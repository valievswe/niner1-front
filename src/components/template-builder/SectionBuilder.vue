<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue"; // Import new Vue functions
import draggable from "vuedraggable";
import apiClient from "@/services/api";
import QuestionPreview from "@/components/QuestionPreview.vue";
import QuestionDetailModal from "@/components/QuestionDetailModal.vue";

const props = defineProps({
  section: { type: String, required: true },
  initialSelectedQuestions: { type: Array, default: () => [] },
});

// --- STATE (Unchanged) ---
const questionSets = ref([]);
const selectedQuestions = ref([...props.initialSelectedQuestions]);
const loading = ref(true);
const isModalVisible = ref(false);
const questionForDetailView = ref(null);

// --- NEW RESIZABLE PANEL LOGIC ---
const containerRef = ref(null); // A template ref for the main grid container
const leftPanelWidth = ref(null); // Stores the width of the left panel in pixels
const isResizing = ref(false);

// The computed style that makes the grid layout reactive to dragging
const gridStyle = computed(() => {
  if (leftPanelWidth.value === null) {
    // Initial state before any resizing
    return { gridTemplateColumns: "1fr 10px 1fr" };
  }
  // State after resizing has occurred
  return { gridTemplateColumns: `${leftPanelWidth.value}px 10px 1fr` };
});

// When the user clicks down on the resizer handle
const handleMouseDown = (event) => {
  isResizing.value = true;
  // Add listeners to the entire window so dragging works outside the handle
  window.addEventListener("mousemove", handleMouseMove);
  window.addEventListener("mouseup", handleMouseUp);
};

// As the user moves the mouse while holding it down
const handleMouseMove = (event) => {
  if (!isResizing.value || !containerRef.value) return;

  const containerRect = containerRef.value.getBoundingClientRect();
  // Calculate the new width based on the mouse's position relative to the container
  const newLeftWidth = event.clientX - containerRect.left;

  // Enforce minimum and maximum widths (20% and 80%)
  const minWidth = containerRect.width * 0.2;
  const maxWidth = containerRect.width * 0.8;

  if (newLeftWidth > minWidth && newLeftWidth < maxWidth) {
    leftPanelWidth.value = newLeftWidth;
  }
};

// When the user releases the mouse button
const handleMouseUp = () => {
  isResizing.value = false;
  // IMPORTANT: Clean up the global listeners to prevent memory leaks
  window.removeEventListener("mousemove", handleMouseMove);
  window.removeEventListener("mouseup", handleMouseUp);
};

// --- LIFECYCLE HOOKS ---
onMounted(async () => {
  try {
    const response = await apiClient.get(
      `/question-sets?section=${props.section}`
    );
    questionSets.value = response.data.map((set) => ({
      ...set,
      questions: set.questions || [],
    }));
  } catch (error) {
    console.error(`Failed to load sets for ${props.section}:`, error);
  } finally {
    loading.value = false;
  }
});

// Clean up listeners when the component is destroyed
onUnmounted(() => {
  window.removeEventListener("mousemove", handleMouseMove);
  window.removeEventListener("mouseup", handleMouseUp);
});

// --- METHODS (Unchanged) ---
function addQuestion(question) {
  if (!selectedQuestions.value.some((q) => q.id === question.id)) {
    selectedQuestions.value.push(question);
  }
}
function removeQuestion(index) {
  selectedQuestions.value.splice(index, 1);
}
function viewQuestionDetails(question) {
  questionForDetailView.value = question;
  isModalVisible.value = true;
}
function closeModal() {
  isModalVisible.value = false;
  questionForDetailView.value = null;
}
defineExpose({ selectedQuestions });
</script>

<template>
  <!-- The main container now has a template ref and a bound style for resizing -->
  <div class="builder-grid" ref="containerRef" :style="gridStyle">
    <!-- Column 1: Available Question Sets -->
    <div class="card">
      <div class="card-header">
        <h4 class="card-title">Available Questions ({{ section }})</h4>
      </div>
      <div class="card-body scrollable-list">
        <div v-if="loading" class="loading-state">
          <div class="loader"></div>
          <p>Loading sets...</p>
        </div>
        <div v-else-if="questionSets.length === 0" class="empty-state">
          No question sets found for this section.
        </div>
        <details
          v-else
          v-for="set in questionSets"
          :key="set.id"
          class="question-set-accordion"
          open
        >
          <summary>{{ set.name }}</summary>
          <ul class="question-in-set-list">
            <li
              v-for="question in set.questions"
              :key="question.id"
              class="question-in-set"
            >
              <QuestionPreview :question="question" />
              <div class="actions">
                <button
                  @click="viewQuestionDetails(question)"
                  class="btn btn-secondary btn-sm"
                >
                  View
                </button>
                <button
                  @click="addQuestion(question)"
                  class="btn btn-success btn-sm"
                  aria-label="Add Question"
                >
                  +
                </button>
              </div>
            </li>
            <li
              v-if="!set.questions || set.questions.length === 0"
              class="empty-state-small"
            >
              <small>No questions in this set.</small>
            </li>
          </ul>
        </details>
      </div>
    </div>

    <!-- NEW Resizer Handle -->
    <div class="resizer" @mousedown.prevent="handleMouseDown"></div>

    <!-- Column 2: Selected Questions for this Section -->
    <div class="card">
      <div class="card-header">
        <h4 class="card-title">Selected for Template</h4>
      </div>
      <div class="card-body scrollable-list">
        <p v-if="selectedQuestions.length === 0" class="empty-state">
          Drag or add questions from the list on the left to build this section.
        </p>
        <draggable
          v-model="selectedQuestions"
          item-key="id"
          class="drag-area"
          handle=".drag-handle"
          ghost-class="ghost-item"
        >
          <template #item="{ element, index }">
            <div class="draggable-item">
              <span class="drag-handle" aria-label="Drag to reorder">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <circle cx="9" cy="12" r="1" />
                  <circle cx="9" cy="5" r="1" />
                  <circle cx="9" cy="19" r="1" />
                  <circle cx="15" cy="12" r="1" />
                  <circle cx="15" cy="5" r="1" />
                  <circle cx="15" cy="19" r="1" />
                </svg>
              </span>
              <span class="item-index">{{ index + 1 }}.</span>
              <QuestionPreview :question="element" />
              <button
                @click="removeQuestion(index)"
                class="btn btn-danger btn-sm"
                aria-label="Remove Question"
              >
                &times;
              </button>
            </div>
          </template>
        </draggable>
      </div>
    </div>

    <!-- Modal (Unchanged) -->
    <QuestionDetailModal
      v-if="questionForDetailView"
      :show="isModalVisible"
      :question="questionForDetailView"
      @close="closeModal"
    />
  </div>
</template>

<style scoped>
.builder-grid {
  display: grid;
  /* The grid-template-columns is now handled by a dynamic style in the template */
  gap: 0; /* Gap is now part of the resizer */
  height: 600px;
  overflow: hidden; /* Prevent horizontal scrollbars during resize */
}
.card {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 200px; /* Prevents card from collapsing too much */
}

/* --- NEW Resizer Styles --- */
.resizer {
  flex-shrink: 0;
  background-color: var(--border-primary);
  cursor: col-resize;
  width: 10px;
  transition: background-color var(--transition-fast);
}
.resizer:hover {
  background-color: var(--color-primary-300);
}

.scrollable-list {
  overflow-y: auto;
  flex-grow: 1;
}
.loading-state,
.empty-state {
  padding: var(--space-8);
  text-align: center;
  color: var(--text-secondary);
}
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
}
.empty-state-small {
  padding: var(--space-3);
  text-align: center;
  color: var(--text-tertiary);
}
.question-set-accordion {
  border-bottom: 1px solid var(--border-primary);
}
.question-set-accordion summary {
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  cursor: pointer;
  padding: var(--space-4);
  list-style: revert;
}
.question-set-accordion[open] {
  background-color: var(--bg-secondary);
}
.question-set-accordion[open] summary {
  border-bottom: 1px solid var(--border-primary);
}
.question-in-set-list {
  list-style: none;
  padding: 0;
}
.question-in-set {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-3) var(--space-4);
  border-top: 1px solid var(--border-primary);
}
.question-in-set:first-child {
  border-top: none;
}
.actions {
  display: flex;
  gap: var(--space-2);
}
.drag-area {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.draggable-item {
  display: grid;
  grid-template-columns: auto auto 1fr auto;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  background-color: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-base);
  box-shadow: var(--shadow-xs);
}
.drag-handle {
  cursor: grab;
  color: var(--text-tertiary);
}
.item-index {
  font-family: var(--font-mono);
  color: var(--text-secondary);
}
.ghost-item {
  background-color: var(--color-primary-50);
  border: 1px dashed var(--color-primary-300);
}
.ghost-item > * {
  opacity: 0;
}
</style>
