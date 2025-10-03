<script setup>
import { ref } from "vue";

const instructions = ref("Match each statement with the correct person.");
const prompts = ref([{ id: "p_1", text: "" }]);
const options = ref([{ id: "o_a", text: "" }]);
const answers = ref({});

// --- NEW DYNAMIC METHODS ---
function addPrompt() {
  const newId = `p_${prompts.value.length + 1}`;
  prompts.value.push({ id: newId, text: "" });
}
function removePrompt(index) {
  prompts.value.splice(index, 1);
  prompts.value.forEach((p, i) => {
    p.id = `p_${i + 1}`;
  });
}

function addOption() {
  // Use letters for option IDs: a, b, c, d...
  const newLetter = String.fromCharCode(97 + options.value.length); // 97 is ASCII for 'a'
  const newId = `o_${newLetter}`;
  options.value.push({ id: newId, text: "" });
}
function removeOption(index) {
  options.value.splice(index, 1);
  options.value.forEach((o, i) => {
    o.id = `o_${String.fromCharCode(97 + i)}`;
  });
}

const getPayload = () => {
  const content = {
    instructions: instructions.value,
    prompts: prompts.value.filter((p) => p.text.trim()),
    options: options.value.filter((o) => o.text.trim()),
  };
  const answer = answers.value;
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
      <label>Prompts (e.g., questions or statements)</label>
      <div v-for="(prompt, index) in prompts" :key="index" class="dynamic-row">
        <input
          type="text"
          v-model="prompt.text"
          :placeholder="`Prompt ${prompt.id}`"
        />
        <button
          v-if="prompts.length > 1"
          type="button"
          @click="removePrompt(index)"
        >
          -
        </button>
      </div>
      <button type="button" @click="addPrompt">+ Add Prompt</button>
    </div>
    <div class="form-group">
      <label>Options (to match against)</label>
      <div v-for="(option, index) in options" :key="index" class="dynamic-row">
        <input
          type="text"
          v-model="option.text"
          :placeholder="`Option ${option.id}`"
        />
        <button
          v-if="options.length > 1"
          type="button"
          @click="removeOption(index)"
        >
          -
        </button>
      </div>
      <button type="button" @click="addOption">+ Add Option</button>
    </div>
    <h4>Answer Key</h4>
    <div class="form-group">
      <div v-for="prompt in prompts" :key="prompt.id">
        <label>Answer for Prompt {{ prompt.id }}:</label>
        <select v-model="answers[prompt.id]">
          <option :value="undefined">-- Select --</option>
          <option v-for="option in options" :key="option.id" :value="option.id">
            {{ option.text || option.id }}
          </option>
        </select>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Styles can be shared */
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
select {
  width: 100%;
  padding: 8px;
  margin-bottom: 5px;
}
</style>
