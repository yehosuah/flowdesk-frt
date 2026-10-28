<template>
  <div class="superAdmin-page">
    <div class="page-header-bar">
      <h1 class="page-title">Manejo de cuentas</h1>
      <button class="btn-add" type="button" @click="showCreateCompanyModal = true">
        + Crear empresa
      </button>
    </div>

    <div v-if="successMsg" class="alert alert-success" style="margin-bottom:16px;">
      <span>{{ successMsg }}</span>
      <button class="alert-close" type="button" @click="successMsg = ''">x</button>
    </div>

    <div class="filter">
      <button :class="['btn', active === 'negocios' ? 'activo' : '']" @click="setActiveTab('negocios')">Negocios</button>
      <button :class="['btn', active === 'usuarios' ? 'activo' : '']" @click="setActiveTab('usuarios')">Usuarios</button>
    </div>

    <div class="display">
      <div v-if="active === 'negocios'" class="list">
        <p v-if="!isLoadingCompanies && !companiesError" class="section-label">
          {{ negocios.length }}
          {{ negocios.length === 1 ? 'negocio registrado' : 'negocios registrados' }}
        </p>
        <div v-if="isLoadingCompanies" class="empty-businesses" data-test="companies-loading">
          Cargando empresas...
        </div>
        <div v-else-if="companiesError" class="empty-businesses empty-businesses--error" data-test="companies-error">
          <span>{{ companiesError }}</span>
          <button class="btn-retry" type="button" @click="loadCompanies">Reintentar</button>
        </div>
        <div v-else-if="negocios.length === 0" class="empty-businesses">
          No hay empresas registradas.
        </div>
        <template v-else>
          <div v-for="negocio in negocios" :key="negocio.id" class="item">
            <div>
              <div class="item-name">{{ negocio.name }}</div>
              <div class="item-meta">{{ negocio.schema_name }}</div>
            </div>
            <span :class="['business-status', negocio.is_active ? 'business-status--active' : 'business-status--inactive']">
              {{ negocio.is_active ? 'Activa' : 'Inactiva' }}
            </span>
          </div>
        </template>
      </div>

      <div v-if="active === 'usuarios'">
        <p class="section-label">
          {{ activeUsersCount }} usuarios activos de {{ usuarios.length }} registrados
        </p>
        <div class="table-container">
          <div v-if="isLoading" class="table-empty">Cargando usuarios...</div>
          <div v-else-if="loadError" class="table-empty table-empty--error" data-test="users-error">
            <span>{{ loadError }}</span>
            <button class="btn-retry" type="button" @click="loadUsers">Reintentar</button>
          </div>
          <table v-else class="emp-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="u in usuarios" :key="u.id">
                <td class="td-name">{{ u.username }}</td>
                <td class="td-email">{{ u.email }}</td>
                <td>
                  <span :class="['role-badge', roleBadgeClass(u.role_name)]">{{ u.role_name }}</span>
                </td>
                <td>
                  <span :class="['status-dot-wrap', u.is_active ? 'status-dot-wrap--active' : 'status-dot-wrap--inactive']">
                    <span class="status-dot"></span>
                    {{ u.is_active ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
              </tr>
              <tr v-if="usuarios.length === 0">
                <td colspan="4" class="table-empty">
                  No hay usuarios para mostrar.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>

    <CreateCompanyModal
      v-if="showCreateCompanyModal"
      @close="showCreateCompanyModal = false"
      @created="onCompanyCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { fetchEmployees, type UserResponse } from '@/features/employees/api';
import { fetchCompanies, type CompanyResponse } from '@/features/roles/api';
import CreateCompanyModal from '@/features/roles/components/CreateCompanyModal.vue';
import { ApiError, getApiErrorMessage } from '@/services/apiClient';

const active = ref<'negocios' | 'usuarios'>('negocios');
const negocios = ref<CompanyResponse[]>([]);
const isLoadingCompanies = ref(false);
const companiesError = ref('');
const usuarios = ref<UserResponse[]>([]);
const isLoading = ref(false);
const loadError = ref('');
const hasLoadedUsers = ref(false);
const showCreateCompanyModal = ref(false);
const successMsg = ref('');
const activeUsersCount = computed(() => usuarios.value.filter(user => user.is_active).length);

// /companies y /auth/register son exclusivos del superadmin en el backend;
// un 403 significa que la sesión no tiene ese rol.
function translateError(error: unknown, resource: string): string {
  if (error instanceof ApiError && error.status === 403) {
    return `Solo el superadministrador puede consultar ${resource}.`;
  }
  return getApiErrorMessage(error);
}

async function loadCompanies(): Promise<void> {
  isLoadingCompanies.value = true;
  companiesError.value = '';

  try {
    negocios.value = await fetchCompanies();
  } catch (error) {
    companiesError.value = translateError(error, 'las empresas');
  } finally {
    isLoadingCompanies.value = false;
  }
}

async function setActiveTab(tab: 'negocios' | 'usuarios'): Promise<void> {
  active.value = tab;

  if (tab === 'usuarios' && !hasLoadedUsers.value && !isLoading.value) {
    await loadUsers();
  }
}

async function loadUsers(): Promise<void> {
  isLoading.value = true;
  loadError.value = '';

  try {
    usuarios.value = await fetchEmployees();
    hasLoadedUsers.value = true;
  } catch (error) {
    loadError.value = translateError(error, 'los usuarios');
  } finally {
    isLoading.value = false;
  }
}

function onCompanyCreated(company: CompanyResponse): void {
  // La respuesta del registro ya es la empresa guardada; se agrega al inicio
  // porque el backend lista las empresas de la más reciente a la más antigua.
  const existingIndex = negocios.value.findIndex(negocio => negocio.id === company.id);

  if (existingIndex >= 0) {
    negocios.value.splice(existingIndex, 1, company);
  } else {
    negocios.value.unshift(company);
  }

  successMsg.value = 'Empresa creada. Se envio el correo de invitacion al administrador.';
  setTimeout(() => { successMsg.value = ''; }, 5000);
}

onMounted(loadCompanies);

function roleBadgeClass(role: string): string {
  if (role === 'admin') return 'role-badge--admin';
  if (role === 'manager') return 'role-badge--manager';
  if (role === 'superadmin') return 'role-badge--superadmin';
  return 'role-badge--emp';
}
</script>

<style scoped>
.superAdmin-page {
  font-family: var(--font-sans);
  background: var(--color-bg-app);
  min-height: 100vh;
  padding: 24px 28px;
  color: var(--color-text);
  display: flex;
  flex-direction: column;
}

.page-header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.page-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--color-heading);
  margin: 0;
}

.btn-add {
  padding: 9px 18px;
  background: var(--color-structure-base);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: .875rem;
  font-weight: 600;
  cursor: pointer;
  font-family: var(--font-sans);
  transition: filter .14s;
}

.btn-add:hover {
  filter: brightness(1.2);
}

.filter {
  display: inline-flex;
  gap: 5px;
  margin-bottom: 20px;
}

.btn {
  padding: 8px 24px;
  border-radius: 8px;
  border: 1.5px solid var(--color-bg-border);
  background: var(--color-bg-surface);
  color: var(--color-text-muted);
  font-size: .9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all .15s;
  font-family: var(--font-sans);
}

.btn.activo {
  border-color: var(--color-warning);
  background: var(--color-warning-bg);
  color: var(--color-warning-text);
}

.section-label {
  font-size: .72rem;
  font-weight: 700;
  color: var(--color-text-muted);
  letter-spacing: .07em;
  text-transform: uppercase;
  margin-bottom: 12px;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.empty-businesses {
  padding: 40px;
  background: var(--color-bg-surface);
  border: 1.5px solid var(--color-structure-subtle);
  border-radius: 10px;
  color: var(--color-text-muted);
  font-size: .88rem;
  text-align: center;
}

.item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  background: var(--color-bg-surface);
  border: 1.5px solid var(--color-structure-subtle);
  border-radius: 10px;
  cursor: pointer;
  transition: all .15s;
}

.item:hover {
  border-color: var(--color-structure-hover);
  box-shadow: var(--shadow-card);
}

.item-name {
  font-size: .92rem;
  font-weight: 600;
  color: var(--color-heading);
}

.item-meta {
  margin-top: 4px;
  color: var(--color-text-muted);
  font-family: monospace;
  font-size: .78rem;
}

.business-status {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 99px;
  font-size: .75rem;
  font-weight: 700;
}

.business-status--active {
  background: var(--color-success-bg);
  color: var(--color-success-text);
}

.business-status--inactive {
  background: var(--color-bg-border);
  color: var(--color-text-muted);
}

.table-container {
  background: var(--color-bg-surface);
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
  background: var(--color-structure-base);
}

.emp-table th {
  padding: 13px 20px;
  text-align: left;
  font-weight: 700;
  color: var(--color-text-on-structure);
  font-size: .82rem;
}

.emp-table tbody tr {
  border-bottom: 1px solid var(--color-bg-border);
  transition: background .12s;
}

.emp-table tbody tr:last-child {
  border-bottom: none;
}

.emp-table tbody tr:hover {
  background: var(--color-bg-subtle);
}

.emp-table td {
  padding: 13px 20px;
  vertical-align: middle;
  color: var(--color-text-secondary);
}

.td-name {
  font-weight: 600;
  color: var(--color-heading);
}

.td-email {
  font-size: .83rem;
  color: var(--color-text-muted);
}

.table-empty {
  text-align: center;
  padding: 40px;
  color: var(--color-text-muted);
  font-size: .88rem;
}

.table-empty--error,
.empty-businesses--error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: var(--color-danger-text);
}

.btn-retry {
  padding: 6px 14px;
  border: 1px solid currentColor;
  border-radius: 8px;
  background: transparent;
  color: inherit;
  font-weight: 600;
  cursor: pointer;
}

.role-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 99px;
  font-size: .75rem;
  font-weight: 700;
  text-transform: capitalize;
}

.role-badge--superadmin,
.role-badge--admin {
  background: var(--color-structure-subtle);
  color: var(--color-structure-hover);
  border: 1px solid var(--color-info-border);
}

.role-badge--manager {
  background: var(--color-info-bg);
  color: var(--color-info-text);
  border: 1px solid var(--color-info-border);
}

.role-badge--emp {
  background: var(--color-pop-honey);
  color: var(--color-warning-text);
  border: 1px solid var(--color-warning-border);
}

.status-dot-wrap {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: .8rem;
  font-weight: 600;
}

.status-dot-wrap--active {
  color: var(--color-success-text);
}

.status-dot-wrap--inactive {
  color: var(--color-text-faint);
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-dot-wrap--active .status-dot {
  background: var(--color-success);
}

.status-dot-wrap--inactive .status-dot {
  background: var(--color-border-strong);
}

</style>
