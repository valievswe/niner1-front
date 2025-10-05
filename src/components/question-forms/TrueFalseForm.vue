<script setup>
import { ref, onMounted } from "vue";

const props = defineProps({
  initialData: { type: Object, default: null },
});
const instructions = ref(
  "Do the following statements agree with the information given in the passage?"
);
const passage = ref("");
const statements = ref([{ id: "s_1", text: "", answer: "TRUE" }]);
onMounted(() => {
  if (props.initialData) {
    const { content, answer } = props.initialData;
    instructions.value =
      content.instructions ||
      "Do the following statements agree with the information given in the passage?";
    passage.value = content.passage || "";

    if (content.statements && content.statements.length && answer) {
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
    instructions: instructions.value,
    passage: passage.value,
    statements: statements.value
      .filter((s) => s.text.trim())
      .map((s) => ({ id: s.id, text: s.text })),
  };

  const answer = statements.value
    .filter((s) => s.text.trim())
    .reduce((acc, curr) => {
      acc[curr.id] = curr.answer;
      return acc;
    }, {});

  return { content, answer };
};

defineExpose({ getPayload });
</script>
<template>
  <div class="form-container">
    <div class="card">
      <div class="card-header">
        <h4 class="card-title">Question Content</h4>
      </div>
      <div class="card-body">
        <div class="form-group">
          <label class="form-label" for="tf-instructions">Instructions</label>
          <input
            id="tf-instructions"
            type="text"
            v-model="instructions"
            class="form-input"
          />
        </div>
        <div class="form-group">
          <label class="form-label" for="tf-passage"
            >Passage Text (Optional for Listening)</label
          >
          <textarea
            id="tf-passage"
            v-model="passage"
            class="form-textarea"
            rows="7"
            placeholder="Enter the reading passage here..."
          ></textarea>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h4 class="card-title">Statements & Answer Key</h4>
      </div>
      <div class="card-body">
        <div class="statements-list">
          <div
            v-for="(statement, index) in statements"
            :key="statement.id"
            class="statement-row"
          >
            <strong class="statement-id">{{ statement.id }}:</strong>

            <input
              type="text"
              v-model="statement.text"
              class="form-input"
              placeholder="Enter the statement text..."
            />

            <select v-model="statement.answer" class="form-select">
              <option value="TRUE">TRUE</option>
              <option value="FALSE">FALSE</option>
              <option value="NOT_GIVEN">NOT GIVEN</option>
            </select>

            <!-- SEMANTIC BUTTON COLOR: Destructive action -->
            <button
              v-if="statements.length > 1"
              type="button"
              @click="removeStatement(index)"
              class="btn btn-danger btn-sm"
            >
              &ndash;
            </button>
          </div>
        </div>
        <div class="add-button-container">
          <!-- SEMANTIC BUTTON COLOR: Additive/neutral action -->
          <button type="button" @click="addStatement" class="btn btn-secondary">
            + Add Statement
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.form-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.statements-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.statement-row {
  display: grid;
  grid-template-columns: 40px 1fr 150px auto;
  gap: var(--space-4);
  align-items: center;
}

.statement-id {
  font-family: var(--font-mono);
  color: var(--text-secondary);
  text-align: right;
}

.add-button-container {
  margin-top: var(--space-5);
  padding-top: var(--space-5);
  border-top: 1px solid var(--border-primary);
}
</style>
