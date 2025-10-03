<!-- src/components/question-forms/TrueFalseForm.vue -->
<script setup>
import { ref, onMounted } from "vue";

const props = defineProps({
  initialData: {
    type: Object,
    default: null,
  },
});

const instructions = ref("");
const passage = ref("");
const statements = ref([{ id: "s_1", text: "", answer: "TRUE" }]);

onMounted(() => {
  if (props.initialData) {
    const { content, answer } = props.initialData;
    instructions.value = content.instructions || "";
    passage.value = content.passage || "";

    if (content.statements && answer) {
      statements.value = content.statements.map((stmt) => ({
        id: stmt.id,
        text: stmt.text,
        answer: answer[stmt.id] || "TRUE",
      }));
    }
  }
});

function addStatement() {
  const newId = `s_${statements.value.length + 1}`;
  statements.value.push({ id: newId, text: "", answer: "TRUE" });
}

function removeStatement(index) {
  statements.value.splice(index, 1);

  statements.value.forEach((stmt, i) => {
    stmt.id = `s_${i + 1}`;
  });
}

const getPayload = () => {
  const content = {
    // passage: passage.value,
    statements: statements.value.map((s) => ({ id: s.id, text: s.text })),
  };

  const answer = statements.value.reduce((acc, curr) => {
    acc[curr.id] = curr.answer;
    return acc;
  }, {});

  return { content, answer };
};

defineExpose({
  getPayload,
});
</script>

<template>
  <div class="form-section">
    <h4>Question Content</h4>
    <!-- <div class="form-group">
      <label
        >Passage Text (content.passage) -
        <em>Leave blank for Listening questions</em></label
      >
      <textarea
        v-model="passage"
        rows="7"
        placeholder="Enter the reading passage here..."
      ></textarea>
    </div> -->

    <div class="form-group">
      <label>Statements (content.statements)</label>
      <div
        v-for="(statement, index) in statements"
        :key="statement.id"
        class="statement-row"
      >
        <strong class="statement-id">{{ statement.id }}:</strong>

        <input
          type="text"
          v-model="statement.text"
          placeholder="Enter the statement text..."
        />

        <select v-model="statement.answer">
          <option>TRUE</option>
          <option>FALSE</option>
          <option>NOT_GIVEN</option>
        </select>

        <button
          v-if="statements.length > 1"
          type="button"
          @click="removeStatement(index)"
        >
          -
        </button>
      </div>
      <button type="button" @click="addStatement">+ Add Statement</button>
    </div>

    <div class="preview-section">
      <h4>Answer Key Preview</h4>
      <pre>{{
        { ...statements.reduce((a, c) => ({ ...a, [c.id]: c.answer }), {}) }
      }}</pre>
    </div>
  </div>
</template>

<style scoped>
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
textarea,
input,
select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.statement-row {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 10px;
}
.statement-id {
  font-family: monospace;
}
.statement-row input {
  flex-grow: 1;
}
button {
  padding: 5px 10px;
}
.preview-section {
  margin-top: 20px;
  background-color: #f7f7f7;
  padding: 10px;
  border-radius: 4px;
}
pre {
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
