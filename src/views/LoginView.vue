<script setup>
// The script is correct and remains unchanged.
import { ref } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "vue-router";

const email = ref("");
const password = ref("");
const errorMessage = ref("");
const authStore = useAuthStore();
const router = useRouter();

async function handleLogin() {
  errorMessage.value = "";
  try {
    const loggedInUser = await authStore.login({
      email: email.value,
      password: password.value,
    });
    if (loggedInUser.role === "ADMIN") {
      router.push("/admin/dashboard");
    } else {
      router.push("/dashboard");
    }
  } catch (error) {
    errorMessage.value =
      error.response?.data?.error ||
      "Login failed. Please check your credentials.";
  }
}
</script>

<template>
  <div class="login-page-wrapper">
    <div class="login-container">
      <div class="page-title">
        <h1>niner</h1>
        <h1>CD IELTS Platform</h1>
        <p class="text-secondary">Please log in to continue</p>
      </div>

      <div class="card">
        <div class="card-header">
          <h4 class="card-title">Login</h4>
        </div>
        <form @submit.prevent="handleLogin" class="card-body">
          <div class="form-group">
            <label for="email" class="form-label">Email Address</label>
            <input
              type="email"
              id="email"
              v-model="email"
              class="form-input"
              required
              placeholder="you@example.com"
            />
          </div>
          <div class="form-group">
            <label for="password" class="form-label">Password</label>
            <input
              type="password"
              id="password"
              v-model="password"
              class="form-input"
              required
              placeholder="••••••••"
            />
          </div>

          <div v-if="errorMessage" class="alert alert-error">
            {{ errorMessage }}
          </div>

          <button type="submit" class="btn btn-primary btn-lg btn-block">
            Login
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  width: 100%;
  background-color: var(--bg-secondary);
}

.login-container {
  width: 100%;
  max-width: 400px;
}

.page-title {
  text-align: center;
  margin-bottom: var(--space-8);
}

.page-title h1 {
  font-size: var(--text-3xl);
  color: var(--text-primary);
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.btn-block {
  width: 100%;
}
</style>
