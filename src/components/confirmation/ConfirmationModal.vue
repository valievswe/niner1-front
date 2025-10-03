<!-- src/components/ConfirmationModal.vue -->
<script setup>
// This component is controlled by props from its parent.
const props = defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    default: "Confirm Action",
  },
  message: {
    type: String,
    required: true,
  },
});

// It communicates back to the parent by emitting events.
const emit = defineEmits(["confirm", "cancel"]);
</script>

<template>
  <!-- Use a <Teleport> to render the modal at the end of the <body> -->
  <!-- This prevents CSS issues with z-index and positioning. -->
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="show" class="modal-overlay" @click.self="emit('cancel')">
        <div class="modal-content">
          <h3 class="modal-title">{{ title }}</h3>
          <p class="modal-message">{{ message }}</p>
          <div class="modal-actions">
            <button @click="emit('cancel')" class="btn-secondary">
              Cancel
            </button>
            <button @click="emit('confirm')" class="btn-danger">Confirm</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.modal-content {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  width: 90%;
  max-width: 400px;
  text-align: center;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.modal-title {
  margin-top: 0;
}

.modal-actions {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  gap: 15px;
}

.modal-actions button {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-danger {
  background-color: #dc3545;
  color: white;
}

/* --- Transition Styles --- */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
