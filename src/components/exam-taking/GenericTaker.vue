<script setup>
defineProps({
  question: { type: Object, required: true },
});
</script>

<template>
  <!-- 
    IMPROVEMENT:
    Using the "alert" component with a warning state is a semantically
    clearer way to show this component is a placeholder.
  -->
  <div class="question-container alert alert-warning">
    <h3>{{ question.questionType }} - Placeholder</h3>
    <p>
      <em>(Rendering for this question type is a work in progress.)</em>
    </p>
    <pre>{{ question.content }}</pre>
  </div>
</template>

<style scoped>
.question-container {
  margin-bottom: var(--space-6); /* DS Spacing */
}

h3 {
  /* Inherits color from .alert-warning */
  font-size: var(--text-xl); /* DS Typography */
  margin-bottom: var(--space-2); /* DS Spacing */
}

p {
  color: var(--text-secondary); /* DS Color */
  margin-bottom: var(--space-4); /* DS Spacing */
}

pre {
  background-color: var(--color-warning-100); /* DS Color */
  color: var(--text-primary); /* DS Color */
  padding: var(--space-4); /* DS Spacing */
  border-radius: var(--radius-base); /* DS Border Radius */
  font-family: var(--font-mono); /* DS Font Family */
  font-size: var(--text-sm);
  white-space: pre-wrap; /* Ensures content wraps */
  word-break: break-all;
}
</style>
