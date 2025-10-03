<!-- src/components/exam-taking/MapLabelingTaker.vue -->
<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  question: { type: Object, required: true },
  initialAnswer: { type: Object, default: () => ({}) },
});
const emit = defineEmits(["answer-updated"]);

// The answers will be { "1": "label_a", "2": "label_c", ... }
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
    <div class="map-container">
      <img :src="question.content.imageUrl" alt="Map for labeling" />
    </div>
    <div class="labels-list">
      <h4>Labels</h4>
      <ul>
        <li v-for="label in question.content.labels" :key="label.id">
          {{ label.id }}: {{ label.text }}
        </li>
      </ul>
    </div>
    <div class="answer-grid">
      <h4>Your Answers</h4>
      <!-- We assume the map has numbered locations that correspond to the answer keys -->
      <div
        v-for="(value, key) in question.answer"
        :key="key"
        class="answer-row"
      >
        <label :for="key">Answer for Location {{ key }}:</label>
        <select :id="key" v-model="studentAnswers[key]">
          <option :value="undefined">-- Select Label --</option>
          <option
            v-for="label in question.content.labels"
            :key="label.id"
            :value="label.id"
          >
            {{ label.text }}
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
.map-container img {
  max-width: 100%;
  border: 1px solid #ccc;
}
.labels-list {
  margin: 15px 0;
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
