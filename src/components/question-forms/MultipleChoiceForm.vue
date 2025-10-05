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
          <label class="form-label" for="mc-instructions">Instructions</label>
          <input
            id="mc-instructions"
            type="text"
            v-model="instructions"
            class="form-input"
          />
        </div>
        <div class="form-group">
          <label class="form-label" for="mc-passage">Passage (Optional)</label>
          <textarea
            id="mc-passage"
            v-model="passage"
            class="form-textarea"
            rows="5"
          ></textarea>
        </div>
        <div class="form-group">
          <label class="form-label" for="mc-prompt">Prompt / Question</label>
          <input
            id="mc-prompt"
            type="text"
            v-model="prompt"
            class="form-input"
          />
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h4 class="card-title">Options & Answer Key</h4>
      </div>
      <div class="card-body">
        <label class="form-label">
          Define Options (Check the box for correct answers)
        </label>
        <div class="options-list">
          <div
            v-for="(option, index) in options"
            :key="index"
            class="option-row"
          >
            <label class="checkbox-label">
              <input
                type="checkbox"
                :value="option.id"
                v-model="correctOptionIds"
              />
              <span class="custom-checkbox"></span>
            </label>
            <input
              type="text"
              v-model="option.text"
              class="form-input"
              :placeholder="`Text for Option ${option.id}`"
            />
            <!-- 
              SEMANTIC BUTTON COLOR:
              Using 'btn-danger' because removing an item is a destructive action.
            -->
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
        <div class="add-button-container">
          <!-- 
            SEMANTIC BUTTON COLOR:
            Using 'btn-secondary' as this is a neutral, additive action.
          -->
          <button type="button" @click="addOption" class="btn btn-secondary">
            + Add Option
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

.options-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.option-row {
  display: grid;
  grid-template-columns: auto 1fr auto; /* Checkbox | Input | Button */
  align-items: center;
  gap: var(--space-4);
}

.add-button-container {
  margin-top: var(--space-5);
  padding-top: var(--space-5);
  border-top: 1px solid var(--border-primary);
}

/* --- Custom Checkbox Styles (for answer key) --- */
/* This ensures the admin sees the same control as the student */
.checkbox-label {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  height: 40px; /* Aligns with form input height */
}

.checkbox-label input[type="checkbox"] {
  position: absolute;
  opacity: 0;
}

.custom-checkbox {
  height: 24px;
  width: 24px;
  background-color: var(--bg-primary);
  border: var(--border-width-thick) solid var(--border-primary);
  border-radius: var(--radius-base);
  display: grid;
  place-content: center;
  transition: all var(--transition-fast);
}

.checkbox-label:hover .custom-checkbox {
  border-color: var(--border-secondary);
}

.checkbox-label input:checked + .custom-checkbox {
  background-color: var(--color-primary-600);
  border-color: var(--color-primary-600);
}

.custom-checkbox::after {
  content: "";
  position: absolute;
  display: none;
  width: 6px;
  height: 12px;
  border: solid white;
  border-width: 0 3px 3px 0;
  transform: rotate(45deg);
}

.checkbox-label input:checked + .custom-checkbox::after {
  display: block;
}
</style>
