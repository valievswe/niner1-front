<!-- src/components/exam-taking/GenericTaker.vue -->
<script setup>
defineProps({
  question: { type: Object, required: true },
});
</script>

<template>
  <div class="question-container">
    <h3>{{ question.questionType }}</h3>
    <p>
      <i>(Rendering component for this question type is a work in progress.)</i>
    </p>
    <pre>{{ question.content }}</pre>
  </div>
</template>

<style scoped>
.question-container {
  margin-bottom: 30px;
  padding: 15px;
  border: 1px dashed #ccc;
}
pre {
  background-color: #f4f4f4;
  padding: 10px;
}
</style>
