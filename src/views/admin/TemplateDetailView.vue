<!-- src/views/admin/TemplateDetailView.vue -->
<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import apiClient from "@/services/api";

const route = useRoute();
const template = ref(null);
const loading = ref(true);
const errorMessage = ref("");

onMounted(async () => {
  try {
    const templateId = route.params.id;
    // We're calling the backend endpoint we created earlier
    const response = await apiClient.get(`/templates/${templateId}`);
    template.value = response.data;
  } catch (error) {
    errorMessage.value = "Failed to load template data.";
    console.error(error);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div>
    <h1>Admin: Template Details</h1>

    <div v-if="loading">Loading template...</div>
    <div v-else-if="errorMessage" class="error-message">{{ errorMessage }}</div>

    <div v-else-if="template" class="template-details">
      <h2>{{ template.title }}</h2>
      <p><strong>Description:</strong> {{ template.description || "N/A" }}</p>

      <div v-if="template.sectionDurations" class="durations-display">
        <p>
          <strong>Listening Duration:</strong>
          {{ template.sectionDurations.listening }} minutes
        </p>
        <p>
          <strong>Reading Duration:</strong>
          {{ template.sectionDurations.reading }} minutes
        </p>
        <p>
          <strong>Writing Duration:</strong>
          {{ template.sectionDurations.writing }} minutes
        </p>
      </div>

      <p v-if="template.audioFiles && template.audioFiles.listening">
        <strong>Listening Audio URL:</strong>
        {{ template.audioFiles.listening }}
      </p>

      <h3>Questions (in order)</h3>
      <div class="questions-list">
        <div
          v-for="item in template.questions"
          :key="item.question.id"
          class="question-item"
        >
          <div class="order-badge">{{ item.order }}</div>
          <div class="question-info">
            <strong>{{ item.question.questionType }}</strong> ({{
              item.question.section
            }})
            <pre>{{ item.question.content }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.template-details {
  max-width: 900px;
}
.questions-list {
  margin-top: 20px;
}
.durations-display {
  display: flex;
  gap: 30px;
  background-color: #f8f9fa;
  padding: 10px;
  border: 1px solid #dee2e6;
  margin: 10px 0;
}
.durations-display p {
  margin: 0;
}
.question-item {
  display: flex;
  gap: 15px;
  align-items: flex-start;
  border: 1px solid #eee;
  padding: 10px;
  margin-bottom: 10px;
  border-radius: 4px;
}
.order-badge {
  font-size: 1.2em;
  font-weight: bold;
  background-color: #007bff;
  color: white;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
pre {
  background-color: #f4f4f4;
  padding: 10px;
  border-radius: 4px;
  white-space: pre-wrap;
  margin-top: 5px;
}
.error-message {
  color: red;
}
</style>
