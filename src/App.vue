<script setup>
import { RouterLink, RouterView, useRoute, useRouter } from "vue-router";
import { useAuthStore } from "./stores/auth";
import { computed } from "vue";

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();

const hideNavbar = computed(() => {
  return route.path.startsWith("/admin") || route.path.startsWith("/exam");
});

const isConstrained = computed(() => {
  return !hideNavbar.value;
});

function handleLogout() {
  authStore.logout();
  router.push("/login");
}
</script>

<template>
  <div id="app-layout">
    <header v-if="!hideNavbar" class="app-header">
      <div class="user-actions">
        <a
          v-if="authStore.isAuthenticated"
          href="#"
          @click.prevent="handleLogout"
        >
          Logout
        </a>
        <RouterLink v-else to="/login">Login</RouterLink>
      </div>
    </header>

    <main :class="['app-main', { constrained: isConstrained }]">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
#app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background-color: var(--bg-secondary);
  border-bottom: 1px solid var(--border-primary);
}

.logo a {
  font-weight: var(--font-bold);
  font-size: var(--text-xl);
  color: var(--text-primary);
  text-decoration: none;
}

.main-nav,
.user-actions {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.main-nav a,
.user-actions a {
  font-weight: var(--font-medium);
  color: var(--text-primary);
  text-decoration: none;
}

.main-nav a.router-link-exact-active {
  color: var(--color-primary-600);
  font-weight: var(--font-semibold);
}

.admin-links span {
  color: var(--border-primary);
}

.app-main.constrained {
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: var(--space-6);
}

.app-main {
  flex-grow: 1;
}
</style>
