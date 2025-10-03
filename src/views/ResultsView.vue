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
</script>

<template>
  <div class="results-container">
    <h1>Exam Results</h1>
    <div v-if="loading">Loading results...</div>
    <div v-else-if="errorMessage" class="error-message">{{ errorMessage }}</div>
    <div v-else-if="results && results.scores">
      <h2>{{ results.template.title }}</h2>
      <p>
        <strong>Completed On:</strong>
        {{ new Date(results.completedAt).toLocaleString() }}
      </p>

      <!-- SCORE SUMMARY SECTION (Updated to use the new data structure) -->
      <div class="score-summary-panel">
        <h3>Your Scores</h3>
        <div class="scores-grid">
          <div class="score-card">
            <h4>Listening</h4>
            <div class="band-score">
              {{ results.scores.bandScores.listening.toFixed(1) }}
            </div>
            <div class="raw-score">
              {{ results.scores.rawScores.LISTENING }} correct
            </div>
          </div>
          <div class="score-card">
            <h4>Reading</h4>
            <div class="band-score">
              {{ results.scores.bandScores.reading.toFixed(1) }}
            </div>
            <div class="raw-score">
              {{ results.scores.rawScores.READING }} correct
            </div>
          </div>
          <div class="score-card">
            <h4>Writing</h4>
            <div class="band-score">
              {{ (results.scores.bandScores.writing || 0).toFixed(1) }}
            </div>
            <div class="raw-score">Final Assessed Score</div>
          </div>
          <div class="score-card overall">
            <h4>Overall Band</h4>
            <div class="band-score">
              {{ results.scores.overallBandScore.toFixed(1) }}
            </div>
          </div>
        </div>
      </div>
      <hr />

      <h3>Detailed Breakdown</h3>
      <div
        v-for="studentAnswer in results.studentAnswers"
        :key="studentAnswer.id"
        class="result-item"
      >
        <div class="question-content">
          <h4>Question ({{ studentAnswer.question.questionType }})</h4>
          <QuestionResultDisplay :question="studentAnswer.question" />
        </div>
        <div class="answer-comparison">
          <div class="answer-box your-answer">
            <strong>Your Answer:</strong>
            <!-- Display logic for different answer types -->
            <div
              v-if="
                ['GAP_FILLING', 'SUMMARY_COMPLETION'].includes(
                  studentAnswer.question.questionType
                )
              "
            >
              <pre>{{ studentAnswer.answer }}</pre>
              <!-- Keep raw for simple answers -->
            </div>
            <div
              v-else-if="
                studentAnswer.question.questionType === 'WRITING_PROMPT'
              "
            >
              <p class="writing-response">{{ studentAnswer.answer.text }}</p>
            </div>
            <pre v-else>{{ studentAnswer.answer }}</pre>

            <span v-if="studentAnswer.isCorrect" class="badge correct"
              >✔ Correct</span
            >
            <span
              v-else-if="studentAnswer.isCorrect === false"
              class="badge incorrect"
              >✖ Incorrect</span
            >
          </div>
          <div
            v-if="studentAnswer.isCorrect === false"
            class="answer-box correct-answer"
          >
            <strong>Correct Answer:</strong>
            <pre>{{ studentAnswer.question.answer }}</pre>
          </div>

          <!-- This will now correctly show feedback for BOTH Task 1 and Task 2 -->
          <div v-if="studentAnswer.feedback" class="answer-box manual-grade">
            <strong>Examiner Feedback:</strong>
            <p>{{ studentAnswer.feedback }}</p>
            <strong v-if="studentAnswer.score">Score:</strong>
            {{ studentAnswer.score }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.results-container {
  max-width: 900px;
  margin: auto;
  padding: 20px;
}
.loading-state,
.error-message {
  text-align: center;
  font-size: 1.2em;
  padding: 40px;
}
.error-message {
  color: red;
}
.result-item {
  margin-bottom: 30px;
  border-bottom: 2px solid #eee;
  padding-bottom: 20px;
}
.answer-comparison {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  margin-top: 15px;
}
@media (min-width: 768px) {
  .answer-comparison {
    grid-template-columns: 1fr 1fr;
  }
}
.answer-box {
  padding: 15px;
  border-radius: 8px;
}
.your-answer {
  background-color: #e9ecef;
}
.correct-answer {
  background-color: #d4edda;
}
.manual-grade {
  background-color: #fff3cd;
  grid-column: 1 / -1;
}
.badge {
  font-weight: bold;
  margin-left: 10px;
}
.correct {
  color: #155724;
}
.incorrect {
  color: #721c24;
}
pre {
  background-color: #fff;
  padding: 10px;
  border-radius: 4px;
  white-space: pre-wrap;
  word-wrap: break-word;
}
.gapped-text {
  line-height: 1.8;
}
.filled-gap {
  background-color: #fff;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
  border: 1px solid #ddd;
}
.writing-response {
  white-space: pre-wrap;
}
.score-summary-panel {
  margin: 30px 0;
  padding: 20px;
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
}
.score-summary-panel h3 {
  margin-top: 0;
  text-align: center;
}
.scores-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
}
.score-card {
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  text-align: center;
  background-color: #fff;
}
.score-card h4 {
  margin: 0 0 10px 0;
  color: #495057;
}
.band-score {
  font-size: 2.5em;
  font-weight: bold;
  color: #007bff;
}
.raw-score {
  font-size: 0.9em;
  color: #6c757d;
}
.score-card.overall .band-score {
  color: #28a745;
}
</style>
