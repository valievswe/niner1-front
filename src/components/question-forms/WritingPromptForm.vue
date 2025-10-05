<script setup>
import { ref, onMounted } from "vue";

const props = defineProps({
  initialData: { type: Object, default: null },
});

// Default state for the form.
const taskType = ref("TASK_1");
const prompt = ref("");
const imageUrl = ref("");

onMounted(() => {
  if (props.initialData) {
    const { content } = props.initialData;
    taskType.value = content.taskType || "TASK_1";
    prompt.value = content.prompt || "";
    imageUrl.value = content.imageUrl || "";
  }
});

const getPayload = () => {
  const content = {
    taskType: taskType.value,
    prompt: prompt.value,
    ...(taskType.value === "TASK_1" &&
      imageUrl.value && { imageUrl: imageUrl.value }),
  };
  const answer = {};
  return { content, answer };
};

defineExpose({ getPayload });
</script>

<template>
  <div class="form-container">
    <div class="card">
      <div class="card-header">
        <h4 class="card-title">Writing Prompt Content</h4>
      </div>
      <div class="card-body">
        <div class="form-group">
          <label class="form-label" for="writing-task-type">Task Type</label>
          <select id="writing-task-type" v-model="taskType" class="form-select">
            <option value="TASK_1">Task 1 (Describe visual info)</option>
            <option value="TASK_2">Task 2 (Essay)</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label" for="writing-prompt">Prompt Text</label>
          <textarea
            id="writing-prompt"
            v-model="prompt"
            class="form-textarea"
            rows="7"
            placeholder="Enter the writing prompt here..."
          ></textarea>
        </div>

        <!-- This section correctly appears only for Task 1 -->
        <div v-if="taskType === 'TASK_1'" class="form-group">
          <label class="form-label" for="writing-image-url"
            >Image URL (for Task 1 chart/graph)</label
          >
          <input
            id="writing-image-url"
            type="text"
            v-model="imageUrl"
            class="form-input"
            placeholder="https://path/to/your/chart.png"
          />
          <div v-if="imageUrl" class="image-preview-container">
            <img :src="imageUrl" alt="Image Preview" class="image-preview" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* No top-level container style needed as it's just one card */
/* All form elements are styled by global classes from main.css */

.image-preview-container {
  margin-top: var(--space-4);
  background-color: var(--bg-secondary);
  padding: var(--space-4);
  border-radius: var(--radius-base);
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid var(--border-primary);
}

.image-preview {
  max-width: 450px;
  max-height: 350px;
  width: auto;
  height: auto;
}
</style>
