<template>
  <div class="page-container">
    <header class="page-header">
      <div class="header-content">
        <h1 class="page-title">Clientes</h1>
        <p class="page-subtitle">
          Directorio de clientes. Se registran desde Ventas al asignar un cliente a una venta.
        </p>
      </div>
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

        <div v-if="isLoading" class="loading-state-skeletons">
          <div v-for="i in 5" :key="i" class="skeleton-item">
            <div class="skeleton-content">
              <Skeleton width="120px" height="16px" class="mb-2" />
              <Skeleton width="200px" height="12px" />
            </div>
          </div>
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

        <EmptyState v-else description="No hay clientes encontrados." />
      </aside>

      <main class="detail-panel card">
        <EmptyState v-if="!selectedClient" title="Ningún cliente seleccionado" description="Selecciona un cliente de la lista para ver sus detalles."><template #icon><Users :size="48" /></template></EmptyState>

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

          <section class="detail-section" data-testid="client-purchases">
            <h3 class="section-title">Historial de compras</h3>

            <p v-if="isLoadingPurchases" class="purchases-state">Cargando compras...</p>

            <div v-else-if="purchasesError" class="purchases-error">
              <span>{{ purchasesError }}</span>
              <button type="button" class="btn-retry" @click="loadPurchases(selectedClient.id)">Reintentar</button>
            </div>

            <p v-else-if="purchases.length === 0" class="purchases-state">
              Este cliente aún no tiene compras. Asígnalo a una venta desde el módulo de Ventas.
            </p>

            <template v-else>
              <dl class="purchases-summary">
                <div class="purchases-summary__item">
                  <dt>Compras</dt>
                  <dd>{{ completedPurchases.length }}</dd>
                </div>
                <div class="purchases-summary__item">
                  <dt>Total comprado</dt>
                  <dd>{{ formatMoney(totalPurchased) }}</dd>
                </div>
              </dl>

              <ul class="purchase-list">
                <li
                  v-for="sale in purchases"
                  :key="sale.id"
                  class="purchase-row"
                  :class="{ 'purchase-row--voided': sale.estado === SALE_STATE_VOIDED }"
                >
                  <div class="purchase-row__main">
                    <span class="purchase-row__date">{{ formatDate(sale.fecha) }}</span>
                    <span class="purchase-row__items">{{ itemsLabel(sale) }}</span>
                  </div>
                  <span v-if="sale.estado === SALE_STATE_VOIDED" class="purchase-badge">Anulada</span>
                  <span class="purchase-row__total">{{ formatMoney(sale.total) }}</span>
                </li>
              </ul>

              <p v-if="purchases.length >= PURCHASES_LIMIT" class="purchases-note">
                Se muestran las últimas {{ PURCHASES_LIMIT }} ventas; el resumen corresponde a ellas.
              </p>
            </template>
          </section>
        </div>
      </main>
    </div>

    <ClientModal
      v-if="showModal"
      :client="clientToEdit"
      @close="onModalClose"
      @saved="onModalSaved"
      @status-changed="onStatusChanged"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { Search, Phone, Mail, Pencil, MapPin, Users } from 'lucide-vue-next';
import { fetchClients, fetchClientPurchases, type Client } from '@/features/clients/api';
import { SALE_STATE_COMPLETED, SALE_STATE_VOIDED, type Sale } from '@/features/sales/types';
import { useCurrency } from '@/features/currency';
import { getApiErrorMessage } from '@/services/apiClient';
import ClientModal from '@/features/clients/components/ClientModal.vue';
import { Skeleton, EmptyState, Alert } from '@/app/components/ui';

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

// ── Historial de compras del cliente seleccionado ──
const { formatCurrency: formatMoney } = useCurrency();
// Máximo que devuelve el backend por página; si se alcanza, el resumen solo
// cubre esas compras y se avisa en pantalla.
const PURCHASES_LIMIT = 50;
const purchases = ref<Sale[]>([]);
const isLoadingPurchases = ref(false);
const purchasesError = ref('');
let purchasesSeq = 0;

// Las ventas anuladas se muestran en el historial pero no cuentan como compras.
const completedPurchases = computed(() =>
  purchases.value.filter((sale) => sale.estado === SALE_STATE_COMPLETED),
);

const totalPurchased = computed(() =>
  completedPurchases.value.reduce((sum, sale) => sum + Number(sale.total), 0),
);

async function loadPurchases(clientId: string) {
  // Si el usuario cambia de cliente antes de que responda la petición anterior,
  // se descarta esa respuesta para no mostrar compras de otro cliente.
  const seq = ++purchasesSeq;
  isLoadingPurchases.value = true;
  purchasesError.value = '';

  try {
    const result = await fetchClientPurchases(clientId, PURCHASES_LIMIT);
    if (seq !== purchasesSeq) return;
    purchases.value = result;
  } catch (err) {
    if (seq !== purchasesSeq) return;
    purchases.value = [];
    purchasesError.value = getApiErrorMessage(err);
  } finally {
    if (seq === purchasesSeq) isLoadingPurchases.value = false;
  }
}

watch(
  () => selectedClient.value?.id,
  (clientId) => {
    if (clientId) {
      loadPurchases(clientId);
    } else {
      purchasesSeq++;
      purchases.value = [];
      purchasesError.value = '';
      isLoadingPurchases.value = false;
    }
  },
);

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return (
    `${String(date.getDate()).padStart(2, '0')}/` +
    `${String(date.getMonth() + 1).padStart(2, '0')}/` +
    `${date.getFullYear()}`
  );
}

function itemsLabel(sale: Sale): string {
  const count = sale.items?.length ?? 0;
  return count === 1 ? '1 producto' : `${count} productos`;
}

function openEditModal(cli: Client) {
  clientToEdit.value = cli;
  showModal.value = true;
}

function onModalSaved(saved: Client) {
  // Selecciona el cliente recién creado/editado para que quede visible
  // de inmediato en el panel de detalle (antes se quedaba en el que
  // estuviera seleccionado previamente, o en ninguno).
  selectedClient.value = saved;
  showModal.value = false;
  fetchData();
}

function onStatusChanged(updated: Client) {
  // Actualiza en memoria (panel de detalle + fila en la lista) sin volver a
  // pedir la lista todavía: si el cliente activado/desactivado deja de
  // cumplir el filtro actual (p. ej. "Activos"), un fetchData() aquí lo
  // saca de la lista y salta la selección a otro cliente mientras el modal
  // sigue abierto, lo cual es confuso. La lista se reconcilia con el
  // filtro recién al cerrar el modal, en onModalClose().
  clientToEdit.value = updated;
  selectedClient.value = updated;

  const idx = clients.value.findIndex((client) => client.id === updated.id);
  if (idx !== -1) {
    clients.value[idx] = updated;
  }
}

function onModalClose() {
  showModal.value = false;
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
  content: 'âŒ„';
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

.purchases-state {
  margin: 0;
  padding: 20px;
  border: 1px dashed var(--color-bg-border);
  border-radius: 12px;
  color: var(--color-text-muted);
  font-size: 0.9rem;
  text-align: center;
}

.purchases-error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 12px;
  background: var(--color-danger-bg);
  color: var(--color-danger-text);
  font-size: 0.9rem;
}

.btn-retry {
  flex-shrink: 0;
  padding: 6px 14px;
  border: 1px solid currentColor;
  border-radius: 8px;
  background: none;
  color: inherit;
  font-weight: 600;
  cursor: pointer;
}

.purchases-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin: 0 0 12px;
}

.purchases-summary__item {
  padding: 14px 16px;
  border: 1px solid var(--color-bg-border);
  border-radius: 12px;
  background: var(--color-bg-subtle);
}

.purchases-summary__item dt {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  margin-bottom: 4px;
}

.purchases-summary__item dd {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--color-heading);
}

.purchase-list {
  list-style: none;
  margin: 0;
  padding: 0;
  border: 1px solid var(--color-bg-border);
  border-radius: 12px;
  overflow: hidden;
}

.purchase-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-bg-border);
}

.purchase-row:last-child {
  border-bottom: none;
}

.purchase-row__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.purchase-row__date {
  font-weight: 600;
  color: var(--color-heading);
}

.purchase-row__items {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.purchase-row__total {
  font-weight: 700;
  color: var(--color-heading);
  font-variant-numeric: tabular-nums;
}

.purchase-row--voided .purchase-row__total {
  color: var(--color-text-faint);
  text-decoration: line-through;
}

.purchases-note {
  margin: 8px 0 0;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.purchase-badge {
  padding: 2px 8px;
  border-radius: 9999px;
  background: var(--color-danger-bg);
  color: var(--color-danger-text);
  font-size: 0.72rem;
  font-weight: 600;
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
    max-height: 50vh;
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
.loading-state-skeletons {
  padding: 0;
  display: flex;
  flex-direction: column;
}
.skeleton-item {
  padding: 16px;
  border-bottom: 1px solid var(--color-bg-border);
}
.skeleton-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.mb-2 {
  margin-bottom: 4px;
}



