<!-- src/views/admin/TemplatesView.vue -->
<script setup>
import { ref, onMounted } from "vue";
import { RouterLink } from "vue-router";
import apiClient from "@/services/api";
import ConfirmationModal from "@/components/confirmation/ConfirmationModal.vue";

// --- STATE (Unchanged) ---
const templates = ref([]);
const loading = ref(true);
const errorMessage = ref("");

// --- NEW STATE for the modal ---
const isModalVisible = ref(false);
const templateToDelete = ref(null);

// --- LIFECYCLE HOOK (Unchanged) ---
onMounted(async () => {
  try {
    const response = await apiClient.get("/templates");
    templates.value = response.data;
  } catch (error) {
    errorMessage.value =
      error.response?.data?.error || "Could not load templates.";
  } finally {
    loading.value = false;
  }
});

// --- NEW METHODS to control the modal ---
function showDeleteConfirmation(template) {
  templateToDelete.value = template;
  isModalVisible.value = true;
}

function closeConfirmationModal() {
  isModalVisible.value = false;
  templateToDelete.value = null;
}

// REFACTORED: The original deleteTemplate logic, now called by the modal
async function handleDeleteConfirmed() {
  if (!templateToDelete.value) return;

  try {
    await apiClient.delete(`/templates/${templateToDelete.value.id}`);
    templates.value = templates.value.filter(
      (t) => t.id !== templateToDelete.value.id
    );
  } catch (error) {
    console.error("Failed to delete template:", error);
    alert("Failed to delete template.");
  } finally {
    closeConfirmationModal();
  }
}
</script>

<template>
  <div>
    <h1>Admin: Mock Exam Templates</h1>
    <RouterLink to="/admin/templates/new">
      <button>Create New Template</button>
    </RouterLink>

    <div v-if="loading">...</div>
    <div v-else-if="errorMessage" class="error-message">{{ errorMessage }}</div>

    <div v-else>
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Description</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="template in templates" :key="template.id">
            <td>{{ template.title }}</td>
            <td>{{ template.description }}</td>
            <td class="actions-cell">
              <RouterLink :to="`/admin/templates/${template.id}`">
                <button>View</button>
              </RouterLink>
              <RouterLink :to="`/admin/templates/${template.id}/edit`">
                <button>Edit</button>
              </RouterLink>
              <!-- This button now shows the modal -->
              <button
                @click="showDeleteConfirmation(template)"
                class="delete-btn"
              >
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="templates.length === 0">No templates found.</p>
    </div>

    <!-- The Confirmation Modal Component, now for templates -->
    <ConfirmationModal
      :show="isModalVisible"
      title="Delete Template"
      :message="`Are you sure you want to delete the template '${templateToDelete?.title}'? This action cannot be undone.`"
      @confirm="handleDeleteConfirmed"
      @cancel="closeConfirmationModal"
    />
  </div>
</template>

<style scoped>
/* Your existing styles are fine */
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
.actions-cell {
  display: flex;
  gap: 5px;
}
.delete-btn {
  background-color: #ffdddd;
  color: #c53030;
}
.error-message {
  color: red;
}
button {
  margin-right: 5px;
}
</style>
