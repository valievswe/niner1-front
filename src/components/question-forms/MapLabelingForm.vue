<!-- src/components/question-forms/MapLabelingForm.vue -->
<script setup>
import { ref } from "vue";

const instructions = ref("Label the map below.");
const imageUrl = ref("");
const labels = ref([{ id: "label_1", text: "" }]);
// The answers map the location number (e.g., '1' on the map) to a label ID (e.g., 'label_1')
const answers = ref({ 1: "" });

function addLabel() {
  const newId = `label_${labels.value.length + 1}`;
  labels.value.push({ id: newId, text: "" });
  // Also add a corresponding answer slot
  const newAnswerKey = `${Object.keys(answers.value).length + 1}`;
  answers.value[newAnswerKey] = "";
}

function removeLabel(index) {
  const removedLabel = labels.value.splice(index, 1)[0];
  // Clean up any answers that might have been pointing to this label
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
  <div class="form-section">
    <h4>Question Content</h4>
    <div class="form-group">
      <label>Instructions</label>
      <input type="text" v-model="instructions" />
    </div>
    <div class="form-group">
      <label>Image URL (for the map)</label>
      <input
        type="text"
        v-model="imageUrl"
        placeholder="https://path/to/your/map.png"
      />
      <img
        v-if="imageUrl"
        :src="imageUrl"
        alt="Map Preview"
        class="image-preview"
      />
    </div>
    <div class="form-group">
      <label>Labels (the words to be placed on the map)</label>
      <div v-for="(label, index) in labels" :key="index" class="dynamic-row">
        <span>{{ label.id }}:</span>
        <input type="text" v-model="label.text" />
        <button
          v-if="labels.length > 1"
          type="button"
          @click="removeLabel(index)"
        >
          -
        </button>
      </div>
      <button type="button" @click="addLabel">+ Add Label</button>
    </div>
    <h4>Answer Key</h4>
    <div class="form-group">
      <div v-for="(value, key) in answers" :key="key" class="answer-row">
        <label>Location {{ key }} on map corresponds to:</label>
        <select v-model="answers[key]">
          <option :value="undefined">-- Select Label --</option>
          <option v-for="label in labels" :key="label.id" :value="label.id">
            {{ label.text || label.id }}
          </option>
        </select>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ... shared styles ... */
.image-preview {
  max-width: 100%;
  margin-top: 10px;
  border: 1px solid #ccc;
}
.form-section {
  margin-top: 20px;
  padding: 15px;
  border: 1px solid #e0e0e0;
}
.form-group {
  margin-bottom: 15px;
}
label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}
input,
select {
  width: 100%;
  padding: 8px;
  margin-bottom: 5px;
}
.dynamic-row {
  display: flex;
  gap: 10px;
  margin-bottom: 5px;
}
.answer-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 5px;
}
</style>
