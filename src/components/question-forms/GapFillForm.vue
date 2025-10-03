<!-- src/components/question-forms/GapFillForm.vue -->
<script setup>
import { ref } from "vue";

const instructions = ref("Complete the notes below...");
const textWithGaps = ref(
  "Example Text:\nThe student is in their {{1}} year.\nContact number: {{2}}"
);
// The answers array is now simpler and can be added to
const answers = ref([{ id: "1", text: "" }]);

// --- NEW DYNAMIC METHODS ---
function addAnswerField() {
  const newId = `${answers.value.length + 1}`;
  answers.value.push({ id: newId, text: "" });
}

function removeAnswerField(index) {
  answers.value.splice(index, 1);
  // Re-index the IDs to keep them sequential
  answers.value.forEach((ans, i) => {
    ans.id = `${i + 1}`;
  });
}

const getPayload = () => {
  const content = {
    instructions: instructions.value,
    textWithGaps: textWithGaps.value,
  };
  const answer = answers.value.reduce((acc, curr) => {
    // Only include answers that have text, to keep the final JSON clean
    if (curr.text.trim()) {
      acc[curr.id] = curr.text.trim();
    }
    return acc;
  }, {});
  return { content, answer };
};

defineExpose({ getPayload });
</script>

<template>
  <div class="form-section">
    <h4>Question Content</h4>
    <div class="form-group">
      <label>Instructions</label>
      <input type="text" v-model="instructions" />
    </div>
    <div class="form-group">
      <label>Text with Gaps (Use {'{'}number{'}'} for gaps)</label>
      <textarea v-model="textWithGaps" rows="7"></textarea>
    </div>

    <h4>Answer Key</h4>
    <div class="form-group">
      <div v-for="(ans, index) in answers" :key="index" class="answer-row">
        <label>Answer for gap {{ ans.id }}:</label>
        <input type="text" v-model="ans.text" />
        <button
          v-if="answers.length > 1"
          type="button"
          @click="removeAnswerField(index)"
        >
          -
        </button>
      </div>
      <button type="button" @click="addAnswerField">+ Add Answer Field</button>
    </div>
  </div>
</template>
<style scoped>
/* You can share styles between these components */
.form-section {
  margin-top: 20px;
  padding: 15px;
  border: 1px solid #e0e0e0;
}
.form-group {
  margin-bottom: 15px;
}
label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}
input,
textarea {
  width: 100%;
  padding: 8px;
}
.answer-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 5px;
}
</style>
