<script setup>
import { ref, onMounted } from "vue";
import { RouterLink } from "vue-router";
import apiClient from "@/services/api";
import ConfirmationModal from "@/components/confirmation/ConfirmationModal.vue";

// --- Main State ---
const questions = ref([]);
const loading = ref(true);
const errorMessage = ref("");

// --- Pagination State ---
const currentPage = ref(1);
const totalPages = ref(1); // Will be updated by the API response
const itemsPerPage = 10;

// --- Filter State ---
const filterSection = ref("ALL");
const filterPart = ref("ALL");
const filterType = ref("ALL");

// --- Sort State ---
const sortBy = ref("section"); // Default sort by section
const sortOrder = ref("ASC");

// --- Modal State ---
const isModalVisible = ref(false);
const questionToDelete = ref(null);

// --- Data Fetching ---
// This function now fetches a specific page from the backend
const fetchQuestions = async (page) => {
  loading.value = true;
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: itemsPerPage.toString(),
      sortBy: sortBy.value,
      sortOrder: sortOrder.value,
    });

    if (filterSection.value !== "ALL") {
      params.append("section", filterSection.value);
    }
    if (filterPart.value !== "ALL") {
      params.append("partNumber", filterPart.value);
    }
    if (filterType.value !== "ALL") {
      params.append("questionType", filterType.value);
    }

    const response = await apiClient.get(`/questions?${params.toString()}`);
    questions.value = response.data.items;
    totalPages.value = response.data.totalPages;
    currentPage.value = response.data.currentPage;
  } catch (error) {
    errorMessage.value = "Could not load questions.";
  } finally {
    loading.value = false;
  }
};

// Apply filters and reset to page 1
function applyFilters() {
  currentPage.value = 1;
  fetchQuestions(1);
}

// Sort by column
function sortByColumn(column) {
  if (sortBy.value === column) {
    // Toggle sort order
    sortOrder.value = sortOrder.value === "ASC" ? "DESC" : "ASC";
  } else {
    sortBy.value = column;
    sortOrder.value = "ASC";
  }
  currentPage.value = 1;
  fetchQuestions(1);
}

// Fetch the initial page when the component mounts
onMounted(() => {
  fetchQuestions(currentPage.value);
});

// --- Methods ---
function showDeleteConfirmation(question) {
  questionToDelete.value = question;
  isModalVisible.value = true;
}

function closeConfirmationModal() {
  isModalVisible.value = false;
  questionToDelete.value = null;
}

async function handleDeleteConfirmed() {
  if (!questionToDelete.value) return;
  try {
    await apiClient.delete(`/questions/${questionToDelete.value.id}`);

    fetchQuestions(currentPage.value);
  } catch (error) {
    alert(error.response?.data?.error || "Failed to delete the question.");
  } finally {
    closeConfirmationModal();
  }
}

function goToPage(page) {
  if (page >= 1 && page <= totalPages.value) {
    fetchQuestions(page);
  }
}

// Helper to get a short preview from question content
function getPreviewText(question) {
  const content = question.content;
  let text = "";
  switch (question.questionType) {
    case "TRUE_FALSE_NOT_GIVEN":
      text = content.statements?.[0]?.text || "No statements";
      break;
    case "MULTIPLE_CHOICE_MULTIPLE_ANSWER":
      text = content.prompt || "No prompt";
      break;
    case "WRITING_PROMPT":
      text = content.prompt || "No prompt";
      break;
    default:
      text = content.instructions || "No instructions";
  }
  return text.length > 50 ? text.substring(0, 50) + "..." : text;
}
</script>

<template>
  <div class="questions-view-container">
    <div class="page-header">
      <h1>Question Bank</h1>
      <RouterLink to="/admin/questions/new" class="btn btn-primary">
        + Create New Question
      </RouterLink>
    </div>

    <!-- Filters Card -->
    <div class="card filters-card">
      <div class="card-body">
        <div class="filters-grid">
          <div class="form-group">
            <label for="filterSection" class="form-label">Section</label>
            <select
              id="filterSection"
              v-model="filterSection"
              @change="applyFilters"
              class="form-select"
            >
              <option value="ALL">All Sections</option>
              <option value="LISTENING">Listening</option>
              <option value="READING">Reading</option>
              <option value="WRITING">Writing</option>
            </select>
          </div>
          <div class="form-group">
            <label for="filterPart" class="form-label">Part/Passage/Task</label>
            <select
              id="filterPart"
              v-model="filterPart"
              @change="applyFilters"
              class="form-select"
            >
              <option value="ALL">All Parts</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
            </select>
          </div>
          <div class="form-group">
            <label for="filterType" class="form-label">Question Type</label>
            <select
              id="filterType"
              v-model="filterType"
              @change="applyFilters"
              class="form-select"
            >
              <option value="ALL">All Types</option>
              <option value="TRUE_FALSE_NOT_GIVEN">True/False/Not Given</option>
              <option value="MULTIPLE_CHOICE_MULTIPLE_ANSWER">
                Multiple Choice
              </option>
              <option value="GAP_FILLING">Gap Filling</option>
              <option value="SUMMARY_COMPLETION">Summary Completion</option>
              <option value="MATCHING">Matching</option>
              <option value="MAP_LABELING">Map Labeling</option>
              <option value="WRITING_PROMPT">Writing Prompt</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-body">
        <div v-if="loading" class="loading-state">
          <div class="loader"></div>
          <p>Loading Question Bank...</p>
        </div>
        <div v-else-if="errorMessage" class="alert alert-error">
          <p>{{ errorMessage }}</p>
        </div>
        <div v-else-if="questions.length === 0" class="empty-state">
          <p>No questions found. Go ahead and create one!</p>
        </div>

        <!-- THE UPDATED TABLE THAT MATCHES THE SCREENSHOT -->
        <div v-else class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th class="sortable" @click="sortByColumn('section')">
                  Section
                  <span v-if="sortBy === 'section'" class="sort-indicator">
                    {{ sortOrder === "ASC" ? "↑" : "↓" }}
                  </span>
                </th>
                <th class="sortable" @click="sortByColumn('partNumber')">
                  Part
                  <span v-if="sortBy === 'partNumber'" class="sort-indicator">
                    {{ sortOrder === "ASC" ? "↑" : "↓" }}
                  </span>
                </th>
                <th class="sortable" @click="sortByColumn('questionType')">
                  Question
                  <span v-if="sortBy === 'questionType'" class="sort-indicator">
                    {{ sortOrder === "ASC" ? "↑" : "↓" }}
                  </span>
                </th>
                <th>Set</th>
                <th class="actions-column">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="question in questions" :key="question.id">
                <td>
                  <span class="badge badge-info">{{ question.section }}</span>
                </td>
                <td>
                  <span class="part-badge">{{ question.partNumber || 1 }}</span>
                </td>
                <td>
                  <div class="question-preview-cell">
                    <span class="badge badge-primary">{{
                      question.questionType.replace(/_/g, " ")
                    }}</span>
                    <span class="preview-text"
                      >"{{ getPreviewText(question) }}"</span
                    >
                  </div>
                </td>
                <td>
                  <span class="text-secondary">{{
                    question.questionSet?.name || "N/A"
                  }}</span>
                </td>
                <td class="actions-cell">
                  <RouterLink
                    :to="`/admin/questions/${question.id}`"
                    class="btn btn-secondary btn-sm"
                    >View</RouterLink
                  >
                  <RouterLink
                    :to="`/admin/questions/${question.id}/edit`"
                    class="btn btn-secondary btn-sm"
                    >Edit</RouterLink
                  >
                  <button
                    @click="showDeleteConfirmation(question)"
                    class="btn btn-danger btn-sm"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-if="totalPages > 1" class="card-footer pagination-footer">
        <button
          @click="goToPage(currentPage - 1)"
          :disabled="currentPage === 1"
          class="btn btn-secondary btn-sm"
        >
          &larr; Previous
        </button>
        <span>Page {{ currentPage }} of {{ totalPages }}</span>
        <button
          @click="goToPage(currentPage + 1)"
          :disabled="currentPage === totalPages"
          class="btn btn-secondary btn-sm"
        >
          Next &rarr;
        </button>
      </div>
    </div>

    <ConfirmationModal
      :show="isModalVisible"
      title="Delete Question"
      :message="`Are you sure you want to permanently delete Question ID: ${questionToDelete?.id}? This action cannot be undone.`"
      @confirm="handleDeleteConfirmed"
      @cancel="closeConfirmationModal"
    />
  </div>
</template>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-8);
}
.loading-state,
.empty-state {
  text-align: center;
  padding: var(--space-10) 0;
  color: var(--text-secondary);
}
.loading-state {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.table th {
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
}
.table th.sortable {
  cursor: pointer;
  user-select: none;
  transition: background-color var(--transition-fast);
}
.table th.sortable:hover {
  background-color: var(--bg-secondary);
}
.sort-indicator {
  margin-left: var(--space-1);
  font-size: var(--text-lg);
  color: var(--color-primary-600);
}
.actions-column {
  width: 1%;
  white-space: nowrap;
  text-align: right;
}
.actions-cell {
  text-align: right;
  display: flex;
  gap: var(--space-2);
  justify-content: flex-end;
}

/* New styles to match the screenshot's question display */
.question-preview-cell {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
}
.question-preview-cell .badge {
  flex-shrink: 0;
}
.preview-text {
  font-style: italic;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pagination-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

/* Filters */
.filters-card {
  margin-bottom: var(--space-6);
}
.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-4);
}

/* Part badge */
.part-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: var(--space-1) var(--space-2);
  background: var(--color-primary-100);
  color: var(--color-primary-700);
  border-radius: var(--radius-full);
  font-weight: var(--font-bold);
  font-size: var(--text-sm);
}
</style>
