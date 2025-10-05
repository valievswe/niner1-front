<script setup>
import { ref, onMounted, computed, defineAsyncComponent } from "vue";
import { useRoute, RouterLink } from "vue-router";
import apiClient from "@/services/api";

const route = useRoute();
const template = ref(null);
const loading = ref(true);
const errorMessage = ref("");

// --- DYNAMIC COMPONENT MAPPING for TAKER components ---
const takerComponentMap = {
  TRUE_FALSE_NOT_GIVEN: defineAsyncComponent(() =>
    import("@/components/exam-taking/TrueFalseTaker.vue")
  ),
  MULTIPLE_CHOICE_MULTIPLE_ANSWER: defineAsyncComponent(() =>
    import("@/components/exam-taking/MultipleChoiceTaker.vue")
  ),
  GAP_FILLING: defineAsyncComponent(() =>
    import("@/components/exam-taking/GapFillTaker.vue")
  ),
  SUMMARY_COMPLETION: defineAsyncComponent(() =>
    import("@/components/exam-taking/GapFillTaker.vue")
  ),
  MATCHING: defineAsyncComponent(() =>
    import("@/components/exam-taking/MatchingTaker.vue")
  ),
  MAP_LABELING: defineAsyncComponent(() =>
    import("@/components/exam-taking/MapLabelingTaker.vue")
  ),
  WRITING_PROMPT: defineAsyncComponent(() =>
    import("@/components/exam-taking/WritingPromptTaker.vue")
  ),
  DEFAULT: defineAsyncComponent(() =>
    import("@/components/exam-taking/GenericTaker.vue")
  ),
};

const getTakerComponent = (questionType) => {
  return takerComponentMap[questionType] || takerComponentMap.DEFAULT;
};

// --- Computed properties to group questions by section ---
const listeningQuestions = computed(
  () =>
    template.value?.questions
      .filter((q) => q.question.section === "LISTENING")
      .sort((a, b) => a.order - b.order) || []
);
const readingQuestions = computed(
  () =>
    template.value?.questions
      .filter((q) => q.question.section === "READING")
      .sort((a, b) => a.order - b.order) || []
);
const writingQuestions = computed(
  () =>
    template.value?.questions
      .filter((q) => q.question.section === "WRITING")
      .sort((a, b) => a.order - b.order) || []
);

onMounted(async () => {
  try {
    const response = await apiClient.get(`/templates/${route.params.id}`);
    template.value = response.data;
  } catch (error) {
    errorMessage.value = "Failed to load template data.";
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="template-preview-container">
    <div v-if="!loading" class="page-header">
      <div class="header-content">
        <h1 class="page-title">{{ template?.title || "Template Preview" }}</h1>
        <p class="page-subtitle">
          {{
            template?.description ||
            "A preview of the exam as a student will see it."
          }}
        </p>
      </div>
      <RouterLink to="/admin/templates" class="btn btn-secondary btn-sm">
        &larr; Back to Templates
      </RouterLink>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="loader"></div>
      <p>Loading Template Preview...</p>
    </div>

    <div v-else-if="errorMessage" class="alert alert-error">
      <h4>Error Loading Preview</h4>
      <p>{{ errorMessage }}</p>
    </div>

    <div v-else-if="template" class="template-content">
      <!-- Listening Section -->
      <div v-if="listeningQuestions.length" class="card section-card">
        <div class="card-header section-header listening">
          <div class="section-icon">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M3 15v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4" />
              <polyline points="17 9 12 14 7 9" />
            </svg>
          </div>
          <h4 class="card-title">Listening Section</h4>
        </div>
        <div class="card-body">
          <div v-if="template.audioFiles?.listening" class="audio-preview">
            <h5 class="content-title">Audio Passage</h5>
            <audio
              controls
              :src="template.audioFiles.listening"
              class="audio-element"
            >
              Your browser does not support the audio element.
            </audio>
          </div>
          <div v-else class="alert alert-info">
            <strong>No audio file provided.</strong> Students will not hear any
            audio for this section.
          </div>

          <div
            v-for="(item, index) in listeningQuestions"
            :key="item.question.id"
            class="question-preview"
          >
            <span class="question-badge">Q{{ index + 1 }}</span>
            <component
              :is="getTakerComponent(item.question.questionType)"
              :question="item.question"
              disabled
            />
          </div>
        </div>
      </div>

      <!-- Reading Section -->
      <div v-if="readingQuestions.length" class="card section-card">
        <div class="card-header section-header reading">
          <div class="section-icon">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"
              />
            </svg>
          </div>
          <h4 class="card-title">Reading Section</h4>
        </div>
        <div class="card-body">
          <div
            v-for="(item, index) in readingQuestions"
            :key="item.question.id"
            class="question-preview"
          >
            <span class="question-badge">Q{{ index + 1 }}</span>
            <component
              :is="getTakerComponent(item.question.questionType)"
              :question="item.question"
              disabled
            />
          </div>
        </div>
      </div>

      <!-- Writing Section -->
      <div v-if="writingQuestions.length" class="card section-card">
        <div class="card-header section-header writing">
          <div class="section-icon">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            </svg>
          </div>
          <h4 class="card-title">Writing Section</h4>
        </div>
        <div class="card-body">
          <div
            v-for="(item, index) in writingQuestions"
            :key="item.question.id"
            class="question-preview writing-task"
          >
            <span class="question-badge">Task {{ index + 1 }}</span>
            <component
              :is="getTakerComponent(item.question.questionType)"
              :question="item.question"
              disabled
            />
          </div>
        </div>
      </div>

      <div
        v-if="
          !listeningQuestions.length &&
          !readingQuestions.length &&
          !writingQuestions.length
        "
        class="empty-state"
      >
        <p>This template contains no questions.</p>
        <p class="text-secondary">
          Add questions in the template editor to preview them here.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.template-preview-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-6);
}

/* Page Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin: var(--space-8) 0;
  gap: var(--space-6);
}
.header-content {
  flex: 1;
}
.page-title {
  font-size: var(--text-3xl);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--space-2) 0;
}
.page-subtitle {
  font-size: var(--text-base);
  color: var(--text-secondary);
  margin: 0;
}

/* Section Cards */
.section-card {
  border-left: 4px solid var(--color-gray-300);
}
.listening {
  border-left-color: var(--color-primary-600);
}
.reading {
  border-left-color: var(--color-success-600);
}
.writing {
  border-left-color: var(--color-warning-600);
}

.section-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
}
.section-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  color: var(--text-secondary);
}
.listening .section-icon {
  background: var(--color-primary-50);
  color: var(--color-primary-700);
}
.reading .section-icon {
  background: var(--color-success-50);
  color: var(--color-success-700);
}
.writing .section-icon {
  background: var(--color-warning-50);
  color: var(--color-warning-700);
}

.card-title {
  font-size: var(--text-xl);
  margin: 0;
}

/* Audio Preview */
.audio-preview {
  margin-bottom: var(--space-6);
}
.content-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  margin: 0 0 var(--space-3) 0;
  color: var(--text-primary);
}
.audio-element {
  width: 100%;
  padding: var(--space-2) 0;
}

/* Question Preview */
.question-preview {
  position: relative;
  padding: var(--space-5) var(--space-5) var(--space-5) var(--space-12);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-base);
  background: var(--bg-primary);
  margin-bottom: var(--space-5);
}
.question-badge {
  position: absolute;
  left: var(--space-5);
  top: var(--space-5);
  display: flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
  height: 28px;
  padding: var(--space-2);
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
  color: white;
  background: var(--color-gray-600);
  border-radius: var(--radius-full);
  letter-spacing: var(--tracking-wide);
}
.listening .question-badge {
  background: var(--color-primary-600);
}
.reading .question-badge {
  background: var(--color-success-600);
}
.writing .question-badge {
  background: var(--color-warning-600);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: var(--space-12) 0;
  color: var(--text-secondary);
}
.empty-state p {
  margin: var(--space-2) 0;
}

/* Loading & Alerts */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: var(--space-4);
  color: var(--text-secondary);
}
.loader {
  border: 3px solid var(--color-gray-200);
  border-top: 3px solid var(--color-primary-600);
  border-radius: 50%;
  width: 48px;
  height: 48px;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .template-preview-container {
    padding: 0 var(--space-4);
  }
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }
  .question-preview {
    padding-left: var(--space-10);
  }
  .question-badge {
    left: var(--space-4);
  }
}
</style>
