<!-- src/components/template-builder/SectionBuilder.vue -->
<script setup>
import { ref, onMounted } from "vue";
import draggable from "vuedraggable";
import apiClient from "@/services/api";
import QuestionPreview from "@/components/QuestionPreview.vue";
import QuestionDetailModal from "@/components/QuestionDetailModal.vue";

const props = defineProps({
  section: { type: String, required: true },
  allQuestions: { type: Array, required: true },

  initialSelectedQuestions: {
    type: Array,
    default: () => [],
  },
});

// --- STATE ---
const questionSets = ref([]); // Holds the sets for THIS section
const selectedQuestions = ref([...props.initialSelectedQuestions]);
const loading = ref(true);

// Modal state
const isModalVisible = ref(false);
const questionForDetailView = ref(null);

// --- LIFECYCLE HOOK ---
// Fetch Question Sets filtered by this component's section
onMounted(async () => {
  try {
    const response = await apiClient.get(
      `/question-sets?section=${props.section}`
    );
    // Attach the full question object to each set for the UI
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

// --- METHODS ---
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

// Expose the list of selected questions so the parent can access it
defineExpose({
  selectedQuestions,
});
</script>

<template>
  <div>
    <!-- Wrapper for modal positioning -->
    <div class="builder-container">
      <!-- Column 1: Question Sets Accordion -->
      <div class="question-list">
        <h2>Question Sets ({{ section }})</h2>
        <div v-if="loading">Loading sets...</div>
        <details v-for="set in questionSets" :key="set.id" class="question-set">
          <summary>{{ set.name }}</summary>
          <ul>
            <li v-for="question in set.questions" :key="question.id">
              <QuestionPreview :question="question" />
              <div class="actions">
                <button class="view-btn" @click="viewQuestionDetails(question)">
                  View
                </button>
                <button @click="addQuestion(question)">+</button>
              </div>
            </li>
            <li v-if="!set.questions || set.questions.length === 0">
              <small>No questions in this set.</small>
            </li>
          </ul>
        </details>
        <p v-if="!loading && questionSets.length === 0">
          No question sets found for this section.
        </p>
      </div>

      <!-- Column 2: Selected Questions for this Section -->
      <div class="question-list selected">
        <h2>Selected Questions (Drag to Reorder)</h2>
        <draggable v-model="selectedQuestions" item-key="id" class="drag-area">
          <template #item="{ element, index }">
            <li class="draggable-item">
              <span>{{ index + 1 }}.</span>
              <QuestionPreview :question="element" />
              <button @click="removeQuestion(index)">x</button>
            </li>
          </template>
        </draggable>
        <p v-if="selectedQuestions.length === 0">
          Add questions from the sets on the left.
        </p>
      </div>
    </div>

    <!-- Modal for viewing question details -->
    <QuestionDetailModal
      v-if="questionForDetailView"
      :show="isModalVisible"
      :question="questionForDetailView"
      @close="closeModal"
    />
  </div>
</template>

<style scoped>
.builder-container {
  display: flex;
  gap: 20px;
}
.question-list {
  flex: 1;
  border: 1px solid #ccc;
  padding: 10px;
  height: 500px;
  overflow-y: auto;
  min-width: 300px;
}
.question-list.selected {
  background-color: #f9f9f9;
}
.question-set summary {
  font-weight: bold;
  cursor: pointer;
  padding: 5px;
}
.question-set[open] {
  background-color: #f0f0f0;
}
.question-list ul {
  list-style: none;
  padding: 0;
  margin-top: 5px;
}
.question-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 5px;
  border-top: 1px solid #eee;
}
.draggable-item {
  cursor: move;
  background-color: white;
  display: flex;
  gap: 5px;
}
.actions {
  display: flex;
  gap: 5px;
}
.view-btn {
  background-color: #eee;
  border: 1px solid #ccc;
  font-size: 0.8em;
}
</style>
