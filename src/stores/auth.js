// src/stores/auth.js

import { defineStore } from "pinia";
import { ref, computed } from "vue";
import apiClient from "@/services/api";

export const useAuthStore = defineStore("auth", () => {
  // --- STATE ---
  // Initialize state from localStorage to enable session persistence
  const user = ref(JSON.parse(localStorage.getItem("user")));
  const token = ref(localStorage.getItem("token"));

  // --- GETTERS ---
  // Computed property to check if a user is authenticated
  const isAuthenticated = computed(() => !!token.value);
  // Computed property to check if the authenticated user is an admin
  const isAdmin = computed(() => user.value?.role === "ADMIN");

  // --- ACTIONS ---
  /**
   * Handles the user login process.
   * @param {Object} credentials - { email, password }
   */
  async function login(credentials) {
    const response = await apiClient.post("/auth/login", credentials);
    const { user: userData, token: authToken } = response.data;

    // Update the state
    user.value = userData;
    token.value = authToken;

    // Store the state in localStorage for persistence
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", authToken);
  }

  /**
   * Handles the user logout process.
   */
  function logout() {
    // Clear the state
    user.value = null;
    token.value = null;

    // Clear the localStorage
    localStorage.removeItem("user");
    localStorage.removeItem("token");

    // We will redirect to login from the component that calls this
  }

  // Expose state, getters, and actions
  return {
    user,
    token,
    isAuthenticated,
    isAdmin,
    login,
    logout,
  };
});
