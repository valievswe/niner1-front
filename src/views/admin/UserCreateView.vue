<!-- src/views/admin/UserCreateView.vue -->
<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import apiClient from "@/services/api";

const router = useRouter();

// State for the new user form
const newUser = ref({
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  role: "STUDENT", // Default role for new users
});

const successMessage = ref("");
const errorMessage = ref("");

// Function to handle form submission
async function handleRegisterUser() {
  successMessage.value = "";
  errorMessage.value = "";
  try {
    // Call the POST /api/users endpoint
    await apiClient.post("/users", newUser.value);

    successMessage.value = "User created successfully! Redirecting...";
    // Redirect back to the user list after a short delay
    setTimeout(() => router.push("/admin/users"), 2000);
  } catch (error) {
    console.error("Failed to create user:", error);
    errorMessage.value =
      error.response?.data?.error || "Could not create user.";
  }
}
</script>

<template>
  <div>
    <h1>Admin: Create New User</h1>

    <form @submit.prevent="handleRegisterUser" class="user-form">
      <div class="form-group">
        <label for="firstName">First Name:</label>
        <input
          type="text"
          id="firstName"
          v-model="newUser.firstName"
          required
        />
      </div>

      <div class="form-group">
        <label for="lastName">Last Name:</label>
        <input type="text" id="lastName" v-model="newUser.lastName" required />
      </div>

      <div class="form-group">
        <label for="email">Email:</label>
        <input type="email" id="email" v-model="newUser.email" required />
      </div>

      <div class="form-group">
        <label for="password">Initial Password:</label>
        <input
          type="password"
          id="password"
          v-model="newUser.password"
          required
        />
      </div>

      <div class="form-group">
        <label for="role">Role:</label>
        <select id="role" v-model="newUser.role">
          <option value="STUDENT">Student</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>

      <button type="submit">Create User</button>

      <p v-if="successMessage" class="success-message">{{ successMessage }}</p>
      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
    </form>
  </div>
</template>

<style scoped>
.user-form {
  max-width: 500px;
  margin-top: 20px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
}
.form-group {
  margin-bottom: 15px;
}
label {
  display: block;
  margin-bottom: 5px;
}
input,
select {
  width: 100%;
  padding: 8px;
}
.success-message {
  color: green;
  margin-top: 15px;
}
.error-message {
  color: red;
  margin-top: 15px;
}
</style>
