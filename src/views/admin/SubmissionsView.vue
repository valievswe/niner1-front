<script setup>
import { ref, onMounted, watch } from "vue";
import { RouterLink } from "vue-router";
import apiClient from "@/services/api";
import ActionMenu from "./ActionMenu.vue";

const submissions = ref([]);
const loading = ref(true);
const errorMessage = ref("");
const awaitingMarkingCount = ref(0);
const searchQuery = ref("");
const statusFilter = ref("ALL");
const currentPage = ref(1);
const totalPages = ref(1);
const itemsPerPage = 10;

const fetchSubmissions = async () => {
  loading.value = true;
  errorMessage.value = "";
  try {
    const params = new URLSearchParams();
    params.append("page", currentPage.value);
    params.append("limit", itemsPerPage);
    if (searchQuery.value) params.append("search", searchQuery.value);
    if (statusFilter.value && statusFilter.value !== "ALL")
      params.append("status", statusFilter.value);

    const response = await apiClient.get(
      `/marking/submissions?${params.toString()}`
    );
    submissions.value = response.data.items;
    totalPages.value = response.data.totalPages;
    currentPage.value = response.data.currentPage;
    awaitingMarkingCount.value = response.data.awaitingCount || 0;
  } catch (error) {
    errorMessage.value = "Could not load submissions. Please check the server.";
  } finally {
    loading.value = false;
  }
};

watch([searchQuery, statusFilter], () => {
  currentPage.value = 1;
  fetchSubmissions();
});

onMounted(() => {
  fetchSubmissions();
});

function getStatusClass(status) {
  switch (status) {
    case "COMPLETED":
      return "status-awaiting";
    case "MARKED":
      return "status-marked";
    case "RESULTS_RELEASED":
      return "status-released";
    case "IN_PROGRESS":
      return "status-progress";
    case "SCHEDULED":
      return "status-scheduled";
    default:
      return "status-default";
  }
}

function formatDate(dateString) {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function goToPage(page) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    fetchSubmissions();
  }
}
</script>

<template>
  <div class="submissions-page">
    <div class="page-header">
      <div class="header-content">
        <h1>Submissions & Marking</h1>
        <p class="header-subtitle">
          Review, mark, and manage student exam submissions
        </p>
      </div>
      <div v-if="awaitingMarkingCount > 0" class="awaiting-badge">
        <span class="badge-count">{{ awaitingMarkingCount }}</span>
        <span class="badge-text">Awaiting Marking</span>
      </div>
    </div>

    <div class="content-card">
      <div class="filters-section">
        <div class="filter-group">
          <label for="search" class="filter-label">Search</label>
          <input
            type="text"
            id="search"
            v-model="searchQuery"
            class="filter-input"
            placeholder="Student name or email..."
          />
        </div>
        <div class="filter-group">
          <label for="statusFilter" class="filter-label">Status Filter</label>
          <select
            id="statusFilter"
            v-model="statusFilter"
            class="filter-select"
          >
            <option value="ALL">All Statuses</option>
            <option value="COMPLETED">Awaiting Marking</option>
            <option value="MARKED">Marked</option>
            <option value="RESULTS_RELEASED">Results Released</option>
            <option value="IN_PROGRESS">In Progress</option>
          </select>
        </div>
      </div>

      <div class="table-section">
        <div v-if="loading" class="loading-state">
          <div class="loader"></div>
          <p>Loading submissions...</p>
        </div>

        <div v-else-if="errorMessage" class="error-state">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p>{{ errorMessage }}</p>
        </div>

        <div
          v-else-if="!submissions || submissions.length === 0"
          class="empty-state"
        >
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
          >
            <path
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p>No submissions found</p>
          <span>Try adjusting your search or filter criteria</span>
        </div>

        <div v-else class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Student Information</th>
                <th>Exam Template</th>
                <th>Submitted</th>
                <th>Status</th>
                <th class="actions-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="sub in submissions" :key="sub.id">
                <td>
                  <div class="student-info">
                    <div class="student-name">
                      {{ sub.student?.firstName }} {{ sub.student?.lastName }}
                    </div>
                    <div class="student-email">{{ sub.student?.email }}</div>
                  </div>
                </td>
                <td>
                  <span class="template-title">{{ sub.template?.title }}</span>
                </td>
                <td>
                  <span class="date-text">{{
                    formatDate(sub.submittedAt || sub.createdAt)
                  }}</span>
                </td>
                <td>
                  <span
                    class="status-badge"
                    :class="getStatusClass(sub.status)"
                  >
                    {{ sub.status.replace("_", " ") }}
                  </span>
                </td>

                <td class="actions-cell">
                  <ActionMenu>
                    <RouterLink
                      :to="`/admin/submissions/${sub.id}`"
                      class="menu-item"
                    >
                      {{ sub.status === "COMPLETED" ? "Mark Now" : "View" }}
                    </RouterLink>
                    <RouterLink
                      v-if="
                        ['COMPLETED', 'MARKED', 'RESULTS_RELEASED'].includes(
                          sub.status
                        ) &&
                        sub.studentId &&
                        sub.templateId
                      "
                      :to="`/admin/scheduler?studentId=${sub.studentId}&templateId=${sub.templateId}`"
                      class="menu-item"
                      title="Schedule a new exam for this student"
                    >
                      Grant Re-take
                    </RouterLink>
                  </ActionMenu>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-if="totalPages > 1" class="pagination-section">
        <button
          @click="goToPage(currentPage - 1)"
          :disabled="currentPage === 1"
          class="pagination-btn"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Previous
        </button>
        <div class="pagination-info">
          <span class="current-page">{{ currentPage }}</span>
          <span class="page-separator">/</span>
          <span class="total-pages">{{ totalPages }}</span>
        </div>
        <button
          @click="goToPage(currentPage + 1)"
          :disabled="currentPage === totalPages"
          class="pagination-btn"
        >
          Next
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.submissions-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: var(--space-8) var(--space-6);
}

/* Page Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-8);
  gap: var(--space-6);
}

.header-content h1 {
  margin: 0 0 var(--space-2) 0;
  font-size: var(--text-4xl);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.header-subtitle {
  margin: 0;
  font-size: var(--text-base);
  color: var(--text-secondary);
}

.awaiting-badge {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-5);
  background: var(--color-warning-50);
  border: var(--border-width) solid var(--color-warning-300);
  border-radius: var(--radius-base);
  flex-shrink: 0;
}

.badge-count {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 0 var(--space-2);
  background: var(--color-warning-500);
  color: white;
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  border-radius: var(--radius-base);
}

.badge-text {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--color-warning-800);
  white-space: nowrap;
}

/* Content Card */
.content-card {
  background: var(--bg-primary);
  border: var(--border-width) solid var(--border-primary);
  border-radius: var(--radius-base);
  overflow: hidden;
}

/* Filters Section */
.filters-section {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: var(--space-5);
  padding: var(--space-6);
  background: var(--bg-secondary);
  border-bottom: var(--border-width) solid var(--border-primary);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.filter-label {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
}

.filter-input,
.filter-select {
  height: var(--h-input);
  padding: 0 var(--space-4);
  font-size: var(--text-base);
  font-family: var(--font-primary);
  color: var(--text-primary);
  background: var(--bg-primary);
  border: var(--border-width) solid var(--border-primary);
  border-radius: var(--radius-base);
  transition: all var(--transition-fast);
}

.filter-input {
  min-width: 300px;
}

.filter-select {
  min-width: 200px;
}

.filter-input:focus,
.filter-select:focus {
  outline: none;
  border-color: var(--border-focus);
  box-shadow: 0 0 0 3px rgba(44, 82, 130, 0.1);
}

/* Table Section & States */
.table-section {
  min-height: 400px;
}

.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-12) var(--space-6);
  gap: var(--space-4);
  text-align: center;
}

.loader {
  border: 3px solid var(--color-gray-200);
  border-top: 3px solid var(--color-primary-600);
  border-radius: 50%;
  width: 48px;
  height: 48px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-state p {
  margin: 0;
  color: var(--text-secondary);
}
.error-state svg {
  color: var(--color-error-500);
}
.error-state p {
  margin: 0;
  color: var(--color-error-600);
}
.empty-state svg {
  color: var(--color-gray-300);
}
.empty-state p {
  margin: 0;
  font-size: var(--text-lg);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
}
.empty-state span {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
}

/* Table */
.table-wrapper {
  overflow-x: auto;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
}
.data-table th {
  padding: var(--space-4) var(--space-5);
  text-align: left;
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wider);
  border-bottom: var(--border-width) solid var(--border-primary);
  white-space: nowrap;
}
.actions-header {
  text-align: right;
}
.data-table td {
  padding: var(--space-5);
  font-size: var(--text-base);
  color: var(--text-primary);
  border-bottom: var(--border-width) solid var(--border-primary);
  vertical-align: middle;
}
.data-table tbody tr {
  transition: background var(--transition-fast);
}
.data-table tbody tr:hover {
  background: var(--bg-secondary);
}
.data-table tbody tr:last-child td {
  border-bottom: none;
}

/* Table Cell Content */
.student-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}
.student-name {
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}
.student-email {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}
.template-title {
  font-weight: var(--font-medium);
  color: var(--text-primary);
}
.date-text {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  white-space: nowrap;
}

/* Status Badge */
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: var(--space-1) var(--space-3);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  border-radius: var(--radius-full);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  white-space: nowrap;
}
.status-awaiting {
  background: var(--color-warning-100);
  color: var(--color-warning-800);
}
.status-marked {
  background: var(--color-info-100);
  color: var(--color-info-800);
}
.status-released {
  background: var(--color-success-100);
  color: var(--color-success-800);
}
.status-progress,
.status-scheduled,
.status-default {
  background: var(--color-gray-100);
  color: var(--color-gray-700);
}

/* Actions */
.actions-cell {
  text-align: right;
}

/* Pagination */
.pagination-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-5) var(--space-6);
  background: var(--bg-secondary);
  border-top: var(--border-width) solid var(--border-primary);
}
.pagination-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  height: 36px;
  padding: 0 var(--space-4);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-primary);
  background: var(--bg-primary);
  border: var(--border-width) solid var(--border-primary);
  border-radius: var(--radius-base);
  cursor: pointer;
  transition: all var(--transition-base);
}
.pagination-btn:hover:not(:disabled) {
  border-color: var(--color-primary-600);
  color: var(--color-primary-600);
}
.pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.pagination-btn svg {
  flex-shrink: 0;
}
.pagination-info {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-base);
  font-weight: var(--font-medium);
}
.current-page {
  color: var(--color-primary-600);
  font-weight: var(--font-semibold);
}
.page-separator {
  color: var(--text-tertiary);
}
.total-pages {
  color: var(--text-secondary);
}

/* Responsive */
@media (max-width: 1024px) {
  .submissions-page {
    padding: var(--space-6) var(--space-4);
  }
  .page-header {
    flex-direction: column;
    gap: var(--space-4);
    align-items: flex-start;
  }
  .filters-section {
    grid-template-columns: 1fr;
  }
  .filter-input,
  .filter-select {
    min-width: 100%;
  }
}
@media (max-width: 768px) {
  .header-content h1 {
    font-size: var(--text-3xl);
  }
  .data-table th,
  .data-table td {
    padding: var(--space-3) var(--space-4);
  }
  .pagination-section {
    flex-direction: column;
    gap: var(--space-4);
  }
  .pagination-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
