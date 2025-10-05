<script setup>
import { ref, onMounted } from "vue";

// Define the 'initialData' prop.
const props = defineProps({
  initialData: { type: Object, default: null },
});

// Default state for the form.
const instructions = ref("Label the map below.");
const imageUrl = ref("");
const labels = ref([{ id: "label_1", text: "" }]);
const answers = ref({ 1: "" }); // Maps location '1' to a label ID.

// When the component mounts, populate the state with the prop data if it exists.
onMounted(() => {
  if (props.initialData) {
    const { content, answer } = props.initialData;
    instructions.value = content.instructions || "";
    imageUrl.value = content.imageUrl || "";
    labels.value =
      content.labels && content.labels.length
        ? content.labels
        : [{ id: "label_1", text: "" }];
    answers.value = answer && Object.keys(answer).length ? answer : { 1: "" };
  }
});

function addLabel() {
  const newId = `label_${labels.value.length + 1}`;
  labels.value.push({ id: newId, text: "" });
  const newAnswerKey = `${Object.keys(answers.value).length + 1}`;
  answers.value[newAnswerKey] = "";
}

function removeLabel(index) {
  const removedLabel = labels.value.splice(index, 1)[0];
  for (const key in answers.value) {
    if (answers.value[key] === removedLabel.id) {
      answers.value[key] = "";
    }
  }
}

const getPayload = () => {
  const content = {
    instructions: instructions.value,
    imageUrl: imageUrl.value,
    labels: labels.value.filter((l) => l.text.trim()),
  };
  const answer = answers.value;
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
          <label class="form-label" for="map-instructions">Instructions</label>
          <input
            id="map-instructions"
            type="text"
            v-model="instructions"
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="map-imageUrl"
            >Image URL (for the map)</label
          >
          <input
            id="map-imageUrl"
            type="text"
            v-model="imageUrl"
            class="form-input"
            placeholder="https://path/to/your/map.png"
          />
          <div v-if="imageUrl" class="image-preview-container">
            <img :src="imageUrl" alt="Map Preview" class="image-preview" />
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h4 class="card-title">Labels & Answer Key</h4>
      </div>
      <div class="card-body">
        <div class="form-group">
          <label class="form-label">Define Labels (words to be placed)</label>
          <div class="dynamic-list">
            <div
              v-for="(label, index) in labels"
              :key="index"
              class="dynamic-row"
            >
              <span class="row-id">{{ label.id }}:</span>
              <input
                type="text"
                v-model="label.text"
                class="form-input"
                placeholder="Enter label text"
              />
              <button
                v-if="labels.length > 1"
                type="button"
                @click="removeLabel(index)"
                class="btn btn-danger btn-sm"
              >
                &ndash;
              </button>
            </div>
          </div>
          <div class="add-button-container">
            <button type="button" @click="addLabel" class="btn btn-secondary">
              + Add Label
            </button>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Map Answers (Location → Label)</label>
          <div class="dynamic-list">
            <div v-for="(value, key) in answers" :key="key" class="answer-row">
              <label :for="`answer-${key}`" class="form-label"
                >Location {{ key }}</label
              >
              <select
                :id="`answer-${key}`"
                v-model="answers[key]"
                class="form-select"
              >
                <option :value="undefined">-- Select Label --</option>
                <option
                  v-for="label in labels.filter((l) => l.text)"
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
.form-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.image-preview-container {
  margin-top: var(--space-4);
  background-color: var(--bg-secondary);
  padding: var(--space-4);
  border-radius: var(--radius-base);
  display: flex;
  justify-content: center;
  align-items: center;
}

.image-preview {
  max-width: 400px;
  max-height: 300px;
  width: auto;
  height: auto;
  border: 1px solid var(--border-primary);
}

.dynamic-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.dynamic-row,
.answer-row {
  display: grid;
  align-items: center;
  gap: var(--space-4);
}

.dynamic-row {
  grid-template-columns: 100px 1fr auto; /* ID | Input | Button */
}
.answer-row {
  grid-template-columns: 100px 1fr; /* Label | Select */
}

.row-id {
  font-family: var(--font-mono);
  color: var(--text-secondary);
  text-align: right;
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
</style>
