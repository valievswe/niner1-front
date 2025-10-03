<!-- src/components/QuestionPreview.vue -->
<script setup>
import { computed } from "vue";

const props = defineProps({
  question: {
    type: Object,
    required: true,
  },
});

// This is the core logic. It generates a preview based on question type.
const previewText = computed(() => {
  if (!props.question || !props.question.content) return "No content";

  const content = props.question.content;
  let text = "";

  switch (props.question.questionType) {
    case "TRUE_FALSE_NOT_GIVEN":
      // Show the first statement's text
      text = content.statements?.[0]?.text || "No statements";
      break;
    case "MULTIPLE_CHOICE_MULTIPLE_ANSWER":
      // Show the main prompt
      text = content.prompt || "No prompt";
      break;
    case "GAP_FILLING":
      // Show the instructions
      text = content.instructions || "No instructions";
      break;
    // Add cases for your other question types here...
    default:
      text = "Preview not available";
  }

  // Truncate the text if it's too long
  return text.length > 50 ? text.substring(0, 50) + "..." : text;
});
</script>

<template>
  <span class="preview-container">
    <strong class="type">{{ question.questionType }}</strong>
    <span class="section">({{ question.section }})</span>
    <span class="preview-text">- "{{ previewText }}"</span>
  </span>
</template>

<style scoped>
.preview-container {
  display: flex;
  align-items: center;
  gap: 8px;
}
.type {
  color: #333;
}
.section {
  color: #777;
  font-size: 0.9em;
}
.preview-text {
  color: #555;
  font-style: italic;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
