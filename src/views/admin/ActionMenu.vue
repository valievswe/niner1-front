<!-- src/components/admin/ActionMenu.vue -->
<script setup>
import { ref, onMounted, onUnmounted } from "vue";

const isOpen = ref(false);
const menuRef = ref(null);

const toggleMenu = () => {
  isOpen.value = !isOpen.value;
};

const handleClickOutside = (event) => {
  if (menuRef.value && !menuRef.value.contains(event.target)) {
    isOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<template>
  <div class="action-menu-container" ref="menuRef">
    <!-- The "three dots" button that triggers the menu -->
    <button
      @click.stop="toggleMenu"
      class="menu-trigger-btn"
      aria-label="Actions"
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
        <circle cx="12" cy="12" r="1" />
        <circle cx="12" cy="5" r="1" />
        <circle cx="12" cy="19" r="1" />
      </svg>
    </button>

    <!-- The dropdown menu itself, which appears when isOpen is true -->
    <Transition name="fade">
      <div v-if="isOpen" class="menu-dropdown">
        <!-- This slot allows the parent to inject any links or buttons it wants -->
        <slot />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.action-menu-container {
  position: relative;
  display: inline-block;
}

.menu-trigger-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: transparent;
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-base);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.menu-trigger-btn:hover {
  background-color: var(--bg-secondary);
  border-color: var(--border-secondary);
  color: var(--text-primary);
}

.menu-dropdown {
  position: absolute;
  right: 0;
  top: calc(100% + var(--space-2));
  width: 180px;
  background-color: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-base);
  box-shadow: var(--shadow-lg);
  z-index: var(--z-dropdown);
  padding: var(--space-2);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

/* This targets the links passed in via the slot */
:slotted(.menu-item) {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-3);
  text-align: left;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-primary);
  background: none;
  border: none;
  border-radius: var(--radius-base);
  cursor: pointer;
  text-decoration: none;
}

:slotted(.menu-item:hover) {
  background-color: var(--bg-secondary);
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 150ms ease, transform 150ms ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}
</style>
