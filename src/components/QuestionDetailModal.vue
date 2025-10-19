<script setup>
import { computed } from "vue"; // Import computed for the helper functions

const props = defineProps({
  question: { type: Object, required: true },
  show: { type: Boolean, required: true },
});

const emit = defineEmits(["close"]);

// --- USER-FRIENDLY DISPLAY HELPERS (Copied from Detail View) ---

// Helper to find the text for a given option/label ID
const findItemTextById = (itemList, id) => {
  if (!itemList || !id) return "N/A";
  const item = itemList.find((i) => i.id === id);
  return item ? item.text : "Invalid ID";
};

// Helper to parse the Gap Filling text into displayable parts
const textParts = computed(() => {
  if (
    (props.question?.questionType === "GAP_FILLING" ||
      props.question?.questionType === "SUMMARY_COMPLETION") &&
    props.question.content.textWithGaps
  ) {
    return props.question.content.textWithGaps
      .split(/({{\d+}})/g)
      .filter(Boolean);
  }
  return [];
});
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="show" class="modal-overlay" @click.self="emit('close')">
        <div
          class="modal-content card"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div class="card-header">
            <h4 id="modal-title" class="card-title">Question Details</h4>
            <button
              class="close-button"
              @click="emit('close')"
              aria-label="Close"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <!-- THE FIX: The card-body now contains the intelligent, user-friendly view -->
          <div class="card-body">
            <!-- Common Fields -->
            <div v-if="question.content.instructions" class="content-block">
              <h5 class="content-title">Instructions</h5>
              <p>{{ question.content.instructions }}</p>
            </div>
            <div v-if="question.content.passage" class="content-block passage">
              <h5 class="content-title">Passage</h5>
              <p>{{ question.content.passage }}</p>
            </div>

            <!-- ====== USER-FRIENDLY DISPLAY PER QUESTION TYPE ====== -->

            <!-- True/False/Not Given -->
            <div v-if="question.questionType === 'TRUE_FALSE_NOT_GIVEN'">
              <div class="content-block">
                <h5 class="content-title">Statements & Answers</h5>
                <ul class="answer-list">
                  <li
                    v-for="statement in question.content.statements"
                    :key="statement.id"
                  >
                    <span>{{ statement.text }}</span>
                    <span
                      class="badge"
                      :class="{
                        'badge-success':
                          question.answer[statement.id] === 'TRUE',
                        'badge-error':
                          question.answer[statement.id] === 'FALSE',
                        'badge-warning':
                          question.answer[statement.id] === 'NOT_GIVEN',
                      }"
                      >{{
                        question.answer[statement.id].replace("_", " ")
                      }}</span
                    >
                  </li>
                </ul>
              </div>
            </div>

            <!-- Multiple Choice -->
            <div
              v-else-if="
                question.questionType === 'MULTIPLE_CHOICE_MULTIPLE_ANSWER'
              "
            >
              <div class="content-block">
                <h5 class="content-title">Prompt</h5>
                <p>
                  <strong>{{ question.content.prompt }}</strong>
                </p>
              </div>
              <div class="content-block">
                <h5 class="content-title">Options</h5>
                <ul class="answer-list">
                  <li
                    v-for="option in question.content.options"
                    :key="option.id"
                    :class="{
                      'is-correct': question.answer.correctOptionIds.includes(
                        option.id
                      ),
                    }"
                  >
                    <span class="icon">{{
                      question.answer.correctOptionIds.includes(option.id)
                        ? "✓"
                        : "✗"
                    }}</span>
                    <span>{{ option.text }}</span>
                  </li>
                </ul>
              </div>
            </div>

            <!-- Gap Filling -->
            <div v-else-if="question.questionType === 'GAP_FILLING'">
              <div class="content-block">
                <h5 class="content-title">Text with Answers</h5>
                <p class="gapped-text">
                  <template v-for="(part, index) in textParts" :key="index">
                    <span v-if="!part.startsWith('{{')">{{ part }}</span>
                    <span v-else class="gap-answer">
                      {{ question.answer[part.replace(/[{}]/g, "")] || "???" }}
                    </span>
                  </template>
                </p>
              </div>
            </div>

            <!-- Summary Completion -->
            <div v-else-if="question.questionType === 'SUMMARY_COMPLETION'">
              <div class="content-block">
                <h5 class="content-title">Summary with Answers</h5>
                <p class="gapped-text">
                  <template v-for="(part, index) in textParts" :key="index">
                    <span v-if="!part.startsWith('{{')">{{ part }}</span>
                    <span v-else class="gap-answer">
                      {{ question.answer[part.replace(/[{}]/g, "")] || "???" }}
                    </span>
                  </template>
                </p>
              </div>
            </div>

            <!-- Matching -->
            <div v-else-if="question.questionType === 'MATCHING'">
              <div class="content-block">
                <h5 class="content-title">Match Pairs</h5>
                <div class="matching-grid">
                  <div class="matching-column">
                    <h6>Prompts</h6>
                    <ul class="matching-list">
                      <li
                        v-for="prompt in question.content.prompts"
                        :key="prompt.id"
                      >
                        <span class="item-id">{{ prompt.id }}</span>
                        <span>{{ prompt.text }}</span>
                      </li>
                    </ul>
                  </div>
                  <div class="matching-column">
                    <h6>Options</h6>
                    <ul class="matching-list">
                      <li
                        v-for="option in question.content.options"
                        :key="option.id"
                      >
                        <span class="item-id">{{ option.id }}</span>
                        <span>{{ option.text }}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              <div class="content-block">
                <h5 class="content-title">Correct Matches</h5>
                <ul class="answer-list">
                  <li
                    v-for="prompt in question.content.prompts"
                    :key="prompt.id"
                  >
                    <span
                      ><strong>{{ prompt.text }}</strong></span
                    >
                    <span class="arrow">→</span>
                    <span>{{
                      findItemTextById(
                        question.content.options,
                        question.answer[prompt.id]
                      )
                    }}</span>
                  </li>
                </ul>
              </div>
            </div>

            <!-- Map Labeling -->
            <div v-else-if="question.questionType === 'MAP_LABELING'">
              <div class="content-block">
                <h5 class="content-title">Map Image</h5>
                <img
                  v-if="question.content.imageUrl"
                  :src="question.content.imageUrl"
                  alt="Map"
                  class="map-image"
                />
                <p v-else class="text-secondary">No map image provided.</p>
              </div>
              <div class="content-block">
                <h5 class="content-title">Available Labels</h5>
                <ul class="label-list">
                  <li v-for="label in question.content.labels" :key="label.id">
                    <span class="item-id">{{ label.id }}</span>
                    <span>{{ label.text }}</span>
                  </li>
                </ul>
              </div>
              <div class="content-block">
                <h5 class="content-title">Correct Label Positions</h5>
                <ul class="answer-list">
                  <li
                    v-for="(labelId, location) in question.answer"
                    :key="location"
                  >
                    <span
                      ><strong>Location {{ location }}</strong></span
                    >
                    <span class="arrow">→</span>
                    <span>{{
                      findItemTextById(question.content.labels, labelId)
                    }}</span>
                  </li>
                </ul>
              </div>
            </div>

            <!-- Writing Prompt -->
            <div v-else-if="question.questionType === 'WRITING_PROMPT'">
              <div class="content-block">
                <h5 class="content-title">
                  Task {{ question.content.taskType.split("_")[1] }} Prompt
                </h5>
                <p>{{ question.content.prompt }}</p>
                <img
                  v-if="question.content.imageUrl"
                  :src="question.content.imageUrl"
                  alt="Task Image"
                  class="map-image"
                />
              </div>
              <div class="alert alert-info">
                This is a writing task and has no pre-defined answer key.
              </div>
            </div>

            <!-- Fallback for any other type -->
            <div v-else class="content-block">
              <h5 class="content-title">Raw Content</h5>
              <pre>{{ question.content }}</pre>
              <h5 class="content-title mt-4">Raw Answer</h5>
              <pre>{{ question.answer }}</pre>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: var(--bg-overlay);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: var(--z-modal);
  padding: var(--space-6);
}
.modal-content {
  width: 100%;
  max-width: 700px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-body {
  overflow-y: auto;
}
.close-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--space-2);
  border-radius: var(--radius-full);
  color: var(--text-tertiary);
  transition: all var(--transition-fast);
}
.close-button:hover {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
}
.close-button svg {
  width: 20px;
  height: 20px;
}

/* --- UI-FRIENDLY CONTENT STYLES --- */
.content-block {
  margin-bottom: var(--space-6);
}
.content-block:last-child {
  margin-bottom: 0;
}
.content-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin-bottom: var(--space-3);
  border-bottom: 1px solid var(--border-primary);
  padding-bottom: var(--space-2);
}
.passage {
  background-color: var(--bg-secondary);
  padding: var(--space-4);
  border-radius: var(--radius-base);
}
.answer-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.answer-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-3) var(--space-4);
  background-color: var(--bg-secondary);
  border-radius: var(--radius-base);
}
.answer-list li.is-correct {
  background-color: var(--color-success-50);
  border-left: 3px solid var(--color-success-500);
}
.answer-list li .icon {
  font-weight: bold;
  margin-right: var(--space-3);
}
.answer-list li.is-correct .icon {
  color: var(--color-success-600);
}
.gapped-text {
  line-height: var(--leading-loose);
}
.gap-answer {
  display: inline-block;
  padding: var(--space-1) var(--space-2);
  margin: 0 var(--space-1);
  background-color: var(--color-primary-50);
  border: 1px solid var(--color-primary-200);
  border-radius: var(--radius-base);
  font-weight: var(--font-semibold);
  color: var(--color-primary-700);
}
.map-image {
  max-width: 100%;
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-base);
}
pre {
  background-color: var(--bg-secondary);
  padding: var(--space-4);
  border-radius: var(--radius-base);
  border: 1px solid var(--border-primary);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  white-space: pre-wrap;
  word-break: break-word;
}
.mt-4 {
  margin-top: var(--space-4);
}

/* Matching styles */
.matching-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-6);
  margin-bottom: var(--space-4);
}
.matching-column h6 {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  margin-bottom: var(--space-3);
  color: var(--text-secondary);
  text-transform: uppercase;
  font-size: var(--text-xs);
  letter-spacing: var(--tracking-wide);
}
.matching-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.matching-list li {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  background-color: var(--bg-secondary);
  border-radius: var(--radius-base);
}
.item-id {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 50px;
  padding: var(--space-1) var(--space-2);
  background: var(--color-primary-100);
  color: var(--color-primary-800);
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
  flex-shrink: 0;
}
.arrow {
  font-size: var(--text-lg);
  color: var(--color-primary-600);
  font-weight: var(--font-bold);
}

/* Label list styles */
.label-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--space-2);
}
.label-list li {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background-color: var(--bg-secondary);
  border-radius: var(--radius-base);
}

/* Modal Transitions */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity var(--transition-base);
}
.modal-fade-enter-active .modal-content,
.modal-fade-leave-active .modal-content {
  transition: transform var(--transition-base);
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
.modal-fade-enter-from .modal-content,
.modal-fade-leave-to .modal-content {
  transform: translateY(-20px);
}
</style>
