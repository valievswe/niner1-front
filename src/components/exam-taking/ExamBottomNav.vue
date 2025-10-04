<script setup>
import { computed } from "vue";

const props = defineProps({
  sectionQuestions: { type: Array, required: true },
  activePartIndex: { type: Number, required: true },
  activeQuestionIndex: { type: Number, required: true },
  studentAnswers: { type: Object, required: true },
  questionNumberOffset: { type: Number, default: 0 },
  questionNumberMap: { type: Object, required: true },
});

const emit = defineEmits(["goToPart", "goToQuestion"]);

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

function getQuestionDisplayNumber(questionId) {
  return props.questionNumberMap[questionId] || "?";
}

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
</script>

<template>
  <div class="bottom-nav">
    <div class="nav-container">
      <!-- Part Tabs -->
      <div v-if="sectionParts.length > 1" class="part-selector">
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
          v-for="(q, index) in currentPartQuestions"
          :key="q.question.id"
          :class="[
            'question-btn',
            {
              answered: isAnswered(q.question.id),
              current: index === activeQuestionIndex,
            },
          ]"
          @click="emit('goToQuestion', index)"
          :title="`Question ${getQuestionDisplayNumber(q.question.id)}${
            isAnswered(q.question.id) ? ' - Answered' : ' - Not answered'
          }`"
        >
          {{ getQuestionDisplayNumber(q.question.id) }}
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
