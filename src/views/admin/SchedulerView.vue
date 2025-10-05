<script setup>
// The script is correct and remains unchanged.
import { ref, onMounted } from "vue";
import apiClient from "@/services/api";
import { useRoute } from "vue-router";

function getLocalISOString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

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
    if (route.query.studentId)
      newSchedule.value.studentId = route.query.studentId;
    if (route.query.templateId)
      newSchedule.value.templateId = route.query.templateId;
  } catch (error) {
    errorMessage.value =
      "Failed to load initial data for students and templates.";
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
    errorMessage.value =
      "Please select a student, a template, and both availability dates.";
    return;
  }
  try {
    const response = await apiClient.post("/schedules", {
      studentId,
      templateId,
      startAvailableAt: new Date(startAvailableAt).toISOString(),
      endAvailableAt: new Date(endAvailableAt).toISOString(),
    });
    const scheduledStudent = students.value.find(
      (s) => s.id === response.data.studentId
    );
    successMessage.value = `Exam successfully scheduled for ${
      scheduledStudent?.firstName || ""
    } ${scheduledStudent?.lastName || ""}.`;
    newSchedule.value.studentId = "";
    newSchedule.value.templateId = "";
    newSchedule.value.endAvailableAt = "";
  } catch (error) {
    errorMessage.value =
      error.response?.data?.error || "Failed to schedule exam.";
  }
}
</script>

<template>
  <div class="scheduler-container">
    <div class="page-header">
      <h1>Exam Scheduler</h1>
      <p class="text-secondary">
        Assign a mock exam template to a student for a specific time window.
      </p>
    </div>
    <div v-if="loading" class="loading-state">
      <div class="loader"></div>
      <p>Loading scheduler data...</p>
    </div>
    <form v-else @submit.prevent="scheduleExam" class="card">
      <!-- THIS IS THE FIX: Corrected `class=` attribute -->
      <div class="card-header">
        <h4 class="card-title">Schedule a New Exam</h4>
      </div>
      <div class="card-body">
        <div class="form-group">
          <label for="student" class="form-label">1. Select Student</label>
          <select
            id="student"
            v-model="newSchedule.studentId"
            class="form-select"
            required
          >
            <option disabled value="">-- Please select a student --</option>
            <option
              v-for="student in students"
              :key="student.id"
              :value="student.id"
            >
              {{ student.firstName }} {{ student.lastName }} ({{
                student.email
              }})
            </option>
          </select>
        </div>
        <div class="form-group">
          <label for="template" class="form-label"
            >2. Select Mock Exam Template</label
          >
          <select
            id="template"
            v-model="newSchedule.templateId"
            class="form-select"
            required
          >
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
        <div class="form-row">
          <div class="form-group">
            <label for="startAvailableAt" class="form-label"
              >3. Available From</label
            >
            <input
              type="datetime-local"
              id="startAvailableAt"
              v-model="newSchedule.startAvailableAt"
              class="form-input"
              required
            />
          </div>
          <div class="form-group">
            <label for="endAvailableAt" class="form-label"
              >4. Available Until</label
            >
            <input
              type="datetime-local"
              id="endAvailableAt"
              v-model="newSchedule.endAvailableAt"
              class="form-input"
              required
            />
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
        <button type="submit" class="btn btn-primary btn-lg">
          Schedule Exam
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
/* Scoped styles remain the same */
.scheduler-container {
  max-width: 800px;
  margin: 0 auto;
}
.page-header {
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
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-5);
}
.card-footer {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.card-footer .btn {
  align-self: flex-end;
}
@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
