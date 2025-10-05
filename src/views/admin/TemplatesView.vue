<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { RouterLink } from "vue-router";
import apiClient from "@/services/api";
import ConfirmationModal from "@/components/confirmation/ConfirmationModal.vue";
import ActionMenu from "@/views/admin/ActionMenu.vue";

// --- Main State ---
const templates = ref([]);
const loading = ref(true);
const errorMessage = ref("");

// --- Search & Pagination State ---
const searchQuery = ref("");
const currentPage = ref(1);
const totalPages = ref(1);
const itemsPerPage = 10;

// --- Modal State ---
const isModalVisible = ref(false);
const templateToDelete = ref(null);

// --- COMPUTED & WATCH ---

// 1. Filter templates based on the search query
const filteredTemplates = computed(() => {
  if (!searchQuery.value) return templates.value;
  return templates.value.filter(
    (t) =>
      t.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (t.description &&
        t.description.toLowerCase().includes(searchQuery.value.toLowerCase()))
  );
});

// 2. Watch for changes in the filtered list to update total pages
watch(filteredTemplates, (newVal) => {
  totalPages.value = Math.ceil(newVal.length / itemsPerPage);
  // If the current page is now out of bounds, reset to the last page
  if (currentPage.value > totalPages.value) {
    currentPage.value = totalPages.value || 1;
  }
});

// 3. Create the final paginated list from the filtered list
const paginatedTemplates = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredTemplates.value.slice(start, end);
});

// --- LIFECYCLE & METHODS ---
onMounted(async () => {
  try {
    const response = await apiClient.get("/templates");
    templates.value = response.data;
    totalPages.value = Math.ceil(templates.value.length / itemsPerPage); // Initial calculation
  } catch (error) {
    errorMessage.value = "Could not load templates.";
  } finally {
    loading.value = false;
  }
});

function goToPage(page) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
}

function showDeleteConfirmation(template) {
  templateToDelete.value = template;
  isModalVisible.value = true;
}

function closeConfirmationModal() {
  isModalVisible.value = false;
  templateToDelete.value = null;
}

async function handleDeleteConfirmed() {
  if (!templateToDelete.value) return;
  try {
    await apiClient.delete(`/templates/${templateToDelete.value.id}`);
    // Re-fetch or filter from the existing array
    templates.value = templates.value.filter(
      (t) => t.id !== templateToDelete.value.id
    );
  } catch (error) {
    alert("Failed to delete template.");
  } finally {
    closeConfirmationModal();
  }
}
</script>

<template>
  <div class="templates-container">
    <div class="page-header">
      <h1>Mock Exam Templates</h1>
      <RouterLink to="/admin/templates/new" class="btn btn-primary">
        + Create New Template
      </RouterLink>
    </div>

    <div class="card">
      <div class="card-header filter-bar">
        <div class="form-group search-group">
          <label for="search" class="sr-only">Search Templates</label>
          <input
            type="text"
            id="search"
            v-model="searchQuery"
            class="form-input"
            placeholder="Search templates..."
          />
        </div>
      </div>
      <div class="card-body">
        <div v-if="loading" class="loading-state">...</div>
        <div v-else-if="errorMessage" class="alert alert-error">
          {{ errorMessage }}
        </div>
        <div v-else-if="filteredTemplates.length === 0" class="empty-state">
          ...
        </div>
        <div v-else class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Description</th>
                <th>Questions</th>
                <th class="actions-column">Actions</th>
              </tr>
            </thead>
            <tbody>
              <!-- This now loops over the paginated list -->
              <tr v-for="template in paginatedTemplates" :key="template.id">
                <td>
                  <RouterLink
                    :to="`/admin/templates/${template.id}`"
                    class="template-title-link"
                  >
                    {{ template.title }}
                  </RouterLink>
                </td>
                <td>
                  <span class="text-secondary">{{
                    template.description || "N/A"
                  }}</span>
                </td>
                <td>
                  <span class="badge">{{
                    template.questions?.length || 0
                  }}</span>
                </td>
                <td class="actions-cell">
                  <ActionMenu>
                    <RouterLink
                      :to="`/admin/templates/${template.id}`"
                      class="menu-item"
                      >View Preview</RouterLink
                    >
                    <RouterLink
                      :to="`/admin/templates/${template.id}/edit`"
                      class="menu-item"
                      >Edit</RouterLink
                    >
                    <button
                      @click="showDeleteConfirmation(template)"
                      class="menu-item text-error"
                    >
                      Delete
                    </button>
                  </ActionMenu>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- THE FIX: The complete pagination UI is now here -->
      <div
        v-if="!loading && totalPages > 1"
        class="card-footer pagination-footer"
      >
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
      title="Delete Template"
      :message="`Are you sure you want to permanently delete the template '${templateToDelete?.title}'? This action cannot be undone.`"
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
  align-items: center;
  gap: var(--space-4);
}
.empty-state span {
  font-size: var(--text-sm);
}
.card .card-header.filter-bar {
  padding-top: var(--space-5);
  padding-bottom: var(--space-5);
}
.form-group {
  margin: 0;
}

/* Table Styles */
.actions-column {
  width: 1%;
  text-align: right;
}
.actions-cell {
  text-align: right;
}
.template-title-link {
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  text-decoration: none;
  transition: color var(--transition-fast);
}
.template-title-link:hover {
  color: var(--color-primary-600);
}
.text-error {
  color: var(--color-error-600) !important;
}
.text-error:hover {
  background-color: var(--color-error-50) !important;
}
</style>
