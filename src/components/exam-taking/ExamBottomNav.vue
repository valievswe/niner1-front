<!-- ExamBottomNav.vue -->
<script setup>
import { computed } from "vue";

const props = defineProps({
  sectionQuestions: { type: Array, required: true },
  activePartIndex: { type: Number, required: true },
  activeQuestionIndex: { type: Number, required: true }, // This might not be used for reading now
  studentAnswers: { type: Object, required: true },
  questionNumberOffset: { type: Number, default: 0 },
  questionNumberMap: { type: Object, required: true },
  // Add a prop to pass the active section, to handle reading differently
  activeSection: { type: String, default: "" },
  // Add a prop to pass the reading passages structure
  readingPassages: { type: Object, default: () => ({}) },
  // Add a prop to allow changing the active passage
  activePassageIndex: { type: Number, default: 0 },
});

const emit = defineEmits(["goToPart", "goToQuestion", "goToPassage"]); // Add goToPassage emit

const sectionParts = computed(() => {
  if (!props.sectionQuestions.length) return [];
  const partNumbers = new Set(
    props.sectionQuestions.map((q) => q.question.partNumber)
  );
  return Array.from(partNumbers).sort((a, b) => a - b);
});

// --- MODIFICATION: Compute all questions for the current part, regardless of passage ---
const allCurrentPartQuestions = computed(() => {
  const currentPartNumber = sectionParts.value[props.activePartIndex];
  if (currentPartNumber === undefined) return [];
  return props.sectionQuestions.filter(
    (q) => q.question.partNumber === currentPartNumber
  );
});

// --- MODIFICATION: Compute question buttons specifically for Reading ---
const questionButtonsForReading = computed(() => {
  if (props.activeSection !== "READING") return [];

  const buttons = [];
  const passageKeys = Object.keys(props.readingPassages);

  passageKeys.forEach((passageText, passageIndex) => {
    const questionsForPassage = props.readingPassages[passageText] || [];
    questionsForPassage.forEach((question) => {
      // Find the corresponding wrapper in allCurrentPartQuestions to get display numbers
      const questionWrapper = allCurrentPartQuestions.value.find(
        (qw) => qw.question.id === question.id
      );
      if (questionWrapper) {
        const displayNumber = props.questionNumberMap[question.id]?.start;
        // Only add buttons for questions with display numbers (not INSTRUCTION, and not null/undefined)
        if (displayNumber !== null && displayNumber !== undefined) {
          buttons.push({
            id: question.id,
            displayNumber: displayNumber,
            passageIndex: passageIndex, // Include the passage index
          });
        }
      }
    });
  });

  // Sort buttons by display number
  return buttons.sort((a, b) => a.displayNumber - b.displayNumber);
});

// --- MODIFICATION: Compute question buttons for other sections ---
const questionButtonsForOtherSections = computed(() => {
  if (props.activeSection === "READING") return [];

  return allCurrentPartQuestions.value
    .map((q, index) => ({
      id: q.question.id,
      index: index, // Use the index within the part
      displayNumber: props.questionNumberMap[q.question.id]?.start,
    }))
    .filter((q) => q.displayNumber !== null && q.displayNumber !== undefined); // Filter out INSTRUCTION questions
});

// --- MODIFICATION: Determine which set of buttons to use ---
const questionButtons = computed(() => {
  return props.activeSection === "READING"
    ? questionButtonsForReading.value
    : questionButtonsForOtherSections.value;
});

function isAnswered(questionId) {
  const answer = props.studentAnswers[questionId];
  if (answer === undefined || answer === null) return false;
  if (typeof answer === "string" && answer.trim() === "") return false;
  if (Array.isArray(answer) && answer.length === 0) return false;
  if (typeof answer === "object" && Object.keys(answer).length === 0)
    return false;
  return true;
}

const answeredInSection = computed(() => {
  return props.sectionQuestions.filter((q) => isAnswered(q.question.id)).length;
});

// --- ADD THIS METHOD ---
function handleQuestionButtonClick(button) {
  if (props.activeSection === "READING") {
    // Emit both the question ID and the required passage index
    emit("goToPassage", button.passageIndex);
    // Pass the question ID directly for scrolling
    emit("goToQuestion", button.id);
  } else {
    // For non-Reading, emit the index within the part as before
    emit("goToQuestion", button.index);
  }
}
</script>

<template>
  <div class="bottom-nav">
    <div class="nav-container">
      <!-- Part Tabs (Hidden for Reading) -->
      <div
        v-if="sectionParts.length > 1 && activeSection !== 'READING'"
        class="part-selector"
      >
        <span class="selector-label">Part:</span>
        <div class="part-buttons">
          <button
            v-for="(part, index) in sectionParts"
            :key="part"
            :class="['part-btn', { active: index === activePartIndex }]"
            @click="emit('goToPart', index)"
            :title="`Navigate to Part ${part}`"
          >
            {{ part }}
          </button>
        </div>
      </div>

      <!-- Question Navigator -->
      <div class="question-navigator">
        <button
          v-for="button in questionButtons"
          :key="button.id"
          :class="[
            'question-btn',
            {
              answered: isAnswered(button.id),
              // current: activeSection !== 'READING' && button.index === activeQuestionIndex, // Adjust current logic if needed
              current: false, // Temporarily disable 'current' highlighting, or implement custom logic
            },
          ]"
          @click="handleQuestionButtonClick(button)"
          :title="`Question ${button.displayNumber}${
            isAnswered(button.id) ? ' - Answered' : ' - Not answered'
          }`"
        >
          {{ button.displayNumber }}
        </button>
      </div>

      <!-- Progress Indicator -->
      <div class="progress-indicator">
        <span class="progress-label">Progress:</span>
        <span class="progress-value">
          {{ answeredInSection }}/{{ sectionQuestions.length }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* (Keep your existing styles here) */
.bottom-nav {
  background: #fafafa;
  border-top: 1px solid #e2e8f0;
  padding: 16px 0;
}

.nav-container {
  display: flex;
  align-items: center;
  gap: 24px;
  max-width: 1800px;
  margin: 0 auto;
  padding: 0 32px;
}

/* Part Selector */
.part-selector {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.selector-label {
  font-size: 13px;
  font-weight: 600;
  color: #4a5568;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.part-buttons {
  display: flex;
  gap: 8px;
}

.part-btn {
  width: 36px;
  height: 36px;
  border: 1px solid #cbd5e0;
  background: white;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  color: #4a5568;
  cursor: pointer;
  transition: all 0.2s;
}

.part-btn:hover {
  border-color: #2c5282;
  color: #2c5282;
}

.part-btn.active {
  background: #2c5282;
  border-color: #2c5282;
  color: white;
}

/* Question Navigator */
.question-navigator {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 4px 0;
  flex: 1;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e0 transparent;
}

.question-navigator::-webkit-scrollbar {
  height: 6px;
}

.question-navigator::-webkit-scrollbar-track {
  background: transparent;
}

.question-navigator::-webkit-scrollbar-thumb {
  background: #cbd5e0;
  border-radius: 3px;
}

.question-navigator::-webkit-scrollbar-thumb:hover {
  background: #a0aec0;
}

.question-btn {
  min-width: 40px;
  height: 40px;
  padding: 0 12px;
  border: 1px solid #cbd5e0;
  background: white;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  color: #4a5568;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.question-btn:hover {
  border-color: #2c5282;
  color: #2c5282;
  transform: translateY(-1px);
}

.question-btn.answered {
  background: #c6f6d5;
  border-color: #38a169;
  color: #22543d;
}

.question-btn.answered:hover {
  background: #9ae6b4;
}

.question-btn.current {
  border: 2px solid #2c5282;
  border-color: #2c5282;
  color: #2c5282;
  font-weight: 700;
}

.question-btn.current.answered {
  background: #9ae6b4;
  border-color: #2f855a;
  color: #22543d;
}

/* Progress Indicator */
.progress-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  padding: 8px 16px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
}

.progress-label {
  font-size: 13px;
  font-weight: 600;
  color: #4a5568;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.progress-value {
  font-size: 15px;
  font-weight: 700;
  color: #2c5282;
  font-family: "Courier New", monospace;
}

/* Responsive */
@media (max-width: 1024px) {
  .nav-container {
    gap: 16px;
    padding: 0 20px;
  }

  .question-navigator {
    max-width: 400px;
  }
}

@media (max-width: 768px) {
  .nav-container {
    flex-wrap: wrap;
    gap: 12px;
    padding: 0 16px;
  }

  .part-selector {
    order: 1;
    width: 100%;
    justify-content: space-between;
  }

  .part-buttons {
    flex: 1;
    justify-content: flex-end;
  }

  .question-navigator {
    order: 3;
    width: 100%;
    max-width: none;
  }

  .progress-indicator {
    order: 2;
    margin-left: auto;
  }

  .part-btn,
  .question-btn {
    height: 36px;
    font-size: 13px;
  }

  .part-btn {
    width: 32px;
  }

  .question-btn {
    min-width: 36px;
  }
}

@media (max-width: 480px) {
  .bottom-nav {
    padding: 12px 0;
  }

  .nav-container {
    padding: 0 12px;
  }

  .part-selector {
    font-size: 12px;
  }

  .selector-label,
  .progress-label {
    font-size: 11px;
  }

  .progress-value {
    font-size: 14px;
  }

  .part-btn {
    width: 28px;
    height: 28px;
    font-size: 12px;
  }

  .question-btn {
    min-width: 32px;
    height: 32px;
    font-size: 12px;
  }

  .progress-indicator {
    padding: 6px 12px;
  }
}
</style>
