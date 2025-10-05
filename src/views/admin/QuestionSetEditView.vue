<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter, RouterLink } from "vue-router";
import apiClient from "@/services/api";

const route = useRoute();
const router = useRouter();
const setId = route.params.id;

// The script logic is correct and remains unchanged.
const setData = ref({
  name: "",
  description: "",
  passage: "",
});
const section = ref("");
const loading = ref(true);
const successMessage = ref("");
const errorMessage = ref("");

onMounted(async () => {
  try {
    const response = await apiClient.get(`/question-sets/${setId}`);
    if (response.data) {
      const set = response.data;
      setData.value = {
        name: set.name,
        description: set.description,
        passage: set.passage,
      };
      section.value = set.section;
    } else {
      errorMessage.value = "Question set not found.";
    }
  } catch (error) {
    errorMessage.value = "Failed to load question set data.";
  } finally {
    loading.value = false;
  }
});

async function updateSet() {
  errorMessage.value = "";
  successMessage.value = "";
  try {
    await apiClient.put(`/question-sets/${setId}`, setData.value);
    successMessage.value = "Set updated successfully! Redirecting...";
    setTimeout(() => router.push("/admin/question-sets"), 1500);
  } catch (error) {
    errorMessage.value = "Failed to update set.";
  }
}
</script>

<template>
  <div class="edit-set-container">
    <div class="page-header">
      <h1>Edit Question Set</h1>
      <RouterLink to="/admin/question-sets" class="btn btn-secondary">
        &larr; Back to Question Set List
      </RouterLink>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="loader"></div>
      <p>Loading Set Information...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="errorMessage && !section" class="alert alert-error">
      <h4>Error Loading Data</h4>
      <p>{{ errorMessage }}</p>
    </div>

    <!-- Main Form -->
    <form v-else @submit.prevent="updateSet" class="card">
      <div class="card-body">
        <div class="info-banner">
          <p><strong>Section:</strong> {{ section }} (Cannot be changed)</p>
        </div>

        <div class="form-group">
          <label for="setName" class="form-label">Set Name</label>
          <input
            type="text"
            id="setName"
            v-model="setData.name"
            class="form-input"
            required
          />
        </div>

        <div class="form-group">
          <label for="setDescription" class="form-label">Description</label>
          <input
            type="text"
            id="setDescription"
            v-model="setData.description"
            class="form-input"
          />
        </div>

        <div v-if="section === 'READING'" class="form-group">
          <label for="setPassage" class="form-label">Reading Passage</label>
          <textarea
            id="setPassage"
            v-model="setData.passage"
            class="form-textarea"
            rows="10"
          ></textarea>
        </div>
      </div>

      <div class="card-footer">
        <div v-if="successMessage" class="alert alert-success">
          {{ successMessage }}
        </div>
        <div v-if="errorMessage" class="alert alert-error">
          {{ errorMessage }}
        </div>
        <button type="submit" class="btn btn-primary btn-lg">Update Set</button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.edit-set-container {
  max-width: 800px;
  margin: 0 auto;
}
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
/* All form and card styles are handled by global CSS */
.info-banner {
  background-color: var(--bg-secondary);
  padding: var(--space-4);
  border-radius: var(--radius-base);
  border: 1px solid var(--border-primary);
  margin-bottom: var(--space-6);
  text-align: center;
}
.info-banner p {
  margin: 0;
  color: var(--text-secondary);
}
.card-footer {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.card-footer .btn {
  align-self: flex-end; /* Pushes button to the right */
}
</style>
