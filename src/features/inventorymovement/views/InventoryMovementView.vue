<template>
  <div class="movimiento-page">
    <div class="content-container">
      <div class="table-section">
        <div class="section-header">
          <div>
            <h1 class="page-title">Movimiento de Inventario</h1>
            <p class="page-subtitle">Gestiona las entradas y salidas de tus productos</p>
          </div>
          <div class="dropdown-container">
            <button class="btn-add" type="button" @click="isDropdownOpen = !isDropdownOpen">
              <span class="btn-icon">+</span> Nuevo Registro
            </button>
            <div v-if="isDropdownOpen" class="dropdown-menu">
              <button class="dropdown-item" @click="openModal('product')">Crear Producto</button>
              <button class="dropdown-item" @click="openModal('stock')">Ingresar Stock</button>
              <button class="dropdown-item" @click="openModal('sale')">Registrar Venta</button>
              <div class="dropdown-divider"></div>
              <button class="dropdown-item" @click="openModal('other')">Ajuste (Otro)</button>
            </div>
          </div>
        </div>

        <div v-if="successMsg" class="alert alert-success">
          <span>{{ successMsg }}</span>
          <button class="alert-close" type="button" @click="successMsg = ''">✕</button>
        </div>

        <div class="table-container">
          <div v-if="isLoading" class="empty-state">
            <div class="spinner"></div>
            <p>Cargando movimientos…</p>
          </div>
          <div v-else>
            <div class="table-wrapper">
              <table class="movimiento-table">
                <thead>
                  <tr>
                    <th v-if="columnasVisibles.id">ID</th>
                    <th v-if="columnasVisibles.fecha">Fecha</th>
                    <th v-if="columnasVisibles.producto">Producto</th>
                    <th v-if="columnasVisibles.tipo">Tipo</th>
                    <th v-if="columnasVisibles.cantidad">Cantidad</th>
                    <th v-if="columnasVisibles.motivo">Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="mov in movimientosPaginados" :key="mov.id">
                    <td v-if="columnasVisibles.id" class="td-id">{{ mov.id.slice(0,8).toUpperCase() }}</td>
                    <td v-if="columnasVisibles.fecha" class="td-fecha">{{ formatFecha(mov.fecha) }}</td>
                    <td v-if="columnasVisibles.producto" class="td-producto">
                      <div class="product-name">{{ getProductName(mov.producto_id) }}</div>
                    </td>
                    <td v-if="columnasVisibles.tipo">
                      <span class="tipo-badge" :class="isInbound(mov.tipo_movimiento) ? 'tipo-badge--entrada' : 'tipo-badge--salida'">
                        {{ isInbound(mov.tipo_movimiento) ? 'Entrada' : 'Salida' }}
                      </span>
                    </td>
                    <td v-if="columnasVisibles.cantidad">
                      <span class="cantidad-num" :class="isInbound(mov.tipo_movimiento) ? 'cantidad-num--entrada' : 'cantidad-num--salida'">
                        {{ isInbound(mov.tipo_movimiento) ? '+' : '-' }}{{ mov.cantidad }}
                      </span>
                    </td>
                    <td v-if="columnasVisibles.motivo" class="td-motivo">{{ mov.motivo ?? '—' }}</td>
                  </tr>
                  <tr v-if="loadError">
                    <td :colspan="columnaCount" class="empty-state empty-state--error">{{ loadError }}</td>
                  </tr>
                  <tr v-else-if="movimientosFiltrados.length === 0">
                    <td :colspan="columnaCount" class="empty-state">
                      <p>{{ emptyStateMessage }}</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div class="pagination-footer" v-if="movimientosFiltrados.length > 0">
              <span class="pagination-info">
                Mostrando {{ startIndex + 1 }} a {{ Math.min(endIndex, movimientosFiltrados.length) }} de {{ movimientosFiltrados.length }} resultados
              </span>
              <div class="pagination-controls">
                <button class="btn-page" :disabled="currentPage === 1" @click="prevPage">Anterior</button>
                
                <div class="page-numbers">
                  <button v-for="page in displayedPages" :key="page" 
                    class="btn-page-number" :class="{ 'active': page === currentPage }"
                    @click="goToPage(page)">
                    {{ page }}
                  </button>
                </div>

                <button class="btn-page" :disabled="currentPage === totalPages" @click="nextPage">Siguiente</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <aside class="filtros-panel">
        <div class="panel-header">
          <h3 class="filtros-titulo">Filtros</h3>
          <button v-if="hasActiveFilters" class="btn-limpiar-text" @click="limpiarFiltros">Limpiar</button>
        </div>

        <div class="filtro-group">
          <p class="filtros-sub">Producto</p>
          <div class="select-wrapper">
            <select v-model="filtroProducto" class="filtro-input">
              <option value="">Todos los productos</option>
              <option v-for="prod in products" :key="prod.id" :value="prod.id">
                {{ prod.nombre }}
              </option>
            </select>
            <div class="select-arrow">▼</div>
          </div>
        </div>

        <div class="filtros-divider" />

        <div class="filtro-group">
          <p class="filtros-sub">Tipo de Movimiento</p>
          <div class="filtros-chips">
            <button v-for="op in opcionesTipo" :key="op.value" class="chip"
              :class="{ 'chip--active': filtroTipo === op.value }" @click="filtroTipo = op.value">
              {{ op.label }}
            </button>
          </div>
        </div>

        <div class="filtros-divider" />

        <div class="filtro-group">
          <p class="filtros-sub">Rango de fechas</p>
          <div class="fecha-inputs">
            <div class="input-group">
              <label>Desde</label>
              <input type="date" class="filtro-input-fecha" v-model="filtroFechaDesde" />
            </div>
            <div class="input-group">
              <label>Hasta</label>
              <input type="date" class="filtro-input-fecha" v-model="filtroFechaHasta" />
            </div>
          </div>
        </div>

        <div class="filtros-divider" />
        
        <div class="filtro-group">
          <p class="filtros-sub">Columnas Visibles</p>
          <ul class="filtros-list">
            <li v-for="col in todasColumnas" :key="col.key" @click="toggleColumna(col.key)" class="col-item">
              <span class="checkbox" :class="{ checked: columnasVisibles[col.key] }">
                <svg v-if="columnasVisibles[col.key]" class="checkbox__check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </span>
              {{ col.label }}
            </li>
          </ul>
        </div>
      </aside>
    </div>

    <NewProductModal
      v-if="showNewProduct"
      :products="products"
      @close="showNewProduct = false"
      @created="onMovementCreated"
    />

    <StockInputModal
      v-if="showStockInput"
      :products="products"
      @close="showStockInput = false"
      @created="onMovementCreated"
    />

    <SaleModal
      v-if="showSale"
      :products="products"
      @close="showSale = false"
      @created="onMovementCreated"
    />

    <NewMovementModal
      v-if="showNewMovement"
      :products="products"
      @close="showNewMovement = false"
      @created="onMovementCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { fetchMovements, isInbound, type InventoryMovement } from '@/features/inventorymovement/api';
import { fetchInventoryProducts } from '@/features/inventory/api';
import type { InventoryProduct } from '@/features/inventory/types';
import NewProductModal from '@/features/inventory/components/NewProductModal.vue';
import StockInputModal from '@/features/inventorymovement/components/StockInputModal.vue';
import SaleModal from '@/features/inventorymovement/components/SaleModal.vue';
import NewMovementModal from '@/features/inventorymovement/components/NewMovementModal.vue';
import { ApiError } from '@/services/apiClient';

const movimientos = ref<InventoryMovement[]>([]);
const products = ref<InventoryProduct[]>([]);
const isLoading = ref(false);
const loadError = ref('');
const successMsg = ref('');

const showNewMovement = ref(false); 
const showNewProduct = ref(false);
const showStockInput = ref(false);
const showSale = ref(false);

const isDropdownOpen = ref(false);

function openModal(modalName: string) {
  isDropdownOpen.value = false;
  if (modalName === 'product') showNewProduct.value = true;
  if (modalName === 'stock') showStockInput.value = true;
  if (modalName === 'sale') showSale.value = true;
  if (modalName === 'other') showNewMovement.value = true;
}

function closeDropdown(e: MouseEvent) {
  const target = e.target as HTMLElement;
  if (!target.closest('.dropdown-container')) {
    isDropdownOpen.value = false;
  }
}

const currentPage = ref(1);
const itemsPerPage = ref(10);

async function load() {
  isLoading.value = true; loadError.value = '';
  try {
    const [movementsResult, productsResult] = await Promise.allSettled([
      fetchMovements(),
      fetchInventoryProducts(),
    ]);

    if (movementsResult.status === 'fulfilled') {
      movimientos.value = movementsResult.value;
    } else if (movementsResult.reason instanceof ApiError && movementsResult.reason.status === 404) {
      movimientos.value = [];
    } else {
      throw movementsResult.reason;
    }

    if (productsResult.status === 'fulfilled') {
      products.value = productsResult.value;
    }
  } catch {
    loadError.value = 'No se pudieron cargar los movimientos.';
    movimientos.value = [];
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  load();
  document.addEventListener('click', closeDropdown);
});

onUnmounted(() => {
  document.removeEventListener('click', closeDropdown);
});

async function onMovementCreated() {
  successMsg.value = 'Movimiento registrado correctamente.';
  await load();
  setTimeout(() => { successMsg.value = ''; }, 5000);
}

function getProductName(id: string) {
  return products.value.find(p => p.id === id)?.nombre ?? id.slice(0, 8) + '…';
}

function formatFecha(iso: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}

const todasColumnas = [
  { key: 'id', label: 'ID' },
  { key: 'fecha', label: 'Fecha' },
  { key: 'producto', label: 'Producto' },
  { key: 'tipo', label: 'Tipo' },
  { key: 'cantidad', label: 'Cantidad' },
  { key: 'motivo', label: 'Motivo' },
] as const;

type ColumnaKey = (typeof todasColumnas)[number]['key'];
type FiltroTipo = 'todos' | 'entrada' | 'salida';

interface MovementFiltersState {
  columnasVisibles?: Partial<Record<ColumnaKey, boolean>>;
  filtroTipo?: FiltroTipo;
  filtroProducto?: string;
  filtroFechaDesde?: string;
  filtroFechaHasta?: string;
}

const MOVEMENT_FILTERS_STORAGE_KEY = 'flowdesk.inventoryMovements.filters.v2';
const DEFAULT_COLUMNAS_VISIBLES: Record<ColumnaKey, boolean> = {
  id: false,
  fecha: true,
  producto: true,
  tipo: true,
  cantidad: true,
  motivo: true,
};

function isFiltroTipo(value: unknown): value is FiltroTipo {
  return value === 'todos' || value === 'entrada' || value === 'salida';
}

function isDateFilter(value: unknown): value is string {
  return typeof value === 'string' && (/^\d{4}-\d{2}-\d{2}$/.test(value) || value === '');
}

function loadSavedFilters(): MovementFiltersState {
  try {
    const saved = localStorage.getItem(MOVEMENT_FILTERS_STORAGE_KEY);
    if (!saved) return {};
    const parsed = JSON.parse(saved) as Partial<MovementFiltersState>;
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function getSavedColumns(savedColumns?: Partial<Record<ColumnaKey, boolean>>): Record<ColumnaKey, boolean> {
  const columns = { ...DEFAULT_COLUMNAS_VISIBLES };
  if (!savedColumns) return columns;

  todasColumnas.forEach(({ key }) => {
    if (typeof savedColumns[key] === 'boolean') {
      columns[key] = savedColumns[key];
    }
  });

  return columns;
}

const savedFilters = loadSavedFilters();
const columnasVisibles = ref<Record<ColumnaKey, boolean>>(getSavedColumns(savedFilters.columnasVisibles));
function toggleColumna(key: ColumnaKey) { columnasVisibles.value[key] = !columnasVisibles.value[key]; }
const columnaCount = computed(() => Math.max(1, Object.values(columnasVisibles.value).filter(Boolean).length));

const filtroTipo = ref<FiltroTipo>(isFiltroTipo(savedFilters.filtroTipo) ? savedFilters.filtroTipo : 'todos');
const filtroProducto = ref(typeof savedFilters.filtroProducto === 'string' ? savedFilters.filtroProducto : '');
const filtroFechaDesde = ref(isDateFilter(savedFilters.filtroFechaDesde) ? savedFilters.filtroFechaDesde : '');
const filtroFechaHasta = ref(isDateFilter(savedFilters.filtroFechaHasta) ? savedFilters.filtroFechaHasta : '');

const opcionesTipo = [
  { value: 'todos' as const, label: 'Todos' },
  { value: 'entrada' as const, label: 'Entrada' },
  { value: 'salida' as const, label: 'Salida' },
];

watch(
  () => ({
    columnasVisibles: columnasVisibles.value,
    filtroTipo: filtroTipo.value,
    filtroProducto: filtroProducto.value,
    filtroFechaDesde: filtroFechaDesde.value,
    filtroFechaHasta: filtroFechaHasta.value,
  }),
  (filters) => {
    localStorage.setItem(MOVEMENT_FILTERS_STORAGE_KEY, JSON.stringify(filters));
  },
  { deep: true },
);

// Reset a la página 1 cuando cambian los filtros
watch([filtroTipo, filtroProducto, filtroFechaDesde, filtroFechaHasta], () => {
  currentPage.value = 1;
});

const movimientosFiltrados = computed(() => movimientos.value.filter(m => {
  if (filtroTipo.value === 'entrada' && !isInbound(m.tipo_movimiento)) return false;
  if (filtroTipo.value === 'salida' && isInbound(m.tipo_movimiento)) return false;
  if (filtroProducto.value && m.producto_id !== filtroProducto.value) return false;
  
  if (m.fecha) {
    const f = m.fecha.slice(0, 10);
    if (filtroFechaDesde.value && f < filtroFechaDesde.value) return false;
    if (filtroFechaHasta.value && f > filtroFechaHasta.value) return false;
  }
  
  return true;
}));

// Lógica de Paginación
const totalPages = computed(() => Math.ceil(movimientosFiltrados.value.length / itemsPerPage.value) || 1);
const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage.value);
const endIndex = computed(() => startIndex.value + itemsPerPage.value);

const movimientosPaginados = computed(() => {
  return movimientosFiltrados.value.slice(startIndex.value, endIndex.value);
});

const displayedPages = computed(() => {
  const pages = [];
  const maxDisplayed = 5;
  let start = Math.max(1, currentPage.value - Math.floor(maxDisplayed / 2));
  let end = start + maxDisplayed - 1;

  if (end > totalPages.value) {
    end = totalPages.value;
    start = Math.max(1, end - maxDisplayed + 1);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  return pages;
});

function nextPage() {
  if (currentPage.value < totalPages.value) currentPage.value++;
}

function prevPage() {
  if (currentPage.value > 1) currentPage.value--;
}

function goToPage(page: number) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
}

const hasActiveFilters = computed(() =>
  filtroTipo.value !== 'todos' || Boolean(filtroProducto.value) || Boolean(filtroFechaDesde.value) || Boolean(filtroFechaHasta.value),
);

const emptyStateMessage = computed(() =>
  movimientos.value.length === 0 && !hasActiveFilters.value
    ? 'No hay movimientos registrados.'
    : 'No hay movimientos para los filtros seleccionados.',
);

function limpiarFiltros() {
  filtroTipo.value = 'todos';
  filtroProducto.value = '';
  filtroFechaDesde.value = '';
  filtroFechaHasta.value = '';
}
</script>

<style scoped>
.movimiento-page {
  padding: 32px 48px;
  min-height: 100vh;
  font-family: var(--font-sans, 'Inter', sans-serif);
  color: var(--color-text, #1e293b);
  background-color: #f8fafc;
}

.content-container {
  display: flex;
  gap: 32px;
  align-items: flex-start;
  max-width: 1400px;
  margin: 0 auto;
}

.table-section {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-title {
  font-size: 2.25rem;
  font-weight: 800;
  margin: 0;
  color: #0f172a;
  letter-spacing: -0.02em;
}

.page-subtitle {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 0.95rem;
}

/* Botón y Dropdown */
.dropdown-container {
  position: relative;
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
  transition: all 0.2s ease;
}

.btn-add:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.3);
}

.btn-icon {
  font-size: 1.2rem;
  font-weight: bold;
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 220px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  padding: 8px 0;
  z-index: 100;
  animation: slideDownMenu 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideDownMenu {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.dropdown-item {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 10px 16px;
  background: none;
  border: none;
  text-align: left;
  font-size: 0.9rem;
  color: #334155;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.dropdown-icon {
  width: 16px;
  height: 16px;
  margin-right: 10px;
  color: #94a3b8;
  transition: color 0.15s;
  flex-shrink: 0;
}

.dropdown-item:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.dropdown-item:hover .dropdown-icon {
  color: var(--color-structure-base, #3b82f6);
}

.dropdown-divider {
  height: 1px;
  background: #e2e8f0;
  margin: 6px 0;
}

.alert {
  padding: 16px 20px;
  border-radius: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
  animation: slideDown 0.3s ease-out;
}

.alert-success {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #bbf7d0;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.alert-close {
  background: none;
  border: none;
  color: inherit;
  font-size: 1.1rem;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.alert-close:hover {
  opacity: 1;
}

.table-container {
  background: #fff;
  border-radius: 12px;
  box-shadow: var(--shadow-card);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.table-wrapper {
  overflow-x: auto;
}

.movimiento-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.movimiento-table thead tr {
  background: var(--color-structure-base);
  border-bottom: 2px solid #e8eef6;
}

.movimiento-table th {
  padding: 14px 20px;
  text-align: left;
  font-weight: 700;
  color: #f0f4f9;
  font-size: 0.85rem;
}

.movimiento-table tbody tr {
  border-bottom: 1px solid #f0f4f9;
  transition: background 0.12s;
}

.movimiento-table tbody tr:last-child {
  border-bottom: none;
}

.movimiento-table tbody tr:hover {
  background: rgba(0, 0, 0, 0.02);
}

.movimiento-table td {
  padding: 14px 20px;
  vertical-align: middle;
  color: var(--color-text-secondary);
}

.td-id {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  font-weight: 600;
  font-family: 'Fira Code', monospace;
}

.td-fecha {
  white-space: nowrap;
  font-weight: 500;
}

.product-name {
  font-weight: 600;
  color: var(--color-text);
}

.td-motivo {
  max-width: 250px;
  line-height: 1.4;
  color: var(--color-text-muted);
}

.tipo-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 99px;
  font-size: 0.78rem;
  font-weight: 600;
}

.tipo-badge--entrada {
  background: #dcfce7;
  color: #15803d;
}

.tipo-badge--salida {
  background: #fee2e2;
  color: #b91c1c;
}

.cantidad-num {
  font-weight: 700;
  font-size: 0.88rem;
}

.cantidad-num--entrada { color: #15803d; }
.cantidad-num--salida { color: #b91c1c; }

/* Empty State */
.empty-state {
  text-align: center;
  padding: 48px 20px;
  color: var(--color-text-muted);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  font-size: 0.88rem;
}

.empty-icon {
  color: #94a3b8;
  margin-bottom: 8px;
}

.empty-state p {
  font-size: 0.88rem;
  font-weight: 400;
  margin: 0;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: var(--color-structure-base, #3b82f6);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* Pagination */
.pagination-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: #fff;
  border-top: 1px solid #f0f4f9;
}

.pagination-info {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  font-weight: 500;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-page {
  padding: 7px 12px;
  background: #fff;
  border: 1.5px solid #dde3ec;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-family: var(--font-sans);
  transition: border-color 0.13s, background 0.13s;
}

.btn-page:not(:disabled):hover {
  border-color: #b0bbd4;
  background: rgba(0, 0, 0, 0.04);
}

.btn-page:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 4px;
}

.btn-page-number {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1.5px solid transparent;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-family: var(--font-sans);
  transition: all 0.13s;
}

.btn-page-number:hover {
  background: #f1f5f9;
}

.btn-page-number.active {
  background: var(--color-structure-base);
  border-color: var(--color-structure-base);
  color: #fff;
}

/* Filters Panel */
.filtros-panel {
  width: 180px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  padding-top: 4px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.filtros-titulo {
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--color-text);
  margin: 0;
}

.btn-limpiar-text {
  background: none;
  border: none;
  color: var(--color-structure-base);
  font-size: 0.72rem;
  font-weight: 600;
  cursor: pointer;
  padding: 3px 6px;
  border-radius: 6px;
  font-family: var(--font-sans);
  transition: background 0.12s;
}

.btn-limpiar-text:hover {
  background: rgba(0, 0, 0, 0.04);
}

.filtro-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filtros-sub {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--color-text-muted);
  margin: 0;
}

.filtros-divider {
  border-top: 1px solid #dde3ec;
  margin: 14px 0;
}

/* Select Box */
.select-wrapper {
  position: relative;
  width: 100%;
}

.filtro-input, .filtro-input-fecha {
  width: 100%;
  padding: 7px 28px 7px 10px;
  border: 1.5px solid #dde3ec;
  border-radius: 8px;
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  background: #ffffff;
  outline: none;
  font-family: var(--font-sans);
  transition: border-color 0.13s, box-shadow 0.13s;
  appearance: none;
}

.filtro-input-fecha {
  padding-right: 8px;
}

.filtro-input:focus, .filtro-input-fecha:focus {
  border-color: var(--color-structure-base);
  box-shadow: 0 0 0 2px var(--color-structure-subtle);
}

.select-arrow {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  font-size: 0.6rem;
  color: var(--color-text-muted);
}

/* Chips */
.filtros-chips {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.chip {
  padding: 5px 10px;
  border-radius: 99px;
  border: 1.5px solid #dde3ec;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  text-align: left;
  transition: all 0.13s;
  font-family: var(--font-sans);
}

.chip:hover {
  border-color: #b0bbd4;
  background: rgba(0, 0, 0, 0.04);
}

.chip--active {
  background: var(--color-structure-base);
  border-color: var(--color-structure-base);
  color: #fff;
  font-weight: 600;
}

/* Date Inputs */
.fecha-inputs {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.input-group label {
  font-size: 0.72rem;
  color: var(--color-text-muted);
  font-weight: 500;
}

/* Checkboxes */
.filtros-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.col-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 2px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.83rem;
  color: var(--color-text-secondary);
  transition: background 0.12s;
  user-select: none;
}

.col-item:hover {
  background: rgba(0, 0, 0, 0.04);
}

.checkbox {
  width: 16px;
  height: 16px;
  border: 2px solid #b0bbd4;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: #fff;
  transition: all 0.14s;
}

.checkbox.checked {
  background: #4a90d9;
  border-color: #4a90d9;
}

.checkbox__check {
  width: 10px;
  height: 10px;
  color: #fff;
}

@media (max-width: 900px) {
  .content-container {
    flex-direction: column;
  }

  .filtros-panel {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .movimiento-page {
    width: 100%;
    min-width: 0;
    padding: 20px 16px;
    box-sizing: border-box;
    overflow-x: hidden;
  }

  .content-container {
    width: 100%;
    min-width: 0;
    gap: 24px;
  }

  .table-section {
    width: 100%;
    min-width: 0;
  }

  .section-header {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }

  .page-title {
    font-size: 1.6rem;
    line-height: 1.2;
  }

  .page-subtitle {
    font-size: 0.88rem;
    line-height: 1.4;
  }

  .dropdown-container {
    width: 100%;
  }

  .btn-add {
    width: 100%;
    justify-content: center;
    box-sizing: border-box;
  }

  .dropdown-menu {
    width: 100%;
    right: auto;
    left: 0;
    box-sizing: border-box;
  }

  .table-container {
    width: 100%;
    min-width: 0;
    max-width: 100%;
    box-sizing: border-box;
  }

  .table-container > div {
    width: 100%;
    min-width: 0;
    max-width: 100%;
    box-sizing: border-box;
  }

  .table-wrapper {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    overflow-x: hidden;
  }

  .movimiento-table {
    width: 100%;
    min-width: 0;
    table-layout: fixed;
    font-size: 0.72rem;
  }

  .movimiento-table th,
  .movimiento-table td {
    padding: 10px 6px;
    white-space: normal;
    overflow-wrap: break-word;
  }

  .movimiento-table th:first-child,
  .movimiento-table td:first-child {
    padding-left: 10px;
  }

  .movimiento-table th:last-child,
  .movimiento-table td:last-child {
    padding-right: 12px;
  }

  .movimiento-table th {
    font-size: 0.7rem;
  }

  .movimiento-table th:nth-child(1),
  .movimiento-table td:nth-child(1) {
    width: 22%;
  }

  .movimiento-table th:nth-child(2),
  .movimiento-table td:nth-child(2) {
    width: 23%;
  }

  .movimiento-table th:nth-child(3),
  .movimiento-table td:nth-child(3) {
    width: 18%;
  }

  .movimiento-table th:nth-child(4),
  .movimiento-table td:nth-child(4) {
    width: 17%;
  }

  .movimiento-table th:nth-child(5),
  .movimiento-table td:nth-child(5) {
    width: 20%;
  }

  .product-name,
  .td-motivo {
    white-space: normal;
    overflow-wrap: break-word;
  }

  .tipo-badge {
    padding: 3px 6px;
    font-size: 0.68rem;
  }

  .cantidad-num {
    font-size: 0.72rem;
  }
  .pagination-footer {
    width: 100%;
    max-width: 100%;
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    padding: 14px;
    box-sizing: border-box;
    overflow: hidden;
  }

  .pagination-info {
    display: block;
    width: 100%;
    max-width: 100%;
    text-align: center;
    white-space: normal;
    overflow-wrap: anywhere;
    line-height: 1.4;
    box-sizing: border-box;
  }

  .pagination-controls {
    width: 100%;
    max-width: 100%;
    justify-content: center;
    flex-wrap: wrap;
    box-sizing: border-box;
  }

  .filtros-panel {
    width: 100%;
    box-sizing: border-box;
    padding: 16px;
    background: #fff;
    border: 1.5px solid #e2e8f0;
    border-radius: 12px;
    box-shadow: var(--shadow-card);
  }

  .filtros-chips {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .chip {
    text-align: center;
  }

  .fecha-inputs {
    width: 100%;
  }

  .filtro-input,
  .filtro-input-fecha {
    box-sizing: border-box;
  }

  .filtros-list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 4px 12px;
  }
}

@media (max-width: 420px) {
  .filtros-list {
    grid-template-columns: 1fr;
  }

  .page-numbers {
    display: none;
  }

  .btn-page {
    flex: 1;
  }
}

</style>