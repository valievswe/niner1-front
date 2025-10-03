<!-- src/views/admin/questionsView.vue -->
<script setup>
import { ref, onMounted } from "vue";
import apiClient from "@/services/api";
import { RouterLink } from "vue-router";

const questions = ref([]);
const loading = ref(true);
const errorMessage = ref("");

onMounted(async () => {
  try {
    const response = await apiClient.get("/questions");
    questions.value = response.data;
  } catch (error) {
    console.error("Failed to fetch questions:", error);
    errorMessage.value =
      error.response?.data?.error || "Could not load questions.";
  } finally {
    loading.value = false;
  }
});

async function deleteQuestion(questionId) {
  if (
    !confirm(
      "Are you sure you want to delete this question? This action cannot be undone."
    )
  ) {
    return;
  }

  try {
    await apiClient.delete(`/questions/${questionId}`);
    questions.value = questions.value.filter((q) => q.id !== questionId);
  } catch (error) {
    console.error("Failed to delete question:", error);
    alert(error.response?.data?.error || "Failed to delete the question.");
  }
}
</script>

<template>
  <div>
    <h1>Admin: Question Bank</h1>

    <div v-if="loading">
      <p>Loading questions...</p>
    </div>

    <div v-else-if="errorMessage" class="error-message">
      <p>{{ errorMessage }}</p>
    </div>

    <div v-else>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Section</th>
            <th>Question Type</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="question in questions" :key="question.id">
            <td>{{ question.id }}</td>
            <td>{{ question.section }}</td>
            <td>{{ question.questionType }}</td>
            <td>
              <RouterLink :to="`/admin/questions/${question.id}`">
                <button>View</button>
              </RouterLink>
              <RouterLink :to="`/admin/questions/${question.id}/edit`">
                <button>Edit</button>
              </RouterLink>
              <button @click="deleteQuestion(question.id)" class="delete-btn">
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="questions.length === 0">
        No questions found. Go ahead and create one!
      </p>
    </div>
  </div>
</template>

<style scoped>
table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}
th,
td {
  border: 1px solid #ccc;
  padding: 8px;
  text-align: left;
}
th {
  background-color: #f4f4f4;
}
.error-message {
  color: red;
}
.delete-btn {
  background-color: #ffdddd;
  border-color: #ff9999;
  color: #c53030;
}
.delete-btn:hover {
  background-color: #ff9999;
}
</style>
