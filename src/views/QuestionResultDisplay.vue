<script setup>
import { computed } from "vue";

const props = defineProps({
  question: { type: Object, required: true },
  studentAnswer: { type: [String, Object, Array, null], default: null },
});

// Check if answer is correct (for auto-graded questions)
function isCorrect(studentAns, correctAns) {
  if (!studentAns) return false;
  if (typeof correctAns === "string") {
    return (
      studentAns.toString().toLowerCase().trim() ===
      correctAns.toLowerCase().trim()
    );
  }
  if (Array.isArray(correctAns)) {
    return correctAns.some(
      (ans) =>
        studentAns.toString().toLowerCase().trim() === ans.toLowerCase().trim()
    );
  }
  return false;
}

// GAP FILLING - Compare each gap
const gapFillResults = computed(() => {
  if (
    props.question.questionType === "GAP_FILLING" ||
    props.question.questionType === "SUMMARY_COMPLETION"
  ) {
    // Correct answers are in question.answer, NOT question.content.correctAnswers
    const correctAnswers =
      props.question.answer || props.question.content?.correctAnswers || {};
    const studentAnswers = props.studentAnswer || {};
    const results = [];

    Object.keys(correctAnswers).forEach((gapNum) => {
      const studentAns = studentAnswers[gapNum];
      const correctAns = correctAnswers[gapNum];
      results.push({
        gapNumber: gapNum,
        studentAnswer: studentAns || "",
        correctAnswer: correctAns,
        isCorrect: isCorrect(studentAns, correctAns),
      });
    });

    return results;
  }
  return [];
});

// TRUE/FALSE - Compare each statement
const trueFalseResults = computed(() => {
  if (props.question.questionType === "TRUE_FALSE_NOT_GIVEN") {
    const statements = props.question.content?.statements || [];
    const studentAnswers = props.studentAnswer || {};
    // Correct answers are in question.answer
    const correctAnswersMap = props.question.answer || {};

    return statements.map((statement) => {
      const studentAns = studentAnswers[statement.id];
      // Try to get correct answer from question.answer first, then from statement
      const correctAns =
        correctAnswersMap[statement.id] || statement.correctAnswer;
      return {
        id: statement.id,
        text: statement.text,
        studentAnswer: studentAns || "NOT ANSWERED",
        correctAnswer: correctAns,
        isCorrect: studentAns === correctAns,
      };
    });
  }
  return [];
});

// MULTIPLE CHOICE - Compare selected options
const multipleChoiceResults = computed(() => {
  if (props.question.questionType === "MULTIPLE_CHOICE_MULTIPLE_ANSWER") {
    // Correct answers are in question.answer
    const correctAnswers =
      props.question.answer || props.question.content?.correctAnswers || [];
    const studentAnswers = Array.isArray(props.studentAnswer)
      ? props.studentAnswer
      : [];

    return {
      studentSelected: studentAnswers,
      correctAnswers: correctAnswers,
      isCorrect:
        JSON.stringify(studentAnswers.sort()) ===
        JSON.stringify(correctAnswers.sort()),
    };
  }
  return null;
});

// MATCHING - Compare pairs
const matchingResults = computed(() => {
  if (props.question.questionType === "MATCHING") {
    // Correct answers are in question.answer
    const correctAnswers =
      props.question.answer || props.question.content?.correctAnswers || {};
    const studentAnswers = props.studentAnswer || {};
    const prompts = props.question.content?.prompts || [];

    return prompts.map((prompt) => {
      const studentAns = studentAnswers[prompt.id];
      const correctAns = correctAnswers[prompt.id];
      return {
        promptId: prompt.id,
        promptText: prompt.text,
        studentAnswer: studentAns || "NOT ANSWERED",
        correctAnswer: correctAns,
        isCorrect: studentAns === correctAns,
      };
    });
  }
  return [];
});
</script>

<template>
  <div class="question-result-display">
    <!-- Instructions -->
    <div v-if="question.content?.instructions" class="instructions-box">
      <strong>Instructions:</strong> {{ question.content.instructions }}
    </div>

    <!-- WRITING PROMPT - No auto-grading -->
    <div
      v-if="question.questionType === 'WRITING_PROMPT'"
      class="writing-section"
    >
      <div class="prompt-box">
        <h6>Writing Prompt:</h6>
        <p>{{ question.content?.prompt }}</p>
        <img
          v-if="question.content?.imageUrl"
          :src="question.content.imageUrl"
          alt="Task image"
          class="task-image"
        />
      </div>
      <div class="answer-box">
        <h6>Student's Response:</h6>
        <div class="writing-answer">
          {{
            studentAnswer
              ? typeof studentAnswer === "object"
                ? studentAnswer.text
                : studentAnswer
              : "No response provided"
          }}
        </div>
        <div class="word-count">
          Word count:
          {{
            studentAnswer
              ? typeof studentAnswer === "object"
                ? (studentAnswer.text || "")
                    .split(/\s+/)
                    .filter((w) => w.length > 0).length
                : studentAnswer.split(/\s+/).filter((w) => w.length > 0).length
              : 0
          }}
        </div>
      </div>
    </div>

    <!-- GAP FILLING - Show comparison table -->
    <div
      v-else-if="
        question.questionType === 'GAP_FILLING' ||
        question.questionType === 'SUMMARY_COMPLETION'
      "
      class="gap-fill-section"
    >
      <div class="results-table">
        <div class="table-header">
          <span>Gap</span>
          <span>Student Answer</span>
          <span>Correct Answer</span>
          <span>Result</span>
        </div>
        <div
          v-for="result in gapFillResults"
          :key="result.gapNumber"
          class="table-row"
        >
          <span class="gap-num">{{ result.gapNumber }}</span>
          <span
            class="student-ans"
            :class="{
              correct: result.isCorrect,
              wrong: !result.isCorrect && result.studentAnswer,
            }"
          >
            {{ result.studentAnswer || "—" }}
          </span>
          <span class="correct-ans">{{ result.correctAnswer }}</span>
          <span class="result-icon">
            <span v-if="result.isCorrect" class="icon-correct">✓</span>
            <span v-else-if="result.studentAnswer" class="icon-wrong">✗</span>
            <span v-else class="icon-empty">—</span>
          </span>
        </div>
      </div>
    </div>

    <!-- TRUE/FALSE/NOT GIVEN - Show comparison table -->
    <div
      v-else-if="question.questionType === 'TRUE_FALSE_NOT_GIVEN'"
      class="true-false-section"
    >
      <div class="results-table">
        <div class="table-header">
          <span>Statement</span>
          <span>Student</span>
          <span>Correct</span>
          <span>Result</span>
        </div>
        <div
          v-for="result in trueFalseResults"
          :key="result.id"
          class="table-row"
        >
          <span class="statement-text">{{ result.text }}</span>
          <span
            class="student-ans"
            :class="{ correct: result.isCorrect, wrong: !result.isCorrect }"
          >
            {{ result.studentAnswer }}
          </span>
          <span class="correct-ans">{{ result.correctAnswer }}</span>
          <span class="result-icon">
            <span v-if="result.isCorrect" class="icon-correct">✓</span>
            <span v-else class="icon-wrong">✗</span>
          </span>
        </div>
      </div>
    </div>

    <!-- MULTIPLE CHOICE - Show selected vs correct -->
    <div
      v-else-if="
        question.questionType === 'MULTIPLE_CHOICE_MULTIPLE_ANSWER' &&
        multipleChoiceResults
      "
      class="mcq-section"
    >
      <div class="comparison-box">
        <div class="comparison-column">
          <h6>Student Selected:</h6>
          <ul class="answer-list">
            <li
              v-for="ans in multipleChoiceResults.studentSelected"
              :key="ans"
              :class="{
                correct: multipleChoiceResults.correctAnswers.includes(ans),
                wrong: !multipleChoiceResults.correctAnswers.includes(ans),
              }"
            >
              {{ ans }}
            </li>
            <li
              v-if="multipleChoiceResults.studentSelected.length === 0"
              class="empty-answer"
            >
              No answer selected
            </li>
          </ul>
        </div>
        <div class="comparison-column">
          <h6>Correct Answer(s):</h6>
          <ul class="answer-list correct-list">
            <li v-for="ans in multipleChoiceResults.correctAnswers" :key="ans">
              {{ ans }}
            </li>
          </ul>
        </div>
      </div>
      <div
        class="overall-result"
        :class="{
          correct: multipleChoiceResults.isCorrect,
          wrong: !multipleChoiceResults.isCorrect,
        }"
      >
        <span v-if="multipleChoiceResults.isCorrect" class="icon-correct"
          >✓</span
        >
        <span v-else class="icon-wrong">✗</span>
        {{ multipleChoiceResults.isCorrect ? "Correct" : "Incorrect" }}
      </div>
    </div>

    <!-- MATCHING - Show comparison table -->
    <div
      v-else-if="question.questionType === 'MATCHING'"
      class="matching-section"
    >
      <div class="results-table">
        <div class="table-header">
          <span>Prompt</span>
          <span>Student Match</span>
          <span>Correct Match</span>
          <span>Result</span>
        </div>
        <div
          v-for="result in matchingResults"
          :key="result.promptId"
          class="table-row"
        >
          <span class="prompt-text">{{ result.promptText }}</span>
          <span
            class="student-ans"
            :class="{
              correct: result.isCorrect,
              wrong:
                !result.isCorrect && result.studentAnswer !== 'NOT ANSWERED',
            }"
          >
            {{ result.studentAnswer }}
          </span>
          <span class="correct-ans">{{ result.correctAnswer }}</span>
          <span class="result-icon">
            <span v-if="result.isCorrect" class="icon-correct">✓</span>
            <span
              v-else-if="result.studentAnswer !== 'NOT ANSWERED'"
              class="icon-wrong"
              >✗</span
            >
            <span v-else class="icon-empty">—</span>
          </span>
        </div>
      </div>
    </div>

    <!-- MAP LABELING -->
    <div
      v-else-if="question.questionType === 'MAP_LABELING'"
      class="map-section"
    >
      <img
        v-if="question.content?.imageUrl"
        :src="question.content.imageUrl"
        alt="Map"
        class="task-image"
      />
      <div class="answer-box">
        <h6>Student's Labels:</h6>
        <pre>{{ JSON.stringify(studentAnswer, null, 2) }}</pre>
      </div>
    </div>

    <!-- GENERIC FALLBACK -->
    <div v-else class="generic-section">
      <div class="answer-box">
        <h6>Student's Answer:</h6>
        <pre>{{ studentAnswer || "No answer provided" }}</pre>
      </div>
    </div>
  </div>
</template>

<style scoped>
.question-result-display {
  display: flex;
  flex-direction: column;
  gap: var(--space-4, 16px);
}

.instructions-box {
  padding: var(--space-3, 12px);
  background: var(--color-info-50, #e6f7ff);
  border-left: 3px solid var(--color-info-500, #1890ff);
  border-radius: var(--radius-base, 4px);
  font-size: var(--text-sm, 13px);
  line-height: var(--leading-relaxed, 1.6);
}

/* Results Table */
.results-table {
  border: 1px solid var(--border-primary, #e2e8f0);
  border-radius: var(--radius-base, 4px);
  overflow: hidden;
}

.table-header {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 80px;
  gap: var(--space-3, 12px);
  padding: var(--space-3, 12px);
  background: var(--bg-secondary, #fafafa);
  font-weight: var(--font-semibold, 600);
  font-size: var(--text-xs, 11px);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide, 0.025em);
  color: var(--text-secondary, #4a5568);
}

.table-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 80px;
  gap: var(--space-3, 12px);
  padding: var(--space-3, 12px);
  border-top: 1px solid var(--border-primary, #e2e8f0);
  align-items: center;
}

.gap-num,
.result-icon {
  text-align: center;
  font-weight: var(--font-semibold, 600);
}

.student-ans {
  padding: var(--space-2, 8px);
  border-radius: var(--radius-sm, 3px);
  font-weight: var(--font-medium, 500);
}

.student-ans.correct {
  background: var(--color-success-100, #c6f6d5);
  color: var(--color-success-800, #22543d);
}

.student-ans.wrong {
  background: var(--color-error-100, #fed7d7);
  color: var(--color-error-800, #822727);
}

.correct-ans {
  color: var(--color-success-700, #276749);
  font-weight: var(--font-medium, 500);
}

.icon-correct {
  color: var(--color-success-600, #2f855a);
  font-size: 20px;
  font-weight: var(--font-bold, 700);
}

.icon-wrong {
  color: var(--color-error-600, #c53030);
  font-size: 20px;
  font-weight: var(--font-bold, 700);
}

.icon-empty {
  color: var(--text-tertiary, #718096);
}

/* Writing Section */
.prompt-box,
.answer-box {
  padding: var(--space-4, 16px);
  background: var(--bg-secondary, #fafafa);
  border: 1px solid var(--border-primary, #e2e8f0);
  border-radius: var(--radius-base, 4px);
}

.prompt-box h6,
.answer-box h6 {
  margin: 0 0 var(--space-2, 8px) 0;
  font-size: var(--text-sm, 13px);
  font-weight: var(--font-semibold, 600);
  color: var(--text-secondary, #4a5568);
  text-transform: uppercase;
}

.writing-answer {
  padding: var(--space-4, 16px);
  background: white;
  border: 1px solid var(--border-primary, #e2e8f0);
  border-radius: var(--radius-base, 4px);
  line-height: var(--leading-relaxed, 1.6);
  white-space: pre-wrap;
  min-height: 200px;
  max-height: 400px;
  overflow-y: auto;
}

.word-count {
  margin-top: var(--space-2, 8px);
  font-size: var(--text-sm, 13px);
  color: var(--text-secondary, #4a5568);
  font-style: italic;
}

.task-image {
  max-width: 100%;
  margin-top: var(--space-3, 12px);
  border: 1px solid var(--border-primary, #e2e8f0);
  border-radius: var(--radius-base, 4px);
}

/* Multiple Choice Comparison */
.comparison-box {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-6, 24px);
}

.comparison-column h6 {
  margin: 0 0 var(--space-3, 12px) 0;
  font-size: var(--text-sm, 13px);
  font-weight: var(--font-semibold, 600);
  color: var(--text-secondary, #4a5568);
  text-transform: uppercase;
}

.answer-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2, 8px);
}

.answer-list li {
  padding: var(--space-2, 8px) var(--space-3, 12px);
  border-radius: var(--radius-base, 4px);
  border: 1px solid var(--border-primary, #e2e8f0);
}

.answer-list li.correct {
  background: var(--color-success-100, #c6f6d5);
  border-color: var(--color-success-300, #68d391);
  color: var(--color-success-800, #22543d);
}

.answer-list li.wrong {
  background: var(--color-error-100, #fed7d7);
  border-color: var(--color-error-300, #fc8181);
  color: var(--color-error-800, #822727);
}

.answer-list.correct-list li {
  background: var(--color-success-50, #f0fff4);
  border-color: var(--color-success-200, #9ae6b4);
  color: var(--color-success-700, #276749);
}

.empty-answer {
  font-style: italic;
  color: var(--text-tertiary, #718096);
}

.overall-result {
  margin-top: var(--space-4, 16px);
  padding: var(--space-3, 12px);
  text-align: center;
  font-weight: var(--font-semibold, 600);
  border-radius: var(--radius-base, 4px);
}

.overall-result.correct {
  background: var(--color-success-100, #c6f6d5);
  color: var(--color-success-800, #22543d);
}

.overall-result.wrong {
  background: var(--color-error-100, #fed7d7);
  color: var(--color-error-800, #822727);
}

/* Statement text for true/false */
.statement-text,
.prompt-text {
  font-size: var(--text-sm, 13px);
  line-height: var(--leading-relaxed, 1.6);
}

/* Responsive */
@media (max-width: 768px) {
  .table-header,
  .table-row {
    grid-template-columns: 1fr;
    gap: var(--space-2, 8px);
  }

  .table-header span {
    display: none;
  }

  .table-row span::before {
    content: attr(data-label);
    font-weight: var(--font-semibold, 600);
    display: block;
    margin-bottom: var(--space-1, 4px);
  }

  .comparison-box {
    grid-template-columns: 1fr;
  }
}
</style>
