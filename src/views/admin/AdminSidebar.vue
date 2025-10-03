<!-- src/components/admin/AdminSidebar.vue -->
<template>
  <aside :class="['admin-sidebar', { 'sidebar-collapsed': isCollapsed }]">
    <div class="sidebar-header">
      <i class="fas fa-rocket brand-icon" v-show="isCollapsed"></i>
      <h2 v-show="!isCollapsed">Admin Panel</h2>
    </div>

    <nav class="sidebar-nav">
      <template v-for="item in navLinks" :key="item.text">
        <RouterLink
          :to="item.to"
          class="nav-item"
          :title="isCollapsed ? item.text : ''"
        >
          <i :class="item.icon"></i>
          <span class="nav-text" v-show="!isCollapsed">{{ item.text }}</span>
        </RouterLink>
      </template>
    </nav>

    <div class="sidebar-footer">
      <div class="user-info" v-show="!isCollapsed">
        <div class="user-details">
          <div class="user-name">
            {{ authStore.user?.firstName }} {{ authStore.user?.lastName }}
          </div>
          <div class="user-role">Administrator</div>
        </div>
      </div>
      <button
        @click="handleLogout"
        class="logout-btn"
        :title="isCollapsed ? 'Logout' : ''"
      >
        <i class="fas fa-right-from-bracket"></i>
        <span v-show="!isCollapsed">Logout</span>
      </button>
    </div>
  </aside>
</template>

<script setup>
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "vue-router";

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
  { to: "/admin/dashboard", text: "Dashboard", icon: "fas fa-gauge-high" },
  { to: "/admin/submissions", text: "Submissions", icon: "fas fa-file-lines" },
  { to: "/admin/questions", text: "Questions", icon: "fas fa-circle-question" },
  { to: "/admin/templates", text: "Templates", icon: "fas fa-puzzle-piece" },
  { to: "/admin/scheduler", text: "Scheduler", icon: "fas fa-calendar-days" },
  { to: "/admin/users", text: "Users", icon: "fas fa-users" },
  {
    to: "/admin/question-sets",
    text: "Question Sets",
    icon: "fas fa-layer-group",
  },
];
</script>

<style scoped>
.admin-sidebar {
  width: 260px;
  background: var(--admin-sidebar-bg);
  color: var(--admin-sidebar-text);
  display: flex;
  flex-direction: column;
  position: fixed;
  height: 100%;
  left: 0;
  top: 0;
  z-index: 1000;
  transition: width var(--admin-transition-medium);
}
.sidebar-collapsed {
  width: 80px;
}
.sidebar-header {
  padding: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 70px; /* Match header height */
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
.sidebar-header h2 {
  color: white;
  margin: 0;
  font-size: 1.5rem;
}
.brand-icon {
  font-size: 2rem;
}
.sidebar-nav {
  flex-grow: 1;
  padding-top: 1rem;
  overflow-y: auto;
}
.nav-item {
  display: flex;
  align-items: center;
  padding: 1rem 1.5rem;
  color: var(--admin-sidebar-text);
  text-decoration: none;
  transition: var(--admin-transition-fast);
  margin: 0.5rem 0.75rem;
  border-radius: var(--admin-border-radius);
  white-space: nowrap;
}
.sidebar-collapsed .nav-item {
  justify-content: center;
  padding: 1rem;
}
.nav-item i {
  font-size: 1.2rem;
  width: 25px;
  text-align: center;
  margin-right: 1rem;
  transition: all 0.3s ease;
}
.sidebar-collapsed .nav-item i {
  margin-right: 0;
}
.nav-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--admin-sidebar-text-hover);
}
.nav-item.router-link-exact-active {
  background: var(--admin-sidebar-active-bg);
  color: white;
  font-weight: 500;
}
.sidebar-footer {
  padding: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}
.sidebar-collapsed .sidebar-footer {
  padding: 1.5rem 0.5rem;
  display: flex;
  justify-content: center;
}
.user-info {
  margin-bottom: 1rem;
  text-align: center;
}
.user-name {
  font-weight: bold;
}
.user-role {
  font-size: 0.8em;
  opacity: 0.7;
}

.logout-btn {
  background: transparent;
  border: 1px solid var(--admin-danger);
  color: var(--admin-danger);
  width: 100%;
  padding: 0.75rem;
  border-radius: var(--admin-border-radius);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  transition: var(--admin-transition-fast);
}
.logout-btn:hover {
  background: var(--admin-danger);
  color: white;
}
.sidebar-collapsed .logout-btn span {
  display: none;
}
</style>
