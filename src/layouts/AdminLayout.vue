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
  background-color: var(--admin-bg-main);
}
.admin-main-container {
  flex-grow: 1;
  margin-left: 260px; /* Same as sidebar width */
  transition: margin-left var(--admin-transition-medium);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.admin-main-container.is-collapsed {
  margin-left: 80px; /* Same as collapsed sidebar width */
}
.admin-content {
  padding: 2rem;
  flex-grow: 1;
}
</style>
