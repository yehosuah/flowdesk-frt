<template>
  <div class="employees-page">
    <div class="page-header-bar">
      <h1 class="page-title">Empleados</h1>

      <button
        class="btn-add"
        type="button"
        @click="showAddModal = true"
      >
        + Agregar empleado
      </button>
    </div>

    <div
      v-if="successMsg"
      class="alert alert-success"
    >
      <span>{{ successMsg }}</span>

      <button
        class="alert-close"
        type="button"
        @click="successMsg = ''"
      >
        ✕
      </button>
    </div>

    <div class="table-container">
      <div
        v-if="isLoading"
        class="table-empty"
      >
        Cargando empleados…
      </div>

      <div
        v-else-if="loadError"
        class="table-empty table-empty--error"
      >
        {{ loadError }}
      </div>

      <table
        v-else
        class="emp-table"
      >
        <thead>
          <tr>
            <th>Nombre de usuario</th>
            <th>Correo electrónico</th>
            <th>Rol</th>
            <th>Estado</th>
            <th>Miembro desde</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="u in empleados"
            :key="u.id"
          >
            <td
              class="td-name"
              data-label="Nombre de usuario"
            >
              {{ u.username }}
            </td>

            <td
              class="td-email"
              data-label="Correo electrónico"
            >
              {{ u.email }}
            </td>

            <td data-label="Rol">
              <span
                :class="[
                  'role-badge',
                  roleBadgeClass(u.role_name)
                ]"
              >
                {{ u.role_name }}
              </span>
            </td>

            <td data-label="Estado">
              <span
                :class="[
                  'status-wrap',
                  u.is_active
                    ? 'status-wrap--active'
                    : 'status-wrap--inactive'
                ]"
              >
                <span class="status-dot"></span>

                {{ u.is_active ? 'Activo' : 'Inactivo' }}
              </span>
            </td>

            <td
              class="td-date"
              data-label="Miembro desde"
            >
              {{ formatDate(u.created_at) }}
            </td>

            <td
              class="td-actions"
              data-label="Acciones"
            >
              <button
                v-if="u.role_name !== 'superadmin'"
                type="button"
                class="btn-edit"
                @click="openEditModal(u)"
              >
                Editar
              </button>

              <span
                v-else
                class="no-action"
              >
                —
              </span>
            </td>
          </tr>

          <tr
            v-if="empleados.length === 0 && !isLoading"
            class="empty-row"
          >
            <td
              colspan="6"
              class="table-empty"
            >
              No hay empleados registrados aún.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      v-if="!isLoading && empleados.length > 0"
      class="summary-bar"
    >
      <span class="summary-item">
        <strong>{{ empleados.length }}</strong>
        empleados en total
      </span>

      <span class="summary-item summary-item--active">
        <strong>{{ activeCount }}</strong>
        activos
      </span>

      <span class="summary-item summary-item--inactive">
        <strong>{{ inactiveCount }}</strong>
        inactivos
      </span>
    </div>

    <AddEmployeeModal
      v-if="showAddModal"
      @close="showAddModal = false"
      @created="onEmployeeCreated"
    />

    <EditEmployeeModal
      v-if="showEditModal && selectedEmployee"
      :employee="selectedEmployee"
      @close="showEditModal = false"
      @updated="onEmployeeUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  onMounted,
} from 'vue';

import {
  fetchEmployees,
  type UserResponse,
} from '@/features/employees/api';

import AddEmployeeModal from '@/features/employees/components/AddEmployeeModal.vue';
import EditEmployeeModal from '@/features/employees/components/EditEmployeeModal.vue';

import {
  getApiErrorMessage,
} from '@/services/apiClient';

const empleados = ref<UserResponse[]>([]);

const isLoading = ref(false);
const loadError = ref('');

const showAddModal = ref(false);
const showEditModal = ref(false);

const selectedEmployee =
  ref<UserResponse | null>(null);

const successMsg = ref('');

const activeCount = computed(() =>
  empleados.value.filter(
    (employee) => employee.is_active,
  ).length,
);

const inactiveCount = computed(() =>
  empleados.value.filter(
    (employee) => !employee.is_active,
  ).length,
);

async function loadEmpleados() {
  isLoading.value = true;
  loadError.value = '';

  try {
    empleados.value =
      await fetchEmployees();
  } catch (err) {
    loadError.value =
      getApiErrorMessage(err);
  } finally {
    isLoading.value = false;
  }
}

onMounted(loadEmpleados);

async function onEmployeeCreated() {
  showAddModal.value = false;

  successMsg.value =
    'Empleado agregado. Se envió una invitación por correo.';

  await loadEmpleados();

  setTimeout(() => {
    successMsg.value = '';
  }, 5000);
}

function openEditModal(
  employee: UserResponse,
) {
  selectedEmployee.value = employee;
  showEditModal.value = true;
}

async function onEmployeeUpdated() {
  showEditModal.value = false;

  successMsg.value =
    'Empleado actualizado correctamente.';

  await loadEmpleados();

  setTimeout(() => {
    successMsg.value = '';
  }, 5000);
}

function roleBadgeClass(
  role: string,
): string {
  if (role === 'admin') {
    return 'role-badge--admin';
  }

  if (role === 'manager') {
    return 'role-badge--manager';
  }

  return 'role-badge--emp';
}

function formatDate(
  iso: string,
): string {
  const date = new Date(iso);

  return date.toLocaleDateString(
    'es-GT',
    {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    },
  );
}
</script>

<style scoped>
.employees-page {
  width: 100%;
  min-height: 100vh;

  box-sizing: border-box;

  display: flex;
  flex-direction: column;

  gap: 20px;

  padding: 32px 36px;

  font-family: var(--font-sans);

  color: var(--color-text);
}

.page-header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 20px;
}

.page-title {
  margin: 0;

  color: var(--color-text);

  font-size: 2rem;
  font-weight: 700;
}

.btn-add {
  flex-shrink: 0;

  padding: 9px 18px;

  border: none;
  border-radius: 8px;

  background:
    var(--color-structure-base);

  color: #ffffff;

  font-family: var(--font-sans);

  font-size: .875rem;
  font-weight: 600;

  cursor: pointer;

  transition: filter .14s;
}

.btn-add:hover {
  filter: brightness(1.2);
}

.alert {
  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 16px;

  width: 100%;

  box-sizing: border-box;

  padding: 12px 16px;

  border-radius: 8px;
}

.alert-success {
  background: #ecfdf5;

  border: 1px solid #bbf7d0;

  color: #166534;
}

.alert-close {
  flex-shrink: 0;

  padding: 0;

  border: none;

  background: transparent;

  color: inherit;

  font-size: 1rem;

  cursor: pointer;
}

.table-container {
  width: 100%;
  max-width: 100%;

  background: #ffffff;

  border-radius: 12px;

  box-shadow: var(--shadow-card);

  overflow: hidden;
}

.emp-table {
  width: 100%;

  border-collapse: collapse;

  font-size: .875rem;
}

.emp-table thead tr {
  background:
    var(--color-structure-base);
}

.emp-table th {
  padding: 13px 20px;

  color: #f0f4f9;

  font-size: .82rem;
  font-weight: 700;

  text-align: left;
}

.emp-table th:last-child {
  text-align: right;
}

.emp-table tbody tr {
  border-bottom:
    1px solid #f0f4f9;

  transition: background .12s;
}

.emp-table tbody tr:last-child {
  border-bottom: none;
}

.emp-table tbody tr:hover {
  background: #f8fafc;
}

.emp-table td {
  padding: 13px 20px;

  vertical-align: middle;

  color:
    var(--color-text-secondary);
}

.td-name {
  color:
    var(--color-structure-base);

  font-weight: 600;
}

.td-email {
  color:
    var(--color-text-muted);

  font-size: .83rem;

  overflow-wrap: anywhere;
}

.td-date {
  color:
    var(--color-text-muted);

  font-size: .8rem;

  white-space: nowrap;
}

.td-actions {
  text-align: right;

  white-space: nowrap;
}

.btn-edit {
  padding: 6px 14px;

  border:
    1.5px solid
    var(--color-structure-subtle);

  border-radius: 7px;

  background: none;

  color:
    var(--color-structure-hover);

  font-family:
    var(--font-sans);

  font-size: .78rem;
  font-weight: 600;

  cursor: pointer;

  transition: all .13s;
}

.btn-edit:hover {
  border-color:
    var(--color-structure-base);

  background:
    var(--color-structure-subtle);
}

.no-action {
  color: #b0bbd4;
}

.table-empty {
  padding: 48px;

  color:
    var(--color-text-muted);

  font-size: .88rem;

  text-align: center;
}

.table-empty--error {
  color: #c03a3a;
}

.role-badge {
  display: inline-block;

  padding: 3px 10px;

  border-radius: 99px;

  font-size: .75rem;
  font-weight: 700;

  text-transform: capitalize;
}

.role-badge--admin {
  background:
    var(--color-structure-subtle);

  border:
    1px solid
    var(--color-info-border);

  color:
    var(--color-structure-hover);
}

.role-badge--manager {
  background:
    var(--color-info-bg);

  border:
    1px solid
    var(--color-info-border);

  color: #1565c0;
}

.role-badge--emp {
  background:
    var(--color-pop-honey);

  border:
    1px solid
    var(--color-warning-border);

  color: #b37400;
}

.status-wrap {
  display: inline-flex;
  align-items: center;

  gap: 5px;

  font-size: .8rem;
  font-weight: 600;
}

.status-wrap--active {
  color: #2e7d32;
}

.status-wrap--inactive {
  color: #b0bbd4;
}

.status-dot {
  width: 7px;
  height: 7px;

  flex-shrink: 0;

  border-radius: 50%;
}

.status-wrap--active .status-dot {
  background: #4caf50;
}

.status-wrap--inactive .status-dot {
  background: #b0bbd4;
}

.summary-bar {
  display: flex;
  align-items: center;

  gap: 20px;

  padding: 12px 20px;

  background:
    var(--color-bg-surface);

  border:
    1.5px solid
    var(--color-structure-subtle);

  border-radius: 10px;

  color:
    var(--color-text-muted);

  font-size: .85rem;
}

.summary-item strong {
  color: var(--color-text);

  font-weight: 700;
}

.summary-item--active strong {
  color: #2e7d32;
}

.summary-item--inactive strong {
  color: #b0bbd4;
}

@media (max-width: 900px) {
  .employees-page {
    padding: 20px 16px;
  }

  .page-title {
    font-size: 1.6rem;
  }

  .table-container {
    overflow: hidden;
  }

  .emp-table,
  .emp-table tbody {
    display: block;

    width: 100%;
  }

  .emp-table thead {
    display: none;
  }

  .emp-table tbody tr {
    display: block;

    width: 100%;

    box-sizing: border-box;

    padding: 14px 16px;

    border-bottom:
      1px solid #dde3ec;
  }

  .emp-table tbody tr:last-child {
    border-bottom: none;
  }

  .emp-table tbody tr:hover {
    background: #ffffff;
  }

  .emp-table td {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;

    gap: 16px;

    width: 100%;

    box-sizing: border-box;

    padding: 6px 0;

    border: none;

    color:
      var(--color-text-secondary);

    font-size: .78rem;

    text-align: right;

    white-space: normal;

    overflow-wrap: anywhere;
  }

  .emp-table td::before {
    content: attr(data-label);

    flex: 0 0 38%;

    color: var(--color-text);

    font-size: .75rem;
    font-weight: 700;

    text-align: left;
  }

  .td-name {
    color:
      var(--color-structure-base);
  }

  .td-email {
    font-size: .76rem;
  }

  .td-date {
    font-size: .76rem;

    white-space: normal;
  }

  .td-actions {
    align-items: center;

    text-align: right;
  }

  .btn-edit {
    padding: 5px 12px;

    font-size: .72rem;
  }

  .empty-row {
    padding: 0 !important;
  }

  .empty-row .table-empty {
    display: block;

    padding: 32px 16px;

    text-align: center;
  }

  .empty-row .table-empty::before {
    display: none;
  }

  .summary-bar {
    flex-wrap: wrap;

    gap: 10px 18px;
  }
}

@media (max-width: 600px) {
  .employees-page {
    gap: 16px;

    padding: 20px 16px;
  }

  .page-header-bar {
    flex-direction: column;
    align-items: stretch;

    gap: 14px;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .btn-add {
    width: 100%;

    box-sizing: border-box;

    padding: 10px 14px;

    text-align: center;
  }

  .emp-table tbody tr {
    padding: 12px 14px;
  }

  .emp-table td {
    gap: 12px;

    padding: 5px 0;

    font-size: .72rem;
  }

  .emp-table td::before {
    flex-basis: 40%;

    font-size: .7rem;
  }

  .role-badge {
    padding: 2px 8px;

    font-size: .68rem;
  }

  .status-wrap {
    font-size: .7rem;
  }

  .summary-bar {
    display: grid;

    grid-template-columns:
      repeat(2, minmax(0, 1fr));

    gap: 8px 12px;

    padding: 12px 14px;

    font-size: .75rem;
  }

  .summary-item:first-child {
    grid-column: 1 / -1;
  }
}

@media (max-width: 390px) {
  .employees-page {
    padding-left: 14px;
    padding-right: 14px;
  }

  .emp-table tbody tr {
    padding: 11px 12px;
  }

  .emp-table td {
    gap: 10px;

    padding: 4px 0;

    font-size: .68rem;
  }

  .emp-table td::before {
    flex-basis: 40%;

    font-size: .67rem;
  }
}
</style>