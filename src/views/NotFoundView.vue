<script setup>
import { RouterLink } from "vue-router";
</script>

<template>
  <div class="not-found-container">
    <div class="content-wrapper">
      <h1 class="status-code">404</h1>
      <h2 class="status-title">Page Not Found</h2>
      <p class="status-description text-secondary">
        Sorry, the page you are looking for does not exist or has been moved.
      </p>
      <div class="actions">
        <RouterLink to="/" class="btn btn-primary btn-lg">
          Go to Homepage
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.not-found-container {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 80vh;
  width: 100%;
  background-color: var(--bg-secondary);
}

.content-wrapper {
  max-width: 500px;
}

.status-code {
  font-size: 120px;
  font-weight: 700;
  color: var(--color-primary-600);
  line-height: 1;
  margin: 0;
}

.status-title {
  font-size: var(--text-4xl);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: var(--space-4) 0;
}

.status-description {
  font-size: var(--text-lg);
  line-height: var(--leading-relaxed);
  margin: 0 0 var(--space-8) 0;
}
</style>
