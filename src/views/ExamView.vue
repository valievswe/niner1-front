<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import apiClient from "@/services/api";

// --- COMPONENT IMPORTS ---
import ExamBottomNav from "@/components/exam-taking/ExamBottomNav.vue";
import TrueFalseTaker from "@/components/exam-taking/TrueFalseTaker.vue";
import MultipleChoiceTaker from "@/components/exam-taking/MultipleChoiceTaker.vue";
import GapFillTaker from "@/components/exam-taking/GapFillTaker.vue";
import MatchingTaker from "@/components/exam-taking/MatchingTaker.vue";
import MapLabelingTaker from "@/components/exam-taking/MapLabelingTaker.vue";
import WritingPromptTaker from "@/components/exam-taking/WritingPromptTaker.vue";
import GenericTaker from "@/components/exam-taking/GenericTaker.vue";

// --- STATE ---
const route = useRoute();
const router = useRouter();
const exam = ref(null);
const studentAnswers = ref({});
const loading = ref(true);
const errorMessage = ref("");
const sections = ["LISTENING", "READING", "WRITING"];
const activeSectionIndex = ref(0);
const timer = ref("00:00");
let timerInterval = null;
const isTimeUp = ref(false);
const audioRef = ref(null);
const readingPassages = ref({});
const hasAudioPlayed = ref(localStorage.getItem("hasAudioPlayed") === "true");

// State for Part and Question Navigation
const activePartIndex = ref(0);
const activeQuestionIndex = ref(0);

// --- DYNAMIC COMPONENT MAPPING ---
const questionComponentMap = {
  TRUE_FALSE_NOT_GIVEN: TrueFalseTaker,
  MULTIPLE_CHOICE_MULTIPLE_ANSWER: MultipleChoiceTaker,
  GAP_FILLING: GapFillTaker,
  SUMMARY_COMPLETION: GapFillTaker,
  MATCHING: MatchingTaker,
  MAP_LABELING: MapLabelingTaker,
  WRITING_PROMPT: WritingPromptTaker,
};

// --- COMPUTED PROPERTIES ---
const activeSection = computed(() => sections[activeSectionIndex.value]);

const currentSectionQuestions = computed(() => {
  if (!exam.value) return [];
  return exam.value.questions.filter(
    (q) => q.question.section === activeSection.value
  );
});

const sectionParts = computed(() => {
  if (!currentSectionQuestions.value.length) return [];
  const partNumbers = new Set(
    currentSectionQuestions.value.map((q) => q.question.partNumber)
  );
  return Array.from(partNumbers).sort((a, b) => a - b);
});

const currentPart = computed(() => sectionParts.value[activePartIndex.value]);

const currentPartQuestions = computed(() => {
  if (currentPart.value === undefined) return [];
  return currentSectionQuestions.value.filter(
    (q) => q.question.partNumber === currentPart.value
  );
});

const currentQuestion = computed(() => {
  if (!currentPartQuestions.value.length) return null;
  return currentPartQuestions.value[activeQuestionIndex.value];
});

// Calculate question numbers for the entire exam
const questionNumberMap = computed(() => {
  if (!exam.value) return {};

  const map = {};
  let globalNumber = 1;

  // Iterate through all questions in order
  exam.value.questions.forEach((qWrapper) => {
    map[qWrapper.question.id] = globalNumber;
    globalNumber++;
  });

  return map;
});

// Get the current question's global number
const currentQuestionNumber = computed(() => {
  if (!currentQuestion.value) return 0;
  return questionNumberMap.value[currentQuestion.value.question.id] || 0;
});

// Calculate offset for current section (for ExamBottomNav)
const sectionQuestionOffset = computed(() => {
  if (!exam.value) return 0;

  let offset = 0;
  for (let i = 0; i < activeSectionIndex.value; i++) {
    const sectionName = sections[i];
    offset += exam.value.questions.filter(
      (q) => q.question.section === sectionName
    ).length;
  }

  return offset;
});

const currentSectionDuration = computed(() => {
  if (!exam.value?.sectionDurations) return 0;
  return exam.value.sectionDurations[activeSection.value.toLowerCase()];
});

const partQuestionCounts = computed(() => {
  const counts = {};
  sectionParts.value.forEach((partNum) => {
    counts[partNum] = currentSectionQuestions.value.filter(
      (q) => q.question.partNumber === partNum
    ).length;
  });
  return counts;
});

// --- LIFECYCLE HOOKS ---
const beforeUnloadHandler = (event) => {
  event.preventDefault();
  event.returnValue = "";
};

onMounted(async () => {
  const scheduledExamId = route.params.id;
  try {
    const response = await apiClient.post(
      `/student/exams/${scheduledExamId}/start`
    );
    exam.value = response.data;

    // Debug logging
    console.log("=== EXAM STRUCTURE DEBUG ===");
    console.log("Total questions:", exam.value.questions.length);
    sections.forEach((section) => {
      const sectionQs = exam.value.questions.filter(
        (q) => q.question.section === section
      );
      const parts = [
        ...new Set(sectionQs.map((q) => q.question.partNumber)),
      ].sort();
      console.log(
        `${section}: ${parts.length} parts [${parts.join(", ")}], ${
          sectionQs.length
        } questions`
      );
      parts.forEach((partNum) => {
        const partQs = sectionQs.filter(
          (q) => q.question.partNumber === partNum
        );
        console.log(`  Part ${partNum}: ${partQs.length} questions`);
      });
    });
    console.log("=== END DEBUG ===");

    prepareReadingPassages();
    startTimer();
    window.addEventListener("beforeunload", beforeUnloadHandler);
  } catch (error) {
    errorMessage.value =
      error.response?.data?.error || "Failed to load the exam.";
    console.error("Exam load error:", error);
  } finally {
    loading.value = false;
  }
});

onUnmounted(() => {
  clearInterval(timerInterval);
  window.removeEventListener("beforeunload", beforeUnloadHandler);
});

// --- METHODS ---
function prepareReadingPassages() {
  const passages = {};
  if (!exam.value || !exam.value.questions) return;
  exam.value.questions.forEach((qWrapper) => {
    const question = qWrapper.question;
    if (question.section === "READING" && question.questionSet?.passage) {
      const passageText = question.questionSet.passage;
      if (!passages[passageText]) passages[passageText] = [];
      passages[passageText].push(question);
    }
  });
  readingPassages.value = passages;
}

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  const durationInMinutes = currentSectionDuration.value;
  if (!durationInMinutes) {
    timer.value = "N/A";
    return;
  }
  const sectionDeadline = new Date().getTime() + durationInMinutes * 60 * 1000;
  timerInterval = setInterval(() => {
    const remainingMs = sectionDeadline - new Date().getTime();
    if (remainingMs <= 0) {
      forceEndSection();
    } else {
      const minutes = Math.floor(remainingMs / 1000 / 60);
      const seconds = Math.floor((remainingMs / 1000) % 60);
      timer.value = `${String(minutes).padStart(2, "0")}:${String(
        seconds
      ).padStart(2, "0")}`;
    }
  }, 1000);
}

function forceEndSection() {
  clearInterval(timerInterval);
  timer.value = "00:00";
  isTimeUp.value = true;
  setTimeout(() => {
    nextSection(true);
  }, 3000);
}

function updateAnswer(payload) {
  if (!currentQuestion.value) return;

  const questionId = currentQuestion.value.question.id;

  // Handle different answer formats
  let answerValue = payload.answer;

  // Ensure we're storing the actual value, not undefined
  if (answerValue === undefined || answerValue === null) {
    console.warn(`Received undefined/null answer for question ${questionId}`);
    return;
  }

  console.log(
    `✓ Saving answer for Q${currentQuestionNumber.value} (ID: ${questionId}):`,
    answerValue
  );

  // Store the answer
  studentAnswers.value[questionId] = answerValue;

  // Log current state
  console.log(
    `Total answers saved: ${Object.keys(studentAnswers.value).length}`
  );
}

function onAudioPlay() {
  if (!hasAudioPlayed.value) {
    hasAudioPlayed.value = true;
    localStorage.setItem("hasAudioPlayed", "true");
  }
}

async function submitExam() {
  const answerCount = Object.keys(studentAnswers.value).length;
  const totalQuestions = exam.value.questions.length;

  if (
    !confirm(
      `Are you sure you want to submit your final exam?\n\n` +
        `You have answered ${answerCount} out of ${totalQuestions} questions.`
    )
  ) {
    return;
  }

  clearInterval(timerInterval);
  window.removeEventListener("beforeunload", beforeUnloadHandler);

  const scheduledExamId = route.params.id;
  const answersPayload = Object.entries(studentAnswers.value).map(
    ([questionId, answer]) => ({
      questionId,
      answer,
    })
  );

  console.log("=== SUBMITTING EXAM ===");
  console.log(`Total answers: ${answersPayload.length}`);
  console.log("Payload:", answersPayload);

  try {
    await apiClient.post(`/student/exams/${scheduledExamId}/submit`, {
      answers: answersPayload,
    });
    alert("Exam submitted successfully!");
    localStorage.removeItem("hasAudioPlayed");
    router.push("/dashboard");
  } catch (error) {
    errorMessage.value =
      error.response?.data?.error || "Failed to submit the exam.";
    alert(errorMessage.value);
    console.error("Submit error:", error);
  }
}

function goToPart(partIndex) {
  if (partIndex >= 0 && partIndex < sectionParts.value.length) {
    console.log(`Navigating to Part ${sectionParts.value[partIndex]}`);
    activePartIndex.value = partIndex;
    activeQuestionIndex.value = 0;
  }
}

function goToQuestion(questionIndex) {
  if (questionIndex >= 0 && questionIndex < currentPartQuestions.value.length) {
    console.log(
      `Navigating to question index ${questionIndex} in current part`
    );
    activeQuestionIndex.value = questionIndex;
  }
}

function previousQuestion() {
  if (activeQuestionIndex.value > 0) {
    activeQuestionIndex.value--;
  } else if (activePartIndex.value > 0) {
    activePartIndex.value--;
    // Go to last question of previous part
    const prevPartQuestions = currentSectionQuestions.value.filter(
      (q) => q.question.partNumber === sectionParts.value[activePartIndex.value]
    );
    activeQuestionIndex.value = prevPartQuestions.length - 1;
  }
}

function nextQuestion() {
  if (activeQuestionIndex.value < currentPartQuestions.value.length - 1) {
    activeQuestionIndex.value++;
  } else if (activePartIndex.value < sectionParts.value.length - 1) {
    activePartIndex.value++;
    activeQuestionIndex.value = 0;
  }
}

function nextSection(isAutoAdvance = false) {
  if (
    !isAutoAdvance &&
    !confirm(
      `Are you sure you want to finish the ${activeSection.value} section?`
    )
  ) {
    return;
  }

  if (activeSectionIndex.value < sections.length - 1) {
    activeSectionIndex.value++;
    activePartIndex.value = 0;
    activeQuestionIndex.value = 0;
    isTimeUp.value = false;
    prepareReadingPassages();
    startTimer();
  } else {
    submitExam();
  }
}

const getComponentForQuestion = (questionType) => {
  return questionComponentMap[questionType] || GenericTaker;
};
</script>

<template>
  <div class="exam-container">
    <div v-if="loading" class="loading-container">
      <p>Loading your exam...</p>
    </div>
    <div v-else-if="errorMessage" class="error-message">
      <p>{{ errorMessage }}</p>
    </div>
    <div v-else-if="exam">
      <div v-if="isTimeUp" class="times-up-overlay">
        <div class="times-up-message">
          <h2>Time is up for this section.</h2>
          <p>Moving to the next section...</p>
        </div>
      </div>
      <fieldset :disabled="isTimeUp">
        <header class="exam-header">
          <h1>{{ exam.title }}</h1>
          <div class="section-indicator">
            Section {{ activeSectionIndex + 1 }} of 3:
            <strong>{{ activeSection }}</strong>
          </div>
          <div class="timer">Time Remaining: {{ timer }}</div>
        </header>

        <main class="exam-body">
          <div class="left-panel">
            <div v-if="activeSection === 'LISTENING'">
              <h3>Listening Section - Part {{ currentPart }}</h3>
              <div
                v-if="exam.audioFiles?.listening"
                class="audio-player-container"
              >
                <audio
                  controls
                  :src="exam.audioFiles.listening"
                  ref="audioRef"
                  @play="onAudioPlay"
                ></audio>
              </div>
            </div>
            <div v-if="activeSection === 'READING'" class="passage-viewer">
              <h3>Reading Passage(s) - Part {{ currentPart }}</h3>
              <div
                v-for="(questions, passageText) in readingPassages"
                :key="passageText"
                class="passage"
              >
                <p v-html="passageText.replace(/\n/g, '<br>')"></p>
              </div>
            </div>
            <div v-if="activeSection === 'WRITING'">
              <h3>Writing Section - Task {{ currentPart }}</h3>
              <p>
                You have {{ currentSectionDuration }} minutes to complete the
                writing tasks.
              </p>
            </div>
          </div>
          <div class="right-panel">
            <div v-if="currentQuestion" class="question-wrapper">
              <h4 class="question-number-display">
                Question {{ currentQuestionNumber }}
              </h4>
              <component
                :is="
                  getComponentForQuestion(currentQuestion.question.questionType)
                "
                :key="currentQuestion.question.id"
                :question="currentQuestion.question"
                :initial-answer="studentAnswers[currentQuestion.question.id]"
                @answer-updated="updateAnswer"
              />
            </div>
            <div v-else>
              <p>This part has no questions. Please proceed.</p>
            </div>
          </div>
        </main>
      </fieldset>

      <footer class="exam-footer">
        <ExamBottomNav
          :section-questions="currentSectionQuestions"
          :student-answers="studentAnswers"
          :active-part-index="activePartIndex"
          :active-question-index="activeQuestionIndex"
          :question-number-offset="sectionQuestionOffset"
          :question-number-map="questionNumberMap"
          @go-to-part="goToPart"
          @go-to-question="goToQuestion"
          @previous="previousQuestion"
          @next="nextQuestion"
        />
        <button @click="nextSection()" class="finish-section-btn">
          {{
            activeSection === "WRITING"
              ? "Submit Final Exam"
              : `Finish ${activeSection} Section`
          }}
        </button>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.exam-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding-bottom: 180px;
}

.loading-container,
.error-message {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  font-size: 1.2rem;
}

.error-message {
  color: #d32f2f;
}

.exam-header {
  background: #2c3e50;
  color: white;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
}

.exam-header h1 {
  margin: 0;
  font-size: 1.5rem;
}

.section-indicator {
  font-size: 1.1rem;
}

.timer {
  font-size: 1.2rem;
  font-weight: bold;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.exam-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  padding: 20px;
  flex: 1;
}

.left-panel,
.right-panel {
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
  max-height: calc(100vh - 300px);
}

.left-panel h3 {
  margin-top: 0;
  color: #2c3e50;
  border-bottom: 2px solid #6200ea;
  padding-bottom: 10px;
}

.audio-player-container {
  margin-top: 20px;
}

.audio-player-container audio {
  width: 100%;
}

.passage-viewer .passage {
  line-height: 1.8;
  font-size: 1rem;
  margin-bottom: 20px;
  padding: 15px;
  background: #f9f9f9;
  border-radius: 8px;
}

.question-wrapper {
  animation: fadeIn 0.3s ease-in;
}

.question-number-display {
  color: #6200ea;
  font-size: 1.3rem;
  margin-top: 0;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #e0e0e0;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.times-up-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.times-up-message {
  background: white;
  padding: 40px;
  border-radius: 12px;
  text-align: center;
  animation: bounceIn 0.5s ease-out;
}

@keyframes bounceIn {
  0% {
    transform: scale(0.5);
    opacity: 0;
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.times-up-message h2 {
  color: #d32f2f;
  margin-top: 0;
}

.exam-footer {
  background: #f8f9fa;
  padding: 20px;
  border-top: 2px solid #ddd;
}

.finish-section-btn {
  width: 100%;
  padding: 15px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  margin-top: 15px;
  transition: background-color 0.2s;
}

.finish-section-btn:hover {
  background: #218838;
}

@media (max-width: 768px) {
  .exam-body {
    grid-template-columns: 1fr;
  }
}
</style>
