<!-- src/views/admin/SchedulerView.vue -->
<script setup>
import { ref, onMounted } from "vue";
import apiClient from "@/services/api";
import { useRoute } from "vue-router";

// --- HELPER FUNCTION ---
// This function creates a YYYY-MM-DDTHH:mm string based on LOCAL time
function getLocalISOString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// --- STATE ---
const route = useRoute();
const students = ref([]);
const templates = ref([]);
const loading = ref(true);
const errorMessage = ref("");
const successMessage = ref("");

const newSchedule = ref({
  studentId: "",
  templateId: "",

  startAvailableAt: getLocalISOString(new Date()),
  endAvailableAt: "",
});

onMounted(async () => {
  try {
    const [studentsResponse, templatesResponse] = await Promise.all([
      apiClient.get("/users"),
      apiClient.get("/templates"),
    ]);
    students.value = studentsResponse.data.filter((u) => u.role === "STUDENT");
    templates.value = templatesResponse.data;

    if (route.query.studentId) {
      newSchedule.value.studentId = route.query.studentId;
    }
    if (route.query.templateId) {
      newSchedule.value.templateId = route.query.templateId;
    }
  } catch (error) {
    errorMessage.value = "Failed to load initial data.";
  } finally {
    loading.value = false;
  }
});

async function scheduleExam() {
  errorMessage.value = "";
  successMessage.value = "";

  const { studentId, templateId, startAvailableAt, endAvailableAt } =
    newSchedule.value;
  if (!studentId || !templateId || !startAvailableAt || !endAvailableAt) {
    errorMessage.value = "Please select a student, a template, and both dates.";
    return;
  }

  try {
    const response = await apiClient.post("/schedules", {
      studentId,
      templateId,
      startAvailableAt: new Date(startAvailableAt).toISOString(),
      endAvailableAt: new Date(endAvailableAt).toISOString(),
    });
    successMessage.value = `Exam successfully scheduled for student ID ${response.data.studentId}`;
  } catch (error) {
    errorMessage.value =
      error.response?.data?.error || "Failed to schedule exam.";
    console.error(error);
  }
}
</script>

<template>
  <div>
    <h1>Admin: Exam Scheduler</h1>

    <div v-if="loading">Loading scheduler data...</div>
    <div v-else-if="errorMessage" class="error-message">{{ errorMessage }}</div>

    <form v-else @submit.prevent="scheduleExam" class="scheduler-form">
      <h3>Schedule a New Exam</h3>

      <div class="form-group">
        <label for="student">Select Student</label>
        <select id="student" v-model="newSchedule.studentId" required>
          <option disabled value="">-- Please select a student --</option>
          <option
            v-for="student in students"
            :key="student.id"
            :value="student.id"
          >
            {{ student.firstName }} {{ student.lastName }} ({{ student.email }})
          </option>
        </select>
      </div>

      <div class="form-group">
        <label for="template">Select Mock Exam Template</label>
        <select id="template" v-model="newSchedule.templateId" required>
          <option disabled value="">-- Please select a template --</option>
          <option
            v-for="template in templates"
            :key="template.id"
            :value="template.id"
          >
            {{ template.title }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label for="scheduledAt">Schedule For (Date and Time)</label>
        <input
          type="datetime-local"
          id="scheduledAt"
          v-model="newSchedule.startAvailableAt"
          required
        />
      </div>

      <div class="form-group">
        <label for="scheduledAt">Schedule For (Date and Time)</label>
        <input
          type="datetime-local"
          id="scheduledAt"
          v-model="newSchedule.endAvailableAt"
          required
        />
      </div>

      <button type="submit">Schedule Exam</button>

      <p v-if="successMessage" class="success-message">{{ successMessage }}</p>
    </form>
  </div>
</template>

<style scoped>
.scheduler-form {
  max-width: 600px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
}
.form-group {
  margin-bottom: 15px;
}
label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}
select,
input {
  width: 100%;
  padding: 8px;
}
.success-message {
  color: green;
}
.error-message {
  color: red;
}
</style>
