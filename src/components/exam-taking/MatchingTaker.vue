<!-- src/components/exam-taking/MatchingTaker.vue -->
<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  question: { type: Object, required: true },
  initialAnswer: { type: Object, default: () => ({}) },
});
const emit = defineEmits(["answer-updated"]);

// The student's answers will be stored in an object { p_1: "o_a", p_2: "o_c", ... }
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
  <div class="question-container">
    <p class="instructions">{{ question.content.instructions }}</p>
    <div class="matching-container">
      <div class="prompts-list">
        <h4>Prompts</h4>
        <div
          v-for="prompt in question.content.prompts"
          :key="prompt.id"
          class="prompt-item"
        >
          <p>{{ prompt.id }}: {{ prompt.text }}</p>
        </div>
      </div>
      <div class="options-list">
        <h4>Options</h4>
        <div
          v-for="option in question.content.options"
          :key="option.id"
          class="option-item"
        >
          <p>{{ option.id }}: {{ option.text }}</p>
        </div>
      </div>
    </div>
    <div class="answer-grid">
      <h4>Your Answers</h4>
      <div
        v-for="prompt in question.content.prompts"
        :key="prompt.id"
        class="answer-row"
      >
        <label :for="prompt.id">Answer for Prompt {{ prompt.id }}:</label>
        <select :id="prompt.id" v-model="studentAnswers[prompt.id]">
          <option :value="undefined">-- Select --</option>
          <option
            v-for="option in question.content.options"
            :key="option.id"
            :value="option.id"
          >
            Option {{ option.id }}
          </option>
        </select>
      </div>
    </div>
  </div>
</template>

<style scoped>
.question-container {
  margin-bottom: 30px;
}
.instructions {
  font-style: italic;
  color: #555;
}
.matching-container {
  display: flex;
  gap: 30px;
  margin: 15px 0;
}
.prompts-list,
.options-list {
  flex: 1;
}
.answer-grid {
  margin-top: 20px;
}
.answer-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 5px;
}
</style>
