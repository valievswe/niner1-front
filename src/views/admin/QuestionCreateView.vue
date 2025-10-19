<script setup>
import { ref, watch, computed } from "vue";
import { useRouter, RouterLink } from "vue-router";
import apiClient from "@/services/api";

// Script setup is correct and remains unchanged
import TrueFalseForm from "@/components/question-forms/TrueFalseForm.vue";
import MultipleChoiceForm from "@/components/question-forms/MultipleChoiceForm.vue";
import GapFillForm from "@/components/question-forms/GapFillForm.vue";
import MatchingForm from "@/components/question-forms/MatchingForm.vue";
import MapLabelingForm from "@/components/question-forms/MapLabelingForm.vue";
import WritingPromptForm from "@/components/question-forms/WritingPromptForm.vue";

const router = useRouter();

const section = ref("READING");
const questionSets = ref([]);
const selectedSetId = ref("");
const partNumber = ref(1);

const questionType = ref("TRUE_FALSE_NOT_GIVEN");
const explanation = ref("");
const formComponentRef = ref(null);
const successMessage = ref("");
const errorMessage = ref("");
const formKey = ref(0);

const formComponentMap = {
  TRUE_FALSE_NOT_GIVEN: TrueFalseForm,
  MULTIPLE_CHOICE_MULTIPLE_ANSWER: MultipleChoiceForm,
  GAP_FILLING: GapFillForm,
  SUMMARY_COMPLETION: GapFillForm,
  MATCHING: MatchingForm,
  MAP_LABELING: MapLabelingForm,
  WRITING_PROMPT: WritingPromptForm,
};
const currentFormComponent = computed(
  () => formComponentMap[questionType.value]
);

watch(
  section,
  async (newSection) => {
    selectedSetId.value = "";
    questionSets.value = [];
    partNumber.value = 1;
    if (newSection) {
      try {
        const response = await apiClient.get(
          `/question-sets?section=${newSection}`
        );
        questionSets.value = response.data;
      } catch (error) {
        console.error("Failed to fetch question sets:", error);
        errorMessage.value = "Could not load question sets for this section.";
      }
    }
  },
  { immediate: true }
);

async function saveQuestion() {
  errorMessage.value = "";
  successMessage.value = "";

  if (!selectedSetId.value) {
    errorMessage.value = "You must select a Question Set first.";
    return;
  }
  if (!formComponentRef.value?.getPayload) {
    errorMessage.value = "Form component is not loaded correctly.";
    return;
  }

  try {
    const { content, answer } = formComponentRef.value.getPayload();
    await apiClient.post("/questions", {
      section: section.value,
      questionType: questionType.value,
      questionSetId: selectedSetId.value,
      partNumber: partNumber.value,
      content,
      answer,
      explanation: explanation.value,
    });
    successMessage.value = "Question created successfully!";

    // Reset only the form fields, keep section/set/part selections
    explanation.value = "";

    // Force re-render of the form component to get a fresh form
    formKey.value++;

    // Clear success message after 3 seconds
    setTimeout(() => {
      successMessage.value = "";
    }, 3000);
  } catch (error) {
    errorMessage.value =
      error.response?.data?.error || "Failed to save question.";
    console.error(error);
  }
}
</script>

<template>
  <div class="create-question-container">
    <div class="page-header">
      <h1>Create New Question</h1>
      <p class="text-secondary">
        Follow the steps below to configure and save a new question.
      </p>
    </div>

    <form @submit.prevent="saveQuestion" class="question-form">
      <!-- STEP 1 & 2 CARD -->
      <div class="card">
        <div class="card-header">
          <h4 class="card-title">1. Setup Details</h4>
        </div>
        <div class="card-body">
          <div class="form-row">
            <div class="form-group">
              <label for="section" class="form-label">Select Section</label>
              <select id="section" v-model="section" class="form-select">
                <option value="LISTENING">Listening</option>
                <option value="READING">Reading</option>
                <option value="WRITING">Writing</option>
              </select>
            </div>
            <div class="form-group">
              <label for="questionSet" class="form-label"
                >Select Question Set</label
              >
              <select
                id="questionSet"
                v-model="selectedSetId"
                class="form-select"
                required
              >
                <option disabled value="">-- Please choose a set --</option>
                <option
                  v-for="set in questionSets"
                  :key="set.id"
                  :value="set.id"
                >
                  {{ set.name }}
                </option>
              </select>
              <p
                v-if="questionSets.length === 0 && section"
                class="form-helper-text"
              >
                No sets found.
                <RouterLink to="/admin/question-sets/new"
                  >Create one first.</RouterLink
                >
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- STEP 3, 4 & CONTENT CARD -->
      <div v-if="selectedSetId" class="card">
        <div class="card-header">
          <h4 class="card-title">2. Question Details</h4>
        </div>
        <div class="card-body">
          <div class="form-row">
            <div class="form-group">
              <label for="partNumber" class="form-label"
                >Part / Passage / Task</label
              >
              <select
                v-if="section === 'LISTENING'"
                id="partNumber"
                v-model="partNumber"
                class="form-select"
                required
              >
                <option :value="1">Part 1</option>
                <option :value="2">Part 2</option>
                <option :value="3">Part 3</option>
                <option :value="4">Part 4</option>
              </select>
              <select
                v-else-if="section === 'READING'"
                id="partNumber"
                v-model="partNumber"
                class="form-select"
                required
              >
                <option :value="1">Passage 1</option>
                <option :value="2">Passage 2</option>
                <option :value="3">Passage 3</option>
              </select>
              <select
                v-else-if="section === 'WRITING'"
                id="partNumber"
                v-model="partNumber"
                class="form-select"
                required
              >
                <option :value="1">Task 1</option>
                <option :value="2">Task 2</option>
              </select>
            </div>
            <div class="form-group">
              <label for="questionType" class="form-label">Question Type</label>
              <select
                id="questionType"
                v-model="questionType"
                class="form-select"
              >
                <option value="TRUE_FALSE_NOT_GIVEN">
                  True/False/Not Given
                </option>
                <option value="MULTIPLE_CHOICE_MULTIPLE_ANSWER">
                  Multiple Choice
                </option>
                <option value="GAP_FILLING">Gap Filling</option>
                <option value="SUMMARY_COMPLETION">Summary Completion</option>
                <option value="MATCHING">Matching</option>
                <option value="MAP_LABELING">Map Labeling</option>
                <option value="WRITING_PROMPT">Writing Prompt</option>
              </select>
            </div>
          </div>

          <hr class="form-divider" />

          <!-- Dynamic form component is rendered here -->
          <component
            :is="currentFormComponent"
            ref="formComponentRef"
            :key="formKey"
          />
        </div>
        <div class="card-footer">
          <div class="form-group">
            <label for="explanation" class="form-label"
              >Explanation (Optional)</label
            >
            <input
              type="text"
              id="explanation"
              v-model="explanation"
              class="form-input"
              placeholder="Explain why the answer is correct..."
            />
          </div>
          <!-- Success and Error alerts -->
          <div v-if="successMessage" class="alert alert-success">
            {{ successMessage }}
          </div>
          <div v-if="errorMessage" class="alert alert-error">
            {{ errorMessage }}
          </div>

          <button type="submit" class="btn btn-primary btn-lg">
            Save Question
          </button>
        </div>
      </div>
    </form>
  </div>
</template>

<style scoped>
.create-question-container {
  max-width: 900px;
  margin: 0 auto;
}
.page-header {
  margin-bottom: var(--space-8);
}
.question-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

/* Use a grid for side-by-side form groups on larger screens */
.form-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-5);
}
@media (min-width: 768px) {
  .form-row {
    grid-template-columns: 1fr 1fr;
  }
}

.form-helper-text {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin-top: var(--space-2);
}
.form-helper-text a {
  font-weight: var(--font-semibold);
}

.form-divider {
  border: none;
  border-top: 1px solid var(--border-primary);
  margin: var(--space-6) 0;
}

.card-footer {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.card-footer .btn {
  align-self: flex-end; /* Aligns button to the right */
}
</style>
