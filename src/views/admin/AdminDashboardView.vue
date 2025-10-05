<template>
  <div class="dashboard-container">
    <!-- 1. Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="loader"></div>
      <p>Loading Dashboard...</p>
    </div>

    <!-- 2. Error State -->
    <div v-else-if="errorMessage" class="error-state alert alert-error">
      <h4>Could Not Load Dashboard Data</h4>
      <p>{{ errorMessage }}</p>
      <!-- SEMANTIC BUTTON: Primary action to resolve the error state -->
      <button @click="fetchDashboardData" class="btn btn-primary mt-4">
        Try Again
      </button>
    </div>

    <!-- 3. Success State -->
    <div v-else class="dashboard-content">
      <h1>Welcome, {{ authStore.user?.firstName || "Admin" }}!</h1>
      <p class="subtitle">Here's a summary of the platform's activity.</p>

      <!-- Stats Grid -->
      <section class="stats-grid">
        <div class="card stat-card">
          <div class="stat-icon-wrapper students">
            <!-- Lucide Icon: users -->
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.totalStudents }}</div>
            <div class="stat-label">Total Students</div>
          </div>
        </div>
        <div class="card stat-card">
          <div class="stat-icon-wrapper templates">
            <!-- Lucide Icon: layout-template -->
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <rect width="18" height="7" x="3" y="3" rx="1" />
              <rect width="9" height="7" x="3" y="14" rx="1" />
              <rect width="5" height="7" x="16" y="14" rx="1" />
            </svg>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.totalTemplates }}</div>
            <div class="stat-label">Mock Templates</div>
          </div>
        </div>
        <div class="card stat-card">
          <div class="stat-icon-wrapper marking">
            <!-- Lucide Icon: pen-square -->
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path
                d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
              />
              <path
                d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
              />
            </svg>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.awaitingMarking }}</div>
            <div class="stat-label">Awaiting Marking</div>
          </div>
        </div>
      </section>

      <!-- Dashboard Columns -->
      <div class="dashboard-columns">
        <section class="card">
          <div class="card-header">
            <h4 class="card-title">Awaiting Your Action</h4>
          </div>
          <div class="card-body">
            <div
              v-if="!submissionsToMark || submissionsToMark.length === 0"
              class="empty-state"
            >
              <p>No submissions are waiting for marking. Great job!</p>
            </div>
            <div v-else class="table-container">
              <table class="table">
                <thead>
                  <tr>
                    <th>Student & Template</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="sub in submissionsToMark" :key="sub.id">
                    <td>
                      <strong
                        >{{ sub.student?.firstName || "Unknown" }}
                        {{ sub.student?.lastName || "Student" }}</strong
                      >
                      <span class="d-block text-secondary">{{
                        sub.template?.title || "Untitled Template"
                      }}</span>
                    </td>
                    <td class="text-right">
                      <!-- SEMANTIC BUTTON: Primary action for this row -->
                      <RouterLink
                        :to="`/admin/submissions/${sub.id}`"
                        class="btn btn-primary btn-sm"
                      >
                        Mark Now
                      </RouterLink>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section class="card">
          <div class="card-header">
            <h4 class="card-title">Quick Links</h4>
          </div>
          <div class="card-body">
            <div class="link-grid">
              <RouterLink to="/admin/questions/new" class="link-card"
                >Create Question</RouterLink
              >
              <RouterLink to="/admin/templates/new" class="link-card"
                >Create Template</RouterLink
              >
              <RouterLink to="/admin/scheduler" class="link-card"
                >Schedule Exam</RouterLink
              >
              <RouterLink to="/admin/users/new" class="link-card"
                >Create User</RouterLink
              >
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import apiClient from "@/services/api";

const authStore = useAuthStore();
const loading = ref(true);
const errorMessage = ref("");
const stats = ref({ totalStudents: 0, totalTemplates: 0, awaitingMarking: 0 });
const submissionsToMark = ref([]);

const fetchDashboardData = async () => {
  loading.value = true;
  errorMessage.value = "";
  try {
    const [statsResponse, submissionsResponse] = await Promise.all([
      apiClient.get("/stats/admin-dashboard"),
      apiClient.get("/marking/submissions"),
    ]);
    stats.value = statsResponse.data;

    const submissions = submissionsResponse.data.items || [];
    if (!Array.isArray(submissions)) {
      throw new Error("Expected submissions to be an array");
    }

    submissionsToMark.value = submissions
      .filter((s) => s.status === "COMPLETED")
      .slice(0, 5);
  } catch (error) {
    console.error("Failed to load dashboard data:", error);
    errorMessage.value = `API Error: "${error.message}". Please ensure the backend server is running.`;
  } finally {
    loading.value = false;
  }
};
onMounted(() => {
  fetchDashboardData();
});
</script>

<style scoped>
/* Loading and Error States */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  min-height: 60vh;
  color: var(--text-secondary);
}
.error-state {
  /* Styled by .alert .alert-error from the design system */
  text-align: center;
}

/* Page Header */
.subtitle {
  color: var(--text-secondary);
  margin-bottom: var(--space-8);
  font-size: var(--text-lg);
}

/* Stats Section */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--space-6);
  margin-bottom: var(--space-8);
}
.stat-card {
  /* Uses .card from DS */
  display: flex;
  align-items: center;
  gap: var(--space-5);
  padding: var(--space-5);
}
.stat-icon-wrapper {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-full);
  display: grid;
  place-items: center;
  color: white;
  flex-shrink: 0;
}
.stat-icon-wrapper svg {
  width: 28px;
  height: 28px;
}
.stat-icon-wrapper.students {
  background-color: var(--color-primary-500);
}
.stat-icon-wrapper.templates {
  background-color: var(--color-success-500);
}
.stat-icon-wrapper.marking {
  background-color: var(--color-warning-500);
}

.stat-value {
  font-size: var(--text-4xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  line-height: var(--leading-tight);
}
.stat-label {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

/* Main Content Layout */
.dashboard-columns {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--space-6);
  align-items: flex-start;
}

/* Action List & Table */
.empty-state {
  text-align: center;
  padding: var(--space-8) 0;
  color: var(--text-secondary);
}
.d-block {
  display: block;
}
.text-secondary {
  color: var(--text-secondary);
}
.text-right {
  text-align: right;
}

/* Quick Links Section */
.link-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-3);
}
.link-card {
  display: block;
  padding: var(--space-4);
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  color: var(--text-primary);
  text-align: center;
  border-radius: var(--radius-base);
  text-decoration: none;
  font-weight: var(--font-semibold);
  transition: all var(--transition-fast);
}
.link-card:hover {
  border-color: var(--color-primary-600);
  background-color: var(--color-primary-50);
  color: var(--color-primary-700);
}

/* Responsive Adjustments */
@media (max-width: 1024px) {
  .dashboard-columns {
    grid-template-columns: 1fr;
  }
}
</style>
