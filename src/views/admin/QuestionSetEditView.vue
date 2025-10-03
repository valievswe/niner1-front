<!-- src/views/admin/QuestionSetEditView.vue -->
<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import apiClient from "@/services/api";

const route = useRoute();
const router = useRouter();
const setId = route.params.id;

const setData = ref({
  name: "",
  description: "",
  passage: "",
});

const section = ref(""); // Section is not editable
const loading = ref(true);
const successMessage = ref("");
const errorMessage = ref("");

onMounted(async () => {
  try {
    // We need a GET /api/question-sets/:id endpoint. Let's assume we build it.
    // For now, we can fetch all and find the one we need. This is inefficient but works.
    const response = await apiClient.get("/question-sets");
    const set = response.data.find((s) => s.id === setId);
    if (set) {
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
  try {
    await apiClient.put(`/question-sets/${setId}`, setData.value);
    successMessage.value = "Set updated successfully!";
    setTimeout(() => router.push("/admin/question-sets"), 1500);
  } catch (error) {
    errorMessage.value = "Failed to update set.";
  }
}
</script>

<template>
  <div>
    <h1>Admin: Edit Question Set</h1>
    <div v-if="loading">Loading...</div>
    <div v-else-if="errorMessage" class="error-message">{{ errorMessage }}</div>
    <form v-else @submit.prevent="updateSet" class="set-form">
      <p><strong>Section:</strong> {{ section }} (Cannot be changed)</p>
      <div class="form-group">
        <label for="setName">Set Name</label>
        <input type="text" id="setName" v-model="setData.name" required />
      </div>
      <div class="form-group">
        <label for="setDescription">Description</label>
        <input type="text" id="setDescription" v-model="setData.description" />
      </div>
      <div v-if="section === 'READING'" class="form-group">
        <label for="setPassage">Reading Passage</label>
        <textarea
          id="setPassage"
          v-model="setData.passage"
          rows="10"
        ></textarea>
      </div>
      <button type="submit">Update Set</button>
      <p v-if="successMessage" class="success-message">{{ successMessage }}</p>
    </form>
  </div>
</template>

<style scoped>
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
}
.success-message {
  color: green;
}
.error-message {
  color: red;
}
.sets-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.actions button {
  margin-left: 10px;
}
.delete-btn {
  background-color: #ffdddd;
  border-color: #ff9999;
  color: #c53030;
}
</style>
