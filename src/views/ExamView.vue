<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import apiClient from "@/services/api";
import { debounce } from "lodash-es";

import ExamBottomNav from "@/components/exam-taking/ExamBottomNav.vue";
import TrueFalseTaker from "@/components/exam-taking/TrueFalseTaker.vue";
import MultipleChoiceTaker from "@/components/exam-taking/MultipleChoiceTaker.vue";
import GapFillTaker from "@/components/exam-taking/GapFillTaker.vue";
import MatchingTaker from "@/components/exam-taking/MatchingTaker.vue";
import MapLabelingTaker from "@/components/exam-taking/MapLabelingTaker.vue";
import WritingPromptTaker from "@/components/exam-taking/WritingPromptTaker.vue";
import GenericTaker from "@/components/exam-taking/GenericTaker.vue";

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

const leftPanelWidth = ref(45);
const isDragging = ref(false);
const containerRef = ref(null);
const activePartIndex = ref(0);

const questionComponentMap = {
  TRUE_FALSE_NOT_GIVEN: TrueFalseTaker,
  MULTIPLE_CHOICE_MULTIPLE_ANSWER: MultipleChoiceTaker,
  GAP_FILLING: GapFillTaker,
  SUMMARY_COMPLETION: GapFillTaker,
  MATCHING: MatchingTaker,
  MAP_LABELING: MapLabelingTaker,
  WRITING_PROMPT: WritingPromptTaker,
};

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

const questionNumberMap = computed(() => {
  if (!exam.value) return {};
  const map = {};
  let globalNumber = 1;
  exam.value.questions.forEach((qWrapper) => {
    map[qWrapper.question.id] = globalNumber;
    globalNumber++;
  });
  return map;
});

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

const timerWarning = computed(() => {
  if (timer.value === "N/A") return false;
  const [minutes] = timer.value.split(":").map(Number);
  return minutes < 5;
});

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
    prepareReadingPassages();
    startTimer();
    window.addEventListener("beforeunload", beforeUnloadHandler);

    document.addEventListener("mousemove", onDrag);
    document.addEventListener("mouseup", stopDrag);
    document.addEventListener("touchmove", onDrag);
    document.addEventListener("touchend", stopDrag);
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
  document.removeEventListener("mousemove", onDrag);
  document.removeEventListener("mouseup", stopDrag);
  document.removeEventListener("touchmove", onDrag);
  document.removeEventListener("touchend", stopDrag);
});

function prepareReadingPassages() {
  const passages = {};
  if (!exam.value || !exam.value.questions) return;

  exam.value.questions.forEach((qWrapper) => {
    const question = qWrapper.question;
    if (question.section === "READING" && question.questionSet?.passages) {
      const matchingPassage = question.questionSet.passages.find(
        (p) => p.partNumber === question.partNumber
      );

      if (matchingPassage) {
        const passageText = matchingPassage.text;
        if (!passages[passageText]) {
          passages[passageText] = [];
        }
        passages[passageText].push(question);
      }
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
  const questionId = payload.questionId || payload.question?.id;
  let answerValue = payload.answer;
  if (answerValue === undefined || answerValue === null) {
    console.warn(`Received undefined/null answer for question ${questionId}`);
    return;
  }
  studentAnswers.value[questionId] = answerValue;
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

  // Normalize answers to match backend expectations
  const answersPayload = Object.entries(studentAnswers.value).map(
    ([questionId, answerObj]) => {
      let finalAnswer = answerObj;

      // Handle Multiple Choice: extract array from { correctOptionIds: [...] }
      if (answerObj && answerObj.correctOptionIds !== undefined) {
        finalAnswer = answerObj.correctOptionIds;
      }
      // Handle Writing: send plain text instead of { text: "..." }
      else if (answerObj && answerObj.text !== undefined) {
        finalAnswer = answerObj.text;
      }
      // Gap Filling, True/False, Matching: already in correct object format

      return {
        questionId,
        answer: finalAnswer,
      };
    }
  );

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
    activePartIndex.value = partIndex;
  }
}

function scrollToQuestion(questionIndex) {
  const questionId = currentPartQuestions.value[questionIndex]?.question.id;
  if (questionId) {
    const element = document.getElementById(`question-${questionId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
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

function startDrag(event) {
  isDragging.value = true;
  event.preventDefault();
  document.body.style.cursor = "col-resize";
  document.body.style.userSelect = "none";
}

function onDrag(event) {
  if (!isDragging.value || !containerRef.value) return;

  const clientX = event.clientX || (event.touches && event.touches[0]?.clientX);
  if (clientX === undefined) return;

  const containerRect = containerRef.value.getBoundingClientRect();
  const newWidth = ((clientX - containerRect.left) / containerRect.width) * 100;

  const clampedWidth = Math.min(Math.max(newWidth, 30), 70);
  leftPanelWidth.value = clampedWidth;
}

function stopDrag() {
  if (!isDragging.value) return;
  isDragging.value = false;
  document.body.style.cursor = "";
  document.body.style.userSelect = "";
}
</script>

<template>
  <div class="exam-container">
    <div v-if="loading" class="loading-container">
      <div class="loader"></div>
      <p class="loading-text">Loading examination...</p>
    </div>

    <div v-else-if="errorMessage" class="error-message">
      <div class="error-content">
        <h2>Unable to Load Exam</h2>
        <p>{{ errorMessage }}</p>
        <button @click="router.push('/dashboard')" class="btn-return">
          Return to Dashboard
        </button>
      </div>
    </div>

    <div v-else-if="exam" class="exam-wrapper">
      <div v-if="isTimeUp" class="times-up-overlay">
        <div class="times-up-message">
          <h2>Time Expired</h2>
          <p>This section has ended. Proceeding to next section...</p>
          <div class="spinner"></div>
        </div>
      </div>

      <fieldset :disabled="isTimeUp" class="exam-fieldset">
        <header class="exam-header">
          <div class="header-content">
            <div class="exam-info">
              <h1 class="exam-title">{{ exam.title }}</h1>
              <div class="section-info">
                <span class="section-label"
                  >Section {{ activeSectionIndex + 1 }} of 3:</span
                >
                <span class="section-name">{{ activeSection }}</span>
              </div>
            </div>
            <div
              class="timer-container"
              :class="{ 'timer-warning': timerWarning }"
            >
              <span class="timer-label">Time Remaining</span>
              <span class="timer-value">{{ timer }}</span>
            </div>
          </div>
        </header>

        <main class="exam-body" ref="containerRef">
          <div class="left-panel" :style="{ width: leftPanelWidth + '%' }">
            <div v-if="activeSection === 'LISTENING'" class="panel-content">
              <div class="panel-header">
                <h2>Listening</h2>
                <span class="part-label">Part {{ currentPart }}</span>
              </div>
              <div v-if="exam.audioFiles?.listening" class="audio-container">
                <audio
                  autoplay
                  :src="exam.audioFiles.listening"
                  ref="audioRef"
                  @play="onAudioPlay"
                  style="display: none"
                ></audio>
                <div class="audio-notice">
                  <div class="notice-icon">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path
                        d="M9 18V5l12-2v13M9 13a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"
                      />
                    </svg>
                  </div>
                  <p>Audio playing automatically</p>
                </div>
                <div class="instructions-box">
                  <h3>Instructions</h3>
                  <ul>
                    <li>The audio will play once only</li>
                    <li>You cannot pause or replay</li>
                    <li>Answer questions as you listen</li>
                  </ul>
                </div>
              </div>
            </div>

            <div v-if="activeSection === 'READING'" class="panel-content">
              <div class="panel-header">
                <h2>Reading Passage</h2>
                <span class="part-label">Part {{ currentPart }}</span>
              </div>
              <div class="passage-container">
                <div
                  v-for="(questions, passageText, index) in readingPassages"
                  :key="index"
                  class="passage-box"
                >
                  <div class="passage-label">Passage {{ index + 1 }}</div>
                  <div
                    class="passage-text"
                    v-html="passageText.replace(/\n/g, '<br>')"
                  ></div>
                </div>
                <div
                  v-if="Object.keys(readingPassages).length === 0"
                  class="empty-state"
                >
                  <p>No passage available</p>
                </div>
              </div>
            </div>

            <div v-if="activeSection === 'WRITING'" class="panel-content">
              <div class="panel-header">
                <h2>Writing</h2>
                <span class="part-label">Task {{ currentPart }}</span>
              </div>
              <div class="writing-details">
                <div class="detail-item">
                  <span class="detail-label">Time Allocated:</span>
                  <span class="detail-value"
                    >{{ currentSectionDuration }} minutes</span
                  >
                </div>
                <p class="instruction-text">
                  Complete all writing tasks in this section.
                </p>
              </div>
            </div>
          </div>

          <div
            class="divider"
            @mousedown="startDrag"
            @touchstart="startDrag"
          ></div>

          <div
            class="right-panel"
            :style="{ width: 100 - leftPanelWidth + '%' }"
          >
            <div class="panel-header">
              <h2>Questions - Part {{ currentPart }}</h2>
              <span class="question-badge"
                >{{ currentPartQuestions.length }} Questions</span
              >
            </div>
            <div class="questions-list">
              <div
                v-for="(qWrapper, index) in currentPartQuestions"
                :key="qWrapper.question.id"
                :id="`question-${qWrapper.question.id}`"
                class="question-item"
                :class="{ 'is-answered': studentAnswers[qWrapper.question.id] }"
              >
                <div class="question-meta">
                  <span class="question-label"
                    >Question
                    {{ questionNumberMap[qWrapper.question.id] }}</span
                  >
                  <span
                    v-if="studentAnswers[qWrapper.question.id]"
                    class="status-indicator"
                    >Answered</span
                  >
                </div>
                <component
                  :is="getComponentForQuestion(qWrapper.question.questionType)"
                  :question="qWrapper.question"
                  :initial-answer="studentAnswers[qWrapper.question.id]"
                  @answer-updated="updateAnswer"
                />
              </div>
              <div v-if="!currentPartQuestions.length" class="empty-state">
                <p>No questions in this part</p>
              </div>
            </div>
          </div>
        </main>
      </fieldset>

      <footer class="exam-footer">
        <ExamBottomNav
          :section-questions="currentSectionQuestions"
          :student-answers="studentAnswers"
          :active-part-index="activePartIndex"
          :active-question-index="0"
          :question-number-offset="sectionQuestionOffset"
          :question-number-map="questionNumberMap"
          @go-to-part="goToPart"
          @go-to-question="scrollToQuestion"
        />
        <button @click="nextSection()" class="finish-btn">
          {{
            activeSection === "WRITING"
              ? "Submit Exam"
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
  background: #f5f5f5;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen",
    "Ubuntu", "Cantarell", sans-serif;
}

.exam-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  max-width: 1800px;
  margin: 0 auto;
  width: 100%;
}

/* Loading State */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 24px;
}

.loader {
  border: 3px solid #e0e0e0;
  border-top: 3px solid #2c5282;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  animation: spin 1s linear infinite;
}

.loading-text {
  font-size: 16px;
  color: #4a5568;
  font-weight: 500;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Error State */
.error-message {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
}

.error-content {
  text-align: center;
  max-width: 500px;
  background: white;
  padding: 48px 32px;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
}

.error-content h2 {
  margin: 0 0 16px 0;
  color: #1a202c;
  font-size: 24px;
  font-weight: 600;
}

.error-content p {
  margin: 0 0 32px 0;
  color: #4a5568;
  line-height: 1.6;
}

.btn-return {
  background: #2c5282;
  color: white;
  border: none;
  padding: 12px 32px;
  border-radius: 4px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-return:hover {
  background: #2a4365;
}

/* Time's Up Overlay */
.times-up-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.times-up-message {
  background: white;
  padding: 48px;
  border-radius: 4px;
  text-align: center;
  max-width: 480px;
}

.times-up-message h2 {
  margin: 0 0 16px 0;
  color: #1a202c;
  font-size: 24px;
  font-weight: 600;
}

.times-up-message p {
  margin: 0 0 24px 0;
  color: #4a5568;
  line-height: 1.6;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e2e8f0;
  border-top-color: #2c5282;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto;
}

/* Exam Fieldset */
.exam-fieldset {
  border: none;
  padding: 0;
  margin: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* Header */
.exam-header {
  background: #1a202c;
  color: white;
  padding: 10px 32px;
  border-bottom: 1px solid #2d3748;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1800px;
  margin: 0 auto;
}

.exam-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.exam-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: white;
  letter-spacing: -0.01em;
}

.section-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.section-label {
  color: #a0aec0;
  font-weight: 400;
}

.section-name {
  color: #63b3ed;
  font-weight: 600;
  text-transform: capitalize;
}

.timer-container {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  min-width: 140px;
}

.timer-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #cbd5e0;
  font-weight: 500;
}

.timer-value {
  font-size: 28px;
  font-weight: 600;
  font-family: "Courier New", monospace;
  color: white;
  line-height: 1;
}

.timer-warning {
  border-color: #fc8181;
}

.timer-warning .timer-value {
  color: #fc8181;
}

/* Main Body */
.exam-body {
  display: flex;
  flex: 1;
  min-height: 0;
  background: #f5f5f5;
  padding: 24px;
  gap: 0;
  max-width: 1800px;
  margin-bottom: 10rem;
  width: 100%;
}

.left-panel,
.right-panel {
  background: white;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
  background: #fafafa;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a202c;
}

.part-label {
  font-size: 14px;
  color: #2c5282;
  font-weight: 600;
  padding: 4px 12px;
  background: #ebf8ff;
  border-radius: 3px;
}

.question-badge {
  font-size: 13px;
  color: #4a5568;
  font-weight: 500;
  padding: 4px 12px;
  background: #edf2f7;
  border-radius: 3px;
}

.panel-content {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

/* Audio Container */
.audio-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.audio-notice {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #ebf8ff;
  border-left: 3px solid #4299e1;
  border-radius: 4px;
}

.notice-icon {
  color: #2c5282;
  flex-shrink: 0;
}

.audio-notice p {
  margin: 0;
  color: #2c5282;
  font-weight: 500;
  font-size: 14px;
}

.instructions-box {
  padding: 20px;
  background: #fafafa;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
}

.instructions-box h3 {
  margin: 0 0 12px 0;
  font-size: 15px;
  font-weight: 600;
  color: #1a202c;
}

.instructions-box ul {
  margin: 0;
  padding-left: 20px;
}

.instructions-box li {
  margin-bottom: 8px;
  color: #4a5568;
  line-height: 1.6;
  font-size: 14px;
}

.instructions-box li:last-child {
  margin-bottom: 0;
}

/* Reading Passages */
.passage-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.passage-box {
  padding: 24px;
  background: #fafafa;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
}

.passage-label {
  display: inline-block;
  padding: 4px 12px;
  background: #2c5282;
  color: white;
  font-size: 13px;
  font-weight: 600;
  border-radius: 3px;
  margin-bottom: 16px;
}

.passage-text {
  line-height: 1.8;
  color: #2d3748;
  font-size: 15px;
}

/* Writing Details */
.writing-details {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #fafafa;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
}

.detail-label {
  font-weight: 600;
  color: #1a202c;
  font-size: 14px;
}

.detail-value {
  color: #2c5282;
  font-weight: 600;
  font-size: 14px;
}

.instruction-text {
  margin: 0;
  color: #4a5568;
  line-height: 1.6;
  font-size: 14px;
}

/* Divider */
.divider {
  width: 16px;
  cursor: col-resize;
  background: #f5f5f5;
  position: relative;
  flex-shrink: 0;
}

.divider::before {
  content: "";
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 4px;
  height: 40px;
  background: #cbd5e0;
  border-radius: 2px;
  transition: background 0.2s;
}

.divider:hover::before {
  background: #2c5282;
}

/* Questions List */
.questions-list {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.question-item {
  padding: 24px;
  margin-bottom: 20px;
  background: #fafafa;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  transition: all 0.2s;
  border-left: 3px solid transparent;
}

.question-item:hover {
  border-left-color: #2c5282;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.question-item.is-answered {
  border-left-color: #38a169;
  background: #f0fff4;
}

.question-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e2e8f0;
}

.question-label {
  font-size: 15px;
  font-weight: 600;
  color: #2c5282;
}

.status-indicator {
  font-size: 12px;
  font-weight: 600;
  color: #38a169;
  padding: 4px 10px;
  background: #c6f6d5;
  border-radius: 3px;
}

.empty-state {
  text-align: center;
  padding: 48px 24px;
  color: #718096;
  font-style: italic;
}

.empty-state p {
  margin: 0;
}

/* Footer */
.exam-footer {
  background: white;
  border-top: 1px solid #e2e8f0;
  padding: 16px 32px;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
}

.finish-btn {
  width: 100%;
  padding: 14px 24px;
  background: #2c5282;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  margin-top: 12px;
}

.finish-btn:hover {
  background: #2a4365;
}

/* Scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f5f5f5;
}

::-webkit-scrollbar-thumb {
  background: #cbd5e0;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a0aec0;
}

/* Responsive */
@media (max-width: 1200px) {
  .exam-body {
    flex-direction: column;
    padding: 16px;
  }

  .left-panel,
  .right-panel {
    width: 100% !important;
    margin-bottom: 16px;
  }

  .divider {
    display: none;
  }

  .questions-list {
    max-height: 50vh;
  }
}

@media (max-width: 768px) {
  .exam-header {
    padding: 16px 20px;
  }

  .header-content {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .timer-container {
    align-self: stretch;
    align-items: center;
  }

  .exam-title {
    font-size: 18px;
  }

  .panel-header {
    padding: 16px 20px;
  }

  .panel-header h2 {
    font-size: 16px;
  }

  .panel-content {
    padding: 20px;
  }

  .question-item {
    padding: 20px;
  }

  .exam-footer {
    padding: 12px 20px;
  }
}
</style>
