<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter, RouterLink } from "vue-router";
import apiClient from "@/services/api";

// --- COMPLETE COMPONENT IMPORTS ---
import TrueFalseForm from "@/components/question-forms/TrueFalseForm.vue";
import MultipleChoiceForm from "@/components/question-forms/MultipleChoiceForm.vue";
import GapFillForm from "@/components/question-forms/GapFillForm.vue";
import MatchingForm from "@/components/question-forms/MatchingForm.vue";
import MapLabelingForm from "@/components/question-forms/MapLabelingForm.vue";
import WritingPromptForm from "@/components/question-forms/WritingPromptForm.vue";

const route = useRoute();
const router = useRouter();
const questionId = route.params.id;

const question = ref(null);
const formComponentRef = ref(null);
const loading = ref(true);
const successMessage = ref("");
const errorMessage = ref("");

// This mapping ensures the correct form component is loaded based on the question type.
const formComponentMap = {
  TRUE_FALSE_NOT_GIVEN: TrueFalseForm,
  MULTIPLE_CHOICE_MULTIPLE_ANSWER: MultipleChoiceForm,
  GAP_FILLING: GapFillForm,
  SUMMARY_COMPLETION: GapFillForm,
  MATCHING: MatchingForm,
  MAP_LABELING: MapLabelingForm,
  WRITING_PROMPT: WritingPromptForm,
};

const currentFormComponent = computed(() => {
  if (!question.value) return null;
  return formComponentMap[question.value.questionType];
});

// Fetches the question data when the page loads.
onMounted(async () => {
  try {
    const response = await apiClient.get(`/questions/${questionId}`);
    question.value = response.data;
  } catch (error) {
    errorMessage.value =
      "Failed to load question data. It may have been deleted.";
  } finally {
    loading.value = false;
  }
});

// Handles the form submission to update the question.
async function updateQuestion() {
  errorMessage.value = "";
  successMessage.value = "";
  if (!formComponentRef.value?.getPayload) {
    errorMessage.value = "Form component not loaded correctly.";
    return;
  }

  try {
    // Retrieves the updated data from the child form component.
    const { content, answer } = formComponentRef.value.getPayload();
    const payload = { content, answer }; // Only send fields that can be updated.

    await apiClient.put(`/questions/${questionId}`, payload);

    successMessage.value = "Question updated successfully! Redirecting...";
    setTimeout(() => router.push("/admin/questions"), 1500);
  } catch (error) {
    errorMessage.value =
      error.response?.data?.error || "Failed to update question.";
    console.error(error);
  }
}
</script>

<template>
  <div class="edit-question-container">
    <div class="page-header">
      <h1>Edit Question</h1>
      <RouterLink to="/admin/questions" class="btn btn-secondary">
        &larr; Back to Question List
      </RouterLink>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="loader"></div>
      <p>Loading Question Editor...</p>
    </div>

    <!-- Error State (if question failed to load) -->
    <div v-else-if="errorMessage && !question" class="alert alert-error">
      <h4>Error Loading Question</h4>
      <p>{{ errorMessage }}</p>
    </div>

    <!-- Main Form Content -->
    <form v-else-if="question" @submit.prevent="updateQuestion" class="card">
      <div class="card-header">
        <h4 class="card-title">Editing Question ID: {{ question.id }}</h4>
      </div>
      <div class="card-body">
        <!-- Non-editable information is displayed in a visually distinct banner -->
        <div class="info-banner">
          <p><strong>Section:</strong> {{ question.section }}</p>
          <p>
            <strong>Type:</strong>
            {{ question.questionType.replace(/_/g, " ") }}
          </p>
          <span>(Section and Type cannot be changed)</span>
        </div>

        <hr class="form-divider" />

        <!-- The dynamic form component receives the initial data here -->
        <component
          :is="currentFormComponent"
          ref="formComponentRef"
          :key="question.id"
          :initial-data="question"
        />
      </div>

      <div class="card-footer">
        <div v-if="successMessage" class="alert alert-success">
          {{ successMessage }}
        </div>
        <div v-if="errorMessage" class="alert alert-error">
          {{ errorMessage }}
        </div>

        <!-- SEMANTIC BUTTON: The primary action of the page -->
        <button type="submit" class="btn btn-primary btn-lg">
          Update Question
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.edit-question-container {
  max-width: 900px;
  margin: 0 auto;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-8);
}
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  min-height: 40vh;
  color: var(--text-secondary);
}
.info-banner {
  background-color: var(--bg-secondary);
  padding: var(--space-4);
  border-radius: var(--radius-base);
  border: 1px solid var(--border-primary);
  display: flex;
  justify-content: space-around;
  align-items: center;
  flex-wrap: wrap; /* Allows wrapping on smaller screens */
  gap: var(--space-4);
}
.info-banner p {
  color: var(--text-primary);
  margin: 0;
}
.info-banner span {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
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
  align-self: flex-end; /* Pushes button to the right */
}
</style>
