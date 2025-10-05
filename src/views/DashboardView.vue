<script setup>
import { ref, computed, onMounted } from "vue";
import { RouterLink } from "vue-router";
import apiClient from "@/services/api";
import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();
const allExams = ref([]); // ← store ALL exams
const currentPage = ref(1);
const itemsPerPage = 5; // show 5 exams per page

// Computed: paginated slice
const scheduledExams = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return allExams.value.slice(start, start + itemsPerPage);
});

const totalPages = computed(() => {
  return Math.ceil(allExams.value.length / itemsPerPage);
});

const loading = ref(true);
const errorMessage = ref("");

const fetchExams = async () => {
  loading.value = true;
  errorMessage.value = "";
  try {
    const response = await apiClient.get("/student/dashboard");
    // Handle both array and wrapped responses
    if (Array.isArray(response.data)) {
      allExams.value = response.data;
    } else if (Array.isArray(response.data.items)) {
      allExams.value = response.data.items;
    } else {
      allExams.value = [];
    }
  } catch (error) {
    errorMessage.value =
      "Could not load your scheduled exams. Please try again later.";
  } finally {
    loading.value = false;
  }
};

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
};

onMounted(() => {
  fetchExams();
});

// --- Rest of your helpers (getStatusInfo, formatDate) ---
function getStatusInfo(status) {
  switch (status) {
    case "SCHEDULED":
      return { class: "badge-primary", text: "Scheduled" };
    case "IN_PROGRESS":
      return { class: "badge-warning", text: "In Progress" };
    case "RESULTS_RELEASED":
      return { class: "badge-success", text: "Results Available" };
    case "COMPLETED":
    case "MARKED":
      return { class: "badge", text: "Awaiting Results" };
    default:
      return { class: "badge", text: status };
  }
}

function formatDate(dateString) {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
</script>

<template>
  <div class="dashboard-container">
    <div class="page-header">
      <h1>Welcome, {{ authStore.user?.firstName }}!</h1>
      <p class="text-secondary">
        This is your personal dashboard where you can find and start your
        scheduled exams.
      </p>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="loader"></div>
      <p>Loading your exams...</p>
    </div>

    <div v-else-if="errorMessage" class="alert alert-error">
      {{ errorMessage }}
    </div>

    <div v-else>
      <div v-if="allExams.length > 0" class="exam-list">
        <div
          v-for="exam in scheduledExams"
          :key="exam.id"
          class="card exam-card"
        >
          <!-- Your existing exam card content -->
          <div class="exam-info">
            <h4 class="exam-title">
              {{ exam.template?.title || "Untitled Exam" }}
            </h4>
            <div class="exam-details">
              <div class="detail-item">
                <span class="label">Status</span>
                <span class="badge" :class="getStatusInfo(exam.status).class">
                  {{ getStatusInfo(exam.status).text }}
                </span>
              </div>
              <div class="detail-item">
                <span class="label">Available From</span>
                <span>{{ formatDate(exam.startAvailableAt) }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Available Until</span>
                <span>{{ formatDate(exam.endAvailableAt) }}</span>
              </div>
            </div>
          </div>
          <div class="exam-actions">
            <RouterLink
              v-if="exam.status === 'SCHEDULED'"
              :to="`/exam/${exam.id}`"
              class="btn btn-primary btn-lg"
            >
              Start Exam
            </RouterLink>
            <RouterLink
              v-if="exam.status === 'RESULTS_RELEASED'"
              :to="`/results/${exam.id}`"
              class="btn btn-success btn-lg"
            >
              View Results
            </RouterLink>
          </div>
        </div>

        <!-- ✅ PAGINATION APPEARS WHEN totalPages > 1 -->
        <div v-if="totalPages > 1" class="pagination-section card">
          <button
            @click="goToPage(currentPage - 1)"
            :disabled="currentPage === 1"
            class="btn btn-secondary"
          >
            &larr; Previous
          </button>
          <span class="pagination-info">
            Page {{ currentPage }} of {{ totalPages }}
          </span>
          <button
            @click="goToPage(currentPage + 1)"
            :disabled="currentPage === totalPages"
            class="btn btn-secondary"
          >
            Next &rarr;
          </button>
        </div>
      </div>

      <div v-else class="empty-state card">
        <h4>No Exams Scheduled</h4>
        <p>You do not have any exams scheduled at this time.</p>
      </div>
    </div>
  </div>
</template>
<style scoped>
.dashboard-container {
  max-width: 900px;
  margin: 0 auto;
  padding: var(--space-8);
}
.page-header {
  margin-bottom: var(--space-8);
}
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  min-height: 40vh;
  color: var(--text-secondary);
}

.exam-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}
.exam-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-6);
  padding: var(--space-6);
}
.exam-info {
  flex-grow: 1;
}
.exam-title {
  margin: 0 0 var(--space-4) 0;
  font-size: var(--text-xl);
}
.exam-details {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-6);
}
.detail-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}
.detail-item .label {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}
.exam-actions {
  flex-shrink: 0;
}

.empty-state {
  text-align: center;
  padding: var(--space-10);
}
.empty-state h4 {
  margin-bottom: var(--space-2);
}
.empty-state p {
  color: var(--text-secondary);
}

/* Pagination */
.pagination-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-5);
  margin-top: var(--space-6);
}
.pagination-info {
  font-size: var(--text-base);
  color: var(--text-secondary);
  font-weight: var(--font-medium);
}

.pagination-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-5);
  margin-top: var(--space-6);
}
.pagination-info {
  font-size: var(--text-base);
  color: var(--text-secondary);
}
@media (max-width: 768px) {
  .pagination-section {
    flex-direction: column;
    gap: var(--space-3);
  }
}

@media (max-width: 768px) {
  .exam-card {
    flex-direction: column;
    align-items: stretch;
  }
  .exam-actions .btn {
    width: 100%;
  }
  .pagination-section {
    flex-direction: column;
    gap: var(--space-3);
  }
  .pagination-info {
    text-align: center;
  }
}
</style>
