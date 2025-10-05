<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute, RouterLink } from "vue-router";
import apiClient from "@/services/api";

const route = useRoute();
const question = ref(null);
const loading = ref(true);
const errorMessage = ref("");

// Helper computed property to easily find an option/label text by its ID
const findItemTextById = (itemList, id) => {
  if (!itemList || !id) return "N/A";
  const item = itemList.find((i) => i.id === id);
  return item ? item.text : "Invalid ID";
};

// Helper for Gap Filling display
const textParts = computed(() => {
  if (
    question.value?.questionType === "GAP_FILLING" &&
    question.value.content.textWithGaps
  ) {
    return question.value.content.textWithGaps
      .split(/({{\d+}})/g)
      .filter(Boolean);
  }
  return [];
});

onMounted(async () => {
  try {
    const questionId = route.params.id;
    const response = await apiClient.get(`/questions/${questionId}`);
    question.value = response.data;
  } catch (error) {
    errorMessage.value =
      "Failed to load question data. The question may not exist.";
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="question-detail-container">
    <div class="page-header">
      <h1>Question Details</h1>
      <RouterLink to="/admin/questions" class="btn btn-secondary">
        &larr; Back to Question List
      </RouterLink>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="loader"></div>
      <p>Loading Question...</p>
    </div>
    <div v-else-if="errorMessage" class="alert alert-error">
      <h4>Error</h4>
      <p>{{ errorMessage }}</p>
    </div>

    <div v-else-if="question" class="details-view">
      <!-- Top Level Info Card -->
      <div class="card">
        <div class="card-body">
          <div class="details-grid">
            <div class="detail-item">
              <span class="detail-label">Question ID</span>
              <p class="detail-value mono">{{ question.id }}</p>
            </div>
            <div class="detail-item">
              <span class="detail-label">Section</span>
              <p class="detail-value">
                <span class="badge badge-primary">{{ question.section }}</span>
              </p>
            </div>
            <div class="detail-item">
              <span class="detail-label">Question Type</span>
              <p class="detail-value">
                {{ question.questionType.replace(/_/g, " ") }}
              </p>
            </div>
            <div class="detail-item">
              <span class="detail-label">Part / Passage</span>
              <p class="detail-value">{{ question.partNumber }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Content & Answer Card -->
      <div class="card">
        <div class="card-header">
          <h4 class="card-title">Content & Answer Key</h4>
        </div>
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
                      'badge-success': question.answer[statement.id] === 'TRUE',
                      'badge-error': question.answer[statement.id] === 'FALSE',
                      'badge-warning':
                        question.answer[statement.id] === 'NOT_GIVEN',
                    }"
                    >{{ question.answer[statement.id].replace("_", " ") }}</span
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

          <!-- Matching -->
          <div v-else-if="question.questionType === 'MATCHING'">
            <div class="matching-grid">
              <div class="content-block">
                <h5 class="content-title">Prompts</h5>
                <ul class="item-list">
                  <li
                    v-for="prompt in question.content.prompts"
                    :key="prompt.id"
                  >
                    <strong>{{ prompt.id }}:</strong> {{ prompt.text }}
                  </li>
                </ul>
              </div>
              <div class="content-block">
                <h5 class="content-title">Options</h5>
                <ul class="item-list">
                  <li
                    v-for="option in question.content.options"
                    :key="option.id"
                  >
                    <strong>{{ option.id }}:</strong> {{ option.text }}
                  </li>
                </ul>
              </div>
            </div>
            <div class="content-block">
              <h5 class="content-title">Answer Key</h5>
              <ul class="answer-list">
                <li v-for="prompt in question.content.prompts" :key="prompt.id">
                  <span>{{ prompt.text }}</span>
                  <span class="arrow">&rarr;</span>
                  <strong>{{
                    findItemTextById(
                      question.content.options,
                      question.answer[prompt.id]
                    )
                  }}</strong>
                </li>
              </ul>
            </div>
          </div>

          <!-- Map Labeling -->
          <div v-else-if="question.questionType === 'MAP_LABELING'">
            <div class="content-block">
              <h5 class="content-title">Map Image</h5>
              <img
                :src="question.content.imageUrl"
                alt="Map Image"
                class="map-image"
              />
            </div>
            <div class="content-block">
              <h5 class="content-title">Answer Key</h5>
              <ul class="answer-list">
                <li
                  v-for="(labelId, location) in question.answer"
                  :key="location"
                >
                  <span
                    >Location <strong>{{ location }}</strong> on map is</span
                  >
                  <span class="arrow">&rarr;</span>
                  <strong>{{
                    findItemTextById(question.content.labels, labelId)
                  }}</strong>
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
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* General Layout */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-8);
}
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  min-height: 40vh;
  color: var(--text-secondary);
}
.details-view {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

/* Top Info Card */
.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-5);
}
.detail-label {
  display: block;
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-secondary);
  margin-bottom: var(--space-2);
}
.detail-value {
  font-size: var(--text-base);
  color: var(--text-primary);
}
.detail-value.mono {
  font-family: var(--font-mono);
}

/* Content & Answer Card */
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

/* User-Friendly Lists */
.answer-list,
.item-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.answer-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-3) var(--space-4);
  background-color: var(--bg-secondary);
  border-radius: var(--radius-base);
}
.item-list li {
  padding: var(--space-2) 0;
}
.arrow {
  color: var(--text-tertiary);
}

/* Multiple Choice Specific */
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

/* Gap Filling Specific */
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

/* Matching Specific */
.matching-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-6);
}
@media (min-width: 768px) {
  .matching-grid {
    grid-template-columns: 1fr 1fr;
  }
}

/* Map/Writing Image */
.map-image {
  max-width: 100%;
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-base);
}
</style>
