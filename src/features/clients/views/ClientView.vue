<template>
  <div class="page-container">
    <header class="page-header">
      <div class="header-content">
        <h1 class="page-title">Clientes</h1>
        <p class="page-subtitle">Gestiona el directorio de tus clientes</p>
      </div>

      <button class="btn-add" @click="openCreateModal">
        <span class="btn-icon">+</span> Nuevo Cliente
      </button>
    </header>

    <div v-if="globalError" class="error-alert">
      {{ globalError }}
    </div>

    <div class="split-layout">
      <aside class="master-panel card">
        <div class="toolbar">
          <div class="search-box">
            <Search class="search-icon" :size="16" />
            <input
              v-model="searchQuery"
              type="text"
              class="search-input"
              placeholder="Buscar cliente..."
              @input="onSearch"
            />
          </div>

          <div class="filter-box">
            <details ref="filterDropdown" class="filter-dropdown">
              <summary class="filter-select">
                {{
                  statusFilter === 'all'
                    ? 'Todos'
                    : statusFilter === 'active'
                      ? 'Activos'
                      : 'Inactivos'
                }}
              </summary>

              <div class="filter-options">
                <button
                  type="button"
                  class="filter-option"
                  :class="{ 'filter-option--active': statusFilter === 'all' }"
                  @click="changeStatusFilter('all')"
                >
                  Todos
                </button>

                <button
                  type="button"
                  class="filter-option"
                  :class="{ 'filter-option--active': statusFilter === 'active' }"
                  @click="changeStatusFilter('active')"
                >
                  Activos
                </button>

                <button
                  type="button"
                  class="filter-option"
                  :class="{ 'filter-option--active': statusFilter === 'inactive' }"
                  @click="changeStatusFilter('inactive')"
                >
                  Inactivos
                </button>
              </div>
            </details>
          </div>
        </div>

        <div v-if="isLoading" class="loading-state">
          <div class="spinner"></div>
        </div>

        <ul v-else-if="clients.length > 0" class="client-list">
          <li
            v-for="cli in clients"
            :key="cli.id"
            class="client-item"
            :class="{ active: selectedClient?.id === cli.id }"
            @click="selectClient(cli)"
          >
            <div class="client-item-content">
              <div class="client-name">
                <span
                  v-if="!cli.is_active"
                  class="status-dot status-dot--inactive"
                  title="Inactivo"
                ></span>
                {{ cli.nombre }}
              </div>
              <div class="client-desc">
                {{ cli.correo || cli.telefono || 'Sin datos de contacto' }}
              </div>
            </div>
          </li>
        </ul>

        <div v-else class="empty-state">
          No hay clientes encontrados.
        </div>
      </aside>

      <main class="detail-panel card">
        <div v-if="!selectedClient" class="empty-detail">
          <Users :size="48" class="empty-icon" />
          <h3>Ningún cliente seleccionado</h3>
          <p>Selecciona un cliente de la lista para ver sus detalles.</p>
        </div>

        <div v-else class="detail-content">
          <div class="detail-header">
            <div>
              <div class="detail-title-row">
                <h2 class="detail-name">{{ selectedClient.nombre }}</h2>
                <span
                  class="status-dot"
                  :class="selectedClient.is_active ? 'status-dot--active' : 'status-dot--inactive'"
                  :title="selectedClient.is_active ? 'Activo' : 'Inactivo'"
                ></span>
              </div>
            </div>

            <div class="detail-actions">
              <button
                class="btn-icon-action"
                title="Editar información"
                @click="openEditModal(selectedClient)"
              >
                <Pencil :size="18" />
                Editar
              </button>
            </div>
          </div>

          <section class="detail-section">
            <h3 class="section-title">Información de Contacto</h3>

            <div class="contact-card">
              <div class="contact-row">
                <Phone :size="16" class="contact-icon" />
                <span>{{ selectedClient.telefono || 'No registrado' }}</span>
              </div>

              <div class="contact-row">
                <Mail :size="16" class="contact-icon" />
                <span>{{ selectedClient.correo || 'No registrado' }}</span>
              </div>

              <div class="contact-row">
                <MapPin :size="16" class="contact-icon" />
                <span>{{ selectedClient.direccion || 'No registrada' }}</span>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>

    <ClientModal
      v-if="showModal"
      :client="clientToEdit"
      @close="showModal = false"
      @saved="onModalSaved"
      @status-changed="onStatusChanged"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Search, Phone, Mail, Pencil, MapPin, Users } from 'lucide-vue-next';
import { fetchClients, type Client } from '@/features/clients/api';
import { getApiErrorMessage } from '@/services/apiClient';
import ClientModal from '@/features/clients/components/ClientModal.vue';

const clients = ref<Client[]>([]);
const isLoading = ref(true);
const globalError = ref('');
const searchQuery = ref('');
const statusFilter = ref<'all' | 'active' | 'inactive'>('active');
const filterDropdown = ref<HTMLDetailsElement | null>(null);
const selectedClient = ref<Client | null>(null);
const showModal = ref(false);
const clientToEdit = ref<Client | null>(null);

let searchTimeout: ReturnType<typeof setTimeout>;

async function fetchData() {
  isLoading.value = true;
  globalError.value = '';

  try {
    const activeOnlyParam = statusFilter.value === 'active';
    let results = await fetchClients(searchQuery.value, activeOnlyParam);

    if (statusFilter.value === 'inactive') {
      results = results.filter((client) => !client.is_active);
    }

    clients.value = results;

    if (!selectedClient.value && clients.value.length > 0) {
      selectedClient.value = clients.value[0];
    } else if (selectedClient.value) {
      const stillExists = clients.value.find(
        (client) => client.id === selectedClient.value?.id,
      );

      selectedClient.value =
        stillExists || (clients.value.length > 0 ? clients.value[0] : null);
    }
  } catch (err) {
    globalError.value = getApiErrorMessage(err);
  } finally {
    isLoading.value = false;
  }
}

function onSearch() {
  clearTimeout(searchTimeout);

  searchTimeout = setTimeout(() => {
    fetchData();
  }, 400);
}

function changeStatusFilter(value: 'all' | 'active' | 'inactive') {
  statusFilter.value = value;

  if (filterDropdown.value) {
    filterDropdown.value.open = false;
  }

  fetchData();
}

function selectClient(cli: Client) {
  selectedClient.value = cli;
}

function openCreateModal() {
  clientToEdit.value = null;
  showModal.value = true;
}

function openEditModal(cli: Client) {
  clientToEdit.value = cli;
  showModal.value = true;
}

function onModalSaved() {
  showModal.value = false;
  fetchData();
}

function onStatusChanged(updated: Client) {
  clientToEdit.value = updated;
  fetchData();
}

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.page-container {
  padding: 32px;
  max-width: 1300px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--color-heading);
  margin: 0 0 4px;
}

.page-subtitle {
  color: var(--color-text-muted);
  margin: 0;
  font-size: 1rem;
}

.btn-add {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: var(--color-structure-base, #3b82f6);
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
  transition: all 0.2s;
}

.btn-add:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.3);
}

.card {
  background: var(--color-bg-surface);
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  border: 1px solid var(--color-bg-border);
  overflow: hidden;
}

.split-layout {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 24px;
  align-items: stretch;
}

.master-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 800px;
  min-width: 0;
}

.toolbar {
  padding: 16px;
  border-bottom: 1px solid var(--color-bg-border);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: var(--color-text-faint);
}

.search-input {
  width: 100%;
  box-sizing: border-box;
  padding: 10px 10px 10px 36px;
  border: 1px solid var(--color-bg-border);
  border-radius: 8px;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: var(--color-structure-hover);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.filter-box {
  width: 100%;
  min-width: 0;
  position: relative;
}

.filter-dropdown {
  position: relative;
  width: 100%;
}

.filter-dropdown summary {
  list-style: none;
}

.filter-dropdown summary::-webkit-details-marker {
  display: none;
}

.filter-select {
  position: relative;
  width: 100%;
  box-sizing: border-box;
  padding: 8px 32px 8px 12px;
  border: 1px solid var(--color-bg-border);
  border-radius: 8px;
  background: var(--color-bg-subtle);
  color: var(--color-text);
  font-size: 0.85rem;
  cursor: pointer;
  user-select: none;
}

.filter-select::after {
  content: '⌄';
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-55%);
  color: var(--color-text-faint);
}

.filter-dropdown[open] .filter-select {
  border-radius: 8px 8px 0 0;
}

.filter-options {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 50;

  width: 100%;
  box-sizing: border-box;

  background: var(--color-bg-surface);

  border: 1px solid var(--color-bg-border);
  border-top: none;
  border-radius: 0 0 8px 8px;

  box-shadow: 0 8px 16px rgba(15, 23, 42, 0.12);

  overflow: hidden;
}

.filter-option {
  display: block;
  width: 100%;
  box-sizing: border-box;
  padding: 9px 12px;
  border: none;
  border-bottom: 1px solid var(--color-bg-border);
  background: var(--color-bg-surface);
  color: var(--color-text);
  text-align: left;
  font-family: inherit;
  font-size: 0.85rem;
  cursor: pointer;
}

.filter-option:last-child {
  border-bottom: none;
}

.filter-option:hover {
  background: var(--color-bg-subtle);
}

.filter-option--active {
  background: var(--color-bg-active);
  color: var(--color-structure-hover);
  font-weight: 600;
}

.client-list {
  list-style: none;
  padding: 0;
  margin: 0;
  overflow-y: auto;
  flex: 1;
}

.client-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid var(--color-bg-border);
  cursor: pointer;
  transition: background 0.2s;
}

.client-item:hover {
  background: var(--color-bg-subtle);
}

.client-item.active {
  background: var(--color-bg-active);
  border-left: 4px solid var(--color-structure-base, #3b82f6);
  padding-left: 12px;
}

.client-item-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.client-name {
  font-weight: 600;
  color: var(--color-heading);
  font-size: 0.95rem;
}

.client-desc {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 250px;
}

.detail-panel {
  padding: 32px;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-width: 0;
  box-sizing: border-box;
}

.empty-detail {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--color-text-faint);
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  color: var(--color-text-faint);
  margin-bottom: 16px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--color-bg-border);
}

.detail-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.detail-name {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--color-heading);
  margin: 0;
}

.status-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex-shrink: 0;
  display: inline-block;
}

.status-dot--active {
  background: var(--color-success);
}

.status-dot--inactive {
  background: var(--color-danger);
}

.client-name .status-dot {
  width: 7px;
  height: 7px;
  margin-right: 7px;
  vertical-align: middle;
}

.detail-actions {
  display: flex;
  gap: 12px;
}

.btn-icon-action {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: 1px solid var(--color-bg-border);
  border-radius: 8px;
  background: var(--color-bg-subtle);
  color: var(--color-text);
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-icon-action:hover {
  background: var(--color-bg-hover);
  border-color: var(--color-text-faint);
}

.detail-section {
  margin-top: 24px;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-heading);
  margin-bottom: 16px;
}

.contact-card {
  background: var(--color-bg-subtle);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  border: 1px solid var(--color-bg-border);
}

.contact-row {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--color-text);
  font-size: 0.95rem;
}

.contact-icon {
  color: var(--color-text-faint);
  flex-shrink: 0;
}

.loading-state,
.empty-state {
  padding: 48px 20px;
  text-align: center;
  color: var(--color-text-muted);
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--color-bg-border);
  border-top-color: var(--color-structure-base, #3b82f6);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-alert {
  margin-bottom: 20px;
  padding: 16px;
  background: var(--color-danger-bg);
  color: var(--color-danger-text);
  border-radius: 8px;
  text-align: center;
  font-weight: 500;
}

@media (max-width: 768px) {
  .page-container {
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
    font-size: 0.88rem;
    line-height: 1.4;
  }

  .btn-add {
    width: 100%;
    justify-content: center;
    box-sizing: border-box;
  }

  .split-layout {
    width: 100%;
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
  }

  .master-panel {
    width: 100%;
    height: auto;
    max-height: none;
    box-sizing: border-box;
    overflow: visible;
  }

  .toolbar {
    position: relative;
    z-index: 10;
    border-radius: 16px 16px 0 0;
  }

  .client-list {
    position: relative;
    z-index: 1;
  }

  .detail-panel {
    width: 100%;
    height: auto;
    padding: 20px 16px;
    box-sizing: border-box;
  }

  .toolbar {
    padding: 14px;
  }

  .client-list {
    max-height: 240px;
  }

  .client-desc {
    max-width: 100%;
  }

  .detail-header {
    flex-direction: column;
    align-items: stretch;
    gap: 14px;
    margin-bottom: 20px;
    padding-bottom: 18px;
  }

  .detail-name {
    font-size: 1.3rem;
  }

  .detail-actions {
    width: 100%;
  }

  .btn-icon-action {
    width: 100%;
    justify-content: center;
    box-sizing: border-box;
  }

  .contact-card {
    padding: 16px;
  }

  .contact-row {
    align-items: flex-start;
    font-size: 0.88rem;
    min-width: 0;
  }

  .contact-row span {
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .filter-dropdown,
  .filter-select,
  .filter-options {
    max-width: 100%;
  }
}
</style>