<script setup>
import { ref, onMounted } from "vue";

const props = defineProps({
  initialData: { type: Object, default: null },
});

const instructions = ref("Complete the text with the correct words.");
const textWithGaps = ref(
  "Example text with gaps: The student is in their {{1}} year and has a contact number {{2}}."
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
    } else {
      answers.value = [{ id: "1", text: "" }];
    }
  }
});

function addAnswerField() {
  const newId = `${
    parseInt(answers.value[answers.value.length - 1]?.id || 0) + 1
  }`;
  answers.value.push({ id: newId, text: "" });
}

function removeAnswerField(index) {
  answers.value.splice(index, 1);
  // Re-index remaining answers
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
          <label class="form-label" for="gapfill-instructions"
            >Instructions</label
          >
          <input
            id="gapfill-instructions"
            type="text"
            v-model="instructions"
            class="form-input"
          />
        </div>
        <div class="form-group">
          <label class="form-label" for="textWithGaps">
            Text with Gaps (Use &#123;&#123;number&#125;&#125; for gaps)
          </label>
          <textarea
            id="textWithGaps"
            v-model="textWithGaps"
            class="form-textarea"
            rows="7"
            placeholder="Enter text with gaps like: The student is in their {{1}} year and has a contact number {{2}}."
          ></textarea>
          <p class="form-helper-text">
            Use double curly braces with numbers to create gaps:
            &#123;&#123;1&#125;&#125;, &#123;&#123;2&#125;&#125;, etc.
          </p>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h4 class="card-title">Answer Key</h4>
      </div>
      <div class="card-body">
        <div class="answers-list">
          <div v-for="(ans, index) in answers" :key="ans.id" class="answer-row">
            <label :for="`answer-${ans.id}`" class="form-label"
              >Gap {{ ans.id }}</label
            >
            <input
              :id="`answer-${ans.id}`"
              type="text"
              v-model="ans.text"
              class="form-input"
              placeholder="Correct answer for gap"
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
  gap: var(--space-6);
}

.answers-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.answer-row {
  display: grid;
  grid-template-columns: 100px 1fr auto;
  align-items: center;
  gap: var(--space-4);
}

.answer-row .form-label {
  margin: 0;
  text-align: right;
  font-weight: var(--font-medium);
}

.add-button-container {
  margin-top: var(--space-5);
  padding-top: var(--space-5);
  border-top: 1px solid var(--border-primary);
}

.form-helper-text {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin-top: var(--space-2);
}
</style>
