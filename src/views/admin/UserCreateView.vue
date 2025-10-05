<script setup>
// The script is correct and remains unchanged.
import { ref } from "vue";
import { useRouter, RouterLink } from "vue-router";
import apiClient from "@/services/api";

const router = useRouter();
const newUser = ref({
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  role: "STUDENT",
});
const successMessage = ref("");
const errorMessage = ref("");

async function handleRegisterUser() {
  successMessage.value = "";
  errorMessage.value = "";
  try {
    await apiClient.post("/users", newUser.value);
    successMessage.value = "User created successfully! Redirecting...";
    setTimeout(() => router.push("/admin/users"), 2000);
  } catch (error) {
    errorMessage.value =
      error.response?.data?.error || "Could not create user.";
  }
}
</script>

<template>
  <div class="create-user-container">
    <div class="page-header">
      <h1>Create New User</h1>
      <RouterLink to="/admin/users" class="btn btn-secondary">
        &larr; Back to User List
      </RouterLink>
    </div>

    <form @submit.prevent="handleRegisterUser" class="card">
      <div class="card-body">
        <div class="form-row">
          <div class="form-group">
            <label for="firstName" class="form-label">First Name</label>
            <input
              type="text"
              id="firstName"
              v-model="newUser.firstName"
              class="form-input"
              required
            />
          </div>
          <div class="form-group">
            <label for="lastName" class="form-label">Last Name</label>
            <input
              type="text"
              id="lastName"
              v-model="newUser.lastName"
              class="form-input"
              required
            />
          </div>
        </div>

        <div class="form-group">
          <label for="email" class="form-label">Email Address</label>
          <input
            type="email"
            id="email"
            v-model="newUser.email"
            class="form-input"
            required
          />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="password" class="form-label">Initial Password</label>
            <input
              type="password"
              id="password"
              v-model="newUser.password"
              class="form-input"
              required
            />
          </div>
          <div class="form-group">
            <label for="role" class="form-label">Role</label>
            <select id="role" v-model="newUser.role" class="form-select">
              <option value="STUDENT">Student</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
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
          Create User
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.create-user-container {
  max-width: 700px;
  margin: 0 auto;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-8);
}

/* All form and card styles are handled by global CSS */
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
  align-self: flex-end; /* Pushes button to the right */
}
@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
