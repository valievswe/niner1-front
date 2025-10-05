<script setup>
// The script is well-structured and has been preserved without changes.
import { ref, onMounted, computed } from "vue";
import { RouterLink } from "vue-router";
import apiClient from "@/services/api";
import ConfirmationModal from "@/components/confirmation/ConfirmationModal.vue";

const sets = ref([]);
const newSet = ref({
  name: "",
  description: "",
  section: "READING",
  passages: [{ partNumber: 1, text: "" }],
});
const loading = ref(true);
const errorMessage = ref("");
const successMessage = ref("");
const isModalVisible = ref(false);
const setToDelete = ref(null);
const isReadingSection = computed(() => newSet.value.section === "READING");

onMounted(async () => {
  try {
    const response = await apiClient.get("/question-sets");
    sets.value = response.data;
  } catch (error) {
    errorMessage.value = "Failed to load question sets.";
    console.error(error);
  } finally {
    loading.value = false;
  }
});

function addPassage() {
  const nextPart =
    newSet.value.passages.length > 0
      ? Math.max(...newSet.value.passages.map((p) => p.partNumber)) + 1
      : 1;
  newSet.value.passages.push({ partNumber: nextPart, text: "" });
}
function removePassage(index) {
  if (newSet.value.passages.length > 1) {
    newSet.value.passages.splice(index, 1);
  }
}

async function createSet() {
  errorMessage.value = "";
  successMessage.value = "";
  if (!newSet.value.name || !newSet.value.section) {
    errorMessage.value = "Set Name and Section are required.";
    return;
  }
  const payload = {
    name: newSet.value.name,
    description: newSet.value.description,
    section: newSet.value.section,
  };
  if (isReadingSection.value) {
    payload.passages = newSet.value.passages.filter((p) => p.text.trim());
    if (payload.passages.length === 0) {
      errorMessage.value =
        "At least one reading passage is required for the READING section.";
      return;
    }
  }
  try {
    const response = await apiClient.post("/question-sets", payload);
    sets.value.unshift(response.data);
    successMessage.value = `Set "${response.data.name}" created successfully!`;
    resetForm();
  } catch (error) {
    errorMessage.value = error.response?.data?.error || "Failed to create set.";
  }
}

function resetForm() {
  newSet.value = {
    name: "",
    description: "",
    section: "READING",
    passages: [{ partNumber: 1, text: "" }],
  };
}

function showDeleteConfirmation(set) {
  setToDelete.value = set;
  isModalVisible.value = true;
}
function closeConfirmationModal() {
  isModalVisible.value = false;
  setToDelete.value = null;
}
async function handleDeleteConfirmed() {
  if (!setToDelete.value) return;
  try {
    await apiClient.delete(`/question-sets/${setToDelete.value.id}`);
    sets.value = sets.value.filter((s) => s.id !== setToDelete.value.id);
    successMessage.value = "Set deleted successfully!";
  } catch (error) {
    errorMessage.value = error.response?.data?.error || "Failed to delete set.";
  } finally {
    closeConfirmationModal();
  }
}
function handleSectionChange() {
  if (
    newSet.value.section === "READING" &&
    newSet.value.passages.length === 0
  ) {
    newSet.value.passages = [{ partNumber: 1, text: "" }];
  }
}
</script>

<template>
  <div class="question-sets-container">
    <div class="page-header">
      <h1>Question Sets</h1>
      <p class="text-secondary">
        Manage groups of questions for different sections of the exam.
      </p>
    </div>

    <!-- Form for creating a new set -->
    <div class="card">
      <form @submit.prevent="createSet">
        <div class="card-header">
          <h4 class="card-title">Create New Question Set</h4>
        </div>
        <div class="card-body">
          <div class="form-grid">
            <div class="form-group">
              <label for="setName" class="form-label">Set Name *</label>
              <input
                type="text"
                id="setName"
                v-model="newSet.name"
                class="form-input"
                placeholder="e.g., Academic Reading Test 1"
                required
              />
            </div>
            <div class="form-group">
              <label for="setSection" class="form-label">Section *</label>
              <select
                id="setSection"
                v-model="newSet.section"
                class="form-select"
                @change="handleSectionChange"
              >
                <option value="LISTENING">Listening</option>
                <option value="READING">Reading</option>
                <option value="WRITING">Writing</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label for="setDescription" class="form-label">Description</label>
            <input
              type="text"
              id="setDescription"
              v-model="newSet.description"
              class="form-input"
              placeholder="e.g., Official Cambridge Guide Test 5"
            />
          </div>

          <div v-if="isReadingSection" class="passages-section">
            <div class="passage-header">
              <h5 class="passage-title">Reading Passages</h5>
              <button
                type="button"
                @click="addPassage"
                class="btn btn-secondary btn-sm"
              >
                + Add Passage
              </button>
            </div>
            <div class="passage-list">
              <div
                v-for="(passage, index) in newSet.passages"
                :key="index"
                class="passage-group"
              >
                <label :for="`passage-${index}`" class="form-label"
                  >Passage {{ index + 1 }}</label
                >
                <textarea
                  :id="`passage-${index}`"
                  v-model="passage.text"
                  rows="8"
                  class="form-textarea"
                ></textarea>
                <button
                  type="button"
                  @click="removePassage(index)"
                  class="btn-remove-passage"
                  v-if="newSet.passages.length > 1"
                  aria-label="Remove Passage"
                >
                  &times;
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="card-footer">
          <div v-if="successMessage" class="alert alert-success">
            {{ successMessage }}
          </div>
          <div v-if="errorMessage" class="alert alert-error">
            {{ errorMessage }}
          </div>
          <button
            type="submit"
            class="btn btn-primary btn-lg"
            :disabled="loading"
          >
            Create Set
          </button>
        </div>
      </form>
    </div>

    <!-- List of existing sets -->
    <div class="card">
      <div class="card-header">
        <h4 class="card-title">Existing Question Sets</h4>
        <span class="badge">{{ sets.length }} sets</span>
      </div>
      <div class="card-body">
        <div v-if="loading" class="loading-state">
          <div class="loader"></div>
          <p>Loading question sets...</p>
        </div>
        <div v-else-if="sets.length === 0" class="empty-state">
          <p>No question sets found. Create your first set above.</p>
        </div>
        <ul v-else class="sets-list">
          <li v-for="set in sets" :key="set.id" class="set-item">
            <div class="set-info">
              <span class="set-name">{{ set.name }}</span>
              <span class="set-description">{{
                set.description || "No description"
              }}</span>
            </div>
            <div class="set-meta">
              <span
                class="badge"
                :class="`section-${set.section.toLowerCase()}`"
                >{{ set.section }}</span
              >
              <span v-if="set.section === 'READING'" class="badge badge-primary"
                >{{ set.passages?.length || 0 }} Passages</span
              >
            </div>
            <div class="set-actions">
              <RouterLink
                :to="`/admin/question-sets/${set.id}/edit`"
                class="btn btn-secondary btn-sm"
                >Edit</RouterLink
              >
              <button
                @click="showDeleteConfirmation(set)"
                class="btn btn-danger btn-sm"
              >
                Delete
              </button>
            </div>
          </li>
        </ul>
      </div>
    </div>

    <!-- Confirmation Modal -->
    <ConfirmationModal
      :show="isModalVisible"
      title="Delete Question Set"
      :message="`Are you sure you want to delete the set '${setToDelete?.name}'? All questions associated with this set will also be permanently deleted. This action cannot be undone.`"
      @confirm="handleDeleteConfirmed"
      @cancel="closeConfirmationModal"
    />
  </div>
</template>

<style scoped>
.page-header {
  margin-bottom: var(--space-8);
}
.card {
  margin-bottom: var(--space-8);
}
.card-footer .btn {
  align-self: flex-end;
}
.form-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--space-5);
  margin-bottom: var(--space-5);
}

.passages-section {
  margin-top: var(--space-6);
  padding: var(--space-5);
  background: var(--bg-secondary);
  border-radius: var(--radius-base);
}
.passage-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
}
.passage-title {
  font-size: var(--text-xl);
  margin: 0;
}
.passage-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}
.passage-group {
  position: relative;
}
.btn-remove-passage {
  position: absolute;
  top: 0;
  right: 0;
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  color: var(--text-tertiary);
  width: 28px;
  height: 28px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  line-height: 1;
}
.btn-remove-passage:hover {
  background: var(--color-error-50);
  color: var(--color-error-600);
  border-color: var(--color-error-300);
}

.loading-state,
.empty-state {
  text-align: center;
  padding: var(--space-10) 0;
  color: var(--text-secondary);
}
.loading-state {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sets-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.set-item {
  display: grid;
  grid-template-columns: 3fr 2fr auto;
  align-items: center;
  gap: var(--space-5);
  padding: var(--space-4) 0;
  border-bottom: 1px solid var(--border-primary);
}
.set-item:last-child {
  border-bottom: none;
}
.set-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}
.set-name {
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}
.set-description {
  color: var(--text-secondary);
  font-size: var(--text-sm);
}
.set-meta,
.set-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
}

/* Custom Badge Colors for Sections */
.badge.section-reading {
  background-color: var(--color-success-100);
  color: var(--color-success-800);
}
.badge.section-listening {
  background-color: var(--color-info-100);
  color: var(--color-info-800);
}
.badge.section-writing {
  background-color: var(--color-warning-100);
  color: var(--color-warning-800);
}

@media (max-width: 1024px) {
  .set-item {
    grid-template-columns: 2fr 1fr auto;
  }
}
@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
  .set-item {
    grid-template-columns: 1fr;
    text-align: center;
  }
  .set-meta,
  .set-actions {
    justify-content: center;
    margin-top: var(--space-3);
  }
}
</style>
