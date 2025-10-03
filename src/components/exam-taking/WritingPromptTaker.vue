<script setup>
import { ref, watch, computed } from "vue";

const props = defineProps({
  question: { type: Object, required: true },
  initialAnswer: { type: Object, default: () => ({}) },
});
const emit = defineEmits(["answer-updated"]);

const writingResponse = ref(props.initialAnswer.text || "");

// Debounced watcher to update the parent state
let debounceTimer;
watch(writingResponse, (newVal) => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    emit("answer-updated", {
      questionId: props.question.id,
      answer: { text: newVal },
    });
  }, 500);
});

// Computed property to calculate word count
const wordCount = computed(() => {
  if (!writingResponse.value || !writingResponse.value.trim()) {
    return 0;
  }
  const words = writingResponse.value.trim().split(/\s+/).filter(Boolean);
  return words.length;
});
</script>

<template>
  <div class="question-container">
    <h4>Writing {{ question.content.taskType }}</h4>
    <p class="instructions">{{ question.content.prompt }}</p>
    <div v-if="question.content.imageUrl" class="image-container">
      <img :src="question.content.imageUrl" alt="Task 1 Image" />
    </div>
    <textarea
      v-model="writingResponse"
      class="writing-textarea"
      placeholder="Type your response here..."
    ></textarea>
    <div class="word-count">Word Count: {{ wordCount }}</div>
  </div>
</template>

<style scoped>
.question-container {
  margin-bottom: 30px;
}
.instructions {
  font-weight: bold;
  line-height: 1.5;
}
.image-container img {
  max-width: 100%;
  border: 1px solid #ccc;
}
.writing-textarea {
  width: 100%;
  height: 300px;
  margin-top: 15px;
  padding: 10px;
  font-size: 1em;
}

.word-count {
  text-align: right;
  margin-top: 5px;
  color: #6c757d;
  font-size: 0.9em;
}
</style>
