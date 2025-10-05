<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter, RouterLink } from "vue-router";
import apiClient from "@/services/api";
import ConfirmationModal from "@/components/confirmation/ConfirmationModal.vue";
// This component is assumed to provide a UI-friendly view of the QUESTION content.
import QuestionResultDisplay from "../QuestionResultDisplay.vue";

const route = useRoute();
const router = useRouter();
const submission = ref(null);
const loading = ref(true);
const errorMessage = ref("");
const successMessage = ref("");

// --- State for marking and modals ---
const manualScores = ref({});
const isModalVisible = ref(false);

// --- Data Fetching & Core Logic (Unchanged) ---
async function fetchSubmission() {
  loading.value = true;
  errorMessage.value = "";
  try {
    const response = await apiClient.get(
      `/marking/submissions/${route.params.id}`
    );
    submission.value = response.data;
    const initialScores = {};
    submission.value.studentAnswers.forEach((sa) => {
      if (sa.question.section === "WRITING") {
        initialScores[sa.question.id] = {
          score: sa.score || 0,
          feedback: sa.feedback || "",
        };
      }
    });
    manualScores.value = initialScores;
  } catch (error) {
    errorMessage.value = "Failed to load submission data.";
  } finally {
    loading.value = false;
  }
}

onMounted(fetchSubmission);

async function markSubmission() {
  successMessage.value = "";
  errorMessage.value = "";
  try {
    const manualScoresPayload = Object.entries(manualScores.value).map(
      ([questionId, data]) => ({
        questionId,
        score: parseFloat(data.score) || 0,
        feedback: data.feedback,
      })
    );
    await apiClient.post(`/marking/submissions/${route.params.id}/mark`, {
      manualScores: manualScoresPayload,
    });
    successMessage.value = "Marking has been finalized!";
    await fetchSubmission(); // Refresh data to show new status
  } catch (error) {
    errorMessage.value = "Failed to finalize marks.";
  }
}

async function releaseResults() {
  isModalVisible.value = false;
  successMessage.value = "";
  errorMessage.value = "";
  try {
    await apiClient.post(`/marking/submissions/${route.params.id}/release`);
    successMessage.value = "Results have been released to the student!";
    await fetchSubmission(); // Refresh data
  } catch (error) {
    errorMessage.value = "Failed to release results.";
  }
}

// --- Helper Functions ---
function getStatusClass(status) {
  switch (status) {
    case "COMPLETED":
      return "badge-warning";
    case "MARKED":
      return "badge-primary";
    case "RESULTS_RELEASED":
      return "badge-success";
    default:
      return "badge-primary";
  }
}
</script>

<template>
  <div class="submission-detail-container">
    <div class="page-header">
      <h1>Mark Submission</h1>
      <RouterLink to="/admin/submissions" class="btn btn-secondary"
        >&larr; Back to Submissions</RouterLink
      >
    </div>

    <div v-if="loading" class="loading-state">
      <div class="loader"></div>
      <p>Loading submission...</p>
    </div>
    <div v-else-if="errorMessage && !submission" class="alert alert-error">
      {{ errorMessage }}
    </div>

    <div v-else-if="submission" class="submission-layout">
      <!-- Left Column: Main Content -->
      <div class="answers-container card">
        <div class="card-body">
          <div
            v-for="item in submission.studentAnswers"
            :key="item.id"
            class="answer-item"
          >
            <h5 class="content-title">
              {{ item.question.questionType.replace(/_/g, " ") }}
            </h5>

            <!-- Display the question itself -->
            <QuestionResultDisplay
              :question="item.question"
              :student-answer="item.answer"
            />

            <!-- Display the interactive marking form for Writing questions -->
            <div
              v-if="
                item.question.section === 'WRITING' &&
                manualScores[item.question.id]
              "
              class="marking-form"
            >
              <h5 class="marking-title">Admin Marking & Feedback</h5>
              <div class="form-row">
                <div class="form-group">
                  <label :for="`score-${item.id}`" class="form-label"
                    >Score (0.0 - 9.0)</label
                  >
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="9"
                    :id="`score-${item.id}`"
                    v-model="manualScores[item.question.id].score"
                    class="form-input"
                  />
                </div>
              </div>
              <div class="form-group">
                <label :for="`feedback-${item.id}`" class="form-label"
                  >Feedback</label
                >
                <textarea
                  :id="`feedback-${item.id}`"
                  rows="4"
                  v-model="manualScores[item.question.id].feedback"
                  class="form-textarea"
                ></textarea>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Sticky Sidebar -->
      <div class="sidebar">
        <div class="card">
          <div class="card-header">
            <h4 class="card-title">Submission Summary</h4>
          </div>
          <div class="card-body">
            <div class="summary-item">
              <span class="label">Student</span>
              <span class="value"
                >{{ submission.student.firstName }}
                {{ submission.student.lastName }}</span
              >
            </div>
            <div class="summary-item">
              <span class="label">Template</span>
              <span class="value">{{ submission.template.title }}</span>
            </div>
            <div class="summary-item">
              <span class="label">Status</span>
              <span class="value">
                <span class="badge" :class="getStatusClass(submission.status)">
                  {{ submission.status.replace("_", " ") }}
                </span>
              </span>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><h4 class="card-title">Actions</h4></div>
          <div class="card-body">
            <div v-if="successMessage" class="alert alert-success">
              {{ successMessage }}
            </div>
            <div v-if="errorMessage && submission" class="alert alert-error">
              {{ errorMessage }}
            </div>

            <button
              v-if="submission.status === 'COMPLETED'"
              @click="markSubmission"
              class="btn btn-primary btn-lg btn-block"
            >
              Finalize Marks
            </button>
            <button
              v-if="submission.status === 'MARKED'"
              @click="isModalVisible = true"
              class="btn btn-success btn-lg btn-block"
            >
              Release Results
            </button>
            <p
              v-if="submission.status === 'RESULTS_RELEASED'"
              class="text-secondary text-center"
            >
              Results have been released to the student.
            </p>
          </div>
        </div>
      </div>
    </div>

    <ConfirmationModal
      :show="isModalVisible"
      title="Release Results"
      message="Are you sure you want to release these results to the student? They will be able to see their score and feedback."
      @confirm="releaseResults"
      @cancel="isModalVisible = false"
    />
  </div>
</template>

<style scoped>
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
  min-height: 60vh;
  color: var(--text-secondary);
}

.submission-layout {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--space-8);
  align-items: flex-start;
}
.sidebar {
  position: sticky;
  top: var(--space-8);
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}
.summary-item {
  display: flex;
  flex-direction: column;
  margin-bottom: var(--space-4);
}
.summary-item .label {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin-bottom: var(--space-1);
}
.summary-item .value {
  font-weight: var(--font-semibold);
}
.btn-block {
  width: 100%;
}
.text-center {
  text-align: center;
}

.answer-item {
  padding-bottom: var(--space-6);
  margin-bottom: var(--space-6);
  border-bottom: 1px solid var(--border-primary);
}
.answer-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
}
.content-title {
  font-size: var(--text-xl);
  margin-bottom: var(--space-4);
}
.marking-form {
  margin-top: var(--space-5);
  padding: var(--space-5);
  background-color: var(--bg-secondary);
  border-radius: var(--radius-base);
}
.marking-title {
  font-size: var(--text-lg);
  margin-bottom: var(--space-4);
}
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

@media (max-width: 1024px) {
  .submission-layout {
    grid-template-columns: 1fr;
  }
  .sidebar {
    position: static;
  }
}
</style>
