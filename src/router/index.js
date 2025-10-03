// src/router/index.js

import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";

import adminRoutes from "./admin";

import LoginView from "../views/LoginView.vue";
import DashboardView from "../views/DashboardView.vue";
import ExamView from "../views/ExamView.vue";
import ResultsView from "../views/ResultsView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // --- PUBLIC & STUDENT ROUTES ---
    {
      path: "/",
      redirect: "/dashboard",
    },
    {
      path: "/login",
      name: "login",
      component: LoginView,
    },
    {
      path: "/dashboard",
      name: "dashboard",
      component: DashboardView,
      meta: { requiresAuth: true },
    },
    {
      path: "/exam/:id",
      name: "exam-taking",
      component: ExamView,
      meta: { requiresAuth: true },
    },
    {
      path: "/results/:id",
      name: "exam-results",
      component: ResultsView,
      meta: { requiresAuth: true },
    },

    // --- ADMIN ROUTES ---
    adminRoutes,

    {
      path: "/:pathMatch(.*)*",
      name: "NotFound",
      component: () => import("../views/NotFoundView.vue"),
    },
  ],
});

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  const isLoggedIn = authStore.isAuthenticated;
  const isAdmin = authStore.isAdmin;

  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
  const requiresAdmin = to.matched.some((record) => record.meta.requiresAdmin);

  if (requiresAuth && !isLoggedIn) {
    return next({ name: "login" });
  }

  if (requiresAdmin && !isAdmin) {
    alert("You do not have permission to access this page.");
    return next({ name: "dashboard" });
  }

  next();
});

export default router;
