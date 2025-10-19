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
const activePassageIndex = ref(0); // For reading section passages
const showCongratsModal = ref(false);
const submissionSuccess = ref(false);
const showSectionConfirmModal = ref(false);
const pendingSectionTransition = ref(false);

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

// Get INSTRUCTION type questions for current part
const currentPartInstructions = computed(() => {
  if (!currentPartQuestions.value.length) return [];
  return currentPartQuestions.value.filter(
    (q) => q.question.questionType === "INSTRUCTION"
  );
});

// Get non-INSTRUCTION questions for current part
const currentPartRealQuestions = computed(() => {
  if (!currentPartQuestions.value.length) return [];

  // For reading section, filter by current passage
  if (activeSection.value === "READING") {
    const passageKeys = Object.keys(readingPassages.value);
    if (passageKeys.length === 0) {
      return currentPartQuestions.value.filter(
        (q) => q.question.questionType !== "INSTRUCTION"
      );
    }

    const currentPassageText = passageKeys[activePassageIndex.value];
    const questionsForPassage = readingPassages.value[currentPassageText] || [];
    const questionIds = new Set(questionsForPassage.map((q) => q.id));

    return currentPartQuestions.value.filter(
      (q) =>
        q.question.questionType !== "INSTRUCTION" &&
        questionIds.has(q.question.id)
    );
  }

  return currentPartQuestions.value.filter(
    (q) => q.question.questionType !== "INSTRUCTION"
  );
});

// Get total number of passages for reading section
const totalPassages = computed(() => {
  if (activeSection.value !== "READING") return 0;
  return Object.keys(readingPassages.value).length;
});

// Get current passage text for reading
const currentPassageText = computed(() => {
  if (activeSection.value !== "READING") return "";
  const passageKeys = Object.keys(readingPassages.value);
  return passageKeys[activePassageIndex.value] || "";
});

const questionNumberMap = computed(() => {
  if (!exam.value) return {};
  const map = {};

  exam.value.questions.forEach((qWrapper) => {
    // Use backend-provided display numbers
    map[qWrapper.question.id] = {
      start: qWrapper.displayNumberStart,
      end: qWrapper.displayNumberEnd,
      count:
        qWrapper.displayNumberEnd && qWrapper.displayNumberStart
          ? qWrapper.displayNumberEnd - qWrapper.displayNumberStart + 1
          : 0,
    };
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

    // Debug: Log question numbering
    console.log("=== EXAM QUESTIONS DEBUG ===");
    exam.value.questions.forEach((qWrapper, idx) => {
      console.log(`Question ${idx + 1}:`, {
        id: qWrapper.question.id,
        type: qWrapper.question.questionType,
        displayStart: qWrapper.displayNumberStart,
        displayEnd: qWrapper.displayNumberEnd,
        promptsCount: qWrapper.question.content?.prompts?.length,
        labelsCount: qWrapper.question.content?.labels?.length,
        answerKeys: qWrapper.question.answer
          ? Object.keys(qWrapper.question.answer).length
          : 0,
      });
    });
    console.log("=========================");

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
    submissionSuccess.value = true;
    showCongratsModal.value = true;
    localStorage.removeItem("hasAudioPlayed");

    // Redirect after 3 seconds
    setTimeout(() => {
      router.push("/dashboard");
    }, 3000);
  } catch (error) {
    errorMessage.value =
      error.response?.data?.error || "Failed to submit the exam.";
    submissionSuccess.value = false;
    showCongratsModal.value = true;
    console.error("Submit error:", error);
  }
}

function goToPart(partIndex) {
  if (partIndex >= 0 && partIndex < sectionParts.value.length) {
    activePartIndex.value = partIndex;
  }
}

function goToPassage(passageIndex) {
  if (passageIndex >= 0 && passageIndex < totalPassages.value) {
    activePassageIndex.value = passageIndex;
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
  if (!isAutoAdvance) {
    // Show confirmation modal instead of alert
    showSectionConfirmModal.value = true;
    return;
  }

  // Actually proceed with transition
  proceedToNextSection();
}

function proceedToNextSection() {
  showSectionConfirmModal.value = false;

  if (activeSectionIndex.value < sections.length - 1) {
    activeSectionIndex.value++;
    activePartIndex.value = 0;
    activePassageIndex.value = 0; // Reset passage index
    isTimeUp.value = false;
    prepareReadingPassages();
    startTimer();
  } else {
    submitExam();
  }
}

function cancelSectionTransition() {
  showSectionConfirmModal.value = false;
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

              <!-- Passage Navigation -->
              <div v-if="totalPassages > 1" class="passage-navigation">
                <button
                  v-for="index in totalPassages"
                  :key="index"
                  :class="[
                    'passage-nav-btn',
                    { active: activePassageIndex === index - 1 },
                  ]"
                  @click="goToPassage(index - 1)"
                >
                  Passage {{ index }}
                </button>
              </div>

              <!-- Single Passage Display -->
              <div class="passage-container">
                <div v-if="currentPassageText" class="passage-box">
                  <div class="passage-label">
                    Passage {{ activePassageIndex + 1 }}
                  </div>
                  <div
                    class="passage-text"
                    v-html="currentPassageText.replace(/\n/g, '<br>')"
                  ></div>
                </div>
                <div v-else class="empty-state">
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
                >{{ currentPartRealQuestions.length }} Questions</span
              >
            </div>

            <!-- Instructions Section -->
            <div
              v-if="currentPartInstructions.length > 0"
              class="instructions-section"
            >
              <div
                v-for="instruction in currentPartInstructions"
                :key="instruction.question.id"
                class="instruction-content"
              >
                <div class="instruction-icon">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                </div>
                <div
                  class="instruction-text"
                  v-html="
                    instruction.question.content.instructions?.replace(
                      /\n/g,
                      '<br>'
                    )
                  "
                ></div>
              </div>
            </div>

            <div class="questions-list">
              <div
                v-for="(qWrapper, index) in currentPartRealQuestions"
                :key="qWrapper.question.id"
                :id="`question-${qWrapper.question.id}`"
                class="question-item"
                :class="{ 'is-answered': studentAnswers[qWrapper.question.id] }"
              >
                <div class="question-meta">
                  <span
                    class="question-label"
                    v-if="
                      questionNumberMap[qWrapper.question.id]?.start !== null
                    "
                  >
                    {{
                      questionNumberMap[qWrapper.question.id]?.start ===
                      questionNumberMap[qWrapper.question.id]?.end
                        ? `Question ${
                            questionNumberMap[qWrapper.question.id]?.start
                          }`
                        : `Questions ${
                            questionNumberMap[qWrapper.question.id]?.start
                          }-${questionNumberMap[qWrapper.question.id]?.end}`
                    }}
                  </span>
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
                  :display-number-start="qWrapper.displayNumberStart"
                  :display-number-end="qWrapper.displayNumberEnd"
                  @answer-updated="updateAnswer"
                />
              </div>
              <div v-if="!currentPartRealQuestions.length" class="empty-state">
                <p>No questions in this part</p>
              </div>

              <!-- End of Section Button -->
              <div
                v-if="activePartIndex === sectionParts.length - 1"
                class="end-section-container"
              >
                <button @click="nextSection()" class="finish-section-btn">
                  {{
                    activeSection === "WRITING"
                      ? "Submit Exam"
                      : `Finish ${activeSection} Section`
                  }}
                </button>
              </div>
            </div>
          </div>
        </main>
      </fieldset>

      <!-- Section Confirmation Modal -->
      <Teleport to="body">
        <Transition name="modal-fade">
          <div
            v-if="showSectionConfirmModal"
            class="congrats-overlay"
            @click.self="cancelSectionTransition"
          >
            <div class="congrats-modal">
              <div class="congrats-content">
                <div class="warning-icon">
                  <svg
                    width="64"
                    height="64"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
                    ></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                </div>
                <h2>Finish {{ activeSection }} Section?</h2>
                <p>
                  Once you proceed, you will not be able to return to this
                  section.
                </p>
                <p class="answer-count">
                  You have answered
                  <strong>{{
                    Object.keys(studentAnswers).filter((id) =>
                      currentSectionQuestions.find((q) => q.question.id === id)
                    ).length
                  }}</strong>
                  out of
                  <strong>{{ currentSectionQuestions.length }}</strong>
                  questions in this section.
                </p>
                <div class="modal-actions">
                  <button @click="cancelSectionTransition" class="btn-cancel">
                    Go Back
                  </button>
                  <button @click="proceedToNextSection" class="btn-confirm">
                    {{
                      activeSection === "WRITING"
                        ? "Submit Exam"
                        : "Continue to Next Section"
                    }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>

      <!-- Congratulations Modal -->
      <Teleport to="body">
        <Transition name="modal-fade">
          <div
            v-if="showCongratsModal"
            class="congrats-overlay"
            @click.self="showCongratsModal = false"
          >
            <div class="congrats-modal">
              <div v-if="submissionSuccess" class="congrats-content success">
                <div class="congrats-icon">
                  <svg
                    width="64"
                    height="64"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                </div>
                <h2>Congratulations!</h2>
                <p>Your exam has been submitted successfully.</p>
                <p class="redirect-text">Redirecting to dashboard...</p>
                <div class="loading-dots">
                  <span></span><span></span><span></span>
                </div>
              </div>
              <div v-else class="congrats-content error">
                <div class="error-icon">
                  <svg
                    width="64"
                    height="64"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                  </svg>
                </div>
                <h2>Submission Failed</h2>
                <p>{{ errorMessage }}</p>
                <button
                  @click="showCongratsModal = false"
                  class="btn-close-modal"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>

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
  padding: 20px 24px;
  margin-bottom: 16px;
  background: white;
  border-radius: 0;
  transition: all 0.2s;
  border-left: 3px solid transparent;
}

.question-item:hover {
  border-left-color: #cbd5e0;
}

.question-item.is-answered {
  border-left-color: #38a169;
  background: #fafffa;
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
  font-weight: 700;
  color: #1a202c;
  font-size: 14px;
  letter-spacing: 0.3px;
}

.status-indicator {
  font-size: 11px;
  padding: 3px 10px;
  background: #c6f6d5;
  color: #22543d;
  border-radius: 3px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
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

/* Instructions Section */
.instructions-section {
  margin: 0 24px 24px 24px;
  background: #fffbeb;
  border: 2px solid #fbbf24;
  border-radius: 6px;
  padding: 20px;
}

.instruction-content {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.instruction-icon {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  background: #fbbf24;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.instruction-text {
  flex: 1;
  line-height: 1.6;
  color: #78350f;
  font-size: 15px;
}

/* Congratulations Modal */
.congrats-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
}

.congrats-modal {
  background: white;
  border-radius: 12px;
  padding: 48px;
  max-width: 480px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.congrats-content {
  text-align: center;
}

.congrats-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 24px;
  background: #c6f6d5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.congrats-icon svg {
  color: #38a169;
}

.error-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 24px;
  background: #fed7d7;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-icon svg {
  color: #e53e3e;
}

.congrats-content h2 {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 16px 0;
  color: #1a202c;
}

.congrats-content p {
  font-size: 16px;
  color: #4a5568;
  margin: 0 0 12px 0;
  line-height: 1.6;
}

.redirect-text {
  font-size: 14px;
  color: #718096;
  font-style: italic;
  margin-top: 24px !important;
}

.loading-dots {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-top: 16px;
}

.loading-dots span {
  width: 10px;
  height: 10px;
  background: #2c5282;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out both;
}

.loading-dots span:nth-child(1) {
  animation-delay: -0.32s;
}

.loading-dots span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%,
  80%,
  100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

.btn-close-modal {
  background: #2c5282;
  color: white;
  border: none;
  padding: 12px 32px;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 24px;
}

.btn-close-modal:hover {
  background: #2a4365;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(44, 82, 130, 0.3);
}

/* Modal Transitions */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-active .congrats-modal,
.modal-fade-leave-active .congrats-modal {
  transition: transform 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .congrats-modal,
.modal-fade-leave-to .congrats-modal {
  transform: translateY(-30px) scale(0.95);
}

/* End Section Container */
.end-section-container {
  margin-top: 32px;
  padding: 24px;
  text-align: center;
  border-top: 2px solid #e2e8f0;
}

.finish-section-btn {
  background: #1a202c;
  color: white;
  border: none;
  padding: 14px 40px;
  border-radius: 4px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.finish-section-btn:hover {
  background: #2d3748;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(26, 32, 44, 0.3);
}

/* Warning Icon */
.warning-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 24px;
  background: #fef3c7;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.warning-icon svg {
  color: #f59e0b;
}

/* Modal Actions */
.modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
  justify-content: center;
}

.btn-cancel {
  background: #e2e8f0;
  color: #1a202c;
  border: none;
  padding: 12px 28px;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background: #cbd5e0;
}

.btn-confirm {
  background: #2c5282;
  color: white;
  border: none;
  padding: 12px 28px;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-confirm:hover {
  background: #2a4365;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(44, 82, 130, 0.3);
}

.answer-count {
  font-size: 15px !important;
  color: #1a202c !important;
  margin-top: 16px !important;
}

.answer-count strong {
  color: #2c5282;
}

/* Passage Navigation */
.passage-navigation {
  display: flex;
  gap: 12px;
  padding: 16px 24px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  margin: 0 -24px;
}

.passage-nav-btn {
  padding: 10px 20px;
  background: white;
  border: 1px solid #cbd5e0;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
  color: #4a5568;
  cursor: pointer;
  transition: all 0.2s;
}

.passage-nav-btn:hover {
  border-color: #64748b;
  background: #f8fafc;
}

.passage-nav-btn.active {
  background: #1a202c;
  border-color: #1a202c;
  color: white;
}
</style>
