<!-- src/components/question-forms/MultipleChoiceForm.vue -->
<script setup>
import { ref } from "vue";

// --- STATE ---
const instructions = ref("");
const passage = ref(""); // Optional, for reading passages
const prompt = ref(""); // The main question, e.g., "Which TWO of the following are mentioned?"
const options = ref([
  { id: "opt_1", text: "", isCorrect: false },
  { id: "opt_2", text: "", isCorrect: false },
]);

// --- METHODS ---
function addOption() {
  const newId = `opt_${options.value.length + 1}`;
  options.value.push({ id: newId, text: "", isCorrect: false });
}

function removeOption(index) {
  options.value.splice(index, 1);
  // Re-index IDs to keep them sequential
  options.value.forEach((opt, i) => {
    opt.id = `opt_${i + 1}`;
  });
}

const getPayload = () => {
  const content = {
    instructions: instructions.value,
    passage: passage.value,
    prompt: prompt.value,
    // The 'options' array in the content only needs the id and text
    options: options.value.map((opt) => ({ id: opt.id, text: opt.text })),
  };

  const answer = {
    // The 'answer' object contains an array of the IDs of the correct options
    correctOptionIds: options.value
      .filter((opt) => opt.isCorrect)
      .map((opt) => opt.id),
  };

  return { content, answer };
};

// Expose the method for the parent
defineExpose({ getPayload });
</script>

<template>
  <div class="form-section">
    <h4>Question Content</h4>
    <div class="form-group">
      <label>Instructions</label>
      <input
        type="text"
        v-model="instructions"
        placeholder="e.g., Choose TWO letters, A-E."
      />
    </div>

    <div class="form-group">
      <label>Passage Text (Optional - for Reading)</label>
      <textarea
        v-model="passage"
        rows="7"
        placeholder="Leave blank for Listening questions."
      ></textarea>
    </div>

    <div class="form-group">
      <label>Question Prompt</label>
      <input
        type="text"
        v-model="prompt"
        placeholder="e.g., Which TWO advantages of the new library are mentioned?"
      />
    </div>

    <div class="form-group">
      <label>Options</label>
      <div
        v-for="(option, index) in options"
        :key="option.id"
        class="option-row"
      >
        <span>{{ option.id }}:</span>
        <input
          type="text"
          v-model="option.text"
          placeholder="Enter option text..."
        />
        <label class="checkbox-label">
          <input type="checkbox" v-model="option.isCorrect" /> Correct
        </label>
        <button
          v-if="options.length > 2"
          type="button"
          @click="removeOption(index)"
        >
          -
        </button>
      </div>
      <button type="button" @click="addOption">+ Add Option</button>
    </div>
  </div>
</template>

<style scoped>
/* You can reuse styles from other form components */
.form-section {
  margin-top: 20px;
  padding: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}
.form-group {
  margin-bottom: 15px;
}
label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}
input[type="text"],
textarea {
  width: 100%;
  padding: 8px;
}
.option-row {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 10px;
}
.option-row input[type="text"] {
  flex-grow: 1;
}
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
}
</style>
