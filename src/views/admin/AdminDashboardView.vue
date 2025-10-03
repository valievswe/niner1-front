<template>
  <div class="dashboard-container">
    <div v-if="loading" class="loading-state">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Loading Dashboard...</p>
    </div>

    <div v-else-if="errorMessage" class="error-state">
      <h2><i class="fas fa-times-circle"></i> Could Not Load Data</h2>
      <p>{{ errorMessage }}</p>
      <button @click="fetchDashboardData" class="retry-btn">Try Again</button>
    </div>

    <div v-else>
      <h1>Welcome, {{ authStore.user?.firstName || "Admin" }}!</h1>
      <p class="subtitle">Here's a summary of the platform's activity.</p>

      <section class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon students"><i class="fas fa-users"></i></div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.totalStudents }}</div>
            <div class="stat-label">Total Students</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon templates">
            <i class="fas fa-puzzle-piece"></i>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.totalTemplates }}</div>
            <div class="stat-label">Mock Templates</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon marking">
            <i class="fas fa-pen-to-square"></i>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.awaitingMarking }}</div>
            <div class="stat-label">Awaiting Marking</div>
          </div>
        </div>
      </section>

      <div class="dashboard-columns">
        <section class="card action-list">
          <h2>
            <i
              class="fas fa-circle-exclamation"
              style="color: var(--admin-warning)"
            ></i>
            Awaiting Your Action
          </h2>
          <div
            v-if="!submissionsToMark || submissionsToMark.length === 0"
            class="empty-state"
          >
            <p>No submissions are waiting for marking. Great job!</p>
          </div>
          <table v-else class="action-table">
            <tbody>
              <tr v-for="sub in submissionsToMark" :key="sub.id">
                <td>
                  <strong
                    >{{ sub.student?.firstName || "Unknown" }}
                    {{ sub.student?.lastName || "Student" }}</strong
                  >
                  <br />
                  <small>{{
                    sub.template?.title || "Untitled Template"
                  }}</small>
                </td>
                <td class="text-right">
                  <RouterLink
                    :to="`/admin/submissions/${sub.id}`"
                    class="action-btn"
                  >
                    Mark Now
                  </RouterLink>
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <section class="card quick-links">
          <h2><i class="fas fa-bolt-lightning"></i> Quick Links</h2>
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

    submissionsToMark.value = submissionsResponse.data
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
.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  text-align: center;
  font-size: 1.2rem;
  color: var(--admin-text-secondary);
}
.loading-state i {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}
.error-state {
  color: var(--admin-danger);
  background-color: #fff0f0;
  border: 1px solid var(--admin-danger);
  border-radius: var(--admin-border-radius);
  padding: 2rem;
}
.retry-btn {
  background: var(--admin-primary);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  border-radius: 6px;
  cursor: pointer;
  margin-top: 1.5rem;
  transition: background-color 0.2s;
}
.retry-btn:hover {
  background: var(--admin-primary-dark);
}
.subtitle {
  color: var(--admin-text-secondary);
  margin-bottom: 2rem;
  font-size: 1.1rem;
}
.card {
  background: var(--admin-bg-surface);
  border-radius: var(--admin-border-radius);
  box-shadow: var(--admin-box-shadow);
  padding: 1.5rem;
}
.card h2 {
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2.5rem;
}
.stat-card {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  background: var(--admin-bg-surface);
  padding: 1.5rem;
  border-radius: var(--admin-border-radius);
  box-shadow: var(--admin-box-shadow);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}
.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 1.5rem;
  color: white;
  flex-shrink: 0;
}
.stat-icon.students {
  background: #3498db;
}
.stat-icon.templates {
  background: #9b59b6;
}
.stat-icon.marking {
  background: var(--admin-warning);
}
.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--admin-text-primary);
}
.stat-label {
  font-size: 0.9rem;
  color: var(--admin-text-secondary);
}
.dashboard-columns {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
  align-items: flex-start;
}
.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--admin-text-secondary);
}
.action-table {
  width: 100%;
  border-collapse: collapse;
}
.action-table td {
  padding: 1rem;
  border-bottom: 1px solid var(--admin-border-color);
}
.action-table tr:last-child td {
  border-bottom: none;
}
.action-btn {
  background: var(--admin-primary);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  text-decoration: none;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}
.action-btn:hover {
  background: var(--admin-primary-dark);
}
.text-right {
  text-align: right;
}
.link-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
}
.link-card {
  display: block;
  padding: 1rem;
  background: var(--admin-primary-light);
  color: var(--admin-primary-dark);
  text-align: center;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 500;
  transition: var(--admin-transition-fast);
}
.link-card:hover {
  background: var(--admin-primary);
  color: white;
  transform: translateY(-2px);
}
@media (max-width: 992px) {
  .dashboard-columns {
    grid-template-columns: 1fr;
  }
}
</style>
