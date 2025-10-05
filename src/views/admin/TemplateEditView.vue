<script setup>
// The script is well-designed and remains unchanged.
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter, RouterLink } from "vue-router";
import apiClient from "@/services/api";
import SectionBuilder from "@/components/template-builder/SectionBuilder.vue";

const route = useRoute();
const router = useRouter();
const templateId = route.params.id;
const initialTemplateData = ref(null);
const title = ref("");
const description = ref("");
const durations = ref({ listening: 30, reading: 60, writing: 60 });
const listeningAudioUrl = ref("");
const listeningSectionRef = ref(null);
const readingSectionRef = ref(null);
const writingSectionRef = ref(null);
const activeTab = ref("LISTENING");
const loading = ref(true);
const errorMessage = ref("");
const successMessage = ref("");

const initialListeningQuestions = computed(
  () =>
    initialTemplateData.value?.questions
      .filter((q) => q.question.section === "LISTENING")
      .map((q) => q.question) || []
);
const initialReadingQuestions = computed(
  () =>
    initialTemplateData.value?.questions
      .filter((q) => q.question.section === "READING")
      .map((q) => q.question) || []
);
const initialWritingQuestions = computed(
  () =>
    initialTemplateData.value?.questions
      .filter((q) => q.question.section === "WRITING")
      .map((q) => q.question) || []
);

onMounted(async () => {
  try {
    const templateRes = await apiClient.get(`/templates/${templateId}`);
    const template = templateRes.data;
    initialTemplateData.value = template;
    title.value = template.title;
    description.value = template.description || "";
    if (template.sectionDurations) durations.value = template.sectionDurations;
    if (template.audioFiles)
      listeningAudioUrl.value = template.audioFiles.listening || "";
  } catch (error) {
    errorMessage.value = "Failed to load template data for editing.";
  } finally {
    loading.value = false;
  }
});

async function updateTemplate() {
  errorMessage.value = "";
  successMessage.value = "";
  const listeningQuestions = listeningSectionRef.value?.selectedQuestions || [];
  const readingQuestions = readingSectionRef.value?.selectedQuestions || [];
  const writingQuestions = writingSectionRef.value?.selectedQuestions || [];
  const combinedQuestions = [
    ...listeningQuestions,
    ...readingQuestions,
    ...writingQuestions,
  ];
  const questionsPayload = combinedQuestions.map((q, i) => ({
    questionId: q.id,
    order: i + 1,
  }));
  const audioFilesPayload = {};
  if (listeningAudioUrl.value.trim())
    audioFilesPayload.listening = listeningAudioUrl.value.trim();

  try {
    await apiClient.put(`/templates/${templateId}`, {
      title: title.value,
      description: description.value,
      sectionDurations: {
        listening: parseInt(durations.value.listening, 10),
        reading: parseInt(durations.value.reading, 10),
        writing: parseInt(durations.value.writing, 10),
      },
      audioFiles: audioFilesPayload,
      questions: questionsPayload,
    });
    successMessage.value = "Template updated successfully! Redirecting...";
    setTimeout(() => router.push("/admin/templates"), 1500);
  } catch (error) {
    errorMessage.value = "Failed to update template.";
  }
}
</script>

<template>
  <div class="template-builder-container">
    <div class="page-header">
      <div>
        <h1>Edit Template</h1>
        <p class="text-secondary">
          Modify the details and question composition of this exam template.
        </p>
      </div>
      <RouterLink to="/admin/templates" class="btn btn-secondary">
        &larr; Back to Template List
      </RouterLink>
    </div>

    <!-- Loading and Error States -->
    <div v-if="loading" class="loading-state">
      <div class="loader"></div>
      <p>Loading Template Editor...</p>
    </div>
    <div
      v-else-if="errorMessage && !initialTemplateData"
      class="alert alert-error"
    >
      <h4>Error Loading Template</h4>
      <p>{{ errorMessage }}</p>
    </div>

    <!-- Main Builder Content (only shows after data is loaded) -->
    <div v-else>
      <div class="card detail-card">
        <div class="card-body">
          <div class="form-group">
            <label for="title" class="form-label">Template Title *</label>
            <input
              type="text"
              id="title"
              v-model="title"
              class="form-input"
              required
            />
          </div>
          <div class="form-group">
            <label for="description" class="form-label">Description</label>
            <input
              type="text"
              id="description"
              v-model="description"
              class="form-input"
            />
          </div>
          <div class="durations-grid">
            <div class="form-group">
              <label for="duration-listening" class="form-label"
                >Listening (mins)</label
              >
              <input
                type="number"
                id="duration-listening"
                v-model="durations.listening"
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label for="duration-reading" class="form-label"
                >Reading (mins)</label
              >
              <input
                type="number"
                id="duration-reading"
                v-model="durations.reading"
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label for="duration-writing" class="form-label"
                >Writing (mins)</label
              >
              <input
                type="number"
                id="duration-writing"
                v-model="durations.writing"
                class="form-input"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="card builder-card">
        <div class="card-header tab-header">
          <button
            @click="activeTab = 'LISTENING'"
            :class="{ active: activeTab === 'LISTENING' }"
          >
            Listening
          </button>
          <button
            @click="activeTab = 'READING'"
            :class="{ active: activeTab === 'READING' }"
          >
            Reading
          </button>
          <button
            @click="activeTab = 'WRITING'"
            :class="{ active: activeTab === 'WRITING' }"
          >
            Writing
          </button>
        </div>
        <div class="card-body tab-content">
          <div v-show="activeTab === 'LISTENING'">
            <div class="form-group section-specific-field">
              <label for="listeningAudioUrl" class="form-label"
                >Listening Section Audio URL</label
              >
              <input
                type="text"
                id="listeningAudioUrl"
                v-model="listeningAudioUrl"
                class="form-input"
                placeholder="https://.../audio.mp3"
              />
            </div>
            <SectionBuilder
              section="LISTENING"
              :initial-selected-questions="initialListeningQuestions"
              ref="listeningSectionRef"
            />
          </div>
          <div v-show="activeTab === 'READING'">
            <SectionBuilder
              section="READING"
              :initial-selected-questions="initialReadingQuestions"
              ref="readingSectionRef"
            />
          </div>
          <div v-show="activeTab === 'WRITING'">
            <SectionBuilder
              section="WRITING"
              :initial-selected-questions="initialWritingQuestions"
              ref="writingSectionRef"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Floating Save Bar -->
    <div class="floating-footer">
      <div class="message-area">
        <div v-if="successMessage" class="alert alert-success">
          {{ successMessage }}
        </div>
        <div v-if="errorMessage" class="alert alert-error">
          {{ errorMessage }}
        </div>
      </div>
      <button @click="updateTemplate" class="btn btn-primary btn-lg">
        Save Changes
      </button>
    </div>
  </div>
</template>

<style scoped>
/* These styles are identical to the TemplateBuilderView for consistency */
.template-builder-container {
  padding-bottom: 120px;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-8);
}
.detail-card {
  margin-bottom: var(--space-6);
}
.durations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--space-5);
}
.builder-card {
  padding: 0;
}
.tab-header {
  display: flex;
  gap: var(--space-1);
  background-color: transparent;
  padding: var(--space-4) var(--space-6) 0 var(--space-6);
  border-bottom: 2px solid var(--border-primary);
}
.tab-header button {
  padding: var(--space-3) var(--space-5);
  border: 2px solid transparent;
  border-bottom: none;
  background-color: transparent;
  cursor: pointer;
  font-size: var(--text-lg);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
  border-radius: var(--radius-base) var(--radius-base) 0 0;
  margin-bottom: -2px;
  transition: all var(--transition-fast);
}
.tab-header button:hover {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
}
.tab-header button.active {
  background-color: var(--bg-primary);
  border-color: var(--border-primary);
  font-weight: var(--font-semibold);
  color: var(--color-primary-600);
}
.tab-content {
  padding: var(--space-6);
}
.section-specific-field {
  padding: var(--space-4);
  background-color: var(--color-primary-50);
  border: 1px solid var(--color-primary-200);
  border-radius: var(--radius-base);
  margin-bottom: var(--space-6);
}

.floating-footer {
  position: fixed;
  bottom: 0;
  left: var(--w-sidebar);
  right: 0;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: var(--space-5);
  padding: var(--space-4) var(--space-8);
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
  border-top: 1px solid var(--border-primary);
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.05);
  z-index: var(--z-sticky);
  transition: left var(--transition-base);
}
:global(.is-collapsed) .floating-footer {
  left: var(--w-sidebar-collapsed);
}
.message-area {
  flex-grow: 1;
}
.message-area .alert {
  margin: 0;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  min-height: 60vh;
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
</style>
