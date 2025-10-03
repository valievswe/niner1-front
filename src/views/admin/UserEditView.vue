<!-- src/views/admin/UserEditView.vue -->
<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import apiClient from "@/services/api";

const route = useRoute();
const router = useRouter();
const userId = route.params.id;

// State to hold the user data for the form
const user = ref(null);

const loading = ref(true);
const successMessage = ref("");
const errorMessage = ref("");

// Fetch the user's data when the component loads
onMounted(async () => {
  try {
    // We need a GET /api/users/:id endpoint for this.
    // Let's assume we build it. If not, we fetch all and find the one.
    const response = await apiClient.get(`/users/${userId}`);
    user.value = response.data;
  } catch (error) {
    errorMessage.value = "Failed to load user data.";
    console.error(error);
  } finally {
    loading.value = false;
  }
});

// Function to handle the update submission
async function updateUser() {
  successMessage.value = "";
  errorMessage.value = "";
  try {
    // Call the PUT /api/users/:id endpoint
    await apiClient.put(`/users/${userId}`, {
      firstName: user.value.firstName,
      lastName: user.value.lastName,
      role: user.value.role,
      // Note: We are not updating email or password here for simplicity
    });

    successMessage.value = "User updated successfully! Redirecting...";
    setTimeout(() => router.push("/admin/users"), 2000);
  } catch (error) {
    errorMessage.value = "Failed to update user.";
    console.error(error);
  }
}
</script>

<template>
  <div>
    <h1>Admin: Edit User</h1>

    <div v-if="loading">Loading user data...</div>
    <div v-else-if="errorMessage" class="error-message">{{ errorMessage }}</div>

    <form v-else-if="user" @submit.prevent="updateUser" class="user-form">
      <div class="form-group">
        <label>Email (Cannot be changed):</label>
        <input type="email" :value="user.email" disabled />
      </div>
      <div class="form-group">
        <label for="firstName">First Name</label>
        <input type="text" id="firstName" v-model="user.firstName" required />
      </div>
      <div class="form-group">
        <label for="lastName">Last Name</label>
        <input type="text" id="lastName" v-model="user.lastName" required />
      </div>
      <div class="form-group">
        <label for="role">Role</label>
        <select id="role" v-model="user.role">
          <option value="STUDENT">Student</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>

      <button type="submit">Update User</button>

      <p v-if="successMessage" class="success-message">{{ successMessage }}</p>
    </form>
  </div>
</template>

<style scoped>
/* You can reuse the styles from the Create view */
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
input:disabled {
  background-color: #f4f4f4;
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
