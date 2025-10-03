<script setup>
import { ref, watch, computed } from "vue";
import { useRouter, RouterLink } from "vue-router";
import apiClient from "@/services/api";

// Import all your form components
import TrueFalseForm from "@/components/question-forms/TrueFalseForm.vue";
import MultipleChoiceForm from "@/components/question-forms/MultipleChoiceForm.vue";
import GapFillForm from "@/components/question-forms/GapFillForm.vue";
import MatchingForm from "@/components/question-forms/MatchingForm.vue";
import MapLabelingForm from "@/components/question-forms/MapLabelingForm.vue";
import WritingPromptForm from "@/components/question-forms/WritingPromptForm.vue";

const router = useRouter();

// --- STATE ---
const section = ref("READING");
const questionSets = ref([]);
const selectedSetId = ref("");
const partNumber = ref(1); // State for the new part number field

const questionType = ref("TRUE_FALSE_NOT_GIVEN");
const explanation = ref("");
const formComponentRef = ref(null);
const successMessage = ref("");
const errorMessage = ref("");

// --- DYNAMIC COMPONENT MAPPING ---
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

// --- LOGIC TO FETCH QUESTION SETS ---
watch(
  section,
  async (newSection) => {
    selectedSetId.value = "";
    questionSets.value = [];
    partNumber.value = 1; // Reset part number when section changes
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

// --- METHOD TO SAVE THE QUESTION ---
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
      partNumber: partNumber.value, // Include the part number in the payload
      content,
      answer,
      explanation: explanation.value,
    });
    successMessage.value = "Question created successfully!";
    setTimeout(() => router.push("/admin/questions"), 1500);
  } catch (error) {
    errorMessage.value =
      error.response?.data?.error || "Failed to save question.";
    console.error(error);
  }
}
</script>

<template>
  <div>
    <h1>Admin: Create New Question</h1>

    <form @submit.prevent="saveQuestion" class="question-form">
      <!-- STEP 1: SELECT SECTION -->
      <div class="form-group">
        <label for="section">1. Select Section</label>
        <select id="section" v-model="section">
          <option value="LISTENING">Listening</option>
          <option value="READING">Reading</option>
          <option value="WRITING">Writing</option>
        </select>
      </div>

      <!-- STEP 2: SELECT QUESTION SET -->
      <div class="form-group">
        <label for="questionSet">2. Select Question Set</label>
        <select id="questionSet" v-model="selectedSetId" required>
          <option disabled value="">-- Please choose a set --</option>
          <option v-for="set in questionSets" :key="set.id" :value="set.id">
            {{ set.name }}
          </option>
        </select>
        <p v-if="questionSets.length === 0 && section">
          No sets found for this section.
          <RouterLink to="/admin/question-sets">Create one first.</RouterLink>
        </p>
      </div>

      <!-- STEP 3: FILL OUT QUESTION (only visible if a set is selected) -->
      <div v-if="selectedSetId">
        <hr />

        <!-- THE NEW PART NUMBER DROPDOWN -->
        <div class="form-group">
          <label for="partNumber">3. Select Part / Passage / Task Number</label>

          <select
            v-if="section === 'LISTENING'"
            id="partNumber"
            v-model="partNumber"
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
            required
          >
            <option :value="1">Task 1</option>
            <option :value="2">Task 2</option>
          </select>
        </div>

        <div class="form-group">
          <label for="questionType">4. Select Question Type</label>
          <select id="questionType" v-model="questionType">
            <option value="TRUE_FALSE_NOT_GIVEN">True/False/Not Given</option>
            <option value="MULTIPLE_CHOICE_MULTIPLE_ANSWER">
              Multiple Choice (Multiple Answer)
            </option>
            <option value="GAP_FILLING">Gap Filling</option>
            <option value="SUMMARY_COMPLETION">Summary Completion</option>
            <option value="MATCHING">Matching</option>
            <option value="MAP_LABELING">Map Labeling</option>
            <option value="WRITING_PROMPT">Writing Prompt</option>
          </select>
        </div>

        <component
          :is="currentFormComponent"
          ref="formComponentRef"
          :key="questionType"
        />

        <div class="form-group">
          <label for="explanation">Explanation (Optional)</label>
          <input type="text" id="explanation" v-model="explanation" />
        </div>

        <button type="submit">Save Question</button>

        <p v-if="successMessage" class="success-message">
          {{ successMessage }}
        </p>
        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
      </div>
    </form>
  </div>
</template>

<style scoped>
.question-form {
  max-width: 800px;
}
.form-group {
  margin-bottom: 15px;
}
label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}
select,
input,
textarea {
  width: 100%;
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #ccc;
}
.success-message {
  color: green;
}
.error-message {
  color: red;
}
hr {
  margin: 20px 0;
  border: none;
  border-top: 1px solid #eee;
}
</style>
