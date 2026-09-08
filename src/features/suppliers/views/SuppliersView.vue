<template>
  <div class="page-container">
    <header class="page-header">
      <div class="header-content">
        <h1 class="page-title">Proveedores</h1>
        <p class="page-subtitle">Gestiona el directorio de tus proveedores y contactos</p>
      </div>
      <button class="btn-add" @click="openCreateModal">
        <span class="btn-icon">+</span> Nuevo Proveedor
      </button>
    </header>

    <div v-if="globalError" class="error-alert">
      {{ globalError }}
    </div>

    <div class="split-layout">
      <!-- PANEL IZQUIERDO: MASTER LIST -->
      <aside class="master-panel card">
        <div class="toolbar">
          <div class="search-box">
            <Search class="search-icon" :size="16" />
            <input 
              v-model="searchQuery" 
              type="text" 
              class="search-input" 
              placeholder="Buscar proveedor..." 
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
        
        <ul v-else-if="suppliers.length > 0" class="supplier-list">
          <li 
            v-for="sup in suppliers" 
            :key="sup.id" 
            class="supplier-item"
            :class="{ active: selectedSupplier?.id === sup.id }"
            @click="selectSupplier(sup)"
          >
            <div class="supplier-item-content">
              <div class="supplier-name">
                <span
                  v-if="!sup.is_active"
                  class="status-dot status-dot--inactive"
                  title="Inactivo"
                ></span>
                {{ sup.nombre }}
              </div>
            </div>
          </li>
        </ul>

        <div v-else class="empty-state">
          No hay proveedores encontrados.
        </div>
      </aside>

      <!-- PANEL DERECHO: DETALLES -->
      <main class="detail-panel card">
        <div v-if="!selectedSupplier" class="empty-detail">
          <Building2 :size="48" class="empty-icon" />
          <h3>Ningún proveedor seleccionado</h3>
          <p>Selecciona un proveedor de la lista para ver sus detalles.</p>
        </div>

        <div v-else class="detail-content">
          <!-- Detail Header -->
          <div class="detail-header">
            <div>
              <div class="detail-title-row">
                <h2 class="detail-name">{{ selectedSupplier.nombre }}</h2>
                <span
                  class="status-dot"
                  :class="selectedSupplier.is_active ? 'status-dot--active' : 'status-dot--inactive'"
                  :title="selectedSupplier.is_active ? 'Activo' : 'Inactivo'"
                ></span>
              </div>
            </div>
            <div class="detail-actions">
              <button class="btn-icon-action" @click="openEditModal(selectedSupplier)" title="Editar información">
                <Pencil :size="18" /> Editar
              </button>
            </div>
          </div>

            <section class="detail-section">
              <h3 class="section-title">Información de Contacto</h3>
              <div class="contact-card">
                <div class="contact-row">
                  <Phone :size="16" class="contact-icon" />
                  <span>{{ selectedSupplier.telefono || 'No registrado' }}</span>
                </div>
                <div class="contact-row">
                  <Mail :size="16" class="contact-icon" />
                  <span>{{ selectedSupplier.correo || 'No registrado' }}</span>
                </div>
                <div class="contact-row">
                  <MapPin :size="16" class="contact-icon" />
                  <span>{{ selectedSupplier.direccion || 'No registrada' }}</span>
                </div>
              </div>
            </section>

          <section class="detail-section mt-4">
            <h3 class="section-title">Productos que Provee (Catálogo)</h3>
            <div class="dummy-table-container">
              <div v-if="productsLoading" class="loading-state" style="padding: 24px;">Cargando productos...</div>
              <table v-else class="dummy-table">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Producto</th>
                    <th>Precio de Compra</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="p in supplierProducts" :key="p.product_id">
                    <td class="td-sku">{{ p.product_sku }}</td>
                    <td class="font-medium">{{ p.product_name }}</td>
                    <td>Q{{ Number(p.quotation).toFixed(2) }}</td>
                  </tr>
                  <tr v-if="supplierProducts.length === 0">
                    <td colspan="3" class="empty-state" style="padding: 24px; text-align: center;">Este proveedor aún no tiene productos asociados.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

        </div>
      </main>
    </div>

    <!-- Modal (Paso 3) -->
    <SupplierModal
      v-if="showModal"
      :supplier="supplierToEdit"
      @close="showModal = false"
      @saved="onModalSaved"
      @status-changed="onStatusChanged"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { Search, Phone, Mail, Pencil, MapPin, Building2 } from 'lucide-vue-next';
import { fetchSuppliers, fetchSupplierProducts, type Supplier, type SupplierProductResponse } from '@/features/suppliers/api';
import { getApiErrorMessage } from '@/services/apiClient';
import SupplierModal from '@/features/suppliers/components/SupplierModal.vue';

// Estado General
const suppliers = ref<Supplier[]>([]);
const isLoading = ref(true);
const globalError = ref('');
const searchQuery = ref('');
const statusFilter = ref<'all' | 'active' | 'inactive'>('active');
const filterDropdown = ref<HTMLDetailsElement | null>(null);

// Master-Detail State
const selectedSupplier = ref<Supplier | null>(null);

// Supplier Products
const supplierProducts = ref<SupplierProductResponse[]>([]);
const productsLoading = ref(false);

// Variables Modal
const showModal = ref(false);
const supplierToEdit = ref<Supplier | null>(null);

// Buscador
let searchTimeout: ReturnType<typeof setTimeout>;

async function loadProducts(supplierId: string) {
  productsLoading.value = true;
  try {
    supplierProducts.value = await fetchSupplierProducts(supplierId);
  } catch (err) {
    supplierProducts.value = [];
  } finally {
    productsLoading.value = false;
  }
}

watch(selectedSupplier, (newVal) => {
  if (newVal) {
    loadProducts(newVal.id);
  } else {
    supplierProducts.value = [];
  }
});

async function fetchData() {
  isLoading.value = true;
  globalError.value = '';
  try {
    const isActiveParam = statusFilter.value === 'all' ? undefined : (statusFilter.value === 'active');
    suppliers.value = await fetchSuppliers(searchQuery.value, isActiveParam);
    
    // Auto-seleccionar el primero si no hay selección o la selección ya no existe
    if (!selectedSupplier.value && suppliers.value.length > 0) {
      selectedSupplier.value = suppliers.value[0];
    } else if (selectedSupplier.value) {
      const stillExists = suppliers.value.find(s => s.id === selectedSupplier.value?.id);
      selectedSupplier.value = stillExists || (suppliers.value.length > 0 ? suppliers.value[0] : null);
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
  }, 400); // 400ms debounce
}

function changeStatusFilter(value: 'all' | 'active' | 'inactive') {
  statusFilter.value = value;

  if (filterDropdown.value) {
    filterDropdown.value.open = false;
  }

  fetchData();
}

function selectSupplier(sup: Supplier) {
  selectedSupplier.value = sup;
}



function onStatusChanged(updated: Supplier) {
  supplierToEdit.value = updated;
  fetchData();
}

function openCreateModal() {
  supplierToEdit.value = null;
  showModal.value = true;
}

function openEditModal(sup: Supplier) {
  supplierToEdit.value = sup;
  showModal.value = true;
}

function onModalSaved() {
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

/* Master-Detail Layout */
.split-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 24px;
  align-items: stretch;
}

/* Left Panel */
.master-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 800px;
}

.toolbar {
  padding: 16px;
  border-bottom: 1px solid var(--color-bg-border);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.toolbar {
  position: relative;
  z-index: 10;
  padding: 14px;
  border-radius: 16px 16px 0 0;
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
  padding: 10px 10px 10px 36px;
  border: 1px solid var(--color-bg-border);
  border-radius: 8px;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: var(--color-structure-hover);
  box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
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

.supplier-list {
  list-style: none;
  padding: 0;
  margin: 0;
  overflow-y: auto;
  flex: 1;
}

.supplier-list {
  position: relative;
  z-index: 1;
  max-height: 240px;
}

.filter-dropdown,
.filter-select,
.filter-options {
  max-width: 100%;
}

.supplier-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid var(--color-bg-border);
  cursor: pointer;
  transition: background 0.2s;
}

.supplier-item:hover {
  background: var(--color-bg-subtle);
}

.supplier-item.active {
  background: var(--color-bg-active);
  border-left: 4px solid var(--color-structure-base, #3b82f6);
  padding-left: 12px; /* Compensate border */
}

.supplier-item-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.supplier-name {
  font-weight: 600;
  color: var(--color-heading);
  font-size: 0.95rem;
}

.supplier-desc {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 250px;
}

.dot-active {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-success);
}
.dot-inactive {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-text-faint);
}


/* Right Panel */
.detail-panel {
  padding: 32px;
  height: 100%;
  display: flex;
  flex-direction: column;
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

.supplier-name .status-dot {
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
}

/* Dummy Tables */
.dummy-table-container {
  border: 1px solid var(--color-bg-border);
  border-radius: 12px;
  overflow: hidden;
}

.dummy-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.85rem;
}

.dummy-table th {
  background: var(--color-structure-base);
  padding: 12px 16px;
  color: var(--color-text-on-structure);
  font-weight: 700;
  border-bottom: none;
}

.dummy-table td {
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-bg-border);
  color: var(--color-text);
}

.dummy-table tbody tr:last-child td {
  border-bottom: none;
}

.dummy-table tbody tr:hover {
  background: var(--color-bg-subtle);
}

.td-sku { font-family: monospace; color: var(--color-text-muted); }
.font-medium { font-weight: 600; color: var(--color-heading); }
.text-success { color: var(--color-success-text); font-weight: 600; }
.text-danger { color: var(--color-danger-text); font-weight: 600; }
.flex-align { display: flex; align-items: center; gap: 6px; }
.inline-icon { color: var(--color-text-faint); }
.mt-4 { margin-top: 32px; }

/* Status Badge */
.status-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: opacity 0.2s;
}

.status-badge:hover:not(:disabled) { opacity: 0.8; }
.status-active { background: var(--color-success-bg); color: var(--color-success-text); }
.status-inactive { background: var(--color-bg-hover); color: var(--color-text-secondary); }
.status-badge:disabled { opacity: 0.5; cursor: wait; }

.loading-state, .empty-state {
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

@keyframes spin { to { transform: rotate(360deg); } }

.error-alert {
  margin-bottom: 20px;
  padding: 16px;
  background: var(--color-danger-bg);
  color: var(--color-danger-text);
  border-radius: 8px;
  text-align: center;
  font-weight: 500;
}

@media (max-width: 1100px) {
  .page-container {
    width: 100%;
    max-width: 100%;
    padding: 24px 20px;
    box-sizing: border-box;
    overflow-x: hidden;
  }

  .page-header {
    width: 100%;
    gap: 16px;
  }

  .split-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    width: 100%;
    max-width: 100%;
    gap: 20px;
  }

  .master-panel {
    width: 100%;
    min-width: 0;
    max-width: 100%;
    height: auto;
    max-height: none;
    box-sizing: border-box;
    overflow: visible;
  }

  .supplier-list {
    max-height: 240px;
  }

  .detail-panel {
    width: 100%;
    min-width: 0;
    max-width: 100%;
    height: auto;
    padding: 24px;
    box-sizing: border-box;
  }

  .detail-content {
    width: 100%;
    min-width: 0;
    max-width: 100%;
  }

  .contact-card {
    width: 100%;
    box-sizing: border-box;
  }

  .contact-row {
    min-width: 0;
  }

  .contact-row span {
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .dummy-table-container {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    overflow: hidden;
  }

  .dummy-table {
    width: 100%;
    table-layout: fixed;
  }

  .dummy-table th,
  .dummy-table td {
    padding: 10px 12px;
    white-space: normal;
    overflow-wrap: anywhere;
    word-break: normal;
  }

  .dummy-table th:nth-child(1),
  .dummy-table td:nth-child(1) {
    width: 24%;
  }

  .dummy-table th:nth-child(2),
  .dummy-table td:nth-child(2) {
    width: 46%;
  }

  .dummy-table th:nth-child(3),
  .dummy-table td:nth-child(3) {
    width: 30%;
  }
}

@media (max-width: 768px) {
  .page-container {
    padding: 20px 16px;
  }

  .page-header {
    flex-direction: column;
    align-items: stretch;
    gap: 14px;
  }

  .header-content {
    width: 100%;
  }

  .page-title {
    font-size: 1.6rem;
  }

  .page-subtitle {
    font-size: .88rem;
    line-height: 1.4;
  }

  .btn-add {
    width: 100%;
    box-sizing: border-box;
    justify-content: center;
    padding: 10px 14px;
  }

  .split-layout {
    gap: 16px;
  }

  .detail-panel {
    padding: 20px 16px;
  }

  .detail-header {
    margin-bottom: 24px;
    padding-bottom: 18px;
  }

  .detail-name {
    font-size: 1.25rem;
  }

  .section-title {
    font-size: 1rem;
  }

  .contact-card {
    padding: 16px;
    gap: 12px;
  }

  .contact-row {
    font-size: .85rem;
  }

  .mt-4 {
    margin-top: 24px;
  }

  .dummy-table {
    font-size: .78rem;
  }

  .dummy-table th,
  .dummy-table td {
    padding: 9px 10px;
  }
}

@media (max-width: 480px) {
  .page-container {
    padding: 18px 14px;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .toolbar {
    padding: 12px;
  }

  .supplier-item {
    padding: 13px 12px;
  }

  .supplier-item.active {
    padding-left: 8px;
  }

  .supplier-name {
    font-size: .85rem;
  }

  .detail-panel {
    padding: 16px 14px;
  }

  .detail-header {
    align-items: center;
    gap: 10px;
  }

  .detail-name {
    min-width: 0;
    font-size: 1.1rem;
    overflow-wrap: anywhere;
  }

  .btn-icon-action {
    flex-shrink: 0;
    padding: 7px 11px;
    font-size: .78rem;
  }

  .section-title {
    font-size: .9rem;
  }

  .contact-card {
    padding: 14px;
  }

  .contact-row {
    gap: 9px;
    font-size: .78rem;
  }

  .dummy-table {
    font-size: .7rem;
  }

  .dummy-table th,
  .dummy-table td {
    padding: 8px 8px;
  }

  .dummy-table th:nth-child(1),
  .dummy-table td:nth-child(1) {
    width: 25%;
  }

  .dummy-table th:nth-child(2),
  .dummy-table td:nth-child(2) {
    width: 45%;
  }

  .dummy-table th:nth-child(3),
  .dummy-table td:nth-child(3) {
    width: 30%;
  }

  .td-sku {
    overflow-wrap: anywhere;
  }
}
</style>
