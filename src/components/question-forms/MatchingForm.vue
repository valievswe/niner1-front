<script setup>
import { ref, onMounted } from "vue";

const props = defineProps({
  initialData: { type: Object, default: null },
});

const instructions = ref("Match the statements to the correct options.");
const prompts = ref([{ id: "p_1", text: "" }]);
const options = ref([{ id: "o_1", text: "" }]);
const answers = ref({}); // Maps prompt id to option id

onMounted(() => {
  if (props.initialData) {
    const { content, answer } = props.initialData;
    instructions.value = content.instructions || "";

    // Handle prompts
    if (content.prompts && content.prompts.length) {
      prompts.value = content.prompts;
    } else {
      prompts.value = [{ id: "p_1", text: "" }];
    }

    // Handle options
    if (content.options && content.options.length) {
      options.value = content.options;
    } else {
      options.value = [{ id: "o_1", text: "" }];
    }

    // Handle answers
    answers.value = answer && Object.keys(answer).length ? answer : {};
  }
});

function addPrompt() {
  const newId = `p_${prompts.value.length + 1}`;
  prompts.value.push({ id: newId, text: "" });
}

function removePrompt(index) {
  const removedPrompt = prompts.value.splice(index, 1)[0];
  delete answers.value[removedPrompt.id];
  // Re-index remaining prompts if needed
  prompts.value.forEach((prompt, i) => {
    const oldId = prompt.id;
    const newId = `p_${i + 1}`;
    if (oldId !== newId) {
      prompt.id = newId;
      if (answers.value[oldId]) {
        answers.value[newId] = answers.value[oldId];
        delete answers.value[oldId];
      }
    }
  });
}

function addOption() {
  const newId = `o_${options.value.length + 1}`;
  options.value.push({ id: newId, text: "" });
}

function removeOption(index) {
  const removedOption = options.value.splice(index, 1)[0];
  // Remove any answers that referenced this option
  for (const promptId in answers.value) {
    if (answers.value[promptId] === removedOption.id) {
      delete answers.value[promptId];
    }
  }
  // Re-index remaining options if needed
  options.value.forEach((option, i) => {
    const oldId = option.id;
    const newId = `o_${i + 1}`;
    if (oldId !== newId) {
      option.id = newId;
      // Update any answers that reference this option
      for (const promptId in answers.value) {
        if (answers.value[promptId] === oldId) {
          answers.value[promptId] = newId;
        }
      }
    }
  });
}

const getPayload = () => {
  const content = {
    instructions: instructions.value,
    prompts: prompts.value.filter((p) => p.text.trim()),
    options: options.value.filter((o) => o.text.trim()),
  };

  const answer = { ...answers.value }; // Clone the answers object

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
                <input
                  type="text"
                  v-model="prompt.text"
                  class="form-input"
                  placeholder="Enter prompt text"
                />
                <button
                  v-if="prompts.length > 1"
                  type="button"
                  @click="removePrompt(index)"
                  class="btn btn-danger btn-sm"
                  aria-label="Remove prompt"
                >
                  &ndash;
                </button>
              </div>
            </div>
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
                <input
                  type="text"
                  v-model="option.text"
                  class="form-input"
                  placeholder="Enter option text"
                />
                <button
                  v-if="options.length > 1"
                  type="button"
                  @click="removeOption(index)"
                  class="btn btn-danger btn-sm"
                  aria-label="Remove option"
                >
                  &ndash;
                </button>
              </div>
            </div>
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
            v-for="prompt in prompts.filter((p) => p.text.trim())"
            :key="prompt.id"
            class="answer-row"
          >
            <label :for="`answer-${prompt.id}`" class="form-label">
              {{ prompt.text }} ({{ prompt.id }})
            </label>
            <select
              :id="`answer-${prompt.id}`"
              v-model="answers[prompt.id]"
              class="form-select"
            >
              <option :value="undefined">-- Select Option --</option>
              <option
                v-for="option in options.filter((o) => o.text.trim())"
                :key="option.id"
                :value="option.id"
              >
                {{ option.text }} ({{ option.id }})
              </option>
            </select>
          </div>
        </div>
        <div
          v-if="prompts.filter((p) => p.text.trim()).length === 0"
          class="text-secondary"
        >
          No prompts available to match.
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
  grid-template-columns: 60px 1fr auto;
  align-items: center;
  gap: var(--space-3);
}

.row-id {
  font-family: var(--font-mono);
  color: var(--text-secondary);
  text-align: right;
}

.answer-grid {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.answer-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  align-items: center;
  gap: var(--space-4);
}

.answer-row .form-label {
  margin: 0;
  font-weight: var(--font-medium);
  text-align: left;
}

.mt-4 {
  margin-top: var(--space-4);
}
.mb-4 {
  margin-bottom: var(--space-4);
}
</style>
