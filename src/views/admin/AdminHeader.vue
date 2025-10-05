<template>
  <header class="admin-header">
    <div class="header-left">
      <!-- 
        IMPROVEMENT:
        This button is now a styled, accessible control with an SVG icon.
       -->
      <button
        @click="$emit('toggle-sidebar')"
        class="icon-btn sidebar-toggle-btn"
        aria-label="Toggle Sidebar"
      >
        <!-- Lucide Icon: menu -->
        <svg
          xmlns="http://www.w.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="4" x2="20" y1="12" y2="12" />
          <line x1="4" x2="20" y1="6" y2="6" />
          <line x1="4" x2="20" y1="18" y2="18" />
        </svg>
      </button>

      <div class="breadcrumbs">
        <span class="breadcrumb-item">Admin</span>
        <!-- Lucide Icon: chevron-right -->
        <svg
          class="separator"
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
        <span class="breadcrumb-current">{{ pageTitle }}</span>
      </div>
    </div>

    <div class="header-right">
      <!-- These are styled as consistent icon-only buttons -->
      <button class="icon-btn" aria-label="Notifications">
        <!-- Lucide Icon: bell -->
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
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
      </button>
      <button class="icon-btn" aria-label="Settings">
        <!-- Lucide Icon: settings -->
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
          <path
            d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
          />
          <circle cx="12" cy="12" r="3" />
        </svg>
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
  // This logic is effective and remains unchanged.
  return route.name
    .toString()
    .replace("admin-", "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
});
</script>

<style scoped>
.admin-header {
  height: var(--h-header);
  background-color: var(--bg-primary); /* White surface */
  border-bottom: 1px solid var(--border-primary);
  box-shadow: var(--shadow-sm); /* Subtle shadow from DS */

  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-6); /* Using DS spacing */
  flex-shrink: 0; /* Prevents header from shrinking */
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
  gap: var(--space-4); /* Using DS spacing */
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: none;
  border: none;
  border-radius: var(--radius-full); /* Fully rounded */
  cursor: pointer;
  color: var(--text-secondary);
  transition: all var(--transition-fast);
}

.icon-btn:hover {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
}

.icon-btn svg {
  width: 20px;
  height: 20px;
}

.breadcrumbs {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.breadcrumb-item {
  font-size: var(--text-base);
  color: var(--text-secondary);
}

.separator {
  color: var(--text-tertiary);
}

.breadcrumb-current {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}
</style>
