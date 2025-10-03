<!-- src/views/admin/QuestionEditView.vue -->
<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import apiClient from "@/services/api";

// Import all your form components
import TrueFalseForm from "@/components/question-forms/TrueFalseForm.vue";
import MultipleChoiceForm from "@/components/question-forms/MultipleChoiceForm.vue";
// ... import others

const route = useRoute();
const router = useRouter();
const questionId = route.params.id;

// --- STATE ---
const question = ref(null); // Will hold the full question object from the API
const formComponentRef = ref(null);
const loading = ref(true);
const successMessage = ref("");
const errorMessage = ref("");

// Dynamic component mapping (same as in create view)
const formComponentMap = {
  TRUE_FALSE_NOT_GIVEN: TrueFalseForm,
  MULTIPLE_CHOICE_MULTIPLE_ANSWER: MultipleChoiceForm,
  // ... other mappings
};
const currentFormComponent = computed(() => {
  if (!question.value) return null;
  return formComponentMap[question.value.questionType];
});

// --- LIFECYCYCLE HOOK ---
// Fetch the question data when the page loads
onMounted(async () => {
  try {
    const response = await apiClient.get(`/questions/${questionId}`);
    question.value = response.data;
  } catch (error) {
    errorMessage.value = "Failed to load question data.";
  } finally {
    loading.value = false;
  }
});

// --- METHODS ---
async function updateQuestion() {
  errorMessage.value = "";
  successMessage.value = "";
  if (!formComponentRef.value?.getPayload) {
    errorMessage.value = "Form component not loaded correctly.";
    return;
  }

  try {
    // Get the updated payload from the child form
    const { content, answer } = formComponentRef.value.getPayload();

    const payload = {
      // We don't update section or type, only the content and answer
      content,
      answer,
      // We could add a field for explanation here if needed
    };

    // Call the backend PUT endpoint
    await apiClient.put(`/questions/${questionId}`, payload);

    successMessage.value = "Question updated successfully!";
    setTimeout(() => router.push("/admin/questions"), 1500);
  } catch (error) {
    errorMessage.value =
      error.response?.data?.error || "Failed to update question.";
    console.error(error);
  }
}
</script>

<template>
  <div>
    <h1>Admin: Edit Question</h1>

    <div v-if="loading">Loading...</div>
    <div v-else-if="errorMessage">{{ errorMessage }}</div>

    <div v-else-if="question">
      <form @submit.prevent="updateQuestion">
        <!-- Display non-editable info -->
        <p><strong>Section:</strong> {{ question.section }}</p>
        <p><strong>Type:</strong> {{ question.questionType }}</p>

        <!-- The magic is here: Pass the fetched question data as a prop -->
        <component
          :is="currentFormComponent"
          ref="formComponentRef"
          :key="question.id"
          :initial-data="question"
        />

        <button type="submit">Update Question</button>
        <p v-if="successMessage" class="success-message">
          {{ successMessage }}
        </p>
        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
      </form>
    </div>
  </div>
</template>

<style scoped>
.success-message {
  color: green;
}
.error-message {
  color: red;
}
</style>
