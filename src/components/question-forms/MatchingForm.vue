<script setup>
import { ref, onMounted } from "vue";

const props = defineProps({
  initialData: { type: Object, default: null },
});

const instructions = ref("Choose the correct letter, A, B, or C.");
const passage = ref("");
const prompt = ref("Which characteristic is mentioned about the subject?");
const options = ref([{ id: "o_a", text: "" }]);
const correctOptionIds = ref([]);

onMounted(() => {
  if (props.initialData) {
    const { content, answer } = props.initialData;

    instructions.value = content.instructions || "";
    passage.value = content.passage || "";
    prompt.value = content.prompt || "";
    options.value =
      content.options && content.options.length
        ? content.options
        : [{ id: "o_a", text: "" }];
    correctOptionIds.value = answer.correctOptionIds || [];
  }
});

function addOption() {
  const newLetter = String.fromCharCode(97 + options.value.length);
  const newId = `o_${newLetter}`;
  options.value.push({ id: newId, text: "" });
}
function removeOption(index) {
  const removedOption = options.value.splice(index, 1)[0];
  const correctIndex = correctOptionIds.value.indexOf(removedOption.id);
  if (correctIndex > -1) {
    correctOptionIds.value.splice(correctIndex, 1);
  }
  options.value.forEach((o, i) => {
    o.id = `o_${String.fromCharCode(97 + i)}`;
  });
}

const getPayload = () => {
  return {
    content: {
      instructions: instructions.value,
      passage: passage.value,
      prompt: prompt.value,
      options: options.value.filter((o) => o.text.trim()),
    },
    answer: {
      correctOptionIds: correctOptionIds.value,
    },
  };
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
          <label class="form-label" for="matching-instructions"
            >Instructions</label
          >
          <input
            id="matching-instructions"
            type="text"
            v-model="instructions"
            class="form-input"
          />
        </div>

        <div class="matching-grid">
          <div class="form-group">
            <label class="form-label">Prompts (Statements to match)</label>
            <div class="dynamic-list">
              <div
                v-for="(prompt, index) in prompts"
                :key="index"
                class="dynamic-row"
              >
                <span class="row-id">{{ prompt.id }}:</span>
                <input type="text" v-model="prompt.text" class="form-input" />
                <!-- SEMANTIC BUTTON COLOR: Destructive action -->
                <button
                  v-if="prompts.length > 1"
                  type="button"
                  @click="removePrompt(index)"
                  class="btn btn-danger btn-sm"
                >
                  &ndash;
                </button>
              </div>
            </div>
            <!-- SEMANTIC BUTTON COLOR: Additive/neutral action -->
            <button
              type="button"
              @click="addPrompt"
              class="btn btn-secondary mt-4"
            >
              + Add Prompt
            </button>
          </div>

          <div class="form-group">
            <label class="form-label">Options (Choices to match from)</label>
            <div class="dynamic-list">
              <div
                v-for="(option, index) in options"
                :key="index"
                class="dynamic-row"
              >
                <span class="row-id">{{ option.id }}:</span>
                <input type="text" v-model="option.text" class="form-input" />
                <!-- SEMANTIC BUTTON COLOR: Destructive action -->
                <button
                  v-if="options.length > 1"
                  type="button"
                  @click="removeOption(index)"
                  class="btn btn-danger btn-sm"
                >
                  &ndash;
                </button>
              </div>
            </div>
            <!-- SEMANTIC BUTTON COLOR: Additive/neutral action -->
            <button
              type="button"
              @click="addOption"
              class="btn btn-secondary mt-4"
            >
              + Add Option
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h4 class="card-title">Answer Key</h4>
      </div>
      <div class="card-body">
        <p class="text-secondary mb-4">
          Match each prompt to the correct option. Prompts and options must have
          text before they can be matched.
        </p>
        <div class="answer-grid">
          <div
            v-for="prompt in prompts.filter((p) => p.text)"
            :key="prompt.id"
            class="answer-row"
          >
            <label :for="`answer-${prompt.id}`" class="form-label">
              {{ prompt.text }} ({{ prompt.id }})
            </label>
            <select v-model="answers[prompt.id]" class="form-select">
              <option :value="undefined">-- Select Option --</option>
              <option
                v-for="option in options.filter((o) => o.text)"
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
  </div>
</template>

<style scoped>
.form-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.matching-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-6);
  margin-top: var(--space-4);
}

@media (min-width: 1024px) {
  .matching-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.dynamic-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.dynamic-row {
  display: grid;
  grid-template-columns: 40px 1fr auto;
  align-items: center;
  gap: var(--space-3);
}

.row-id {
  font-family: var(--font-mono);
  color: var(--text-secondary);
  text-align: right;
}

.answer-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--space-5);
}

.answer-row {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.answer-row .form-label {
  margin: 0;
  font-weight: var(--font-medium);
}

.mt-4 {
  margin-top: var(--space-4);
}
.mb-4 {
  margin-bottom: var(--space-4);
}
</style>
