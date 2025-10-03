<!-- src/views/admin/TemplateEditView.vue -->
<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import apiClient from "@/services/api";
import SectionBuilder from "@/components/template-builder/SectionBuilder.vue";

// --- STATE ---
const route = useRoute();
const router = useRouter();
const templateId = route.params.id;

const allQuestions = ref([]);
const initialTemplateData = ref(null); // Store the original template data

// Form state - pre-filled from initialTemplateData
const title = ref("");
const description = ref("");
const durations = ref({ listening: 0, reading: 0, writing: 0 });
const listeningAudioUrl = ref("");

// Refs for each section builder component
const listeningSectionRef = ref(null);
const readingSectionRef = ref(null);
const writingSectionRef = ref(null);

// UI state
const activeTab = ref("LISTENING");
const loading = ref(true);
const errorMessage = ref("");
const successMessage = ref("");

// --- COMPUTED PROPERTIES to filter questions for each section ---
const initialListeningQuestions = computed(() => {
  if (!initialTemplateData.value) return [];
  return initialTemplateData.value.questions
    .filter((q) => q.question.section === "LISTENING")
    .map((q) => q.question);
});
const initialReadingQuestions = computed(() => {
  if (!initialTemplateData.value) return [];
  return initialTemplateData.value.questions
    .filter((q) => q.question.section === "READING")
    .map((q) => q.question);
});
const initialWritingQuestions = computed(() => {
  if (!initialTemplateData.value) return [];
  return initialTemplateData.value.questions
    .filter((q) => q.question.section === "WRITING")
    .map((q) => q.question);
});

// --- LIFECYCLE HOOK ---
onMounted(async () => {
  try {
    const [questionsRes, templateRes] = await Promise.all([
      apiClient.get("/questions"),
      apiClient.get(`/templates/${templateId}`),
    ]);

    allQuestions.value = questionsRes.data;
    const template = templateRes.data;
    initialTemplateData.value = template; // Store the original data

    // Pre-populate the form with the fetched data
    title.value = template.title;
    description.value = template.description || "";
    if (template.sectionDurations) durations.value = template.sectionDurations;
    if (template.audioFiles)
      listeningAudioUrl.value = template.audioFiles.listening || "";
  } catch (error) {
    errorMessage.value = "Failed to load data for editing.";
    console.error(error);
  } finally {
    loading.value = false;
  }
});

// --- METHODS ---
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
    // Call the PUT endpoint with the updated data
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

    successMessage.value = "Template updated successfully!";
    setTimeout(() => router.push("/admin/templates"), 1500);
  } catch (error) {
    errorMessage.value = "Failed to update template.";
    console.error(error);
  }
}
</script>

<template>
  <div>
    <h1>Admin: Edit Template</h1>

    <div v-if="loading">Loading Editor...</div>
    <div v-else-if="errorMessage" class="error-message">{{ errorMessage }}</div>

    <div v-else>
      <!-- The template structure is identical to TemplateBuilderView.vue -->
      <div class="form-container">
        <div class="form-group">
          <label for="title">Template Title</label>
          <input type="text" id="title" v-model="title" required />
        </div>
        <div class="form-group">
          <label for="description">Description</label>
          <input type="text" id="description" v-model="description" />
        </div>
        <div class="durations-group">
          <div class="form-group">
            <label for="duration-listening">Listening Duration (mins)</label>
            <input
              type="number"
              id="duration-listening"
              v-model="durations.listening"
            />
          </div>
          <div class="form-group">
            <label for="duration-reading">Reading Duration (mins)</label>
            <input
              type="number"
              id="duration-reading"
              v-model="durations.reading"
            />
          </div>
          <div class="form-group">
            <label for="duration-writing">Writing Duration (mins)</label>
            <input
              type="number"
              id="duration-writing"
              v-model="durations.writing"
            />
          </div>
        </div>
      </div>

      <div class="tabs">
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

      <div class="tab-content">
        <div v-show="activeTab === 'LISTENING'">
          <div class="form-group section-specific-field">
            <label for="listeningAudioUrl">Listening Section Audio URL</label>
            <input
              type="text"
              id="listeningAudioUrl"
              v-model="listeningAudioUrl"
            />
          </div>
          <SectionBuilder
            section="LISTENING"
            :all-questions="allQuestions"
            :initial-selected-questions="initialListeningQuestions"
            ref="listeningSectionRef"
          />
        </div>
        <div v-show="activeTab === 'READING'">
          <SectionBuilder
            section="READING"
            :all-questions="allQuestions"
            :initial-selected-questions="initialReadingQuestions"
            ref="readingSectionRef"
          />
        </div>
        <div v-show="activeTab === 'WRITING'">
          <SectionBuilder
            section="WRITING"
            :all-questions="allQuestions"
            :initial-selected-questions="initialWritingQuestions"
            ref="writingSectionRef"
          />
        </div>
      </div>

      <div class="actions">
        <button @click="updateTemplate">Save Changes</button>
        <p v-if="successMessage" class="success-message">
          {{ successMessage }}
        </p>
        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Styles can be identical to TemplateBuilderView.vue */
.form-container {
  margin-bottom: 20px;
}
.form-group {
  margin-bottom: 10px;
}
.durations-group {
  display: flex;
  gap: 20px;
}
.tabs {
  margin-bottom: 10px;
}
.tabs button {
  padding: 10px 15px;
  border: 1px solid #ccc;
  background-color: #f0f0f0;
  cursor: pointer;
}
.tabs button.active {
  background-color: #fff;
  border-bottom: 1px solid #fff;
}
.tab-content {
  border: 1px solid #ccc;
  padding: 10px;
  border-top: none;
}
.actions {
  margin-top: 20px;
}
.success-message {
  color: green;
}
.error-message {
  color: red;
}
.section-specific-field {
  padding: 15px;
  background-color: #f0f8ff;
  border: 1px solid #cce5ff;
}
</style>
