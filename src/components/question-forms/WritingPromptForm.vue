<!-- src/components/question-forms/WritingPromptForm.vue -->
<script setup>
import { ref } from "vue";

const taskType = ref("TASK_1");
const prompt = ref("");
const imageUrl = ref("");

const getPayload = () => {
  const content = {
    taskType: taskType.value,
    prompt: prompt.value,
    imageUrl: imageUrl.value,
  };
  // Writing tasks do not have a single correct answer, so the answer object is empty.
  // The backend schema expects a JSON field, so we send an empty object.
  const answer = {};
  return { content, answer };
};

defineExpose({ getPayload });
</script>

<template>
  <div class="form-section">
    <h4>Writing Prompt Content</h4>
    <div class="form-group">
      <label>Task Type</label>
      <select v-model="taskType">
        <option value="TASK_1">Task 1 (Describe visual info)</option>
        <option value="TASK_2">Task 2 (Essay)</option>
      </select>
    </div>
    <div class="form-group">
      <label>Prompt Text</label>
      <textarea
        v-model="prompt"
        rows="7"
        placeholder="Enter the writing prompt here..."
      ></textarea>
    </div>
    <div v-if="taskType === 'TASK_1'" class="form-group">
      <label>Image URL (for Task 1 chart/graph)</label>
      <input
        type="text"
        v-model="imageUrl"
        placeholder="https://path/to/your/chart.png"
      />
      <img
        v-if="imageUrl"
        :src="imageUrl"
        alt="Image Preview"
        class="image-preview"
      />
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
select,
textarea {
  width: 100%;
  padding: 8px;
  margin-bottom: 5px;
}
</style>
