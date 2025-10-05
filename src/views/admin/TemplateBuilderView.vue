<script setup>
// The script is well-designed and remains unchanged.
import { ref } from "vue";
import { useRouter } from "vue-router";
import apiClient from "@/services/api";
import SectionBuilder from "@/components/template-builder/SectionBuilder.vue";

const router = useRouter();
const title = ref("");
const description = ref("");
const durations = ref({ listening: 30, reading: 60, writing: 60 });
const listeningAudioUrl = ref("");
const listeningSectionRef = ref(null);
const readingSectionRef = ref(null);
const writingSectionRef = ref(null);
const activeTab = ref("LISTENING");
const errorMessage = ref("");
const successMessage = ref("");

async function saveTemplate() {
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

  if (!title.value || combinedQuestions.length === 0) {
    errorMessage.value = "Title and at least one question are required.";
    return;
  }

  const questionsPayload = combinedQuestions.map((q, i) => ({
    questionId: q.id,
    order: i + 1,
  }));
  const audioFilesPayload = {};
  if (listeningAudioUrl.value.trim()) {
    audioFilesPayload.listening = listeningAudioUrl.value.trim();
  }

  try {
    await apiClient.post("/templates", {
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
    successMessage.value = "Template created successfully! Redirecting...";
    setTimeout(() => router.push("/admin/templates"), 1500);
  } catch (error) {
    errorMessage.value = "Failed to save template.";
  }
}
</script>

<template>
  <div class="template-builder-container">
    <div class="page-header">
      <h1>Template Builder</h1>
      <p class="text-secondary">
        Create a new mock exam template by selecting questions for each section.
      </p>
    </div>

    <!-- Card for Template Details -->
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
            placeholder="e.g., Official Cambridge Guide - Test 1"
          />
        </div>
        <div class="form-group">
          <label for="description" class="form-label">Description</label>
          <input
            type="text"
            id="description"
            v-model="description"
            class="form-input"
            placeholder="A short description of this template"
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

    <!-- Main Card for the Section Builder with Tabs -->
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
          <SectionBuilder section="LISTENING" ref="listeningSectionRef" />
        </div>
        <div v-show="activeTab === 'READING'">
          <SectionBuilder section="READING" ref="readingSectionRef" />
        </div>
        <div v-show="activeTab === 'WRITING'">
          <SectionBuilder section="WRITING" ref="writingSectionRef" />
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
      <button @click="saveTemplate" class="btn btn-primary btn-lg">
        Save Template
      </button>
    </div>
  </div>
</template>

<style scoped>
.template-builder-container {
  /* Add padding at the bottom to make space for the floating footer */
  padding-bottom: 120px;
}
.page-header {
  margin-bottom: var(--space-8);
}
.detail-card {
  margin-bottom: var(--space-6);
}

/* Details Card Layout */
.durations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--space-5);
}

/* Tab Styles */
.builder-card {
  padding: 0; /* Remove default card padding to make tabs flush */
}
.tab-header {
  display: flex;
  gap: var(--space-1);
  background-color: transparent; /* Override card-header background */
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
  margin-bottom: -2px; /* Pulls the button down to overlap the border */
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

/* Section Specific Fields */
.section-specific-field {
  padding: var(--space-4);
  background-color: var(--color-primary-50);
  border: 1px solid var(--color-primary-200);
  border-radius: var(--radius-base);
  margin-bottom: var(--space-6);
}

/* Floating Save Bar */
.floating-footer {
  position: fixed;
  bottom: 0;
  left: var(--w-sidebar); /* Aligns with the sidebar */
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
  transition: left var(--transition-base); /* For sidebar collapse */
}
/* Adjust when sidebar is collapsed */
:global(.is-collapsed) .floating-footer {
  left: var(--w-sidebar-collapsed);
}
.message-area {
  flex-grow: 1;
}
.message-area .alert {
  margin: 0;
}
</style>
