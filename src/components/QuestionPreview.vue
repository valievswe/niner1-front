<script setup>
import { computed } from "vue";

const props = defineProps({
  question: {
    type: Object,
    required: true,
  },
});

const previewText = computed(() => {
  if (!props.question || !props.question.content) return "No content";

  const content = props.question.content;
  let text = "";

  switch (props.question.questionType) {
    case "TRUE_FALSE_NOT_GIVEN":
      text = content.statements?.[0]?.text || "No statements available";
      break;
    case "MULTIPLE_CHOICE_MULTIPLE_ANSWER":
      text = content.prompt || "No prompt available";
      break;
    case "GAP_FILLING":
    case "MAP_LABELING":
    case "MATCHING":
      text = content.instructions || "No instructions available";
      break;
    case "WRITING_PROMPT":
      text = content.prompt || "No prompt available";
      break;
    default:
      text = "Preview not available for this type";
  }

  return text.length > 70 ? text.substring(0, 70) + "..." : text;
});
</script>

<template>
  <div class="preview-container">
    <span class="type-badge">{{
      question.questionType.replace(/_/g, " ")
    }}</span>
    <span class="section">({{ question.section }})</span>
    <span class="preview-text">&ldquo;{{ previewText }}&rdquo;</span>
  </div>
</template>

<style scoped>
.preview-container {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
  font-size: var(--text-base);
  color: var(--text-primary);
}

/* 
  IMPROVEMENT:
  Styled the type as a badge for better visual distinction,
  using design system colors and properties.
*/
.type-badge {
  flex-shrink: 0;
  font-family: var(--font-primary);
  font-weight: var(--font-semibold);
  font-size: var(--text-xs);
  color: var(--color-primary-800);
  background-color: var(--color-primary-100);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-base);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wider);
}

.section {
  flex-shrink: 0;
  color: var(--text-tertiary);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
}

.preview-text {
  color: var(--text-secondary);
  font-style: italic;

  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
