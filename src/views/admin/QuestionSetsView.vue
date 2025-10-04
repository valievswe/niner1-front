<!-- src/views/admin/QuestionSetsView.vue -->
<script setup>
import { ref, onMounted, computed } from "vue";
import { RouterLink } from "vue-router";
import apiClient from "@/services/api";
import ConfirmationModal from "@/components/confirmation/ConfirmationModal.vue";

// --- STATE ---
const sets = ref([]);
const newSet = ref({
  name: "",
  description: "",
  section: "READING",
  passages: [{ partNumber: 1, text: "" }],
});

function addPassage() {
  const nextPart =
    Math.max(...newSet.value.passages.map((p) => p.partNumber)) + 1;
  newSet.value.passages.push({ partNumber: nextPart, text: "" });
}

function removePassage(index) {
  if (newSet.value.passages.length > 1) {
    newSet.value.passages.splice(index, 1);
    // Re-number remaining passages
    newSet.value.passages.forEach((p, i) => {
      p.partNumber = i + 1;
    });
  }
}

const loading = ref(true);
const errorMessage = ref("");
const successMessage = ref("");

// --- MODAL STATE ---
const isModalVisible = ref(false);
const setToDelete = ref(null);

// --- COMPUTED PROPERTIES ---
const isReadingSection = computed(() => newSet.value.section === "READING");

// --- LIFECYCLE HOOK ---
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

// --- METHODS ---
async function createSet() {
  errorMessage.value = "";
  successMessage.value = "";

  if (!newSet.value.name || !newSet.value.section) {
    errorMessage.value = "Set Name and Section are required.";
    return;
  }

  // Prepare the payload based on section type
  const payload = {
    name: newSet.value.name,
    description: newSet.value.description,
    section: newSet.value.section,
  };

  // Handle passages for READING section
  if (isReadingSection.value) {
    // Filter out empty passages but keep part numbers
    const nonEmptyPassages = newSet.value.passages
      .filter((passage) => passage.text.trim() !== "")
      .map((passage) => ({
        partNumber: passage.partNumber,
        text: passage.text,
      }));

    if (nonEmptyPassages.length === 0) {
      errorMessage.value =
        "At least one reading passage is required for READING section.";
      return;
    }

    payload.passages = nonEmptyPassages;
  }

  try {
    const response = await apiClient.post("/question-sets", payload);
    sets.value.unshift(response.data);
    successMessage.value = `Set "${response.data.name}" created successfully!`;

    // Reset form
    resetForm();
  } catch (error) {
    errorMessage.value = error.response?.data?.error || "Failed to create set.";
    console.error(error);
  }
}

function resetForm() {
  newSet.value = {
    name: "",
    description: "",
    section: "READING",
    passages: [
      { partNumber: 1, text: "" },
      { partNumber: 2, text: "" },
      { partNumber: 3, text: "" },
    ],
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
    console.error("Failed to delete set:", error);
  } finally {
    closeConfirmationModal();
  }
}

// Handle section change - reset passages when switching sections
function handleSectionChange() {
  if (newSet.value.section !== "READING") {
    // Clear passages for non-reading sections
    newSet.value.passages = [];
  } else {
    // Restore default passages for reading
    newSet.value.passages = [
      { partNumber: 1, text: "" },
      { partNumber: 2, text: "" },
      { partNumber: 3, text: "" },
    ];
  }
}
</script>

<template>
  <div class="question-sets-container">
    <div class="header">
      <h1>Admin: Question Sets</h1>
    </div>

    <!-- Form for creating a new set -->
    <div class="card">
      <form @submit.prevent="createSet" class="set-form">
        <h2>Create New Question Set</h2>

        <div class="form-grid">
          <div class="form-group">
            <label for="setName">Set Name *</label>
            <input
              type="text"
              id="setName"
              v-model="newSet.name"
              placeholder="e.g., Academic Reading Test 1"
              required
            />
          </div>

          <div class="form-group">
            <label for="setDescription">Description</label>
            <input
              type="text"
              id="setDescription"
              v-model="newSet.description"
              placeholder="e.g., IELTS Academic Reading passages"
            />
          </div>

          <div class="form-group">
            <label for="setSection">Section *</label>
            <select
              id="setSection"
              v-model="newSet.section"
              @change="handleSectionChange"
            >
              <option value="LISTENING">Listening</option>
              <option value="READING">Reading</option>
              <option value="WRITING">Writing</option>
            </select>
          </div>
        </div>

        <!-- Reading Passages Section -->
        <div v-if="isReadingSection" class="passages-section">
          <div class="passage-section-header">
            <h3>Reading Passages</h3>
            <button type="button" @click="addPassage" class="btn-add-passage">
              Add Passage
            </button>
          </div>
          <p class="helper-text">
            Add passages for each part. Leave empty if not used.
          </p>

          <div
            v-for="(passage, index) in newSet.passages"
            :key="index"
            class="passage-group"
          >
            <div class="passage-header">
              <label :for="`passage-${passage.partNumber}`">
                Part {{ passage.partNumber }}
              </label>
              <!-- Add a remove button -->
              <button
                type="button"
                @click="removePassage(index)"
                class="btn-remove-passage"
                v-if="newSet.passages.length > 1"
              >
                Remove
              </button>
            </div>
            <textarea
              :id="`passage-${passage.partNumber}`"
              v-model="passage.text"
              rows="8"
              :placeholder="`Enter passage text for Part ${passage.partNumber}...`"
              class="passage-textarea"
            ></textarea>
          </div>
        </div>
        <div class="form-actions">
          <button
            type="submit"
            class="btn-primary"
            :disabled="!newSet.name || loading"
          >
            {{ loading ? "Creating..." : "Create Set" }}
          </button>
        </div>

        <div v-if="successMessage" class="message success">
          {{ successMessage }}
        </div>
        <div v-if="errorMessage" class="message error">
          {{ errorMessage }}
        </div>
      </form>
    </div>

    <!-- List of existing sets -->
    <div class="card">
      <div class="sets-header">
        <h2>Existing Question Sets</h2>
        <span class="sets-count">{{ sets.length }} sets</span>
      </div>

      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>Loading question sets...</p>
      </div>

      <div v-else-if="sets.length === 0" class="empty-state">
        <p>No question sets found. Create your first set above.</p>
      </div>

      <ul v-else class="sets-list">
        <li v-for="set in sets" :key="set.id" class="set-item">
          <div class="set-info">
            <div class="set-name">
              <strong>{{ set.name }}</strong>
              <span
                class="set-section-badge"
                :class="`section-${set.section.toLowerCase()}`"
              >
                {{ set.section }}
              </span>
            </div>
            <p class="set-description">
              {{ set.description || "No description" }}
            </p>

            <!-- Show passage count for reading sets -->
            <div
              v-if="set.section === 'READING' && set.passages"
              class="passage-info"
            >
              <span class="passage-count">
                {{ set.passages.length }} passage{{
                  set.passages.length !== 1 ? "s" : ""
                }}
              </span>
              <div class="passage-parts">
                Parts:
                <span
                  v-for="part in set.passages.map((p) => p.partNumber).sort()"
                  :key="part"
                  class="part-badge"
                >
                  {{ part }}
                </span>
              </div>
            </div>
          </div>

          <div class="set-actions">
            <RouterLink
              :to="`/admin/question-sets/${set.id}/edit`"
              class="btn-edit"
            >
              Edit
            </RouterLink>
            <button @click="showDeleteConfirmation(set)" class="btn-delete">
              Delete
            </button>
          </div>
        </li>
      </ul>
    </div>

    <!-- Confirmation Modal -->
    <ConfirmationModal
      :show="isModalVisible"
      title="Delete Question Set"
      :message="`Are you sure you want to delete the set '${setToDelete?.name}' and ALL questions inside it? This action cannot be undone.`"
      confirm-text="Delete Permanently"
      cancel-text="Cancel"
      @confirm="handleDeleteConfirmed"
      @cancel="closeConfirmationModal"
    />
  </div>
</template>

<style scoped>
.question-sets-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  margin-bottom: 30px;
}

.header h1 {
  color: #2d3748;
  font-size: 2rem;
  font-weight: 700;
}

.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  padding: 24px;
  margin-bottom: 24px;
}

.set-form h2 {
  margin: 0 0 24px 0;
  color: #2d3748;
  font-size: 1.5rem;
  font-weight: 600;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-weight: 600;
  color: #4a5568;
  margin-bottom: 8px;
  font-size: 0.95rem;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.passages-section {
  margin: 24px 0;
  padding: 20px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.passages-section h3 {
  margin: 0 0 12px 0;
  color: #2d3748;
  font-size: 1.25rem;
}

.helper-text {
  color: #718096;
  font-size: 0.9rem;
  margin-bottom: 16px;
}

.passage-group {
  margin-bottom: 20px;
}

.passage-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.passage-header label {
  font-weight: 600;
  color: #4a5568;
}

.part-indicator {
  background: #667eea;
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
}

.passage-textarea {
  width: 100%;
  min-height: 120px;
  resize: vertical;
}

.form-actions {
  margin-top: 24px;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 14px 28px;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.message {
  margin-top: 16px;
  padding: 12px 16px;
  border-radius: 8px;
  font-weight: 500;
}

.message.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.message.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

/* Sets List Styles */
.sets-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.sets-header h2 {
  margin: 0;
  color: #2d3748;
  font-size: 1.5rem;
  font-weight: 600;
}

.sets-count {
  color: #718096;
  font-size: 0.95rem;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
  color: #718096;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #718096;
}

.sets-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.set-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 20px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  margin-bottom: 16px;
  background: #f8fafc;
  transition: all 0.2s;
}

.set-item:hover {
  border-color: #cbd5e0;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.set-info {
  flex: 1;
  margin-right: 20px;
}

.set-name {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.set-name strong {
  color: #2d3748;
  font-size: 1.1rem;
}

.set-section-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  color: white;
}

.section-listening {
  background: linear-gradient(135deg, #3182ce 0%, #2c5282 100%);
}

.section-reading {
  background: linear-gradient(135deg, #38a169 0%, #276749 100%);
}

.section-writing {
  background: linear-gradient(135deg, #d69e2e 0%, #975a16 100%);
}

.set-description {
  color: #718096;
  margin: 8px 0;
  font-size: 0.95rem;
}

.passage-info {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
}

.passage-count {
  background: #e6fffa;
  color: #2c7a7b;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
}

.passage-parts {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #4a5568;
  font-size: 0.9rem;
}

.part-badge {
  background: #667eea;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
}

.set-actions {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
}

.btn-edit,
.btn-delete {
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-edit {
  background: #667eea;
  color: white;
}

.btn-edit:hover {
  background: #5568d3;
  transform: translateY(-1px);
}

.btn-delete {
  background: #e53e3e;
  color: white;
}

.btn-delete:hover {
  background: #c53030;
  transform: translateY(-1px);
}

/* Responsive Design */
@media (max-width: 768px) {
  .question-sets-container {
    padding: 16px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .set-item {
    flex-direction: column;
    gap: 16px;
  }

  .set-actions {
    align-self: flex-end;
  }

  .passage-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>
