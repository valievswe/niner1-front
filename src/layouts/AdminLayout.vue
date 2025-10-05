<template>
  <div class="admin-layout">
    <AdminSidebar :is-collapsed="sidebarCollapsed" />

    <div
      :class="['admin-main-container', { 'is-collapsed': sidebarCollapsed }]"
    >
      <AdminHeader @toggle-sidebar="toggleSidebar" />
      <main class="admin-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import AdminSidebar from "@/views/admin/AdminSidebar.vue";
import AdminHeader from "@/views/admin/AdminHeader.vue";

const sidebarCollapsed = ref(false);

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value;
};
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;

  background-color: var(--bg-secondary);
}

.admin-main-container {
  flex-grow: 1;
  display: flex;
  flex-direction: column;

  margin-left: var(--w-sidebar);
  transition: margin-left var(--transition-base);
}

.admin-main-container.is-collapsed {
  margin-left: var(--w-sidebar-collapsed);
}

.admin-content {
  flex-grow: 1;

  padding: var(--space-8);
}
</style>
