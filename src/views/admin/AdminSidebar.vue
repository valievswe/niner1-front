<!-- src/views/admin/AdminSidebar.vue (Corrected) -->
<template>
  <aside :class="['admin-sidebar', { 'sidebar-collapsed': isCollapsed }]">
    <div class="sidebar-header">
      <svg
        v-show="isCollapsed"
        class="brand-icon"
        xmlns="http://www.w3.org/2000/svg"
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path
          d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"
        />
        <path d="m14 14-4-4 4-4" />
      </svg>
      <h2 v-show="!isCollapsed">niner</h2>
    </div>

    <nav class="sidebar-nav">
      <RouterLink
        v-for="item in navLinks"
        :key="item.text"
        :to="item.to"
        class="nav-item"
        :title="isCollapsed ? item.text : ''"
      >
        <component :is="item.icon" />
        <span class="nav-text" v-show="!isCollapsed">{{ item.text }}</span>
      </RouterLink>
    </nav>

    <div class="sidebar-footer">
      <div class="user-info" v-show="!isCollapsed">
        <div class="user-name">
          {{ authStore.user?.firstName }} {{ authStore.user?.lastName }}
        </div>
        <div class="user-role">Administrator</div>
      </div>
      <button
        @click="handleLogout"
        class="logout-btn"
        :title="isCollapsed ? 'Logout' : ''"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        <span v-show="!isCollapsed">Logout</span>
      </button>
    </div>
  </aside>
</template>

<script setup>
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "vue-router";

// Import the icon components directly
import IconDashboard from "./icons/IconDashboard.vue";
import IconSubmissions from "./icons/IconSubmissions.vue";
import IconQuestions from "./icons/IconQuestions.vue";
import IconTemplates from "./icons/IconTemplates.vue";
import IconScheduler from "./icons/IconScheduler.vue";
import IconUsers from "./icons/IconUsers.vue";
import IconLayers from "./icons/IconLayers.vue";

defineProps({
  isCollapsed: Boolean,
});

const authStore = useAuthStore();
const router = useRouter();

const handleLogout = () => {
  authStore.logout();
  router.push("/login");
};

const navLinks = [
  { to: "/admin/dashboard", text: "Dashboard", icon: IconDashboard },
  { to: "/admin/submissions", text: "Submissions", icon: IconSubmissions },
  { to: "/admin/questions", text: "Questions", icon: IconQuestions },
  { to: "/admin/question-sets", text: "Question Sets", icon: IconLayers },
  { to: "/admin/templates", text: "Templates", icon: IconTemplates },
  { to: "/admin/scheduler", text: "Scheduler", icon: IconScheduler },
  { to: "/admin/users", text: "Users", icon: IconUsers },
];
</script>

<style scoped>
/* The styles are correct and do not need to be changed. */
.admin-sidebar {
  width: var(--w-sidebar);
  background: var(--color-gray-800);
  color: var(--color-gray-300);
  display: flex;
  flex-direction: column;
  position: fixed;
  height: 100%;
  left: 0;
  top: 0;
  z-index: var(--z-fixed);
  transition: width var(--transition-base);
}
.sidebar-collapsed {
  width: var(--w-sidebar-collapsed);
}

.sidebar-header {
  height: var(--h-header);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 var(--space-4);
  flex-shrink: 0;
  border-bottom: 1px solid var(--color-gray-700);
}
.sidebar-header h2 {
  color: var(--text-inverse);
  font-size: var(--text-2xl);
  margin: 0;
  white-space: nowrap;
}
.brand-icon {
  color: var(--text-inverse);
}

.sidebar-nav {
  flex-grow: 1;
  padding: var(--space-2) 0;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  height: 44px;
  padding: 0 var(--space-5);
  margin: var(--space-2) var(--space-3);
  color: var(--color-gray-300);
  border-radius: var(--radius-base);
  text-decoration: none;
  white-space: nowrap;
  transition: all var(--transition-fast);
}
.sidebar-collapsed .nav-item {
  padding: 0;
  justify-content: center;
}
.nav-item svg {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  margin-right: var(--space-4);
}
.sidebar-collapsed .nav-item svg {
  margin-right: 0;
}
.nav-item:hover {
  background: var(--color-gray-700);
  color: var(--text-inverse);
}
.nav-item.router-link-exact-active {
  background: var(--color-primary-600);
  color: var(--text-inverse);
  font-weight: var(--font-semibold);
}

.sidebar-footer {
  padding: var(--space-4);
  border-top: 1px solid var(--color-gray-700);
  flex-shrink: 0;
}
.sidebar-collapsed .sidebar-footer {
  padding: var(--space-3);
}

.user-info {
  margin-bottom: var(--space-3);
  padding: 0 var(--space-2);
  text-align: center;
  color: var(--text-inverse);
}
.user-name {
  font-weight: var(--font-semibold);
  font-size: var(--text-sm);
}
.user-role {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

.logout-btn {
  display: flex;
  align-items: center;
  width: 100%;
  height: 44px;
  border-radius: var(--radius-base);
  cursor: pointer;
  white-space: nowrap;
  transition: all var(--transition-fast);
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  color: var(--color-error-600);
  padding: 0 var(--space-4);
  justify-content: flex-start;
}
.logout-btn svg {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  margin-right: var(--space-4);
}
.logout-btn:hover {
  background: var(--color-error-500);
  border-color: var(--color-error-500);
  color: var(--text-inverse);
}
.sidebar-collapsed .logout-btn {
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--color-error-300);
}
.sidebar-collapsed .logout-btn svg {
  margin-right: 0;
}
.sidebar-collapsed .logout-btn:hover {
  background: var(--color-error-500);
  color: var(--text-inverse);
}
</style>
