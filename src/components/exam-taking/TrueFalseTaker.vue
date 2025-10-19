<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  question: { type: Object, required: true },
  initialAnswer: { type: Object, default: () => ({}) },
  displayNumberStart: { type: Number, default: null },
  displayNumberEnd: { type: Number, default: null },
});

const emit = defineEmits(["answer-updated"]);

const studentAnswers = ref({ ...props.initialAnswer });

watch(
  studentAnswers,
  (newVal) => {
    emit("answer-updated", {
      questionId: props.question.id,
      answer: newVal,
    });
  },
  { deep: true }
);
</script>

<template>
  <div class="question-container card">
    <div class="card-body">
      <p v-if="question.content.instructions" class="instructions">
        {{ question.content.instructions }}
      </p>
      <div v-if="question.content.passage" class="passage">
        {{ question.content.passage }}
      </div>

      <div class="statements-container">
        <div
          v-for="statement in question.content.statements"
          :key="statement.id"
          class="statement-row"
        >
          <p class="statement-text">{{ statement.text }}</p>
          <div class="options-group">
            <label class="radio-label">
              <input
                type="radio"
                :name="`${question.id}-${statement.id}`"
                value="TRUE"
                v-model="studentAnswers[statement.id]"
              />
              <span class="custom-radio"></span>
              True
            </label>
            <label class="radio-label">
              <input
                type="radio"
                :name="`${question.id}-${statement.id}`"
                value="FALSE"
                v-model="studentAnswers[statement.id]"
              />
              <span class="custom-radio"></span>
              False
            </label>
            <label class="radio-label">
              <input
                type="radio"
                :name="`${question.id}-${statement.id}`"
                value="NOT_GIVEN"
                v-model="studentAnswers[statement.id]"
              />
              <span class="custom-radio"></span>
              Not Given
            </label>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.question-container {
  margin-bottom: var(--space-6);
}

.instructions {
  color: var(--text-secondary);
  font-style: italic;
  margin-bottom: var(--space-4);
}

.passage {
  background-color: var(--bg-secondary);
  padding: var(--space-5);
  border-radius: var(--radius-base);
  margin-bottom: var(--space-5);
  line-height: var(--leading-loose);
  white-space: pre-wrap;
}

.statement-row {
  display: grid;
  grid-template-columns: 1fr; /* Default to single column */
  gap: var(--space-4);
  padding: var(--space-5) 0;
  border-bottom: var(--border-width) solid var(--border-primary);
}

.statement-row:first-child {
  padding-top: 0;
}

.statement-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

/* On larger screens, split statement and options into two columns */
@media (min-width: 768px) {
  .statement-row {
    grid-template-columns: 1fr auto;
    align-items: center;
  }
}

.statement-text {
  color: var(--text-primary);
  line-height: var(--leading-relaxed);
  margin: 0;
}

.options-group {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-5);
}

/* --- Custom Radio Button Styles --- */
.radio-label {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  cursor: pointer;
  font-size: var(--text-base);
  color: var(--text-secondary);
}

.radio-label input[type="radio"] {
  position: absolute;
  opacity: 0;
}

.custom-radio {
  flex-shrink: 0;
  height: 22px;
  width: 22px;
  border: var(--border-width-thick) solid var(--border-primary);
  border-radius: var(--radius-full);
  display: grid;
  place-content: center;
  transition: all var(--transition-fast);
}

.custom-radio::after {
  content: "";
  width: 10px;
  height: 10px;
  border-radius: var(--radius-full);
  background-color: white;
  transform: scale(0);
  transition: transform var(--transition-fast);
}

.radio-label:hover .custom-radio {
  border-color: var(--border-secondary);
}

.radio-label input:checked + .custom-radio {
  background-color: var(--color-primary-600);
  border-color: var(--color-primary-600);
}

.radio-label input:checked + .custom-radio::after {
  transform: scale(1);
}

.radio-label input:focus-visible + .custom-radio {
  outline: 2px solid var(--border-focus);
  outline-offset: 2px;
}
</style>
