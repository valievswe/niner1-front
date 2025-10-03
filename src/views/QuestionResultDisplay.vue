<!-- src/components/QuestionResultDisplay.vue -->
<script setup>
defineProps({
  question: {
    type: Object,
    required: true,
  },
});
</script>

<template>
  <div class="question-display-container">
    <!-- --- WRITING PROMPT --- -->
    <div v-if="question.questionType === 'WRITING_PROMPT'">
      <h4>{{ question.content.taskType }}</h4>
      <p class="prompt">{{ question.content.prompt }}</p>
      <!-- The crucial fix: check for and render the image -->
      <img
        v-if="question.content.imageUrl"
        :src="question.content.imageUrl"
        alt="Writing Task Image"
        class="task-image"
      />
    </div>

    <!-- --- MAP LABELING --- -->
    <div v-else-if="question.questionType === 'MAP_LABELING'">
      <p v-if="question.content.instructions" class="instructions">
        {{ question.content.instructions }}
      </p>
      <!-- The crucial fix: render the map image -->
      <img
        v-if="question.content.imageUrl"
        :src="question.content.imageUrl"
        alt="Map for labeling"
        class="task-image"
      />
    </div>

    <!-- --- TRUE/FALSE/NOT GIVEN --- -->
    <div v-else-if="question.questionType === 'TRUE_FALSE_NOT_GIVEN'">
      <p v-if="question.content.instructions" class="instructions">
        {{ question.content.instructions }}
      </p>
      <p v-if="question.content.passage" class="passage">
        {{ question.content.passage }}
      </p>
      <ul class="statements-list">
        <li
          v-for="statement in question.content.statements"
          :key="statement.id"
        >
          {{ statement.id }}: {{ statement.text }}
        </li>
      </ul>
    </div>

    <!-- Add other v-else-if blocks here for your other question types (MCQ, GapFill, etc.) -->

    <!-- --- GENERIC FALLBACK --- -->
    <!-- This will render for any question type we haven't made a custom view for yet -->
    <div v-else>
      <p v-if="question.content.instructions" class="instructions">
        {{ question.content.instructions }}
      </p>
      <pre>{{ question.content }}</pre>
    </div>
  </div>
</template>

<style scoped>
.instructions {
  font-style: italic;
  color: #555;
}
.prompt {
  font-weight: bold;
  line-height: 1.5;
  white-space: pre-wrap;
}
.passage {
  white-space: pre-wrap;
  background-color: #f9f9f9;
  padding: 15px;
  border-radius: 4px;
}
.task-image {
  max-width: 100%;
  border: 1px solid #ccc;
  margin-top: 15px;
}
.statements-list {
  list-style-position: inside;
  padding-left: 5px;
}
pre {
  background-color: #f4f4f4;
  padding: 10px;
  border-radius: 4px;
  white-space: pre-wrap;
}
</style>
