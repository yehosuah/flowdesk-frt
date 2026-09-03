<template>
  <div class="table-container">
    <table class="task-table">
      <thead>
        <tr>
          <th class="col-task">Tarea</th>
          <th class="col-assignee">Responsable</th>
          <th class="col-priority">Prioridad</th>
          <th class="col-status">Estado</th>
          <th class="col-date">Fecha límite</th>
          <th class="col-actions">Acciones</th>
        </tr>
      </thead>

      <tbody>
        <tr
          v-for="task in tasks"
          :key="task.id"
        >
          <td class="task-column col-task">
            <div class="task-info">
              <strong :title="task.title">
                {{ task.title }}
              </strong>

              <small :title="task.description">
                {{ task.description }}
              </small>

              <span class="mobile-due-date">
                📅 {{ formatDate(task.dueDate) }}
              </span>
            </div>
          </td>

          <td class="col-assignee">
            {{ task.assignee }}
          </td>

          <td class="col-priority">
            <span
              class="badge"
              :class="priorityClass(task.priority)"
            >
              {{ task.priority }}
            </span>
          </td>

          <td class="col-status">
            <div class="status-wrapper">
              <select
                class="status-select"
                :class="statusClass(task.status)"
                :value="task.status"
                @change="
                  emit(
                    'status-change',
                    task.id,
                    ($event.target as HTMLSelectElement).value as TaskStatus
                  )
                "
              >
                <option value="Pendiente">Pendiente</option>
                <option value="En progreso">En progreso</option>
                <option value="Completada">Completada</option>
              </select>

              <ChevronDown
                :size="14"
                class="status-arrow"
              />
            </div>
          </td>

          <td class="col-date">
            {{ formatDate(task.dueDate) }}
          </td>

          <td class="actions-cell col-actions">
            <button
              class="btn-edit"
              @click="$emit('edit', task)"
            >
              ✏️
            </button>
          </td>
        </tr>

        <tr v-if="tasks.length === 0">
          <td colspan="6" class="empty-state">
            No hay tareas registradas.
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next';
import type { Task, TaskPriority, TaskStatus } from '../types';

defineProps<{
  tasks: Task[];
}>();

const emit = defineEmits<{
  (e: 'edit', task: Task): void;
  (e: 'status-change', id: number, status: TaskStatus): void;
}>();

function priorityClass(priority: TaskPriority) {
  return {
    'badge--high': priority === 'Alta',
    'badge--medium': priority === 'Media',
    'badge--low': priority === 'Baja',
  };
}

function statusClass(status: TaskStatus) {
  return {
    'badge--pending': status === 'Pendiente',
    'badge--progress': status === 'En progreso',
    'badge--completed': status === 'Completada',
  };
}

function formatDate(date: string): string {
  const months = [
    'Ene',
    'Feb',
    'Mar',
    'Abr',
    'May',
    'Jun',
    'Jul',
    'Ago',
    'Sep',
    'Oct',
    'Nov',
    'Dic',
  ];

  const taskDate = new Date(`${date}T00:00:00`);

  const day = String(taskDate.getDate()).padStart(2, '0');
  const month = months[taskDate.getMonth()];
  const year = taskDate.getFullYear();

  return `${day} - ${month} - ${year}`;
}
</script>

<style scoped>
.table-container {
  width: 100%;
  max-width: 100%;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: var(--shadow-card);
}

.task-table {
  width: 100%;
  border-collapse: collapse;
  border-spacing: 0;
}

.task-column {
  width: 320px;
  max-width: 340px;
}

.task-table thead {
  background: var(--color-structure-base);
}

.task-table thead tr {
  background: var(--color-structure-base);
}

.task-table th {
  padding: 16px 20px;
  text-align: left;
  color: white;
  background: var(--color-structure-base);
  border: none;
  font-size: .85rem;
}

.task-table td {
  padding: 18px 20px;
  border-bottom: 1px solid #edf1f7;
}

.task-table th.col-actions {
  text-align: center;
}

.task-info {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
  overflow: hidden;
}

.task-info strong {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.task-info small {
  margin-top: 4px;
  color: var(--color-text-secondary);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.mobile-due-date {
  display: none;
}

.badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: .75rem;
  font-weight: 600;
  white-space: nowrap;
}

.badge--high {
  background: #ffe3e3;
  color: #c92a2a;
}

.badge--medium {
  background: #fff3bf;
  color: #e67700;
}

.badge--low {
  background: #d3f9d8;
  color: #2b8a3e;
}

.badge--pending {
  background: #edf2ff;
  color: #364fc7;
}

.badge--progress {
  background: #d0ebff;
  color: #1971c2;
}

.badge--completed {
  background: #d3f9d8;
  color: #2b8a3e;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: var(--color-text-secondary);
}

.actions-cell {
  width: 90px;
  text-align: center;
}

.btn-edit {
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 1.1rem;
  transition: .2s;
}

.btn-edit:hover {
  transform: scale(1.15);
}

.status-wrapper {
  position: relative;
  display: inline-block;
}

.status-select {
  appearance: none;
  border: none;
  cursor: pointer;
  border-radius: 999px;
  padding: 6px 34px 6px 14px;
  font-size: .75rem;
  font-weight: 600;
  outline: none;
  min-width: 145px;
  text-align: center;
}

.status-arrow {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: inherit;
}

@media (max-width: 900px) {
  .task-table {
    table-layout: fixed;
  }

  .task-column {
    width: auto;
    max-width: none;
  }

  .task-table th {
    padding: 12px 7px;
    font-size: .7rem;
  }

  .task-table td {
    padding: 14px 7px;
    font-size: .76rem;
  }

  .task-info strong,
  .task-info small {
    white-space: normal;
    overflow-wrap: anywhere;
  }

  .col-task {
    width: 27%;
    padding-left: 16px !important;
  }

  .col-assignee {
    width: 14%;
  }

  .col-priority {
    width: 12%;
  }

  .col-status {
    width: 20%;
  }

  .col-date {
    width: 16%;
  }

  .col-actions {
    width: 11%;
    padding-right: 16px !important;
    text-align: center !important;
  }

  .badge {
    padding: 3px 6px;
    font-size: .65rem;
  }

  .status-wrapper {
    display: block;
    width: 100%;
  }

  .status-select {
    width: 100%;
    min-width: 0;
    padding: 5px 18px 5px 5px;
    font-size: .64rem;
  }

  .status-arrow {
    right: 4px;
    width: 10px;
  }

  .actions-cell {
    width: auto;
  }

  .btn-edit {
    font-size: .85rem;
    padding: 2px;
  }
}

@media (max-width: 600px) {
  .col-assignee,
  .col-date {
    display: none;
  }

  .col-task {
    width: 40%;
    padding-left: 14px !important;
  }

  .col-priority {
    width: 16%;
  }

  .col-status {
    width: 28%;
  }

  .col-actions {
    width: 16%;
    padding-right: 14px !important;
  }

  .task-table,
  .task-table thead,
  .task-table thead tr,
  .task-table thead th {
    border: none !important;
    border-collapse: collapse !important;
    border-spacing: 0 !important;
    outline: none !important;
    box-shadow: none !important;
  }

  .task-table thead,
  .task-table thead tr,
  .task-table thead th {
    background: var(--color-structure-base) !important;
    background-image: none !important;
  }

  .task-table thead th {
    padding: 11px 4px;
    font-size: .62rem;
  }

  .task-table thead th:not(:first-child) {
    border-left: none !important;
  }

  .task-table thead th:not(:last-child) {
    border-right: none !important;
  }

  .task-table thead th::before,
  .task-table thead th::after {
    display: none !important;
    content: none !important;
  }

  .task-table th.col-task {
    padding-left: 14px !important;
    text-align: left;
  }

  .task-table th.col-priority,
  .task-table th.col-status,
  .task-table th.col-actions {
    text-align: center !important;
  }

  .task-table th.col-actions {
    padding-right: 14px !important;
  }

  .task-table td {
    padding: 13px 4px;
    font-size: .7rem;
  }

  .task-table td.col-task {
    padding-left: 14px !important;
  }

  .task-table td.col-actions {
    padding-right: 14px !important;
    text-align: center;
  }

  .task-info strong {
    font-size: .74rem;
    line-height: 1.25;
  }

  .task-info small {
    margin-top: 3px;
    font-size: .6rem;
    line-height: 1.25;
  }

  .mobile-due-date {
    display: block;
    margin-top: 5px;
    color: var(--color-text-secondary);
    font-size: .6rem;
    font-weight: 600;
    line-height: 1.2;
    white-space: nowrap;
  }

  .badge {
    padding: 3px 5px;
    font-size: .59rem;
  }

  .status-select {
    padding: 5px 14px 5px 4px;
    font-size: .58rem;
  }

  .status-arrow {
    right: 2px;
    width: 8px;
  }

  .btn-edit {
    font-size: .78rem;
  }
}
</style>