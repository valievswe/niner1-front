<script setup>
import { ref, watch, computed } from "vue";

const props = defineProps({
  question: { type: Object, required: true },
  initialAnswer: { type: Object, default: () => ({}) },
  displayNumberStart: { type: Number, default: null },
  displayNumberEnd: { type: Number, default: null },
});
const emit = defineEmits(["answer-updated"]);

const studentAnswers = ref({ ...props.initialAnswer });

// Drag and drop state
const draggedOption = ref(null);
const dragOverPrompt = ref(null);

// Convert index to letter (0 -> A, 1 -> B, etc.)
function indexToLetter(index) {
  return String.fromCharCode(65 + index);
}

// Get available options (not yet used)
const availableOptions = computed(() => {
  const usedIds = Object.values(studentAnswers.value);
  return props.question.content.options.filter(
    (opt) => !usedIds.includes(opt.id)
  );
});

// Start dragging an option
function startDrag(event, option) {
  draggedOption.value = option;
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/html", event.target.innerHTML);
}

// Handle drag over a prompt drop zone
function dragOver(event, promptId) {
  event.preventDefault();
  dragOverPrompt.value = promptId;
  event.dataTransfer.dropEffect = "move";
}

// Handle drag leave
function dragLeave() {
  dragOverPrompt.value = null;
}

// Handle drop on a prompt
function drop(event, promptId) {
  event.preventDefault();
  if (draggedOption.value) {
    studentAnswers.value[promptId] = draggedOption.value.id;
  }
  draggedOption.value = null;
  dragOverPrompt.value = null;
}

// End drag
function endDrag() {
  draggedOption.value = null;
  dragOverPrompt.value = null;
}

// Clear an answer
function clearAnswer(promptId) {
  delete studentAnswers.value[promptId];
}

// Get option text by ID
function getOptionText(optionId) {
  const option = props.question.content.options.find((o) => o.id === optionId);
  return option ? option.text : "";
}

// Get option label by ID
function getOptionLabel(optionId) {
  const index = props.question.content.options.findIndex(
    (o) => o.id === optionId
  );
  return index !== -1 ? indexToLetter(index) : "";
}

watch(
  studentAnswers,
  (newVal) => {
    emit("answer-updated", {
      questionId: props.question.id,
      answer: newVal,
    });
  },
  { deep: true }
);
</script>

<template>
  <div class="question-container card">
    <div class="card-body">
      <!-- Question Number Range -->
      <h4 v-if="displayNumberStart && displayNumberEnd" class="question-range">
        Questions {{ displayNumberStart }}-{{ displayNumberEnd }}
      </h4>

      <p class="instructions">
        {{ question.content.instructions }}
        <span class="drag-hint">💡 Drag options from below to match each prompt</span>
      </p>

      <!-- Available Options at Top -->
      <div class="options-section">
        <h5>Available Options</h5>
        <div class="options-grid">
          <div
            v-for="(option, index) in availableOptions"
            :key="option.id"
            class="option-item"
            draggable="true"
            @dragstart="startDrag($event, option)"
            @dragend="endDrag"
          >
            <span class="option-id">{{ indexToLetter(question.content.options.indexOf(option)) }}</span>
            <span>{{ option.text }}</span>
          </div>
        </div>
        <p v-if="availableOptions.length === 0" class="no-options-msg">
          ✓ All options have been used
        </p>
      </div>

      <!-- Prompts with Drop Zones Below -->
      <div class="prompts-section">
        <h5>Match the Prompts</h5>
        <div class="prompts-grid">
          <div
            v-for="(prompt, index) in question.content.prompts"
            :key="prompt.id"
            class="prompt-item"
          >
            <div class="prompt-header">
              <span class="prompt-number">{{ displayNumberStart !== null ? displayNumberStart + index : index + 1 }}</span>
              <span class="prompt-text">{{ prompt.text }}</span>
            </div>
            <div
              class="drop-zone"
              :class="{
                'drag-over': dragOverPrompt === prompt.id,
                'has-answer': studentAnswers[prompt.id],
              }"
              @dragover="dragOver($event, prompt.id)"
              @dragleave="dragLeave"
              @drop="drop($event, prompt.id)"
            >
              <div v-if="studentAnswers[prompt.id]" class="dropped-option">
                <span class="option-label">{{ getOptionLabel(studentAnswers[prompt.id]) }}</span>
                <span class="option-text">{{
                  getOptionText(studentAnswers[prompt.id])
                }}</span>
                <button
                  @click="clearAnswer(prompt.id)"
                  class="clear-btn"
                  aria-label="Clear answer"
                >
                  ×
                </button>
              </div>
              <div v-else class="drop-placeholder">
                Drop an option here
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.question-container {
  margin-bottom: var(--space-6);
}

.question-range {
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  color: var(--color-primary-700);
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-3);
  border-bottom: 2px solid var(--color-primary-200);
}

.instructions {
  color: var(--text-secondary);
  margin-bottom: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.drag-hint {
  font-size: var(--text-sm);
  color: var(--color-primary-600);
  font-weight: var(--font-medium);
}

h5 {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  margin-bottom: var(--space-4);
  color: var(--text-primary);
}

/* Options Section (Top) */
.options-section {
  background: #f8fafc;
  padding: var(--space-4);
  border-radius: 4px;
  border: 1px solid #cbd5e0;
  margin-bottom: var(--space-5);
}

.options-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--space-3);
}

.no-options-msg {
  text-align: center;
  color: var(--color-success-700);
  font-weight: var(--font-medium);
  font-size: var(--text-base);
  margin-top: var(--space-3);
  padding: var(--space-3);
}

/* Drop Zone */
.drop-zone {
  min-height: 60px;
  border: 1px dashed var(--border-primary);
  border-radius: var(--radius-base);
  padding: var(--space-3);
  transition: all var(--transition-fast);
  background: var(--bg-primary);
}

.drop-zone.drag-over {
  border-color: var(--color-primary-500);
  background: var(--color-primary-50);
  transform: scale(1.02);
}

.drop-zone.has-answer {
  border-style: solid;
  border-color: var(--color-success-400);
  background: var(--color-success-50);
}

.drop-placeholder {
  color: var(--text-tertiary);
  font-size: var(--text-sm);
  font-style: italic;
  text-align: center;
  padding: var(--space-2);
}

.dropped-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  background: var(--color-success-100);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  font-weight: var(--font-medium);
  color: var(--color-success-800);
}

.clear-btn {
  background: none;
  border: none;
  color: var(--color-error-600);
  font-size: var(--text-2xl);
  line-height: 1;
  cursor: pointer;
  padding: 0 var(--space-2);
  transition: transform var(--transition-fast);
}

.clear-btn:hover {
  transform: scale(1.2);
}

/* Draggable Options */
.option-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: white;
  border: 1px solid #cbd5e0;
  border-radius: 4px;
  cursor: grab;
  transition: all 0.15s;
  user-select: none;
  font-size: 14px;
}

.option-item:hover {
  border-color: #64748b;
  background: #f8fafc;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.option-item:active {
  cursor: grabbing;
  opacity: 0.8;
}

.option-id {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  background: #1a202c;
  color: white;
  border-radius: 3px;
  font-weight: 600;
  font-size: 13px;
  flex-shrink: 0;
}

/* Prompts Section */
.prompts-section {
  display: flex;
  flex-direction: column;
}

.prompts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--space-4);
}

.prompt-item {
  background: white;
  padding: var(--space-3);
  border-radius: 4px;
  border: 1px solid #e2e8f0;
}

.prompt-header {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}

.prompt-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
  background: white;
  color: #1a202c;
  border: 2px solid #1a202c;
  border-radius: 3px;
  font-weight: 700;
  font-size: 14px;
  flex-shrink: 0;
}

.prompt-text {
  font-weight: 400;
  line-height: 1.5;
  flex: 1;
  font-size: 15px;
  color: #1a202c;
}

/* Dropped option label */
.option-label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: var(--color-success-600);
  color: white;
  border-radius: var(--radius-full);
  font-weight: var(--font-bold);
  font-size: var(--text-sm);
  flex-shrink: 0;
}
</style>
