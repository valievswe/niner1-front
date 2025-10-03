// src/router/admin/index.js

// Import the ACTUAL layout component and all admin view components
import AdminLayout from "@/layouts/AdminLayout.vue"; // Create this file!
import AdminDashboardView from "@/views/admin/AdminDashboardView.vue";
import SubmissionsView from "@/views/admin/SubmissionsView.vue";
import SubmissionDetailView from "@/views/admin/SubmissionDetailView.vue";
import QuestionSetsView from "@/views/admin/QuestionSetsView.vue";
import QuestionSetEditView from "@/views/admin/QuestionSetEditView.vue";
import QuestionsView from "@/views/admin/questionsView.vue"; // Fixed case sensitivity
import QuestionCreateView from "@/views/admin/QuestionCreateView.vue";
import QuestionDetailView from "@/views/admin/QuestionDetailView.vue";
import QuestionEditView from "@/views/admin/QuestionEditView.vue";
import TemplatesView from "@/views/admin/TemplatesView.vue";
import TemplateBuilderView from "@/views/admin/TemplateBuilderView.vue";
import TemplateDetailView from "@/views/admin/TemplateDetailView.vue";
import TemplateEditView from "@/views/admin/TemplateEditView.vue";
import SchedulerView from "@/views/admin/SchedulerView.vue";
import UserManagementView from "@/views/admin/UserManagementView.vue";
import UserCreateView from "@/views/admin/UserCreateView.vue";
import UserEditView from "@/views/admin/UserEditView.vue";

const adminRoutes = {
  path: "/admin",
  component: AdminLayout, // Now uses proper layout component
  meta: { requiresAuth: true, requiresAdmin: true },
  children: [
    { path: "", name: "admin-root", redirect: { name: "admin-dashboard" } },
    {
      path: "dashboard",
      name: "admin-dashboard",
      component: AdminDashboardView,
    },
    {
      path: "submissions",
      name: "admin-submissions",
      component: SubmissionsView,
    },
    {
      path: "submissions/:id",
      name: "admin-submission-detail",
      component: SubmissionDetailView,
    },
    {
      path: "question-sets",
      name: "admin-question-sets",
      component: QuestionSetsView,
    },
    {
      path: "question-sets/:id/edit",
      name: "admin-question-set-edit",
      component: QuestionSetEditView,
    },
    { path: "questions", name: "admin-questions", component: QuestionsView },
    {
      path: "questions/new",
      name: "admin-question-create",
      component: QuestionCreateView,
    },
    {
      path: "questions/:id",
      name: "admin-question-detail",
      component: QuestionDetailView,
    },
    {
      path: "questions/:id/edit",
      name: "admin-question-edit",
      component: QuestionEditView,
    },
    { path: "templates", name: "admin-templates", component: TemplatesView },
    {
      path: "templates/new",
      name: "admin-template-builder",
      component: TemplateBuilderView,
    },
    {
      path: "templates/:id",
      name: "admin-template-detail",
      component: TemplateDetailView,
    },
    {
      path: "templates/:id/edit",
      name: "admin-template-edit",
      component: TemplateEditView,
    },
    { path: "scheduler", name: "admin-scheduler", component: SchedulerView },
    { path: "users", name: "admin-users", component: UserManagementView },
    { path: "users/new", name: "admin-user-create", component: UserCreateView },
    {
      path: "users/:id/edit",
      name: "admin-user-edit",
      component: UserEditView,
    },
  ],
};

export default adminRoutes;
