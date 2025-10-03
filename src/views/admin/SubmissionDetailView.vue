<!-- src/views/admin/SubmissionDetailView.vue -->
<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import apiClient from "@/services/api";
import QuestionResultDisplay from "../QuestionResultDisplay.vue";

const route = useRoute();
const router = useRouter();
const submission = ref(null);
const loading = ref(true);
const errorMessage = ref("");
const successMessage = ref("");

// --- STATE for the marking form ---

const manualScores = ref({});

// --- LIFECYCLE HOOK ---
onMounted(async () => {
  await fetchSubmission();
});

// --- METHODS ---
async function fetchSubmission() {
  loading.value = true;
  successMessage.value = "";
  errorMessage.value = "";
  try {
    const submissionId = route.params.id;
    const response = await apiClient.get(
      `/marking/submissions/${submissionId}`
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
    errorMessage.value =
      error.response?.data?.error || "Failed to load submission data.";
  } finally {
    loading.value = false;
  }
}

async function markSubmission() {
  successMessage.value = "";
  errorMessage.value = "";
  try {
    const submissionId = route.params.id;

    const manualScoresPayload = Object.entries(manualScores.value).map(
      ([questionId, data]) => ({
        questionId,
        score: parseFloat(data.score) || 0,
        feedback: data.feedback,
      })
    );

    await apiClient.post(`/marking/submissions/${submissionId}/mark`, {
      manualScores: manualScoresPayload,
    });

    successMessage.value =
      "Marking finalized! Auto-marking is complete. Status is now MARKED.";
    await fetchSubmission();
  } catch (error) {
    errorMessage.value =
      error.response?.data?.error || "Failed to finalize marks.";
  }
}

async function releaseResults() {
  successMessage.value = "";
  errorMessage.value = "";
  if (
    !confirm("Are you sure you want to release these results to the student?")
  ) {
    return;
  }
  try {
    const submissionId = route.params.id;
    await apiClient.post(`/marking/submissions/${submissionId}/release`);
    successMessage.value = "Results have been released!";
    await fetchSubmission();
  } catch (error) {
    errorMessage.value =
      error.response?.data?.error || "Failed to release results.";
  }
}
</script>

<template>
  <div>
    <h1>Admin: Submission Details & Marking</h1>

    <div v-if="loading">Loading submission...</div>
    <div v-else-if="errorMessage" class="error-message">{{ errorMessage }}</div>

    <div v-else-if="submission">
      <div class="summary">
        <p>
          <strong>Student:</strong> {{ submission.student.firstName }}
          {{ submission.student.lastName }} ({{ submission.student.email }})
        </p>
        <p><strong>Template:</strong> {{ submission.template.title }}</p>
        <p>
          <strong>Status:</strong>
          <span :class="`status-${submission.status.toLowerCase()}`">{{
            submission.status
          }}</span>
        </p>
      </div>

      <div class="actions-panel">
        <button
          v-if="submission.status === 'COMPLETED'"
          @click="markSubmission"
        >
          Finalize Marks
        </button>
        <button
          v-if="submission.status === 'MARKED'"
          @click="releaseResults"
          class="release-btn"
        >
          Release Results
        </button>
        <p v-if="successMessage" class="success-message">
          {{ successMessage }}
        </p>
      </div>

      <div class="answers-container">
        <h3>Student's Answers</h3>
        <div
          v-for="item in submission.studentAnswers"
          :key="item.id"
          class="answer-item"
        >
          <h4>Question Type: {{ item.question.questionType }}</h4>
          <strong>Question Content:</strong>
          <QuestionResultDisplay :question="item.question" />
          <strong>Student's Answer:</strong>
          <pre class="student-answer">{{ item.answer }}</pre>
          <strong>Correct Answer:</strong>
          <pre class="correct-answer">{{ item.question.answer }}</pre>

          <!-- The Interactive Marking Form for Writing Questions -->
          <div
            v-if="
              item.question.section === 'WRITING' &&
              manualScores[item.question.id]
            "
            class="marking-form"
          >
            <h4>Marking</h4>
            <div class="form-group">
              <label :for="`score-${item.id}`">Score (0.0 - 9.0)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="9"
                :id="`score-${item.id}`"
                v-model="manualScores[item.question.id].score"
              />
            </div>
            <div class="form-group">
              <label :for="`feedback-${item.id}`">Feedback</label>
              <textarea
                :id="`feedback-${item.id}`"
                rows="4"
                v-model="manualScores[item.question.id].feedback"
              ></textarea>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.summary {
  background-color: #f4f4f4;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}
.answers-container {
  margin-top: 20px;
}
.answer-item {
  margin-bottom: 20px;
  border: 1px solid #ddd;
  padding: 15px;
  border-radius: 8px;
}
pre {
  background-color: #eee;
  padding: 10px;
  white-space: pre-wrap;
  word-wrap: break-word;
  border-radius: 4px;
}
.student-answer {
  border-left: 3px solid #007bff;
}
.correct-answer {
  border-left: 3px solid #28a745;
}
.status-completed {
  font-weight: bold;
  color: #dc3545;
}
.status-marked {
  font-weight: bold;
  color: #ffc107;
}
.status-results_released {
  font-weight: bold;
  color: #28a745;
}
.actions-panel {
  margin: 20px 0;
  padding: 15px;
  border: 1px solid #ddd;
  background-color: #f9f9f9;
}
.actions-panel button {
  padding: 10px 15px;
  font-size: 1em;
  cursor: pointer;
}
.release-btn {
  background-color: #28a745;
  color: white;
  border: none;
}
.success-message {
  color: green;
  margin-top: 10px;
}
.error-message {
  color: red;
}
.marking-form {
  margin-top: 20px;
  padding: 15px;
  background-color: #fff3cd;
  border: 1px solid #ffeeba;
  border-radius: 8px;
}
.marking-form .form-group {
  margin-bottom: 10px;
}
.marking-form label {
  display: block;
  margin-bottom: 5px;
}
.marking-form input,
.marking-form textarea {
  width: 100%;
  padding: 8px;
}
</style>
