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
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="show" class="modal-overlay" @click.self="emit('cancel')">
        <!-- The modal content is now structured like a card for consistency -->
        <div
          class="modal-content card"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
        >
          <div class="card-body">
            <h3 :id="titleId" class="modal-title">{{ title }}</h3>
            <p class="modal-message">{{ message }}</p>
          </div>
          <div class="modal-actions card-footer">
            <!-- 
              IMPROVEMENT: 
              Added the base 'btn' class alongside variants 'btn-secondary' and 'btn-danger'.
              This is required by the design system to apply all base button styles correctly.
            -->
            <button @click="emit('cancel')" class="btn btn-secondary">
              Cancel
            </button>
            <button @click="emit('confirm')" class="btn btn-danger">
              Confirm
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script>
// A small addition to provide a unique ID for accessibility.
export default {
  data() {
    return {
      titleId: "modal-title-" + Math.random().toString(36).substring(7),
    };
  },
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: var(--bg-overlay); /* DS Variable */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: var(--z-modal); /* DS Variable */
}

.modal-content {
  /* Aligns with the .card component from the design system */
  width: 90%;
  max-width: 450px;
  text-align: center;
  box-shadow: var(--shadow-lg); /* DS Variable */
  /* Padding is now handled by .card-body and .card-footer */
}

.modal-title {
  /* Using typography scale from the design system */
  font-size: var(--text-2xl);
  color: var(--text-primary);
  margin-bottom: var(--space-3); /* DS Spacing */
}

.modal-message {
  color: var(--text-secondary); /* DS Variable */
  line-height: var(--leading-relaxed); /* DS Variable */
}

.modal-actions {
  display: flex;
  justify-content: flex-end; /* A common pattern for confirm/cancel */
  gap: var(--space-3); /* DS Spacing */
  margin-top: var(--space-6); /* DS Spacing */
  /* Inherits padding and background from .card-footer */
}

/* --- Transition Styles --- */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity var(--transition-base); /* DS Variable */
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .modal-content,
.modal-fade-leave-active .modal-content {
  transition: transform var(--transition-base);
}

.modal-fade-enter-from .modal-content,
.modal-fade-leave-to .modal-content {
  transform: translateY(-20px);
}
</style>
