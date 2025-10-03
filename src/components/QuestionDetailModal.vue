<!-- src/components/QuestionDetailModal.vue -->
<script setup>
defineProps({
  question: {
    type: Object,
    required: true,
  },
  show: {
    type: Boolean,
    required: true,
  },
});

// The 'close' event is what the parent will listen for to hide the modal.
const emit = defineEmits(["close"]);
</script>

<template>
  <div v-if="show" class="modal-overlay" @click.self="emit('close')">
    <div class="modal-content">
      <button class="close-button" @click="emit('close')">X</button>
      <h3>Question Details (ID: {{ question.id }})</h3>

      <div class="details">
        <p><strong>Section:</strong> {{ question.section }}</p>
        <p><strong>Type:</strong> {{ question.questionType }}</p>

        <h4>Content:</h4>
        <pre>{{ question.content }}</pre>

        <h4>Correct Answer:</h4>
        <pre>{{ question.answer }}</pre>
      </div>
    </div>
  </div>
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
  z-index: 1000;
}
.modal-content {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  width: 90%;
  max-width: 700px;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
}
.close-button {
  position: absolute;
  top: 10px;
  right: 10px;
  border: none;
  background: none;
  font-size: 1.5rem;
  cursor: pointer;
}
pre {
  background-color: #f4f4f4;
  padding: 15px;
  border-radius: 4px;
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
