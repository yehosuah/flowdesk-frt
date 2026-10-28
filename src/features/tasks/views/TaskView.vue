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
        :disabled="isLoading"
        @click="showCreateModal = true"
      >
        + Nueva tarea
      </button>
    </div>

    <div
      v-if="isLoading"
      class="summary-skeleton"
    >
      <Skeleton
        v-for="i in 4"
        :key="i"
        height="92px"
      />
    </div>

    <TaskSummaryCards
      v-else-if="!loadError"
      :tasks="filteredTasks"
    />

    <TaskFilters @change="updateFilters" />

    <div
      v-if="isLoading"
      class="table-skeleton"
      data-test="tasks-loading"
    >
      <Skeleton
        v-for="i in 5"
        :key="i"
        height="52px"
      />
    </div>

    <Alert
      v-else-if="loadError"
      title="No se pudieron cargar las tareas"
      data-test="tasks-error"
    >
      <p class="error-message">{{ loadError }}</p>

      <button
        class="btn-retry"
        type="button"
        @click="loadTasks"
      >
        Reintentar
      </button>
    </Alert>

    <TaskTable
      v-else
      :tasks="filteredTasks"
      @edit="openEditModal"
      @delete="taskToDelete = $event"
      @status-change="changeStatus"
    />

    <TaskCreateModal
      v-if="showCreateModal"
      :saving="isSaving"
      @close="showCreateModal = false"
      @create="onCreate"
    />

    <TaskEditModal
      v-if="showEditModal && selectedTask"
      :task="selectedTask"
      :saving="isSaving"
      @close="showEditModal = false"
      @save="onSave"
    />

    <ConfirmDialog
      v-if="taskToDelete"
      title="Eliminar tarea"
      :message="`¿Seguro que deseas eliminar «${taskToDelete.titulo}»? Esta acción no se puede deshacer.`"
      confirm-label="Eliminar"
      variant="danger"
      :loading="isDeleting"
      @confirm="onDelete"
      @cancel="taskToDelete = null"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import TaskSummaryCards from '../components/TaskSummaryCards.vue';
import TaskTable from '../components/TaskTable.vue';
import TaskFilters from '../components/TaskFilters.vue';
import TaskCreateModal from '../components/TaskCreateModal.vue';
import TaskEditModal from '../components/TaskEditModal.vue';
import ConfirmDialog from '@/app/components/ConfirmDialog.vue';
import { Alert, Skeleton } from '@/app/components/ui';
import { useTasks } from '../composables/useTasks';
import type { Task, TaskCreate, TaskUpdate } from '../types';

const {
  tasks,
  isLoading,
  loadError,
  isSaving,
  isDeleting,
  loadTasks,
  addTask,
  saveTask,
  changeStatus,
  removeTask,
} = useTasks();

const search = ref('');
const status = ref('');
const priority = ref('');
const showCreateModal = ref(false);
const showEditModal = ref(false);
const selectedTask = ref<Task | null>(null);
const taskToDelete = ref<Task | null>(null);

// Las tareas se cargan una vez y se filtran en memoria: así los filtros
// responden al instante y los cambios de estado se reflejan sin recargar.
const filteredTasks = computed(() => {
  const term = search.value.toLowerCase();

  return tasks.value.filter(task => {
    const matchesSearch =
      task.titulo.toLowerCase().includes(term) ||
      (task.descripcion ?? '').toLowerCase().includes(term);

    const matchesStatus =
      !status.value || task.estado === status.value;

    const matchesPriority =
      !priority.value || task.prioridad === priority.value;

    return matchesSearch && matchesStatus && matchesPriority;
  });
});

function updateFilters(filters: {
  search: string;
  status: string;
  priority: string;
}) {
  search.value = filters.search;
  status.value = filters.status;
  priority.value = filters.priority;
}

async function onCreate(data: TaskCreate) {
  if (await addTask(data)) {
    showCreateModal.value = false;
  }
}

function openEditModal(task: Task) {
  selectedTask.value = task;
  showEditModal.value = true;
}

async function onSave(data: TaskUpdate) {
  if (!selectedTask.value) return;

  if (await saveTask(selectedTask.value.id, data)) {
    showEditModal.value = false;
  }
}

async function onDelete() {
  if (!taskToDelete.value) return;

  if (await removeTask(taskToDelete.value.id)) {
    taskToDelete.value = null;
  }
}

onMounted(loadTasks);
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
  color: var(--color-heading);
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

.btn-create:disabled {
  opacity: .6;
  cursor: not-allowed;
}

.summary-skeleton {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
  margin-bottom: 28px;
}

@media (max-width: 1100px) {
  .summary-skeleton {
    grid-template-columns: repeat(2, 1fr);
  }
}

.table-skeleton {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 20px;
  border-radius: 12px;
  background: var(--color-bg-surface);
  box-shadow: var(--shadow-card);
}

.error-message {
  margin: 0 0 12px;
}

.btn-retry {
  padding: 8px 14px;
  border: 1px solid currentColor;
  border-radius: 8px;
  background: transparent;
  color: inherit;
  font-weight: 600;
  cursor: pointer;
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