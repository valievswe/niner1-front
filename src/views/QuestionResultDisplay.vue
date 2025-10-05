<script setup>
import { computed } from "vue";

const props = defineProps({
  question: {
    type: Object,
    required: true,
  },
  // We add studentAnswer to provide context, though it's not used in all displays yet.
  studentAnswer: {
    type: Object,
    default: null,
  },
});

// INVENTION: This computed property intelligently parses the gap-fill text.
// It splits the text by the {{number}} placeholders to reconstruct the sentence visually.
const textParts = computed(() => {
  if (
    (props.question.questionType === "GAP_FILLING" ||
      props.question.questionType === "SUMMARY_COMPLETION") &&
    props.question.content.textWithGaps
  ) {
    // The parentheses in the regex are crucial to keep the delimiters in the resulting array.
    return props.question.content.textWithGaps
      .split(/({{\d+}})/g)
      .filter(Boolean);
  }
  return [];
});
</script>

<template>
  <div class="question-display-container">
    <!-- --- INSTRUCTIONS (Common to many types) --- -->
    <p v-if="question.content.instructions" class="instructions">
      {{ question.content.instructions }}
    </p>

    <!-- --- PASSAGE (Common to many types) --- -->
    <div v-if="question.content.passage" class="passage">
      {{ question.content.passage }}
    </div>

    <!-- ====== UI-FRIENDLY DISPLAY PER QUESTION TYPE ====== -->

    <!-- WRITING PROMPT -->
    <div v-if="question.questionType === 'WRITING_PROMPT'">
      <h5 class="prompt-title">
        Task {{ question.content.taskType.split("_")[1] }} Prompt
      </h5>
      <p class="prompt">{{ question.content.prompt }}</p>
      <img
        v-if="question.content.imageUrl"
        :src="question.content.imageUrl"
        alt="Writing Task Image"
        class="task-image"
      />
    </div>

    <!-- MAP LABELING -->
    <div v-else-if="question.questionType === 'MAP_LABELING'">
      <img
        v-if="question.content.imageUrl"
        :src="question.content.imageUrl"
        alt="Map for labeling"
        class="task-image"
      />
      <div class="content-block">
        <h5 class="content-title">Available Labels</h5>
        <ul class="item-list">
          <li v-for="label in question.content.labels" :key="label.id">
            <strong>{{ label.id }}:</strong> {{ label.text }}
          </li>
        </ul>
      </div>
    </div>

    <!-- TRUE/FALSE/NOT GIVEN -->
    <div v-else-if="question.questionType === 'TRUE_FALSE_NOT_GIVEN'">
      <h5 class="content-title">Statements</h5>
      <ul class="statements-list">
        <li
          v-for="statement in question.content.statements"
          :key="statement.id"
        >
          {{ statement.text }}
        </li>
      </ul>
    </div>

    <!-- MULTIPLE CHOICE -->
    <div
      v-else-if="question.questionType === 'MULTIPLE_CHOICE_MULTIPLE_ANSWER'"
    >
      <h5 class="prompt-title">{{ question.content.prompt }}</h5>
      <div class="mcq-options-list">
        <div
          v-for="option in question.content.options"
          :key="option.id"
          class="mcq-option"
        >
          <span class="mcq-checkbox"></span>
          <span>{{ option.text }}</span>
        </div>
      </div>
    </div>

    <!-- GAP FILLING / SUMMARY COMPLETION -->
    <div
      v-else-if="
        question.questionType === 'GAP_FILLING' ||
        question.questionType === 'SUMMARY_COMPLETION'
      "
    >
      <div class="gapped-text">
        <template v-for="(part, index) in textParts" :key="index">
          <span v-if="!part.startsWith('{{')">{{ part }}</span>
          <span v-else class="gap-placeholder">
            [ {{ part.replace(/[{}]/g, "") }} ]
          </span>
        </template>
      </div>
    </div>

    <!-- MATCHING -->
    <div v-else-if="question.questionType === 'MATCHING'">
      <div class="matching-grid">
        <div class="content-block">
          <h5 class="content-title">Prompts</h5>
          <ul class="item-list">
            <li v-for="prompt in question.content.prompts" :key="prompt.id">
              <strong>{{ prompt.id }}:</strong> {{ prompt.text }}
            </li>
          </ul>
        </div>
        <div class="content-block">
          <h5 class="content-title">Options</h5>
          <ul class="item-list">
            <li v-for="option in question.content.options" :key="option.id">
              <strong>{{ option.id }}:</strong> {{ option.text }}
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- GENERIC FALLBACK -->
    <div v-else>
      <h5 class="content-title">Question Content</h5>
      <pre>{{ question.content }}</pre>
    </div>
  </div>
</template>

<style scoped>
.question-display-container {
  font-size: var(--text-base);
  color: var(--text-primary);
}
.instructions {
  font-style: italic;
  color: var(--text-secondary);
  margin-bottom: var(--space-4);
}
.passage {
  white-space: pre-wrap;
  background-color: var(--bg-secondary);
  padding: var(--space-4);
  border-radius: var(--radius-base);
  margin-bottom: var(--space-4);
  line-height: var(--leading-loose);
}
.content-block {
  margin-top: var(--space-5);
}
.content-title {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  margin-bottom: var(--space-3);
}
.prompt-title {
  font-weight: var(--font-semibold);
  font-size: var(--text-lg);
  margin-bottom: var(--space-4);
}
.prompt {
  line-height: var(--leading-relaxed);
  white-space: pre-wrap;
}
.task-image {
  max-width: 100%;
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-base);
  margin-top: var(--space-4);
}

/* List Styles */
.statements-list,
.item-list {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.statements-list li {
  padding: var(--space-3);
  background-color: var(--bg-secondary);
  border-radius: var(--radius-base);
}
.item-list li {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

/* MCQ Styles */
.mcq-options-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.mcq-option {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-3);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-base);
}
.mcq-checkbox {
  flex-shrink: 0;
  height: 24px;
  width: 24px;
  background-color: var(--bg-primary);
  border: 2px solid var(--border-primary);
  border-radius: var(--radius-base);
}

/* Gap Fill Styles */
.gapped-text {
  line-height: var(--leading-loose);
  white-space: pre-wrap;
}
.gap-placeholder {
  display: inline-block;
  padding: 0 var(--space-2);
  margin: 0 var(--space-1);
  border: 1px dashed var(--border-secondary);
  border-radius: var(--radius-base);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

/* Matching Styles */
.matching-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-6);
}

/* Fallback */
pre {
  background-color: var(--bg-secondary);
  padding: var(--space-4);
  border-radius: var(--radius-base);
  white-space: pre-wrap;
  font-family: var(--font-mono);
}
</style>
