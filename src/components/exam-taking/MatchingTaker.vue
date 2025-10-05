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

      <div class="matching-container">
        <div class="prompts-list content-box">
          <h5>Prompts</h5>
          <ul>
            <li v-for="prompt in question.content.prompts" :key="prompt.id">
              <strong>{{ prompt.id }}</strong
              >: {{ prompt.text }}
            </li>
          </ul>
        </div>

        <div class="options-list content-box">
          <h5>Options</h5>
          <ul>
            <li v-for="option in question.content.options" :key="option.id">
              <strong>{{ option.id }}</strong
              >: {{ option.text }}
            </li>
          </ul>
        </div>
      </div>

      <div class="answer-grid">
        <h5>Your Answers</h5>
        <div
          v-for="prompt in question.content.prompts"
          :key="prompt.id"
          class="answer-row"
        >
          <label :for="prompt.id" class="form-label">
            Prompt {{ prompt.id }}
          </label>
          <select
            :id="prompt.id"
            v-model="studentAnswers[prompt.id]"
            class="form-select"
          >
            <option :value="undefined">-- Select an option --</option>
            <!-- 
              IMPROVEMENT:
              Displaying the full option text makes it easier for the user,
              reducing the need to look back at the options list.
            -->
            <option
              v-for="option in question.content.options"
              :key="option.id"
              :value="option.id"
            >
              {{ option.text }} ({{ option.id }})
            </option>
          </select>
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

.matching-container {
  display: grid;
  grid-template-columns: 1fr; /* Single column on mobile */
  gap: var(--space-5);
  margin-bottom: var(--space-6);
}

/* Two columns for larger screens */
@media (min-width: 768px) {
  .matching-container {
    grid-template-columns: 1fr 1fr;
  }
}

.content-box {
  background-color: var(--bg-secondary);
  padding: var(--space-4);
  border-radius: var(--radius-base);
  border: 1px solid var(--border-primary);
}

h5 {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  margin-bottom: var(--space-3);
  color: var(--text-primary);
}

.content-box ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.content-box li {
  color: var(--text-secondary);
  line-height: var(--leading-relaxed);
}

.answer-row {
  display: grid;
  grid-template-columns: 120px 1fr; /* Fixed label width, flexible select */
  align-items: center;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}

.form-label {
  margin: 0; /* Override default margin from form styles */
  font-weight: var(--font-medium);
  text-align: right;
}
</style>
