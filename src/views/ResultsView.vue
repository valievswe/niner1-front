<script setup>
import { ref, onMounted, computed } from "vue";
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

// Group answers by section for display
const listeningAnswers = computed(
  () =>
    results.value?.studentAnswers.filter(
      (sa) => sa.question.section === "LISTENING"
    ) || []
);
const readingAnswers = computed(
  () =>
    results.value?.studentAnswers.filter(
      (sa) => sa.question.section === "READING"
    ) || []
);
const writingAnswers = computed(
  () =>
    results.value?.studentAnswers.filter(
      (sa) => sa.question.section === "WRITING"
    ) || []
);

// Format band scores
const formatBand = (score) => (score ? score.toFixed(1) : "N/A");
</script>

<template>
  <div class="results-container">
    <!-- Loading & Error States -->
    <div v-if="loading" class="loading-state">
      <div class="loader"></div>
      <p>Loading your exam results...</p>
    </div>

    <div v-else-if="errorMessage" class="alert alert-error">
      <p>{{ errorMessage }}</p>
    </div>

    <div v-else-if="results && results.scores" class="results-content">
      <!-- Header -->
      <div class="page-header">
        <h1 class="page-title">Your IELTS Results</h1>
        <p class="page-subtitle">{{ results.template.title }}</p>
        <p class="text-secondary">
          Completed on:
          {{ new Date(results.completedAt).toLocaleString("en-GB") }}
        </p>
      </div>

      <!-- Score Summary -->
      <div class="score-summary-panel card">
        <h2 class="section-title">Band Scores</h2>
        <div class="scores-grid">
          <div class="score-card">
            <h3 class="score-label">Listening</h3>
            <div class="band-score">
              {{ formatBand(results.scores.bandScores.listening) }}
            </div>
            <div class="raw-score">
              {{ results.scores.rawScores.LISTENING }} /
              {{ results.scores.totals?.LISTENING || 40 }}
            </div>
          </div>
          <div class="score-card">
            <h3 class="score-label">Reading</h3>
            <div class="band-score">
              {{ formatBand(results.scores.bandScores.reading) }}
            </div>
            <div class="raw-score">
              {{ results.scores.rawScores.READING }} /
              {{ results.scores.totals?.READING || 40 }}
            </div>
          </div>
          <div class="score-card">
            <h3 class="score-label">Writing</h3>
            <div class="band-score">
              {{ formatBand(results.scores.bandScores.writing) }}
            </div>
            <div class="raw-score">Examiner assessed</div>
          </div>
          <div class="score-card score-card--overall">
            <h3 class="score-label">Overall Band</h3>
            <div class="band-score">
              {{ formatBand(results.scores.overallBandScore) }}
            </div>
          </div>
        </div>
      </div>

      <hr class="divider" />

      <!-- Listening Section -->
      <div v-if="listeningAnswers.length" class="section-results">
        <h2 class="section-title">
          Listening (Questions 1–{{ listeningAnswers.length }})
        </h2>
        <div
          v-for="sa in listeningAnswers"
          :key="sa.id"
          class="result-item card"
        >
          <QuestionResultDisplay
            :question="sa.question"
            :studentAnswer="sa.answer"
          />
          <div v-if="sa.feedback" class="examiner-note">
            <strong>Feedback:</strong> {{ sa.feedback }}
            <span v-if="sa.score" class="score-tag">Score: {{ sa.score }}</span>
          </div>
        </div>
      </div>

      <!-- Reading Section -->
      <div v-if="readingAnswers.length" class="section-results">
        <h2 class="section-title">
          Reading (Questions 1–{{ readingAnswers.length }})
        </h2>
        <div v-for="sa in readingAnswers" :key="sa.id" class="result-item card">
          <QuestionResultDisplay
            :question="sa.question"
            :studentAnswer="sa.answer"
          />
          <div v-if="sa.feedback" class="examiner-note">
            <strong>Feedback:</strong> {{ sa.feedback }}
            <span v-if="sa.score" class="score-tag">Score: {{ sa.score }}</span>
          </div>
        </div>
      </div>

      <!-- Writing Section -->
      <div v-if="writingAnswers.length" class="section-results">
        <h2 class="section-title">Writing</h2>
        <div
          v-for="(sa, index) in writingAnswers"
          :key="sa.id"
          class="result-item card"
        >
          <div class="writing-task-header">
            <h3>Task {{ index + 1 }}</h3>
            <span v-if="sa.score" class="score-badge"
              >Band {{ formatBand(sa.score) }}</span
            >
          </div>
          <div class="writing-response-box">
            <p class="writing-response">{{ sa.answer }}</p>
          </div>
          <div v-if="sa.feedback" class="examiner-note">
            <strong>Examiner Feedback:</strong> {{ sa.feedback }}
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

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: var(--space-4);
  color: var(--text-secondary);
}

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

/* Section Results */
.section-results {
  margin-bottom: var(--space-8);
}
.result-item {
  margin-bottom: var(--space-6);
  padding: var(--space-5);
}

/* Writing Specific */
.writing-task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
}
.writing-response-box {
  background: var(--bg-secondary);
  padding: var(--space-4);
  border-radius: var(--radius-base);
  border: 1px solid var(--border-primary);
}
.writing-response {
  white-space: pre-wrap;
  line-height: var(--leading-relaxed);
  margin: 0;
}
.score-badge {
  background: var(--color-primary-100);
  color: var(--color-primary-800);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
}

/* Examiner Feedback */
.examiner-note {
  margin-top: var(--space-4);
  padding: var(--space-3);
  background: var(--color-warning-50);
  border-left: 3px solid var(--color-warning-500);
  border-radius: var(--radius-base);
  font-size: var(--text-sm);
  color: var(--text-primary);
}
.score-tag {
  display: block;
  margin-top: var(--space-2);
  font-weight: var(--font-semibold);
  color: var(--color-primary-700);
}

/* Responsive */
@media (max-width: 640px) {
  .page-title {
    font-size: var(--text-3xl);
  }
  .band-score {
    font-size: var(--text-3xl);
  }
  .writing-task-header {
    flex-direction: column;
    gap: var(--space-2);
    align-items: flex-start;
  }
}
</style>
