<template>
  <header class="admin-header">
    <div class="header-left">
      <button
        @click="$emit('toggle-sidebar')"
        class="sidebar-toggle-btn"
        title="Toggle Sidebar"
      >
        <i class="fas fa-bars"></i>
      </button>
      <div class="breadcrumbs">
        <span class="breadcrumb-item">Admin</span>
        <i class="fas fa-chevron-right separator"></i>
        <span class="breadcrumb-current">{{ pageTitle }}</span>
      </div>
    </div>
    <div class="header-right">
      <button class="header-btn" title="Notifications">
        <i class="fas fa-bell"></i>
      </button>
      <button class="header-btn" title="Settings">
        <i class="fas fa-cog"></i>
      </button>
    </div>
  </header>
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";

defineEmits(["toggle-sidebar"]);

const route = useRoute();

const pageTitle = computed(() => {
  if (!route.name) return "Dashboard";
  return route.name
    .toString()
    .replace("admin-", "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
});
</script>

<style scoped>
.admin-header {
  background: var(--admin-bg-surface);
  padding: 0 2rem;
  height: 70px;
  border-bottom: 1px solid var(--admin-border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}
.header-left,
.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.sidebar-toggle-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: var(--admin-text-secondary);
}
.breadcrumbs {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.breadcrumb-item {
  color: var(--admin-text-secondary);
}
.separator {
  font-size: 0.7rem;
  color: var(--admin-text-secondary);
}
.breadcrumb-current {
  font-weight: 600;
  font-size: 1.1rem;
  color: var(--admin-text-primary);
}
.header-btn {
  background: none;
  border: 1px solid var(--admin-border-color);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  color: var(--admin-text-secondary);
  cursor: pointer;
  transition: var(--admin-transition-fast);
}
.header-btn:hover {
  background: var(--admin-primary);
  color: white;
  border-color: var(--admin-primary);
}
</style>
