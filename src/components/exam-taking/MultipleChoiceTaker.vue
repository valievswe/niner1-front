<!-- src/components/exam-taking/MultipleChoiceTaker.vue -->
<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  question: { type: Object, required: true },
  initialAnswer: { type: Object, default: () => ({}) },
});
const emit = defineEmits(["answer-updated"]);

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
  <div class="question-container">
    <p v-if="question.content.instructions" class="instructions">
      {{ question.content.instructions }}
    </p>
    <p
      v-if="question.content.passage"
      class="passage"
      v-html="question.content.passage.replace(/\n/g, '<br>')"
    ></p>
    <p class="prompt">{{ question.content.prompt }}</p>
    <div class="options-container">
      <div
        v-for="option in question.content.options"
        :key="option.id"
        class="option"
      >
        <label>
          <input
            type="checkbox"
            :value="option.id"
            v-model="selectedOptionIds"
          />
          {{ option.text }}
        </label>
      </div>
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
.passage {
  white-space: pre-wrap;
  background-color: #f9f9f9;
  padding: 15px;
  border-radius: 4px;
}
.prompt {
  font-weight: bold;
}
.option {
  margin-bottom: 10px;
}
</style>
