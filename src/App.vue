<!-- src/App.vue -->
<script setup>
import { RouterLink, RouterView, useRouter, useRoute } from "vue-router";
import { useAuthStore } from "./stores/auth";
import { computed } from "vue";

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

// Hide navbar on admin pages
const isAdminPage = computed(() => {
  return route.path.startsWith("/admin");
});

// Full-width layout for exam pages
const isExamPage = computed(() => {
  return route.path.startsWith("/exam");
});

// Constrained layout for all other pages
const isConstrainedPage = computed(() => {
  return !isAdminPage.value && !isExamPage.value;
});

function handleLogout() {
  authStore.logout();
  router.push("/login");
}
</script>

<template>
  <div id="layout">
    <!-- Only show header if not on admin pages -->
    <header v-if="!isAdminPage" class="app-header">
      <div class="logo">
        <RouterLink to="/">niner</RouterLink>
      </div>
      <nav class="main-nav">
        <!-- Always visible -->
        <RouterLink to="/dashboard">Dashboard</RouterLink>

        <!-- Admin-only Links -->
        <div v-if="authStore.isAdmin" class="admin-links">
          <span>|</span>
          <RouterLink to="/admin/dashboard">Admin</RouterLink>
        </div>
      </nav>
      <div class="user-actions">
        <a
          v-if="authStore.isAuthenticated"
          href="#"
          @click.prevent="handleLogout"
          >Logout</a
        >
        <RouterLink v-else to="/login">Login</RouterLink>
      </div>
    </header>

    <!-- Main content - full height on admin pages, full width on exam pages -->
    <main
      :class="[
        'app-main',
        {
          'admin-main': isAdminPage,
          'exam-main': isExamPage,
          'constrained-main': isConstrainedPage,
        },
      ]"
    >
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
#layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background-color: var(--color-background-soft);
  border-bottom: 1px solid var(--color-border);
}

.logo a {
  font-weight: 700;
  font-size: 1.2rem;
  color: var(--color-heading);
  text-decoration: none;
}

.main-nav,
.admin-links {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.admin-links span {
  color: var(--color-border);
}

.main-nav a,
.user-actions a {
  font-weight: 500;
  color: var(--color-text);
}

.main-nav a.router-link-exact-active {
  color: var(--brand-primary);
  font-weight: 700;
}

/* Regular app main - constrained layout */
.app-main.constrained-main {
  flex-grow: 1;
  padding: 2rem;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
}

/* Exam pages - full width, no padding constraints */
.app-main.exam-main {
  flex-grow: 1;
  padding: 0;
  max-width: none;
  margin: 0;
  width: 100%;
}

/* Admin pages - no padding, full width */
.app-main.admin-main {
  padding: 0;
  max-width: none;
  margin: 0;
}
</style>
