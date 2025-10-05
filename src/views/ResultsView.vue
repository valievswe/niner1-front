<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import apiClient from "@/services/api";
import QuestionResultDisplay from "./QuestionResultDisplay.vue";

const route = useRoute();
const results = ref(null);
const loading = ref(true);
const errorMessage = ref("");

onMounted(async () => {
  try {
    const scheduledExamId = route.params.id;
    const response = await apiClient.get(
      `/student/exams/${scheduledExamId}/results`
    );
    results.value = response.data;
  } catch (error) {
    errorMessage.value =
      error.response?.data?.error || "Failed to load results.";
  } finally {
    loading.value = false;
  }
});

function formatBandScore(score) {
  return score ? score.toFixed(1) : "N/A";
}
</script>

<template>
  <div class="results-container">
    <div v-if="loading" class="loading-state">
      <div class="loader"></div>
      <p>Loading your exam results...</p>
    </div>

    <div v-else-if="errorMessage" class="alert alert-error">
      <p>{{ errorMessage }}</p>
    </div>

    <div v-else-if="results && results.scores" class="results-content">
      <div class="page-header">
        <h1 class="page-title">Exam Results</h1>
        <p class="page-subtitle">{{ results.template.title }}</p>
        <p class="text-secondary">
          Completed on:
          {{ new Date(results.completedAt).toLocaleString("en-GB") }}
        </p>
      </div>

      <!-- SCORE SUMMARY -->
      <div class="score-summary-panel card">
        <h2 class="section-title">Your Scores</h2>
        <div class="scores-grid">
          <div class="score-card">
            <h3 class="score-label">Listening</h3>
            <div class="band-score">
              {{ formatBandScore(results.scores.bandScores.listening) }}
            </div>
            <div class="raw-score">
              {{ results.scores.rawScores.LISTENING }} correct
            </div>
          </div>
          <div class="score-card">
            <h3 class="score-label">Reading</h3>
            <div class="band-score">
              {{ formatBandScore(results.scores.bandScores.reading) }}
            </div>
            <div class="raw-score">
              {{ results.scores.rawScores.READING }} correct
            </div>
          </div>
          <div class="score-card">
            <h3 class="score-label">Writing</h3>
            <div class="band-score">
              {{ formatBandScore(results.scores.bandScores.writing) }}
            </div>
            <div class="raw-score">Examiner assessed</div>
          </div>
          <div class="score-card score-card--overall">
            <h3 class="score-label">Overall Band</h3>
            <div class="band-score">
              {{ formatBandScore(results.scores.overallBandScore) }}
            </div>
          </div>
        </div>
      </div>

      <hr class="divider" />

      <!-- DETAILED BREAKDOWN -->
      <h2 class="section-title">Detailed Breakdown</h2>
      <div
        v-for="studentAnswer in results.studentAnswers"
        :key="studentAnswer.id"
        class="result-item card"
      >
        <div class="question-content">
          <h3 class="question-type">
            {{ studentAnswer.question.questionType.replace(/_/g, " ") }}
          </h3>
          <QuestionResultDisplay :question="studentAnswer.question" />
        </div>

        <div class="answer-comparison">
          <div class="answer-box your-answer">
            <h4 class="answer-heading">Your Answer</h4>
            <div
              v-if="
                ['GAP_FILLING', 'SUMMARY_COMPLETION'].includes(
                  studentAnswer.question.questionType
                )
              "
            >
              <pre class="answer-pre">{{ studentAnswer.answer }}</pre>
            </div>
            <div
              v-else-if="
                studentAnswer.question.questionType === 'WRITING_PROMPT'
              "
            >
              <p class="writing-response">{{ studentAnswer.answer.text }}</p>
            </div>
            <pre v-else class="answer-pre">{{ studentAnswer.answer }}</pre>

            <span v-if="studentAnswer.isCorrect" class="badge badge-success"
              >✔ Correct</span
            >
            <span
              v-else-if="studentAnswer.isCorrect === false"
              class="badge badge-error"
              >✖ Incorrect</span
            >
          </div>

          <div
            v-if="studentAnswer.isCorrect === false"
            class="answer-box correct-answer"
          >
            <h4 class="answer-heading">Correct Answer</h4>
            <pre class="answer-pre">{{ studentAnswer.question.answer }}</pre>
          </div>

          <div
            v-if="studentAnswer.feedback"
            class="answer-box examiner-feedback"
          >
            <h4 class="answer-heading">Examiner Feedback</h4>
            <p>{{ studentAnswer.feedback }}</p>
            <div v-if="studentAnswer.score" class="feedback-score">
              <strong>Score:</strong> {{ studentAnswer.score }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.results-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: var(--space-6) var(--space-4);
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: var(--space-4);
  color: var(--text-secondary);
}
.loader {
  border: 3px solid var(--color-gray-200);
  border-top: 3px solid var(--color-primary-600);
  border-radius: 50%;
  width: 48px;
  height: 48px;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Page Header */
.page-header {
  text-align: center;
  margin-bottom: var(--space-8);
}
.page-title {
  font-size: var(--text-4xl);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--space-2) 0;
}
.page-subtitle {
  font-size: var(--text-2xl);
  font-weight: var(--font-medium);
  color: var(--text-primary);
  margin: 0 0 var(--space-3) 0;
}

/* Score Summary */
.score-summary-panel {
  margin-bottom: var(--space-8);
}
.section-title {
  font-size: var(--text-3xl);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: var(--space-8) 0 var(--space-6) 0;
}
.scores-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--space-5);
}
.score-card {
  padding: var(--space-5);
  border: var(--border-width) solid var(--border-primary);
  border-radius: var(--radius-base);
  text-align: center;
  background: var(--bg-primary);
}
.score-label {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-secondary);
  margin: 0 0 var(--space-3) 0;
}
.band-score {
  font-size: var(--text-4xl);
  font-weight: var(--font-bold);
  color: var(--color-primary-600);
  margin: var(--space-2) 0;
}
.raw-score {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
}
.score-card--overall .band-score {
  color: var(--color-success-600);
}

.divider {
  border: 0;
  border-top: 1px solid var(--border-primary);
  margin: var(--space-8) 0;
}

/* Result Item */
.result-item {
  margin-bottom: var(--space-6);
}
.question-type {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--space-4) 0;
}

/* Answer Comparison */
.answer-comparison {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin-top: var(--space-5);
}
@media (min-width: 768px) {
  .answer-comparison {
    flex-direction: row;
    flex-wrap: wrap;
  }
  .examiner-feedback {
    flex: 1 1 100%;
  }
}

.answer-box {
  flex: 1;
  padding: var(--space-4);
  border-radius: var(--radius-base);
  border: var(--border-width) solid var(--border-primary);
}
.your-answer {
  background: var(--color-gray-50);
  border-color: var(--color-primary-200);
}
.correct-answer {
  background: var(--color-success-50);
  border-color: var(--color-success-300);
}
.examiner-feedback {
  background: var(--color-warning-50);
  border-color: var(--color-warning-300);
}

.answer-heading {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  color: var(--text-secondary);
  margin: 0 0 var(--space-2) 0;
}

.answer-pre {
  background: white;
  padding: var(--space-3);
  border-radius: var(--radius-sm);
  white-space: pre-wrap;
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  margin: var(--space-2) 0;
  border: 1px solid var(--border-primary);
}

.writing-response {
  white-space: pre-wrap;
  line-height: var(--leading-relaxed);
}

.feedback-score {
  margin-top: var(--space-2);
  font-weight: var(--font-medium);
  color: var(--text-primary);
}

/* Responsive */
@media (max-width: 640px) {
  .page-title {
    font-size: var(--text-3xl);
  }
  .band-score {
    font-size: var(--text-3xl);
  }
}
</style>
