<script setup>
import { ref, watch, computed } from "vue";

const props = defineProps({
  question: { type: Object, required: true },
  initialAnswer: { type: Object, default: () => ({}) },
});
const emit = defineEmits(["answer-updated"]);

const writingResponse = ref(props.initialAnswer.text || "");

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

const wordCount = computed(() => {
  if (!writingResponse.value || !writingResponse.value.trim()) {
    return 0;
  }
  const words = writingResponse.value.trim().split(/\s+/).filter(Boolean);
  return words.length;
});
</script>

<template>
  <div class="question-container card">
    <div class="card-body">
      <h4 class="task-heading">Writing {{ question.content.taskType }}</h4>
      <p class="instructions">{{ question.content.prompt }}</p>

      <div v-if="question.content.imageUrl" class="image-container">
        <img
          :src="question.content.imageUrl"
          :alt="`Image for Task ${question.content.taskType}`"
        />
      </div>

      <textarea
        v-model="writingResponse"
        class="writing-textarea form-textarea"
        placeholder="Type your response here..."
      ></textarea>

      <div class="word-count">
        Word Count: <span class="font-semibold">{{ wordCount }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.question-container {
  margin-bottom: var(--space-6);
}

.task-heading {
  font-size: var(--text-2xl); /* DS Typography */
  margin-bottom: var(--space-3);
  color: var(--text-primary);
}

.instructions {
  font-weight: var(--font-semibold);
  line-height: var(--leading-relaxed);
  color: var(--text-primary);
  margin-bottom: var(--space-5);
}

.image-container {
  margin-bottom: var(--space-5);
  display: flex;
  justify-content: center;
  background-color: var(--bg-secondary);
  padding: var(--space-4);
  border-radius: var(--radius-base);
}

.image-container img {
  max-width: 100%;
  height: auto;
  display: block;
  border: var(--border-width) solid var(--border-primary);
  border-radius: var(--radius-sm);
}

/* The .form-textarea class from main.css handles core textarea styling */
.writing-textarea {
  min-height: 250px;
  margin-top: var(--space-4);
}

.word-count {
  text-align: right;
  margin-top: var(--space-3);
  color: var(--text-secondary);
  font-size: var(--text-sm);
}
</style>
