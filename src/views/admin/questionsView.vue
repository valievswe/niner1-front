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

// --- Modal State ---
const isModalVisible = ref(false);
const questionToDelete = ref(null);

// --- Data Fetching ---
// This function now fetches a specific page from the backend
const fetchQuestions = async (page) => {
  loading.value = true;
  try {
    const response = await apiClient.get(
      `/questions?page=${page}&limit=${itemsPerPage}`
    );
    questions.value = response.data.items;
    totalPages.value = response.data.totalPages;
    currentPage.value = response.data.currentPage;
  } catch (error) {
    errorMessage.value = "Could not load questions.";
  } finally {
    loading.value = false;
  }
};

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
                <th>Question</th>
                <th>Set</th>
                <th class="actions-column">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="question in questions" :key="question.id">
                <td>
                  <div class="question-preview-cell">
                    <span class="badge badge-primary">{{
                      question.questionType.replace(/_/g, " ")
                    }}</span>
                    <span class="text-secondary">({{ question.section }})</span>
                    <span class="preview-text"
                      >"{{ getPreviewText(question) }}"</span
                    >
                  </div>
                </td>
                <td>
                  <!-- THIS IS THE FIX: Accessing the nested questionSet name -->
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
</style>
