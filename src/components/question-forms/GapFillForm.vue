<script setup>
import { ref, onMounted } from "vue";

const props = defineProps({
  initialData: { type: Object, default: null },
});

const instructions = ref("Complete the notes below...");
const textWithGaps = ref(
  "Example Text:\nThe student is in their {{1}} year.\nContact number: {{2}}"
);
const answers = ref([{ id: "1", text: "" }]);

onMounted(() => {
  if (props.initialData) {
    const { content, answer } = props.initialData;
    instructions.value = content.instructions || "";
    textWithGaps.value = content.textWithGaps || "";

    const answerKeys = Object.keys(answer);
    if (answerKeys.length > 0) {
      answers.value = answerKeys.map((key) => ({ id: key, text: answer[key] }));
    }
  }
});

function addAnswerField() {
  const newId = `${answers.value.length + 1}`;
  answers.value.push({ id: newId, text: "" });
}

function removeAnswerField(index) {
  answers.value.splice(index, 1);
  answers.value.forEach((ans, i) => {
    ans.id = `${i + 1}`;
  });
}

const getPayload = () => {
  const content = {
    instructions: instructions.value,
    textWithGaps: textWithGaps.value,
  };
  const answer = answers.value.reduce((acc, curr) => {
    if (curr.text.trim()) {
      acc[curr.id] = curr.text.trim();
    }
    return acc;
  }, {});
  return { content, answer };
};

defineExpose({ getPayload });
</script>
<template>
  <div class="form-container">
    <div class="card">
      <div class="card-header">
        <h4 class="card-title">Question Content</h4>
      </div>
      <div class="card-body">
        <div class="form-group">
          <label class="form-label" for="instructions">Instructions</label>
          <input
            id="instructions"
            type="text"
            v-model="instructions"
            class="form-input"
          />
        </div>
        <div class="form-group">
          <label class="form-label" for="textWithGaps"
            >Text with Gaps (Use {'{{ number }}'} for gaps)</label
          >
          <textarea
            id="textWithGaps"
            v-model="textWithGaps"
            class="form-textarea"
            rows="7"
          ></textarea>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h4 class="card-title">Answer Key</h4>
      </div>
      <div class="card-body">
        <div class="answers-list">
          <div v-for="(ans, index) in answers" :key="index" class="answer-row">
            <label :for="`answer-${ans.id}`" class="form-label"
              >Gap {{ ans.id }}</label
            >
            <input
              :id="`answer-${ans.id}`"
              type="text"
              v-model="ans.text"
              class="form-input"
              placeholder="Correct answer"
            />
            <button
              v-if="answers.length > 1"
              type="button"
              @click="removeAnswerField(index)"
              class="btn btn-danger btn-sm"
              aria-label="Remove answer field"
            >
              &ndash;
            </button>
          </div>
        </div>
        <div class="add-button-container">
          <button
            type="button"
            @click="addAnswerField"
            class="btn btn-secondary"
          >
            + Add Answer Field
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.form-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-6); /* Consistent spacing between cards */
}

.answers-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4); /* Space between each answer row */
}

.answer-row {
  display: grid;
  grid-template-columns: 100px 1fr auto; /* Label | Input | Button */
  align-items: center;
  gap: var(--space-4);
}

.answer-row .form-label {
  margin: 0; /* Override default form-label margin */
  text-align: right;
  font-weight: var(--font-medium);
}

.add-button-container {
  margin-top: var(--space-5);
  padding-top: var(--space-5);
  border-top: 1px solid var(--border-primary);
}
</style>
