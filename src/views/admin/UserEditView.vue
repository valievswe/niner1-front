<script setup>
// The script is correct and remains unchanged.
import { ref, onMounted } from "vue";
import { useRoute, useRouter, RouterLink } from "vue-router";
import apiClient from "@/services/api";

const route = useRoute();
const router = useRouter();
const userId = route.params.id;
const user = ref(null);
const loading = ref(true);
const successMessage = ref("");
const errorMessage = ref("");

onMounted(async () => {
  try {
    const response = await apiClient.get(`/users/${userId}`);
    user.value = response.data;
  } catch (error) {
    errorMessage.value = "Failed to load user data.";
  } finally {
    loading.value = false;
  }
});

async function updateUser() {
  successMessage.value = "";
  errorMessage.value = "";
  try {
    await apiClient.put(`/users/${userId}`, {
      firstName: user.value.firstName,
      lastName: user.value.lastName,
      role: user.value.role,
    });
    successMessage.value = "User updated successfully! Redirecting...";
    setTimeout(() => router.push("/admin/users"), 2000);
  } catch (error) {
    errorMessage.value = "Failed to update user.";
  }
}
</script>

<template>
  <div class="edit-user-container">
    <div class="page-header">
      <h1>Edit User</h1>
      <RouterLink to="/admin/users" class="btn btn-secondary">
        &larr; Back to User List
      </RouterLink>
    </div>

    <!-- Loading & Error States -->
    <div v-if="loading" class="loading-state">
      <div class="loader"></div>
      <p>Loading user data...</p>
    </div>
    <div v-else-if="errorMessage && !user" class="alert alert-error">
      <h4>Error Loading User</h4>
      <p>{{ errorMessage }}</p>
    </div>

    <!-- Main Form -->
    <form v-else-if="user" @submit.prevent="updateUser" class="card">
      <div class="card-body">
        <div class="form-group">
          <label class="form-label">Email Address (Cannot be changed)</label>
          <input type="email" :value="user.email" class="form-input" disabled />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="firstName" class="form-label">First Name</label>
            <input
              type="text"
              id="firstName"
              v-model="user.firstName"
              class="form-input"
              required
            />
          </div>
          <div class="form-group">
            <label for="lastName" class="form-label">Last Name</label>
            <input
              type="text"
              id="lastName"
              v-model="user.lastName"
              class="form-input"
              required
            />
          </div>
        </div>
        <div class="form-group">
          <label for="role" class="form-label">Role</label>
          <select id="role" v-model="user.role" class="form-select">
            <option value="STUDENT">Student</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
      </div>
      <div class="card-footer">
        <div v-if="successMessage" class="alert alert-success">
          {{ successMessage }}
        </div>
        <div v-if="errorMessage" class="alert alert-error">
          {{ errorMessage }}
        </div>
        <button type="submit" class="btn btn-primary btn-lg">
          Update User
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.edit-user-container {
  max-width: 700px;
  margin: 0 auto;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

/* All other styles are handled by global CSS */
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-5);
}
.card-footer {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.card-footer .btn {
  align-self: flex-end;
}
input:disabled {
  background-color: var(--bg-secondary);
  cursor: not-allowed;
}
@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
