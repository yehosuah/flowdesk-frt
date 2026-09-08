<template>
  <div class="summary-grid">

    <div class="summary-card">
      <div class="summary-header">
        <ClipboardList class="summary-icon pending" :size="20" />
        <p class="summary-title">Pendientes</p>
      </div>

      <h2>{{ pending }}</h2>
    </div>

    <div class="summary-card">
      <div class="summary-header">
        <Clock3 class="summary-icon progress" :size="20" />
        <p class="summary-title">En progreso</p>
      </div>

      <h2>{{ inProgress }}</h2>
    </div>

    <div class="summary-card">
      <div class="summary-header">
        <CircleCheckBig class="summary-icon completed" :size="20" />
        <p class="summary-title">Completadas</p>
      </div>

      <h2>{{ completed }}</h2>
    </div>

    <div class="summary-card">
      <div class="summary-header">
        <ListTodo class="summary-icon total" :size="20" />
        <p class="summary-title">Total</p>
      </div>

      <h2>{{ tasks.length }}</h2>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Task } from '../types';

import {
  ClipboardList,
  Clock3,
  CircleCheckBig,
  ListTodo,
} from 'lucide-vue-next';

const props = defineProps<{
  tasks: Task[];
}>();

const pending = computed(() =>
  props.tasks.filter(task => task.status === 'Pendiente').length,
);

const inProgress = computed(() =>
  props.tasks.filter(task => task.status === 'En progreso').length,
);

const completed = computed(() =>
  props.tasks.filter(task => task.status === 'Completada').length,
);
</script>

<style scoped>
.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
  margin-bottom: 28px;
}

@media (max-width: 1100px) {
  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
}

.summary-card {
  background: var(--color-bg-surface);
  border-radius: 12px;
  padding: 18px;
  min-height: 110px;
  box-shadow: var(--shadow-card);
}

.summary-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.summary-title {
  margin: 0;
  font-size: .9rem;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.summary-card h2 {
  margin: 0;
  font-size: 2.8rem;
  font-weight: 700;
  color: var(--color-text);
}

.summary-icon.pending {
  color: var(--color-warning-text);
}

.summary-icon.progress {
  color: var(--color-info);
}

.summary-icon.completed {
  color: var(--color-success);
}

.summary-icon.total {
  color: var(--color-heading);
}
</style>