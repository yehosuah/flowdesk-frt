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
          <td
            class="task-column col-task"
            data-label="Tarea"
          >
            <div class="task-info">
              <strong :title="task.title">
                {{ task.title }}
              </strong>

              <small
                class="task-description"
                :title="task.description"
              >
                {{ task.description }}
              </small>
            </div>
          </td>

          <td
            class="col-assignee"
            data-label="Responsable"
          >
            {{ task.assignee }}
          </td>

          <td
            class="col-priority"
            data-label="Prioridad"
          >
            <span
              class="badge"
              :class="priorityClass(task.priority)"
            >
              {{ task.priority }}
            </span>
          </td>

          <td
            class="col-status"
            data-label="Estado"
          >
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
                <option value="Pendiente">
                  Pendiente
                </option>

                <option value="En progreso">
                  En progreso
                </option>

                <option value="Completada">
                  Completada
                </option>
              </select>

              <ChevronDown
                :size="14"
                class="status-arrow"
              />
            </div>
          </td>

          <td
            class="col-date"
            data-label="Fecha límite"
          >
            {{ formatDate(task.dueDate) }}
          </td>

          <td
            class="actions-cell col-actions"
            data-label="Acciones"
          >
            <button
              class="btn-edit"
              type="button"
              title="Editar tarea"
              @click="emit('edit', task)"
            >
              ✏️
            </button>
          </td>
        </tr>

        <tr
          v-if="tasks.length === 0"
          class="empty-row"
        >
          <td
            colspan="6"
            class="empty-state"
          >
            No hay tareas registradas.
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next';

import type {
  Task,
  TaskPriority,
  TaskStatus,
} from '../types';

defineProps<{
  tasks: Task[];
}>();

const emit = defineEmits<{
  (e: 'edit', task: Task): void;

  (
    e: 'status-change',
    id: number,
    status: TaskStatus
  ): void;
}>();

function priorityClass(
  priority: TaskPriority
) {
  return {
    'badge--high':
      priority === 'Alta',

    'badge--medium':
      priority === 'Media',

    'badge--low':
      priority === 'Baja',
  };
}

function statusClass(
  status: TaskStatus
) {
  return {
    'badge--pending':
      status === 'Pendiente',

    'badge--progress':
      status === 'En progreso',

    'badge--completed':
      status === 'Completada',
  };
}

function formatDate(
  date: string
): string {
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

  const taskDate =
    new Date(`${date}T00:00:00`);

  const day =
    String(
      taskDate.getDate()
    ).padStart(2, '0');

  const month =
    months[taskDate.getMonth()];

  const year =
    taskDate.getFullYear();

  return `${day} - ${month} - ${year}`;
}
</script>

<style scoped>
.table-container {
  width: 100%;
  max-width: 100%;

  background: #ffffff;

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

.task-table thead,
.task-table thead tr {
  background:
    var(--color-structure-base);
}

.task-table th {
  padding: 16px 20px;

  border: none;

  background:
    var(--color-structure-base);

  color: #ffffff;

  font-size: .85rem;
  font-weight: 700;

  text-align: left;
}

.task-table th.col-actions {
  text-align: center;
}

.task-table td {
  padding: 18px 20px;

  border-bottom:
    1px solid #edf1f7;

  color:
    var(--color-text-secondary);
}

.task-table tbody tr:last-child td {
  border-bottom: none;
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

  color: var(--color-text);

  white-space: nowrap;

  text-overflow: ellipsis;
}

.task-info small {
  margin-top: 4px;

  overflow: hidden;

  color:
    var(--color-text-secondary);

  white-space: nowrap;

  text-overflow: ellipsis;
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

.status-wrapper {
  position: relative;

  display: inline-block;
}

.status-select {
  min-width: 145px;

  padding:
    6px 34px 6px 14px;

  appearance: none;

  border: none;
  border-radius: 999px;

  outline: none;

  font-family: inherit;

  font-size: .75rem;
  font-weight: 600;

  text-align: center;

  cursor: pointer;
}

.status-arrow {
  position: absolute;

  top: 50%;
  right: 12px;

  transform:
    translateY(-50%);

  color: inherit;

  pointer-events: none;
}

.actions-cell {
  width: 90px;

  text-align: center;
}

.btn-edit {
  padding: 2px;

  border: none;

  background: transparent;

  font-size: 1.1rem;

  cursor: pointer;

  transition: transform .2s;
}

.btn-edit:hover {
  transform: scale(1.15);
}

.empty-state {
  padding: 40px;

  color:
    var(--color-text-secondary);

  text-align: center;
}

@media (max-width: 1100px) {
  .task-table,
  .task-table tbody {
    display: block;

    width: 100%;
  }

  .task-table thead {
    display: none;
  }

  .task-table tbody {
    padding: 0;
  }

  .task-table tbody tr {
    display: block;

    width: 100%;

    box-sizing: border-box;

    padding: 18px 22px;

    border-bottom:
      1px solid #e2e8f0;
  }

  .task-table tbody tr:last-child {
    border-bottom: none;
  }

  .task-table td {
    display: flex;
    align-items: center;
    justify-content: space-between;

    gap: 20px;

    width: 100%;

    box-sizing: border-box;

    padding: 7px 0;

    border: none;

    font-size: .85rem;

    text-align: right;

    white-space: normal;

    overflow-wrap: anywhere;
  }

  .task-table td::before {
    content: attr(data-label);

    flex: 0 0 34%;

    color: var(--color-text);

    font-size: .82rem;
    font-weight: 700;

    text-align: left;
  }

  .task-column {
    width: 100%;
    max-width: none;
  }

  .task-info {
    width: auto;
    max-width: 62%;

    align-items: flex-end;

    text-align: right;

    overflow: visible;
  }

  .task-info strong {
    width: 100%;

    color: var(--color-text);

    font-size: .9rem;

    white-space: normal;

    overflow-wrap: anywhere;

    text-align: right;
  }

  .task-info small {
    width: 100%;

    margin-top: 3px;

    font-size: .78rem;

    white-space: normal;

    overflow-wrap: anywhere;

    text-align: right;
  }

  .col-assignee,
  .col-priority,
  .col-status,
  .col-date,
  .col-actions {
    width: 100%;
  }

  .status-wrapper {
    width: auto;
  }

  .status-select {
    width: auto;
    min-width: 145px;

    padding:
      6px 32px 6px 14px;
  }

  .actions-cell {
    width: 100%;

    text-align: right;
  }

  .empty-row {
    padding: 0 !important;
  }

  .empty-row .empty-state {
    display: block;

    padding: 32px 16px;

    text-align: center;
  }

  .empty-row .empty-state::before {
    display: none;
  }
}

@media (max-width: 768px) {
  .task-table tbody tr {
    padding: 16px 18px;
  }

  .task-table td {
    gap: 16px;

    padding: 6px 0;

    font-size: .78rem;
  }

  .task-table td::before {
    flex-basis: 38%;

    font-size: .76rem;
  }

  .task-info {
    max-width: 58%;
  }

  .task-info strong {
    font-size: .8rem;
  }

  .task-info small {
    font-size: .68rem;
  }

  .badge {
    padding: 3px 8px;

    font-size: .68rem;
  }

  .status-select {
    min-width: 130px;

    padding:
      5px 28px 5px 12px;

    font-size: .68rem;
  }

  .status-arrow {
    right: 9px;

    width: 11px;
  }

  .btn-edit {
    font-size: .9rem;
  }
}

@media (max-width: 480px) {
  .task-table tbody tr {
    padding: 14px 16px;
  }

  .task-table td {
    gap: 12px;

    padding: 5px 0;

    font-size: .72rem;
  }

  .task-table td::before {
    flex: 0 0 40%;

    font-size: .7rem;
  }

  .task-info {
    max-width: 56%;
  }

  .task-info strong {
    font-size: .74rem;
  }

  .task-info small {
    font-size: .62rem;

    line-height: 1.3;
  }

  .badge {
    padding: 3px 7px;

    font-size: .62rem;
  }

  .status-select {
    min-width: 115px;

    padding:
      5px 24px 5px 10px;

    font-size: .62rem;
  }

  .status-arrow {
    right: 7px;

    width: 10px;
  }

  .btn-edit {
    font-size: .82rem;
  }
}

@media (max-width: 390px) {
  .task-table tbody tr {
    padding: 13px 14px;
  }

  .task-table td {
    gap: 10px;

    padding: 4px 0;

    font-size: .68rem;
  }

  .task-table td::before {
    flex-basis: 40%;

    font-size: .67rem;
  }

  .task-info {
    max-width: 56%;
  }

  .task-info strong {
    font-size: .7rem;
  }

  .task-info small {
    font-size: .58rem;
  }

  .badge {
    font-size: .58rem;
  }

  .status-select {
    min-width: 105px;

    padding:
      5px 22px 5px 8px;

    font-size: .58rem;
  }

  .status-arrow {
    right: 6px;

    width: 9px;
  }

  .btn-edit {
    font-size: .78rem;
  }
}
</style>