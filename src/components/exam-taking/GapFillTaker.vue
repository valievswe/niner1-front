<script setup>
import { ref, computed, watch } from "vue";

const props = defineProps({
  question: { type: Object, required: true },
  initialAnswer: { type: Object, default: () => ({}) },
});

const emit = defineEmits(["answer-updated"]);

const studentAnswers = ref({ ...props.initialAnswer });

const textParts = computed(() => {
  const text = props.question.content?.textWithGaps || "";
  return text.split(/(\{\{\d+\}\})/g).filter(Boolean);
});

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
  <div class="gap-fill-container">
    <p v-if="question.content?.instructions" class="instructions">
      {{ question.content.instructions }}
    </p>
    <div class="gapped-text">
      <template v-for="(part, index) in textParts" :key="index">
        <span v-if="!part.startsWith('{{')" class="text-part">{{ part }}</span>
        <input
          v-else
          type="text"
          class="gap-input"
          :placeholder="`Gap ${part.replace(/[{}]/g, '')}`"
          v-model="studentAnswers[part.replace(/[{}]/g, '')]"
        />
      </template>
    </div>
  </div>
</template>

<style scoped>
.gap-fill-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-4, 16px);
}

.instructions {
  margin: 0;
  padding: var(--space-3, 12px);
  background: var(--bg-secondary, #fafafa);
  border-left: 3px solid var(--color-primary-600, #2c5282);
  color: var(--text-secondary, #4a5568);
  font-size: var(--text-sm, 13px);
  font-style: italic;
  line-height: var(--leading-relaxed, 1.6);
  border-radius: var(--radius-base, 4px);
}

.gapped-text {
  line-height: var(--leading-loose, 1.8);
  color: var(--text-primary, #1a202c);
  font-size: var(--text-base, 15px);
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0;
}

.text-part {
  display: inline;
  white-space: pre-wrap;
}

.gap-input {
  display: inline-block;
  min-width: 120px;
  max-width: 200px;
  border: none;
  border-bottom: 2px solid var(--border-primary, #e2e8f0);
  background-color: transparent;
  text-align: center;
  margin: 0 var(--space-1, 4px);
  padding: var(--space-1, 4px) var(--space-2, 8px);
  font-family: var(--font-primary, inherit);
  font-size: inherit;
  color: var(--text-primary, #1a202c);
  transition: border-color var(--transition-fast, 150ms);
}

.gap-input::placeholder {
  color: var(--text-disabled, #a0aec0);
  font-size: var(--text-xs, 11px);
}

.gap-input:focus {
  outline: none;
  border-bottom-color: var(--border-focus, #2c5282);
  background-color: rgba(44, 82, 130, 0.02);
}

.gap-input:not(:placeholder-shown) {
  font-weight: var(--font-semibold, 600);
  border-bottom-color: var(--color-success-500, #38a169);
}

/* Responsive */
@media (max-width: 768px) {
  .gap-input {
    min-width: 100px;
    max-width: 150px;
    font-size: 14px;
  }
}
</style>
