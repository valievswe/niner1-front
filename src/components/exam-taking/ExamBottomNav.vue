<!-- src/components/exam-taking/ExamBottomNav.vue -->
<script setup>
import { computed } from "vue";

const props = defineProps({
  sectionQuestions: { type: Array, required: true },
  activePartIndex: { type: Number, required: true },
  activeQuestionIndex: { type: Number, required: true },
  studentAnswers: { type: Object, required: true },
  questionNumberOffset: { type: Number, default: 0 },
  questionNumberMap: { type: Object, required: true }, // NEW: Map of question IDs to global numbers
});

const emit = defineEmits(["goToPart", "goToQuestion", "previous", "next"]);

const sectionParts = computed(() => {
  if (!props.sectionQuestions.length) return [];
  const partNumbers = new Set(
    props.sectionQuestions.map((q) => q.question.partNumber)
  );
  return Array.from(partNumbers).sort((a, b) => a - b);
});

const currentPartQuestions = computed(() => {
  const currentPartNumber = sectionParts.value[props.activePartIndex];
  if (currentPartNumber === undefined) return [];
  return props.sectionQuestions.filter(
    (q) => q.question.partNumber === currentPartNumber
  );
});

// Get the display number for a question using the map
function getQuestionDisplayNumber(questionId) {
  return props.questionNumberMap[questionId] || "?";
}

// Check if a question has been answered
function isAnswered(questionId) {
  const answer = props.studentAnswers[questionId];
  // Check for various truthy values
  if (answer === undefined || answer === null) return false;
  if (typeof answer === "string" && answer.trim() === "") return false;
  if (Array.isArray(answer) && answer.length === 0) return false;
  if (typeof answer === "object" && Object.keys(answer).length === 0)
    return false;
  return true;
}
</script>

<template>
  <div class="bottom-nav">
    <!-- Part Tabs -->
    <div v-if="sectionParts.length > 1" class="part-tabs">
      <button
        v-for="(part, index) in sectionParts"
        :key="part"
        :class="{ active: index === activePartIndex }"
        @click="emit('goToPart', index)"
      >
        Part {{ part }}
      </button>
    </div>

    <!-- Navigation Controls -->
    <div class="nav-controls">
      <button
        class="nav-arrow"
        @click="emit('previous')"
        title="Previous Question"
        :disabled="activePartIndex === 0 && activeQuestionIndex === 0"
      >
        ←
      </button>

      <!-- Question Palette -->
      <div class="question-palette">
        <button
          v-for="(q, index) in currentPartQuestions"
          :key="q.question.id"
          :class="{
            answered: isAnswered(q.question.id),
            current: index === activeQuestionIndex,
          }"
          @click="emit('goToQuestion', index)"
          :title="`Question ${getQuestionDisplayNumber(q.question.id)}${
            isAnswered(q.question.id) ? ' (Answered)' : ''
          }`"
        >
          {{ getQuestionDisplayNumber(q.question.id) }}
        </button>
      </div>

      <button class="nav-arrow" @click="emit('next')" title="Next Question">
        →
      </button>
    </div>

    <!-- Progress Indicator -->
    <div class="progress-info">
      <span class="answered-count">
        Answered: {{ Object.keys(studentAnswers).length }} /
        {{ sectionQuestions.length }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #ffffff;
  border-top: 1px solid #e0e0e0;
  padding: 10px 20px;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.08);
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.part-tabs {
  display: flex;
  justify-content: center;
  gap: 5px;
  flex-wrap: wrap;
}

.part-tabs button {
  padding: 8px 16px;
  border: 1px solid #ccc;
  background-color: transparent;
  cursor: pointer;
  border-radius: 20px;
  font-weight: 500;
  transition: all 0.2s;
}

.part-tabs button:hover {
  background-color: #f0eaff;
  border-color: #6200ea;
}

.part-tabs button.active {
  background-color: #6200ea;
  color: white;
  border-color: #6200ea;
}

.nav-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
}

.nav-arrow {
  background-color: #6200ea;
  color: white;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  font-size: 1.5rem;
  cursor: pointer;
  transition: background-color 0.2s;
  flex-shrink: 0;
}

.nav-arrow:hover:not(:disabled) {
  background-color: #7e3ff2;
}

.nav-arrow:disabled {
  background-color: #ccc;
  cursor: not-allowed;
  opacity: 0.5;
}

.question-palette {
  display: flex;
  gap: 8px;
  align-items: center;
  overflow-x: auto;
  padding: 5px 0;
  max-width: calc(100vw - 200px);
}

.question-palette::-webkit-scrollbar {
  height: 6px;
}

.question-palette::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.question-palette::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}

.question-palette::-webkit-scrollbar-thumb:hover {
  background: #555;
}

.question-palette button {
  min-width: 36px;
  height: 36px;
  border: 1px solid #ccc;
  background-color: white;
  cursor: pointer;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s;
  flex-shrink: 0;
}

.question-palette button:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.question-palette button.answered {
  background-color: #c8e6c9;
  border-color: #81c784;
  color: #2e7d32;
}

.question-palette button.current {
  background-color: #6200ea;
  color: white;
  border-color: #6200ea;
  transform: scale(1.15);
  box-shadow: 0 2px 8px rgba(98, 0, 234, 0.3);
}

.question-palette button.current.answered {
  background-color: #4caf50;
  border-color: #388e3c;
}

.progress-info {
  text-align: center;
  padding: 5px 0;
  font-size: 0.9rem;
  color: #666;
}

.answered-count {
  font-weight: 500;
  padding: 4px 12px;
  background: #f0eaff;
  border-radius: 12px;
  display: inline-block;
}

@media (max-width: 768px) {
  .nav-controls {
    gap: 10px;
  }

  .question-palette {
    max-width: calc(100vw - 150px);
  }

  .question-palette button {
    min-width: 32px;
    height: 32px;
    font-size: 0.9rem;
  }

  .nav-arrow {
    width: 36px;
    height: 36px;
    font-size: 1.3rem;
  }
}
</style>
