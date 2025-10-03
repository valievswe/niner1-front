<!-- src/components/exam-taking/GapFillTaker.vue -->
<script setup>
import { ref, computed, watch } from "vue";

const props = defineProps({
  question: { type: Object, required: true },
  initialAnswer: { type: Object, default: () => ({}) },
});
const emit = defineEmits(["answer-updated"]);

const studentAnswers = ref({ ...props.initialAnswer });

// This computed property splits the text and creates an array of strings and gap numbers
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
  <div class="question-container">
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
</template>

<style scoped>
/* ... (shared styles) ... */
.question-container {
  margin-bottom: 30px;
}
.instructions {
  font-style: italic;
  color: #555;
}
.gapped-text {
  line-height: 2;
}
.gap-input {
  width: 150px;
  border: none;
  border-bottom: 1px solid black;
  text-align: center;
  margin: 0 5px;
}
</style>
