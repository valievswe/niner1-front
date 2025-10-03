<!-- src/views/admin/QuestionSetsView.vue -->
<script setup>
import { ref, onMounted } from "vue";
import { RouterLink } from "vue-router";
import apiClient from "@/services/api";
import ConfirmationModal from "@/components/confirmation/ConfirmationModal.vue";

// --- STATE ---
const sets = ref([]);
const newSet = ref({
  name: "",
  description: "",
  section: "READING",
  passage: "",
});
const loading = ref(true);
const errorMessage = ref("");
const successMessage = ref("");

// --- FIX: Add the missing state variables for the modal ---
const isModalVisible = ref(false);
const setToDelete = ref(null);

// --- LIFECYCLE HOOK (Unchanged) ---
onMounted(async () => {
  try {
    const response = await apiClient.get("/question-sets");
    sets.value = response.data;
  } catch (error) {
    errorMessage.value = "Failed to load question sets.";
  } finally {
    loading.value = false;
  }
});

// --- METHODS (Unchanged) ---
async function createSet() {
  errorMessage.value = "";
  successMessage.value = "";
  if (!newSet.value.name || !newSet.value.section) {
    errorMessage.value = "Set Name and Section are required.";
    return;
  }
  try {
    const response = await apiClient.post("/question-sets", newSet.value);
    sets.value.unshift(response.data);
    successMessage.value = `Set "${response.data.name}" created successfully!`;
    newSet.value = {
      name: "",
      description: "",
      section: "READING",
      passage: "",
    };
  } catch (error) {
    errorMessage.value = "Failed to create set.";
    console.error(error);
  }
}

// --- MODAL CONTROL METHODS (Unchanged) ---
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
    // Only update the UI on success
    sets.value = sets.value.filter((s) => s.id !== setToDelete.value.id);
  } catch (error) {
    console.error("Failed to delete set:", error);

    errorMessage.value =
      error.response?.data?.error ||
      "An unknown error occurred while trying to delete the set.";

    alert(errorMessage.value);
  } finally {
    closeConfirmationModal();
  }
}
</script>

<template>
  <div>
    <h1>Admin: Question Sets</h1>

    <!-- Form for creating a new set -->
    <form @submit.prevent="createSet" class="set-form">
      <h3>Create New Question Set</h3>
      <div class="form-group">
        <label for="setName">Set Name</label>
        <input
          type="text"
          id="setName"
          v-model="newSet.name"
          placeholder="e.g., Academic Reading Passage 1"
          required
        />
      </div>
      <div class="form-group">
        <label for="setDescription">Description</label>
        <input
          type="text"
          id="setDescription"
          v-model="newSet.description"
          placeholder="e.g., A passage about the history of glassmaking"
        />
      </div>
      <div class="form-group">
        <label for="setSection">Section</label>
        <select id="setSection" v-model="newSet.section">
          <option value="LISTENING">Listening</option>
          <option value="READING">Reading</option>
          <option value="WRITING">Writing</option>
        </select>
      </div>
      <div v-if="newSet.section === 'READING'" class="form-group">
        <label for="setPassage">Reading Passage</label>
        <textarea
          id="setPassage"
          v-model="newSet.passage"
          rows="10"
          placeholder="Paste the entire reading passage here..."
        ></textarea>
      </div>
      <button type="submit">Create Set</button>
      <p v-if="successMessage" class="success-message">{{ successMessage }}</p>
      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
    </form>

    <!-- List of existing sets -->
    <div class="sets-list">
      <h3>Existing Sets</h3>
      <div v-if="loading">Loading...</div>
      <ul v-else>
        <li v-for="set in sets" :key="set.id">
          <div>
            <strong>{{ set.name }}</strong> ({{ set.section }}) <br />
            <small>{{ set.description }}</small>
          </div>
          <div class="actions">
            <RouterLink :to="`/admin/question-sets/${set.id}/edit`">
              <button>Edit</button>
            </RouterLink>
            <button @click="showDeleteConfirmation(set)" class="delete-btn">
              Delete
            </button>
          </div>
        </li>
      </ul>
    </div>

    <ConfirmationModal
      :show="isModalVisible"
      title="Delete Question Set"
      :message="`Are you sure you want to delete the set '${setToDelete?.name}' and ALL questions inside it? This is permanent.`"
      @confirm="handleDeleteConfirmed"
      @cancel="closeConfirmationModal"
    />
  </div>
</template>

<style scoped>
/* Your existing styles are fine */
.set-form {
  max-width: 600px;
  margin-bottom: 40px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
}
.form-group {
  margin-bottom: 15px;
}
.sets-list ul {
  list-style: none;
  padding: 0;
}
.sets-list li {
  background-color: #f9f9f9;
  padding: 10px;
  border: 1px solid #eee;
  margin-bottom: 5px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.actions button {
  margin-left: 10px;
}
.delete-btn {
  background-color: #ffdddd;
  color: #c53030;
}
.success-message {
  color: green;
}
.error-message {
  color: red;
}
</style>
