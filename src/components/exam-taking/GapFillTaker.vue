<script setup>
import { ref, computed, watch } from "vue";

const props = defineProps({
  question: { type: Object, required: true },
  initialAnswer: { type: Object, default: () => ({}) },
});

const emit = defineEmits(["answer-updated"]);

const studentAnswers = ref({ ...props.initialAnswer });

const textParts = computed(() => {
  return props.question.content.textWithGaps
    .split(/({{\d+}})/g)
    .filter(Boolean);
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
  <div class="question-container card">
    <div class="card-body">
      <p class="instructions">{{ question.content.instructions }}</p>
      <div class="gapped-text">
        <template v-for="(part, index) in textParts" :key="index">
          <span v-if="!part.startsWith('{{')">{{ part }}</span>
          <input
            v-else
            type="text"
            class="gap-input"
            :placeholder="part.replace(/[{}]/g, '')"
            v-model="studentAnswers[part.replace(/[{}]/g, '')]"
          />
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* The main container adopts the .card component for consistency. */
.question-container {
  margin-bottom: var(--space-6); /* DS Spacing */
}

/* Instructions are styled using design system colors and fonts. */
.instructions {
  color: var(--text-secondary); /* DS Color */
  font-size: var(--text-base);
  font-style: italic;
  margin-bottom: var(--space-4); /* DS Spacing */
}

/* The line height for reading passages is set from the design system. */
.gapped-text {
  line-height: var(--leading-loose); /* DS Line Height */
  color: var(--text-primary);
}

/* 
  IMPROVEMENT:
  The gap input is styled to look like a part of the sentence,
  using a bottom border and inheriting font styles.
  It uses design system variables for colors, transitions, and focus states.
*/
.gap-input {
  width: 160px;
  border: none;
  border-bottom: var(--border-width-thick) solid var(--border-primary); /* DS Border */
  background-color: transparent;
  text-align: center;
  margin: 0 var(--space-1);
  padding: var(--space-1) 0;

  /* Typography inherited from design system */
  font-family: var(--font-primary);
  font-size: inherit;
  color: var(--text-primary);

  transition: border-color var(--transition-fast); /* DS Transition */
}

.gap-input::placeholder {
  color: var(--text-disabled);
}

.gap-input:focus {
  outline: none;
  border-bottom-color: var(--border-focus); /* DS Focus Color */
}
</style>
