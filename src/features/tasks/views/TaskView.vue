<template>
  <div class="tasks-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Gestión de tareas</h1>
        <p class="page-subtitle">
          Organiza y da seguimiento a las actividades del negocio.
        </p>
      </div>

      <button
        class="btn-create"
        @click="showCreateModal = true"
      >
        + Nueva tarea
      </button>
    </div>

    <TaskSummaryCards :tasks="tasks" />
        <TaskFilters @change="updateFilters" />

        <TaskTable
          :tasks="tasks"
          @edit="editTask"
          @status-change="updateStatus"
        />
        
        <TaskCreateModal
          v-if="showCreateModal"
          @close="showCreateModal = false"
          @create="createTask"
        />

        <TaskEditModal
          v-if="showEditModal && selectedTask"
          :task="selectedTask"
          @close="showEditModal = false"
          @save="updateTask"
        />
    </div>
</template>

<script setup lang="ts">

import TaskSummaryCards from '../components/TaskSummaryCards.vue';
import { mockTasks } from '../data/mockTasks';
import TaskTable from '../components/TaskTable.vue';
import TaskFilters from '../components/TaskFilters.vue';
import TaskCreateModal from '../components/TaskCreateModal.vue';
import TaskEditModal from '../components/TaskEditModal.vue';
import { ref, computed } from 'vue';
import type { Task, TaskStatus } from '../types';

const search = ref('');
const status = ref('');
const priority = ref('');
const showCreateModal = ref(false);
const showEditModal = ref(false);
const selectedTask = ref<Task | null>(null);
const taskList = ref([...mockTasks]);

const tasks = computed(() => {
  return taskList.value.filter(task => {

    const matchesSearch =
      task.title.toLowerCase().includes(search.value.toLowerCase()) ||
      task.description.toLowerCase().includes(search.value.toLowerCase());

    const matchesStatus =
      !status.value || task.status === status.value;

    const matchesPriority =
      !priority.value || task.priority === priority.value;

    return matchesSearch && matchesStatus && matchesPriority;
  });
});

function updateStatus(id: number, status: TaskStatus) {
  const task = taskList.value.find(task => task.id === id);
  if (!task) return;
  task.status = status;
}

function updateFilters(filters: {
  search: string;
  status: string;
  priority: string;
}) {
  search.value = filters.search;
  status.value = filters.status;
  priority.value = filters.priority;
}

function createTask(task: Task) {
  taskList.value.unshift(task);
  showCreateModal.value = false;
}

function editTask(task: Task){
  selectedTask.value = task;
  showEditModal.value = true;
}

function updateTask(updatedTask: Task) {
  const index = taskList.value.findIndex(
    task => task.id === updatedTask.id,
  );

  if (index === -1) return;
  taskList.value.splice(index, 1, updatedTask);
  showEditModal.value = false;
}

</script>

<style scoped>
.tasks-page {
  padding: 32px 36px;
  min-height: 100vh;
  font-family: var(--font-sans);
  color: var(--color-text);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
}

.page-title {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
}

.page-subtitle {
  margin-top: 8px;
  color: var(--color-text-secondary);
  font-size: 0.95rem;
}

.btn-create {
  padding: 10px 18px;
  border: none;
  border-radius: 8px;
  background: var(--color-structure-base);
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: opacity .2s;
}

.btn-create:hover {
  opacity: .9;
}

.coming-soon-card {
  background: white;
  border-radius: 12px;
  box-shadow: var(--shadow-card);
  padding: 32px;
}

.coming-soon-card h2 {
  margin-top: 0;
}

.coming-soon-card p {
  color: var(--color-text-secondary);
}

@media (max-width: 768px) {
  .tasks-page {
    width: 100%;
    max-width: 100%;
    padding: 20px 16px;
    box-sizing: border-box;
    overflow-x: hidden;
  }

  .page-header {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
    margin-bottom: 20px;
  }

  .page-title {
    font-size: 1.6rem;
  }

  .page-subtitle {
    margin-bottom: 0;
    font-size: 0.88rem;
    line-height: 1.4;
  }

  .btn-create {
    width: 100%;
    box-sizing: border-box;
    padding: 11px 16px;
  }
}
</style>