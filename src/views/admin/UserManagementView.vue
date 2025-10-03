<!-- src/views/admin/UserManagementView.vue -->
<script setup>
import { ref, onMounted } from "vue";
import { RouterLink } from "vue-router";
import apiClient from "@/services/api";
import ConfirmationModal from "@/components/confirmation/ConfirmationModal.vue";

// --- STATE ---
const users = ref([]);
const loading = ref(true);
const errorMessage = ref("");

// --- NEW STATE for controlling the modal ---
const isModalVisible = ref(false);
const userToDelete = ref(null); // Will hold the user object targeted for deletion

// --- LIFECYCLE HOOK (Unchanged) ---
onMounted(async () => {
  await fetchUsers();
});

// --- METHODS ---
async function fetchUsers() {
  loading.value = true;
  try {
    const response = await apiClient.get("/users");
    users.value = response.data;
  } catch (error) {
    errorMessage.value = "Failed to load users.";
    console.error(error);
  } finally {
    loading.value = false;
  }
}

// NEW: This function opens the modal and sets the target user
function showDeleteConfirmation(user) {
  userToDelete.value = user;
  isModalVisible.value = true;
}

// NEW: This function closes the modal
function closeConfirmationModal() {
  isModalVisible.value = false;
  userToDelete.value = null;
}

// REFACTORED: This is the actual delete logic, now called by the modal's 'confirm' event
async function handleDeleteConfirmed() {
  if (!userToDelete.value) return; // Safety check

  try {
    await apiClient.delete(`/users/${userToDelete.value.id}`);
    // Refresh the list after a successful deletion
    await fetchUsers();
  } catch (error) {
    // We can use a more robust error display later
    alert(error.response?.data?.error || "Failed to delete the user.");
    console.error(error);
  } finally {
    // Always close the modal
    closeConfirmationModal();
  }
}
</script>

<template>
  <div>
    <h1>Admin: User Management</h1>

    <RouterLink to="/admin/users/new">
      <button>Create New User</button>
    </RouterLink>

    <div v-if="loading">Loading users...</div>
    <div v-else-if="errorMessage" class="error-message">{{ errorMessage }}</div>

    <table v-else>
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Role</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in users" :key="user.id">
          <td>{{ user.firstName }} {{ user.lastName }}</td>
          <td>{{ user.email }}</td>
          <td>{{ user.role }}</td>
          <td class="actions-cell">
            <RouterLink :to="`/admin/users/${user.id}/edit`">
              <button>Edit</button>
            </RouterLink>
            <!-- This button now calls the method to SHOW the modal -->
            <button @click="showDeleteConfirmation(user)" class="delete-btn">
              Delete
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- The Confirmation Modal Component -->
    <!-- It is always in the template, but only visible when isModalVisible is true -->
    <ConfirmationModal
      :show="isModalVisible"
      title="Delete User"
      :message="`Are you sure you want to permanently delete the user '${userToDelete?.email}'? This action cannot be undone.`"
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
</style>
