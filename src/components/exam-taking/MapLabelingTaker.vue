<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  question: { type: Object, required: true },
  initialAnswer: { type: Object, default: () => ({}) },
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
      <p class="instructions">{{ question.content.instructions }}</p>

      <!-- 
        IMPROVEMENT:
        A two-column layout for map and answers on larger screens.
        This stacks vertically on smaller screens automatically.
      -->
      <div class="map-layout-grid">
        <div class="map-container">
          <img :src="question.content.imageUrl" alt="Map for labeling" />
        </div>

        <div class="controls-container">
          <div class="labels-list">
            <h5>Available Labels</h5>
            <ul>
              <li v-for="label in question.content.labels" :key="label.id">
                <strong>{{ label.id }}</strong
                >: {{ label.text }}
              </li>
            </ul>
          </div>

          <div class="answer-grid">
            <h5>Your Answers</h5>
            <div
              v-for="(value, key) in question.answer"
              :key="key"
              class="answer-row"
            >
              <label :for="key" class="form-label">Location {{ key }}</label>
              <select
                :id="key"
                v-model="studentAnswers[key]"
                class="form-select"
              >
                <option :value="undefined">-- Select Label --</option>
                <option
                  v-for="label in question.content.labels"
                  :key="label.id"
                  :value="label.id"
                >
                  {{ label.text }} ({{ label.id }})
                </option>
              </select>
            </div>
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
  margin-bottom: var(--space-5);
}

.map-layout-grid {
  display: grid;
  grid-template-columns: 1fr; /* Default to single column */
  gap: var(--space-6);
}

/* Use two columns on screens wider than 1024px */
@media (min-width: 1024px) {
  .map-layout-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.map-container img {
  width: 100%;
  border: var(--border-width) solid var(--border-primary);
  border-radius: var(--radius-base);
}

.controls-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.labels-list {
  background-color: var(--bg-secondary);
  padding: var(--space-4);
  border-radius: var(--radius-base);
}

.labels-list h5,
.answer-grid h5 {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  margin-bottom: var(--space-3);
}

.labels-list ul {
  list-style-position: inside;
  padding-left: var(--space-2);
}

.labels-list li {
  margin-bottom: var(--space-2);
  color: var(--text-secondary);
}

.answer-row {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}

.form-label {
  margin: 0;
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  white-space: nowrap;
}
</style>
