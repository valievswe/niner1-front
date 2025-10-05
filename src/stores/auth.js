// src/stores/auth.js (Corrected)

import { defineStore } from "pinia";
import { ref, computed } from "vue";
import apiClient from "@/services/api";
import { useRouter } from "vue-router";

export const useAuthStore = defineStore("auth", () => {
  const user = ref(JSON.parse(localStorage.getItem("user")));
  const token = ref(localStorage.getItem("token"));

  const isAuthenticated = computed(() => !!token.value);
  const isAdmin = computed(() => user.value?.role === "ADMIN");

  async function login(credentials) {
    const response = await apiClient.post("/auth/login", credentials);
    const { user: userData, token: authToken } = response.data;

    user.value = userData;
    token.value = authToken;

    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", authToken);

    return userData;
  }

  function logout() {
    user.value = null;
    token.value = null;
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  }

  return {
    user,
    token,
    isAuthenticated,
    isAdmin,
    login,
    logout,
  };
});
