<!-- src/components/exam-taking/TrueFalseTaker.vue -->
<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  question: { type: Object, required: true },
  initialAnswer: { type: Object, default: () => ({}) },
});

const emit = defineEmits(["answer-updated"]);

// This component's internal state for the student's answers
const studentAnswers = ref({ ...props.initialAnswer });

// This "watcher" automatically emits the new answer whenever the student changes a selection.
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
    <p v-if="question.content.instructions" class="instructions">
      {{ question.content.instructions }}
    </p>
    <p
      v-if="question.content.passage"
      class="passage"
      v-html="question.content.passage.replace(/\n/g, '<br>')"
    ></p>

    <div class="statements-container">
      <div
        v-for="statement in question.content.statements"
        :key="statement.id"
        class="statement"
      >
        <p>{{ statement.text }}</p>
        <div class="options">
          <label>
            <input
              type="radio"
              :name="`${question.id}-${statement.id}`"
              value="TRUE"
              v-model="studentAnswers[statement.id]"
            />
            True
          </label>
          <label>
            <input
              type="radio"
              :name="`${question.id}-${statement.id}`"
              value="FALSE"
              v-model="studentAnswers[statement.id]"
            />
            False
          </label>
          <label>
            <input
              type="radio"
              :name="`${question.id}-${statement.id}`"
              value="NOT_GIVEN"
              v-model="studentAnswers[statement.id]"
            />
            Not Given
          </label>
        </div>
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
.passage {
  white-space: pre-wrap;
  background-color: #f9f9f9;
  padding: 15px;
  border-radius: 4px;
}
.statement {
  margin-bottom: 15px;
}
.options {
  display: flex;
  gap: 20px;
}
</style>
