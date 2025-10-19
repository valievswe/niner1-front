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
const draggedLabel = ref(null);
const dragOverLocation = ref(null);

// Get available labels (not yet used)
const availableLabels = computed(() => {
  const usedIds = Object.values(studentAnswers.value);
  return props.question.content.labels.filter(
    (label) => !usedIds.includes(label.id)
  );
});

// Start dragging a label
function startDrag(event, label) {
  draggedLabel.value = label;
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/html", event.target.innerHTML);
}

// Handle drag over a location drop zone
function dragOver(event, locationKey) {
  event.preventDefault();
  dragOverLocation.value = locationKey;
  event.dataTransfer.dropEffect = "move";
}

// Handle drag leave
function dragLeave() {
  dragOverLocation.value = null;
}

// Handle drop on a location
function drop(event, locationKey) {
  event.preventDefault();
  if (draggedLabel.value) {
    studentAnswers.value[locationKey] = draggedLabel.value.id;
  }
  draggedLabel.value = null;
  dragOverLocation.value = null;
}

// End drag
function endDrag() {
  draggedLabel.value = null;
  dragOverLocation.value = null;
}

// Clear an answer
function clearAnswer(locationKey) {
  delete studentAnswers.value[locationKey];
}

// Get label text by ID
function getLabelText(labelId) {
  const label = props.question.content.labels.find((l) => l.id === labelId);
  return label ? label.text : "";
}

// Get sorted location keys
const sortedLocationKeys = computed(() => {
  if (!props.question.answer) return [];
  return Object.keys(props.question.answer).sort((a, b) => {
    // Try to sort numerically if possible
    const numA = parseInt(a);
    const numB = parseInt(b);
    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB;
    }
    return a.localeCompare(b);
  });
});

// Get question number for a location key
function getQuestionNumberForLocation(locationKey) {
  if (props.displayNumberStart === null) return null;
  const index = sortedLocationKeys.value.indexOf(locationKey);
  if (index === -1) return null;
  return props.displayNumberStart + index;
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
        <span class="drag-hint">💡 Drag labels from below to the numbered locations</span>
      </p>

      <!-- Available Labels at Top -->
      <div class="labels-section">
        <h5>Available Labels</h5>
        <div class="labels-grid">
          <div
            v-for="(label, index) in availableLabels"
            :key="label.id"
            class="label-item"
            draggable="true"
            @dragstart="startDrag($event, label)"
            @dragend="endDrag"
          >
            <span class="label-number">{{ index + 1 }}</span>
            <span>{{ label.text }}</span>
          </div>
        </div>
        <p v-if="availableLabels.length === 0" class="no-labels-msg">
          ✓ All labels have been placed
        </p>
      </div>

      <!-- Map and Drop Zones Below -->
      <div class="map-layout">
        <!-- Left: Map Image -->
        <div class="map-column">
          <img :src="question.content.imageUrl" alt="Map for labeling" class="map-image" />
        </div>

        <!-- Right: Drop Zones for Locations -->
        <div class="locations-column">
          <h5>Label the Locations</h5>
          <div class="locations-grid">
            <div
              v-for="key in sortedLocationKeys"
              :key="key"
              class="location-item"
            >
              <div class="location-header">
                <span class="location-number">{{ displayNumberStart !== null ? getQuestionNumberForLocation(key) : key }}</span>
              </div>
              <div
                class="drop-zone"
                :class="{
                  'drag-over': dragOverLocation === key,
                  'has-answer': studentAnswers[key],
                }"
                @dragover="dragOver($event, key)"
                @dragleave="dragLeave"
                @drop="drop($event, key)"
              >
                <div v-if="studentAnswers[key]" class="dropped-label">
                  <span class="label-text">{{
                    getLabelText(studentAnswers[key])
                  }}</span>
                  <button
                    @click="clearAnswer(key)"
                    class="clear-btn"
                    aria-label="Clear answer"
                  >
                    ×
                  </button>
                </div>
                <div v-else class="drop-placeholder">Drop here</div>
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

/* Labels Section (Top) */
.labels-section {
  background: #f8fafc;
  padding: var(--space-4);
  border-radius: 4px;
  border: 1px solid #cbd5e0;
  margin-bottom: var(--space-5);
}

.labels-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: var(--space-3);
}

.label-item {
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

.label-item:hover {
  border-color: #64748b;
  background: #f8fafc;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.label-item:active {
  cursor: grabbing;
  opacity: 0.8;
}

.label-number {
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

.no-labels-msg {
  text-align: center;
  color: var(--color-success-700);
  font-weight: var(--font-medium);
  font-size: var(--text-base);
  margin-top: var(--space-3);
  padding: var(--space-3);
}

/* Map Layout */
.map-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-6);
}

@media (min-width: 1024px) {
  .map-layout {
    grid-template-columns: 1.3fr 1fr;
  }
}

/* Map Column */
.map-column {
  display: flex;
  align-items: flex-start;
}

.map-image {
  width: 100%;
  border: 2px solid var(--border-primary);
  border-radius: var(--radius-base);
  box-shadow: var(--shadow-md);
}

/* Locations Column */
.locations-column {
  display: flex;
  flex-direction: column;
}

.locations-grid {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  max-height: 600px;
  overflow-y: auto;
  padding-right: var(--space-2);
}

.location-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.location-header {
  flex-shrink: 0;
}

.location-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  background: white;
  color: #1a202c;
  border: 2px solid #1a202c;
  border-radius: 3px;
  font-weight: 700;
  font-size: 15px;
  flex-shrink: 0;
}

/* Drop Zone */
.drop-zone {
  min-height: 50px;
  flex: 1;
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

.dropped-label {
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
</style>
