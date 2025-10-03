<!-- src/views/admin/QuestionDetailView.vue -->
<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import apiClient from "@/services/api";

const route = useRoute();
const question = ref(null);
const loading = ref(true);
const errorMessage = ref("");

onMounted(async () => {
  try {
    const questionId = route.params.id;
    const response = await apiClient.get(`/questions/${questionId}`);
    question.value = response.data;
  } catch (error) {
    errorMessage.value = "Failed to load question data.";
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div>
    <h1>Admin: Question Details</h1>

    <div v-if="loading">Loading...</div>
    <div v-else-if="errorMessage">{{ errorMessage }}</div>

    <div v-else-if="question">
      <div class="form-group">
        <label>ID</label>
        <p>{{ question.id }}</p>
      </div>
      <div class="form-group">
        <label>Section</label>
        <p>{{ question.section }}</p>
      </div>
      <div class="form-group">
        <label>Question Type</label>
        <p>{{ question.questionType }}</p>
      </div>
      <div class="form-group">
        <label>Content</label>
        <pre>{{ question.content }}</pre>
      </div>
      <div class="form-group">
        <label>Answer</label>
        <pre>{{ question.answer }}</pre>
      </div>
    </div>
  </div>
</template>

<style scoped>
pre {
  background-color: #f4f4f4;
  padding: 15px;
  border: 1px solid #ccc;
  white-space: pre-wrap;
}
p {
  background-color: #eee;
  padding: 10px;
  border: 1px solid #ddd;
}
</style>
