<!-- src/views/admin/SubmissionsView.vue -->
<script setup>
import { ref, onMounted, computed } from "vue";
import { RouterLink } from "vue-router";
import apiClient from "@/services/api";

const submissions = ref([]);
const loading = ref(true);

onMounted(async () => {
  try {
    const response = await apiClient.get("/marking/submissions");
    submissions.value = response.data;
  } catch (error) {
    console.error("Failed to fetch submissions:", error);
  } finally {
    loading.value = false;
  }
});

// A computed property to quickly see exams needing action
const submissionsToMark = computed(() => {
  return submissions.value.filter((s) => s.status === "COMPLETED");
});
</script>

<template>
  <div>
    <h1>Admin: Submissions & Marking</h1>

    <div v-if="loading">Loading submissions...</div>
    <div v-else>
      <div class="summary">
        <p>
          <strong>{{ submissionsToMark.length }}</strong> exam(s) waiting for
          marking.
        </p>
      </div>

      <table>
        <thead>
          <tr>
            <th>Student</th>
            <th>Template</th>
            <th>Status</th>
            <th>Scheduled On</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="sub in submissions" :key="sub.id">
            <td>{{ sub.student.firstName }} {{ sub.student.lastName }}</td>
            <td>{{ sub.template.title }}</td>
            <td>
              <span :class="`status-${sub.status.toLowerCase()}`">{{
                sub.status
              }}</span>
            </td>
            <td>{{ new Date(sub.createdAt).toLocaleString() }}</td>
            <td>
              <RouterLink :to="`/admin/submissions/${sub.id}`">
                <button>View & Mark</button>
              </RouterLink>

              <RouterLink
                v-if="
                  sub.status === 'COMPLETED' ||
                  sub.status === 'RESULTS_RELEASED'
                "
                :to="`/admin/scheduler?studentId=${sub.studentId}&templateId=${sub.templateId}`"
              >
                <button class="reschedule-btn">Grant Re-take</button>
              </RouterLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}
th,
td {
  border: 1px solid #ccc;
  padding: 8px;
  text-align: left;
}
th {
  background-color: #f4f4f4;
}
.summary {
  padding: 10px;
  background-color: #e9ecef;
  border: 1px solid #ddd;
}
.status-scheduled {
  font-weight: bold;
  color: #007bff;
}
.status-completed {
  font-weight: bold;
  color: #dc3545;
}
.status-marked {
  font-weight: bold;
  color: #ffc107;
}
.status-results_released {
  font-weight: bold;
  color: #28a745;
}
.status-in_progress {
  font-weight: bold;
  color: #17a2b8;
}
.reschedule-btn {
  background-color: #ffc107;
  border-color: #ffc107;
  color: #212529;
  margin-left: 5px;
}
</style>
