<!-- src/views/LoginView.vue -->
<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";

// --- SETUP ---
const email = ref("");
const password = ref("");
const errorMessage = ref("");
const router = useRouter();
const authStore = useAuthStore();

async function handleLogin() {
  errorMessage.value = "";
  try {
    await authStore.login({
      email: email.value,
      password: password.value,
    });
    router.push("/dashboard");
  } catch (error) {
    console.error("Login failed:", error);
    errorMessage.value =
      error.response?.data?.error || "An unexpected error occurred.";
  }
}
</script>

<template>
  <div class="login-container">
    <h1>Login</h1>
    <form @submit.prevent="handleLogin">
      <div class="form-group">
        <label for="email">Email:</label>
        <input type="email" id="email" v-model="email" required />
      </div>
      <div class="form-group">
        <label for="password">Password:</label>
        <input type="password" id="password" v-model="password" required />
      </div>
      <button type="submit">Log In</button>
    </form>
    <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
  </div>
</template>

<style scoped>
.login-container {
  max-width: 400px;
  margin: 50px auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
}
.form-group {
  margin-bottom: 15px;
}
.error-message {
  color: red;
}
</style>
