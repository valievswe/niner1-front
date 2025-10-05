<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  question: { type: Object, required: true },
  initialAnswer: { type: Object, default: () => ({}) },
});
const emit = defineEmits(["answer-updated"]);

// The v-model uses an array, which is correct for multiple-selection checkboxes.
const selectedOptionIds = ref(props.initialAnswer.correctOptionIds || []);

watch(
  selectedOptionIds,
  (newVal) => {
    emit("answer-updated", {
      questionId: props.question.id,
      answer: { correctOptionIds: newVal },
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

      <p class="prompt">{{ question.content.prompt }}</p>

      <div class="options-container">
        <div v-for="option in question.content.options" :key="option.id">
          <!-- 
            IMPROVEMENT:
            The entire label is now the interactive element. It contains a
            custom-styled checkbox for a consistent look and feel.
           -->
          <label
            class="option-label"
            :class="{ selected: selectedOptionIds.includes(option.id) }"
          >
            <input
              type="checkbox"
              :value="option.id"
              v-model="selectedOptionIds"
            />
            <span class="custom-checkbox"></span>
            <span class="option-text">{{ option.text }}</span>
          </label>
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
  line-height: var(--leading-loose); /* Important for readability */
  white-space: pre-wrap; /* Preserves line breaks from the source */
}

.prompt {
  font-weight: var(--font-semibold);
  font-size: var(--text-lg);
  color: var(--text-primary);
  margin-bottom: var(--space-5);
}

.options-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.option-label {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4);
  border: var(--border-width-thick) solid var(--border-primary);
  border-radius: var(--radius-base);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.option-label:hover {
  border-color: var(--border-secondary);
  background-color: var(--bg-secondary);
}

/* Visually hide the default checkbox */
.option-label input[type="checkbox"] {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.custom-checkbox {
  flex-shrink: 0;
  height: 24px;
  width: 24px;
  background-color: var(--bg-primary);
  border: var(--border-width-thick) solid var(--border-primary);
  border-radius: var(--radius-base);
  display: inline-block;
  position: relative;
  transition: all var(--transition-fast);
}

/* Style the custom checkbox when the hidden input is checked */
.option-label input:checked ~ .custom-checkbox {
  background-color: var(--color-primary-600);
  border-color: var(--color-primary-600);
}

/* Create the checkmark using a pseudo-element */
.custom-checkbox::after {
  content: "";
  position: absolute;
  display: none;
  left: 7px;
  top: 3px;
  width: 6px;
  height: 12px;
  border: solid white;
  border-width: 0 3px 3px 0;
  transform: rotate(45deg);
}

/* Show the checkmark when the checkbox is checked */
.option-label input:checked ~ .custom-checkbox::after {
  display: block;
}

.option-text {
  color: var(--text-primary);
  line-height: var(--leading-relaxed);
}

/* Selected state for the entire label */
.option-label.selected {
  border-color: var(--border-focus);
  background-color: var(--color-primary-50);
}
</style>
