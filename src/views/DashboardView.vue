<!-- src/views/DashboardView.vue -->
<script setup>
import { ref, onMounted } from "vue";
import { RouterLink } from "vue-router";
import apiClient from "@/services/api";

// --- STATE ---
const scheduledExams = ref([]);
const loading = ref(true);
const errorMessage = ref("");

// --- LIFECYCLE HOOK ---
// This function runs automatically when the component is loaded.
onMounted(async () => {
  try {
    // Call the backend API to get the student's scheduled exams
    const response = await apiClient.get("/student/dashboard");
    scheduledExams.value = response.data;
  } catch (error) {
    console.error("Failed to fetch dashboard data:", error);
    errorMessage.value =
      "Could not load your scheduled exams. Please try again later.";
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="dashboard-container">
    <h1>Welcome to Your Dashboard</h1>
    <h2>Your Scheduled Exams</h2>

    <div v-if="loading">
      <p>Loading your exams...</p>
    </div>

    <div v-else-if="errorMessage" class="error-message">
      <p>{{ errorMessage }}</p>
    </div>

    <div v-else>
      <ul class="exam-list">
        <li v-for="exam in scheduledExams" :key="exam.id" class="exam-item">
          <div class="exam-info">
            <h3>{{ exam.template.title }}</h3>
            <p>
              <strong>Scheduled For:</strong>
              {{ new Date(exam.startAvailableAt).toLocaleString() }} to
              {{ new Date(exam.endAvailableAt).toLocaleString() }}
            </p>
            <p>
              <strong>Status:</strong>
              <span :class="`status-${exam.status.toLowerCase()}`">{{
                exam.status
              }}</span>
            </p>
          </div>

          <!-- Only show the Start button if the exam is scheduled -->
          <div class="exam-actions">
            <RouterLink
              v-if="exam.status === 'SCHEDULED'"
              :to="`/exam/${exam.id}`"
            >
              <button>Start Exam</button>
            </RouterLink>

            <RouterLink
              v-if="exam.status === 'RESULTS_RELEASED'"
              :to="`/results/${exam.id}`"
            >
              <button class="results-btn">View Results</button>
            </RouterLink>
          </div>
        </li>
      </ul>
      <p v-if="!loading && scheduledExams.length === 0">
        You have no exams scheduled at this time.
      </p>
    </div>
  </div>
</template>

<style scoped>
.dashboard-container {
  max-width: 800px;
  margin: auto;
  padding: 20px;
}
.error-message {
  color: red;
}
.exam-list {
  list-style: none;
  padding: 0;
}
.exam-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  margin-bottom: 15px;
}
.exam-info h3 {
  margin: 0 0 10px 0;
}
.exam-info p {
  margin: 5px 0;
  color: #555;
}
.status-scheduled {
  font-weight: bold;
  color: #007bff;
}
.status-completed,
.status-marked,
.status-results_released {
  font-weight: bold;
  color: #28a745;
}
.status-in_progress {
  font-weight: bold;
  color: #ffc107;
}
.exam-actions button {
  padding: 10px 20px;
  cursor: pointer;
  border: none;
  background-color: #28a745;
  color: white;
  border-radius: 4px;
}
</style>
