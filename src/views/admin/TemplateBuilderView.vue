<!-- src/views/admin/TemplateBuilderView.vue -->
<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import apiClient from "@/services/api";
import SectionBuilder from "@/components/template-builder/SectionBuilder.vue";

// --- STATE ---
const router = useRouter();

// Template details
const title = ref("");
const description = ref("");
const durations = ref({
  listening: 30,
  reading: 60,
  writing: 60,
});
const listeningAudioUrl = ref("");

// Refs for each of our SectionBuilder component instances
const listeningSectionRef = ref(null);
const readingSectionRef = ref(null);
const writingSectionRef = ref(null);

// UI state
const activeTab = ref("LISTENING");
const errorMessage = ref("");
const successMessage = ref("");

// --- METHODS ---
async function saveTemplate() {
  errorMessage.value = "";
  successMessage.value = "";

  // 1. Gather selected questions from each section component's exposed state
  const listeningQuestions = listeningSectionRef.value?.selectedQuestions || [];
  const readingQuestions = readingSectionRef.value?.selectedQuestions || [];
  const writingQuestions = writingSectionRef.value?.selectedQuestions || [];

  // 2. Combine them into a single list in the correct order
  const combinedQuestions = [
    ...listeningQuestions,
    ...readingQuestions,
    ...writingQuestions,
  ];

  if (!title.value || combinedQuestions.length === 0) {
    errorMessage.value = "Title and at least one question are required.";
    return;
  }

  // 3. Calculate the final order and format the payload for the API
  const questionsPayload = combinedQuestions.map((question, index) => ({
    questionId: question.id,
    order: index + 1,
  }));

  // 4. Prepare the audioFiles payload
  const audioFilesPayload = {};
  if (listeningAudioUrl.value.trim()) {
    audioFilesPayload.listening = listeningAudioUrl.value.trim();
  }

  try {
    // 5. Send the complete, structured payload to the backend
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

    successMessage.value = "Template created successfully!";
    setTimeout(() => router.push("/admin/templates"), 1500);
  } catch (error) {
    errorMessage.value = "Failed to save template.";
    console.error(error);
  }
}
</script>

<template>
  <div>
    <h1>Admin: Template Builder</h1>

    <div class.form-container>
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

    <!-- Tab Navigation -->
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

    <!-- Tab Content -->
    <div class="tab-content">
      <!-- The v-show directive is efficient for tabs, as it keeps the component alive -->
      <div v-show="activeTab === 'LISTENING'">
        <div class="form-group section-specific-field">
          <label for="listeningAudioUrl">Listening Section Audio URL</label>
          <input
            type="text"
            id="listeningAudioUrl"
            v-model="listeningAudioUrl"
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

    <div class="actions">
      <button @click="saveTemplate">Save Template</button>
      <p v-if="successMessage" class="success-message">{{ successMessage }}</p>
      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
    </div>
  </div>
</template>

<style scoped>
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
  border-radius: 4px 4px 0 0;
}
.tabs button.active {
  background-color: #fff;
  border-bottom: 1px solid #fff;
  margin-bottom: -1px;
}
.tab-content {
  border: 1px solid #ccc;
  padding: 10px;
  border-top: 1px solid #ccc;
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
  border-radius: 4px;
  margin-bottom: 20px;
}
.section-specific-field label {
  font-weight: bold;
}
</style>
