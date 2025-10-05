<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { RouterLink } from "vue-router";
import apiClient from "@/services/api";
import ConfirmationModal from "@/components/confirmation/ConfirmationModal.vue";
import ActionMenu from "@/views/admin/ActionMenu.vue";

// --- Main State ---
const users = ref([]);
const loading = ref(true);
const errorMessage = ref("");

// --- Search, Filter & Pagination State ---
const searchQuery = ref("");
const roleFilter = ref("ALL"); // 'ALL', 'ADMIN', 'STUDENT'
const currentPage = ref(1);
const totalPages = ref(1);
const itemsPerPage = 10;

// --- Modal State (Unchanged) ---
const isModalVisible = ref(false);
const userToDelete = ref(null);

// --- Computed & Watch for Front-End Filtering/Pagination ---
const filteredUsers = computed(() => {
  return users.value.filter((user) => {
    const searchMatch =
      !searchQuery.value ||
      user.firstName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.value.toLowerCase());

    const roleMatch =
      roleFilter.value === "ALL" || user.role === roleFilter.value;

    return searchMatch && roleMatch;
  });
});

watch(filteredUsers, (newVal) => {
  totalPages.value = Math.ceil(newVal.length / itemsPerPage);
  if (currentPage.value > totalPages.value)
    currentPage.value = totalPages.value || 1;
});

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return filteredUsers.value.slice(start, start + itemsPerPage);
});

// --- Methods ---
async function fetchUsers() {
  loading.value = true;
  errorMessage.value = "";
  try {
    const response = await apiClient.get("/users");
    users.value = response.data;
    totalPages.value = Math.ceil(users.value.length / itemsPerPage);
  } catch (error) {
    errorMessage.value = "Failed to load users.";
  } finally {
    loading.value = false;
  }
}

onMounted(fetchUsers);

function goToPage(page) {
  if (page >= 1 && page <= totalPages.value) currentPage.value = page;
}

function showDeleteConfirmation(user) {
  userToDelete.value = user;
  isModalVisible.value = true;
}

function closeConfirmationModal() {
  isModalVisible.value = false;
  userToDelete.value = null;
}

async function handleDeleteConfirmed() {
  if (!userToDelete.value) return;
  try {
    await apiClient.delete(`/users/${userToDelete.value.id}`);
    await fetchUsers(); // Re-fetch the entire list
  } catch (error) {
    alert(error.response?.data?.error || "Failed to delete the user.");
  } finally {
    closeConfirmationModal();
  }
}

// Helper for styling role badges
function getRoleClass(role) {
  if (role === "ADMIN") return "badge-primary";
  if (role === "STUDENT") return "badge-success";
  return "badge";
}
</script>

<template>
  <div class="users-container">
    <div class="page-header">
      <h1>User Management</h1>
      <RouterLink to="/admin/users/new" class="btn btn-primary">
        + Create New User
      </RouterLink>
    </div>

    <div class="card">
      <div class="card-header filter-bar">
        <div class="form-group search-group">
          <label for="search" class="sr-only">Search Users</label>
          <input
            type="text"
            id="search"
            v-model="searchQuery"
            class="form-input"
            placeholder="Search by name or email..."
          />
        </div>
        <div class="form-group status-group">
          <label for="roleFilter" class="form-label">Role</label>
          <select id="roleFilter" v-model="roleFilter" class="form-select">
            <option value="ALL">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="STUDENT">Student</option>
          </select>
        </div>
      </div>
      <div class="card-body">
        <div v-if="loading" class="loading-state">
          <div class="loader"></div>
          <p>Loading users...</p>
        </div>
        <div v-else-if="errorMessage" class="alert alert-error">
          {{ errorMessage }}
        </div>
        <div v-else-if="filteredUsers.length === 0" class="empty-state">
          <p>No users found matching your criteria.</p>
        </div>
        <div v-else class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th class="actions-column">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in paginatedUsers" :key="user.id">
                <td>{{ user.firstName }} {{ user.lastName }}</td>
                <td>{{ user.email }}</td>
                <td>
                  <span class="badge" :class="getRoleClass(user.role)">{{
                    user.role
                  }}</span>
                </td>
                <td class="actions-cell">
                  <ActionMenu>
                    <RouterLink
                      :to="`/admin/users/${user.id}/edit`"
                      class="menu-item"
                      >Edit User</RouterLink
                    >
                    <button
                      @click="showDeleteConfirmation(user)"
                      class="menu-item text-error"
                    >
                      Delete User
                    </button>
                  </ActionMenu>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
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
      title="Delete User"
      :message="`Are you sure you want to permanently delete the user '${userToDelete?.email}'? This action cannot be undone.`"
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
.filter-bar {
  display: flex;
  gap: var(--space-5);
  align-items: flex-end;
  padding: var(--space-5);
}
.search-group {
  flex-grow: 1;
}
.form-group {
  margin: 0;
}
.form-label {
  margin-bottom: var(--space-1);
}
.actions-column {
  width: 1%;
  text-align: right;
}
.actions-cell {
  text-align: right;
}
.text-error {
  color: var(--color-error-600) !important;
}
.text-error:hover {
  background-color: var(--color-error-50) !important;
}
.pagination-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--text-sm);
  color: var(--text-secondary);
}
@media (max-width: 768px) {
  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
```
