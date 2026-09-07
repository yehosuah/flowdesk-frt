<template>
  <div class="inventario-page">

    <!-- Encabezado móvil/tablet -->
    <div class="mobile-header">
      <h1 class="page-title">Inventario</h1>
      <p class="page-subtitle">
        Consulta los productos disponibles en tu inventario
      </p>
    </div>

    <div class="content-container">

      <!-- INVENTARIO -->
      <div class="table-section">

        <!-- Encabezado escritorio -->
        <div class="desktop-header">
          <h1 class="page-title">Inventario</h1>
          <p class="page-subtitle">
            Consulta los productos disponibles en tu inventario
          </p>
        </div>

        <div class="table-container">

          <div
            v-if="isLoading"
            class="empty-state"
          >
            Cargando productos...
          </div>

          <div
            v-else-if="loadError"
            class="empty-state load-error"
          >
            {{ loadError }}
          </div>

          <template v-else>
            <table class="inventory-table">

              <thead>
                <tr>
                  <th v-if="columnasVisibles.id">
                    ID
                  </th>

                  <th v-if="columnasVisibles.nombre">
                    Nombre
                  </th>

                  <th v-if="columnasVisibles.precio">
                    Precio c/u
                  </th>

                  <th v-if="columnasVisibles.cantidad">
                    Cantidad actual
                  </th>

                  <th v-if="columnasVisibles.descripcion">
                    Descripción
                  </th>

                  <th v-if="columnasVisibles.proveedor">
                    Proveedor
                  </th>
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="producto in productosFiltrados"
                  :key="producto.id"
                  :class="{
                    'row--inactive': !producto.is_active,
                    'row--low-stock':
                      producto.is_active &&
                      producto.cantidad <= producto.stockMinimo,
                  }"
                >

                  <td
                    v-if="columnasVisibles.id"
                    data-label="ID"
                  >
                    {{ producto.id }}
                  </td>

                  <td
                    v-if="columnasVisibles.nombre"
                    data-label="Nombre"
                  >
                    <div class="cell-content">
                      <span>
                        {{ producto.nombre }}
                      </span>

                      <span
                        v-if="!producto.is_active"
                        class="badge badge--inactive"
                      >
                        Inactivo
                      </span>
                    </div>
                  </td>

                  <td
                    v-if="columnasVisibles.precio"
                    data-label="Precio c/u"
                  >
                    Q{{ formatPrice(producto.precio) }}
                  </td>

                  <td
                    v-if="columnasVisibles.cantidad"
                    data-label="Cantidad"
                  >
                    <span
                      class="cantidad-badge"
                      :class="{
                        'cantidad-badge--low':
                          producto.is_active &&
                          producto.cantidad <= producto.stockMinimo
                      }"
                    >
                      {{ formatQuantity(producto.cantidad) }}
                    </span>
                  </td>

                  <td
                    v-if="columnasVisibles.descripcion"
                    data-label="Descripción"
                  >
                    {{ producto.descripcion || 'Sin descripción' }}
                  </td>

                  <td
                    v-if="columnasVisibles.proveedor"
                    data-label="Proveedor"
                  >
                    {{ producto.proveedor ?? '—' }}
                  </td>

                </tr>

                <tr v-if="productosFiltrados.length === 0">
                  <td
                    :colspan="columnaCount"
                    class="empty-state"
                  >
                    No hay productos que coincidan con los filtros.
                  </td>
                </tr>

              </tbody>
            </table>
          </template>

        </div>
      </div>

      <!-- FILTROS -->
      <aside class="filtros-panel">

        <p class="filtros-titulo">
          Filtros
        </p>

        <p class="filtros-sub">
          Columnas visibles
        </p>

        <ul class="filtros-list">
          <li
            v-for="col in todasColumnas"
            :key="col.key"
            @click="toggleColumna(col.key)"
          >
            <span
              class="checkbox"
              :class="{
                checked: columnasVisibles[col.key]
              }"
            >
              <span
                v-if="columnasVisibles[col.key]"
                class="checkbox__check"
              >
                ✓
              </span>
            </span>

            {{ col.label }}
          </li>
        </ul>

        <div class="filtros-divider"></div>

        <p class="filtros-sub">
          Estado
        </p>

        <div class="filtros-chips">
          <button
            v-for="op in opcionesEstado"
            :key="op.value"
            type="button"
            class="chip"
            :class="{
              'chip--active':
                filtroEstado === op.value
            }"
            @click="filtroEstado = op.value"
          >
            {{ op.label }}
          </button>
        </div>

        <div class="filtros-divider"></div>

        <p class="filtros-sub">
          Stock
        </p>

        <div class="filtros-chips">
          <button
            v-for="op in opcionesStock"
            :key="op.value"
            type="button"
            class="chip"
            :class="{
              'chip--active':
                filtroStock === op.value
            }"
            @click="filtroStock = op.value"
          >
            {{ op.label }}
          </button>
        </div>

        <div
          v-if="productosStockBajo > 0"
          class="stock-alerta"
        >
          <p class="stock-alerta__titulo">
            Stock bajo
          </p>

          <p class="stock-alerta__texto">
            {{ productosStockBajo }}
            {{
              productosStockBajo === 1
                ? 'producto necesita'
                : 'productos necesitan'
            }}
            reabastecimiento pronto.
          </p>
        </div>

        <div class="filtros-footer">
          <button
            class="btn-import"
            type="button"
            @click="showImport = true"
          >
            ↑ Importar Excel
          </button>
        </div>

      </aside>
    </div>

    <ImportExcelModal
      v-if="showImport"
      @close="showImport = false"
      @imported="onImported"
    />
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  onMounted,
  watch,
} from 'vue';

import {
  fetchInventoryProducts,
} from '@/features/inventory/api';

import type {
  InventoryProduct,
} from '@/features/inventory/types';

import ImportExcelModal
  from '@/features/inventory/components/ImportExcelModal.vue';

import {
  getApiErrorMessage,
} from '@/services/apiClient';


const productos =
  ref<InventoryProduct[]>([]);

const isLoading = ref(false);
const loadError = ref('');
const showImport = ref(false);


async function loadProductos() {
  isLoading.value = true;
  loadError.value = '';

  try {
    productos.value =
      await fetchInventoryProducts();
  } catch (err) {
    loadError.value =
      getApiErrorMessage(err);
  } finally {
    isLoading.value = false;
  }
}


onMounted(loadProductos);


async function onImported() {
  await loadProductos();
}


function formatPrice(
  value: number,
): string {
  return Number.isFinite(value)
    ? value.toFixed(2)
    : '0.00';
}


function formatQuantity(
  value: number,
): string {
  return Number.isFinite(value)
    ? String(value)
    : '0';
}


const todasColumnas = [
  {
    key: 'id',
    label: 'ID',
  },

  {
    key: 'nombre',
    label: 'Nombre',
  },

  {
    key: 'precio',
    label: 'Precio c/u',
  },

  {
    key: 'cantidad',
    label: 'Cantidad',
  },

  {
    key: 'descripcion',
    label: 'Descripción',
  },

  {
    key: 'proveedor',
    label: 'Proveedor',
  },
] as const;


type ColumnaKey =
  (typeof todasColumnas)[number]['key'];


type FiltroEstado =
  | 'todos'
  | 'activos'
  | 'inactivos';


type FiltroStock =
  | 'todos'
  | 'bajo';


interface InventoryFiltersState {
  columnasVisibles?: Partial<
    Record<ColumnaKey, boolean>
  >;

  filtroEstado?: FiltroEstado;

  filtroStock?: FiltroStock;
}


const INVENTORY_FILTERS_STORAGE_KEY =
  'flowdesk.inventory.filters';


const DEFAULT_COLUMNAS_VISIBLES:
  Record<ColumnaKey, boolean> = {

    id: false,

    nombre: true,

    precio: true,

    cantidad: true,

    descripcion: false,

    proveedor: false,
  };


function isFiltroEstado(
  value: unknown,
): value is FiltroEstado {

  return (
    value === 'todos' ||
    value === 'activos' ||
    value === 'inactivos'
  );
}


function isFiltroStock(
  value: unknown,
): value is FiltroStock {

  return (
    value === 'todos' ||
    value === 'bajo'
  );
}


function loadSavedFilters():
  InventoryFiltersState {

  try {

    const saved =
      localStorage.getItem(
        INVENTORY_FILTERS_STORAGE_KEY,
      );

    if (!saved) {
      return {};
    }

    const parsed =
      JSON.parse(saved) as
        Partial<InventoryFiltersState>;

    return (
      typeof parsed === 'object' &&
      parsed !== null
    )
      ? parsed
      : {};

  } catch {

    return {};

  }
}


function getSavedColumns(
  savedColumns?: Partial<
    Record<ColumnaKey, boolean>
  >,
): Record<ColumnaKey, boolean> {

  const columns = {
    ...DEFAULT_COLUMNAS_VISIBLES,
  };

  if (!savedColumns) {
    return columns;
  }

  todasColumnas.forEach(({ key }) => {

    if (
      typeof savedColumns[key] ===
      'boolean'
    ) {

      columns[key] =
        savedColumns[key];

    }

  });

  return columns;
}


const savedFilters =
  loadSavedFilters();


const columnasVisibles =
  ref<Record<ColumnaKey, boolean>>(
    getSavedColumns(
      savedFilters.columnasVisibles,
    ),
  );


function toggleColumna(
  key: ColumnaKey,
): void {

  columnasVisibles.value[key] =
    !columnasVisibles.value[key];

}


const columnaCount = computed(() =>

  Math.max(
    1,

    Object.values(
      columnasVisibles.value,
    ).filter(Boolean).length,
  ),

);


const filtroEstado =
  ref<FiltroEstado>(

    isFiltroEstado(
      savedFilters.filtroEstado,
    )

      ? savedFilters.filtroEstado

      : 'todos',

  );


const filtroStock =
  ref<FiltroStock>(

    isFiltroStock(
      savedFilters.filtroStock,
    )

      ? savedFilters.filtroStock

      : 'todos',

  );


const opcionesEstado = [

  {
    value: 'todos' as const,
    label: 'Todos',
  },

  {
    value: 'activos' as const,
    label: 'Activos',
  },

  {
    value: 'inactivos' as const,
    label: 'Inactivos',
  },

];


const opcionesStock = [

  {
    value: 'todos' as const,
    label: 'Todos',
  },

  {
    value: 'bajo' as const,
    label: 'Stock bajo',
  },

];


watch(

  () => ({

    columnasVisibles:
      columnasVisibles.value,

    filtroEstado:
      filtroEstado.value,

    filtroStock:
      filtroStock.value,

  }),

  (filters) => {

    localStorage.setItem(

      INVENTORY_FILTERS_STORAGE_KEY,

      JSON.stringify(filters),

    );

  },

  {
    deep: true,
  },

);


const productosFiltrados =
  computed(() => {

    return productos.value

      .filter((producto) => {

        if (
          filtroEstado.value ===
          'activos'
        ) {

          return producto.is_active;

        }

        if (
          filtroEstado.value ===
          'inactivos'
        ) {

          return !producto.is_active;

        }

        return true;

      })

      .filter((producto) => {

        if (
          filtroStock.value ===
          'bajo'
        ) {

          return (
            producto.cantidad <=
            producto.stockMinimo
          );

        }

        return true;

      });

  });


const productosStockBajo =
  computed(() =>

    productos.value.filter(

      (producto) =>

        producto.is_active &&

        producto.cantidad <=
          producto.stockMinimo,

    ).length,

  );
</script>

<style scoped>
.inventario-page {
  padding: 32px 36px;

  min-height: 100vh;

  box-sizing: border-box;

  font-family: var(--font-sans);

  color: var(--color-text);
}


/* =========================
   ENCABEZADOS
   ========================= */

.mobile-header {
  display: none;
}


.page-title {
  margin: 0;

  color: var(--color-text);

  font-size: 2rem;

  font-weight: 700;
}


.page-subtitle {
  margin: 6px 0 20px;

  color: var(--color-text-muted);

  font-size: .95rem;
}


/* =========================
   LAYOUT
   ========================= */

.content-container {
  display: flex;

  align-items: flex-start;

  gap: 32px;
}


.table-section {
  flex: 1;

  min-width: 0;
}


/* =========================
   TABLA ESCRITORIO
   ========================= */

.table-container {
  width: 100%;

  background: #ffffff;

  border-radius: 12px;

  box-shadow: var(--shadow-card);

  overflow: hidden;
}


.inventory-table {
  width: 100%;

  border-collapse: collapse;

  font-size: .875rem;
}


.inventory-table thead tr {
  background:
    var(--color-structure-base);

  border-bottom:
    2px solid #e8eef6;
}


.inventory-table th {
  padding: 14px 20px;

  color: #ffffff;

  font-size: .85rem;

  font-weight: 700;

  text-align: left;
}


.inventory-table tbody tr {
  border-bottom:
    1px solid #f0f4f9;

  transition:
    background .12s;
}


.inventory-table tbody tr:last-child {
  border-bottom: none;
}


.inventory-table td {
  padding: 14px 20px;

  vertical-align: middle;

  color:
    var(--color-text-secondary);

  overflow-wrap: anywhere;
}


.cell-content {
  display: flex;

  align-items: center;

  gap: 8px;

  min-width: 0;
}


/* =========================
   ESTADOS
   ========================= */

.row--inactive {
  opacity: .38;
}


.badge {
  display: inline-block;

  flex-shrink: 0;

  padding: 2px 8px;

  border-radius: 99px;

  font-size: .72rem;

  font-weight: 600;
}


.badge--inactive {
  background: #f0f0f0;

  color: #888;
}


.cantidad-badge {
  display: inline-block;

  padding: 3px 10px;

  border-radius: 99px;

  color:
    var(--color-text-secondary);

  font-size: .82rem;

  font-weight: 600;
}


.cantidad-badge--low {
  background: #fde8e8;

  color: #c03a3a;
}


/* =========================
   EMPTY
   ========================= */

.empty-state {
  padding: 48px 16px;

  color: var(--color-text-muted);

  font-size: .88rem;

  text-align: center;
}


.load-error {
  color: var(--color-accent);
}


/* =========================
   FILTROS
   ========================= */

.filtros-panel {
  width: 180px;

  flex-shrink: 0;

  display: flex;

  flex-direction: column;

  padding-top: 4px;
}


.filtros-titulo {
  margin: 0 0 12px;

  color: var(--color-text);

  font-size: .95rem;

  font-weight: 700;
}


.filtros-sub {
  margin: 0 0 8px;

  color: var(--color-text-muted);

  font-size: .72rem;

  font-weight: 600;
}


.filtros-divider {
  margin: 14px 0;

  border-top:
    1px solid #dde3ec;
}


.filtros-list {
  margin: 0;

  padding: 0;

  list-style: none;
}


.filtros-list li {
  display: flex;

  align-items: center;

  gap: 8px;

  padding: 4px 2px;

  border-radius: 6px;

  color:
    var(--color-text-secondary);

  font-size: .83rem;

  cursor: pointer;

  user-select: none;

  transition:
    background .12s;
}


.filtros-list li:hover {
  background:
    rgba(0, 0, 0, .04);
}


/* =========================
   CHECKBOX
   ========================= */

.checkbox {
  width: 16px;

  height: 16px;

  flex-shrink: 0;

  display: flex;

  align-items: center;

  justify-content: center;

  box-sizing: border-box;

  border:
    2px solid #b0bbd4;

  border-radius: 3px;

  background: #ffffff;

  transition:
    all .14s;
}


.checkbox.checked {
  background: #4a90d9;

  border-color: #4a90d9;
}


.checkbox__check {
  color: #ffffff;

  font-size: .6rem;

  line-height: 1;
}


/* =========================
   CHIPS
   ========================= */

.filtros-chips {
  display: flex;

  flex-direction: column;

  gap: 6px;
}


.chip {
  padding: 5px 10px;

  border:
    1.5px solid #dde3ec;

  border-radius: 99px;

  background: transparent;

  color:
    var(--color-text-secondary);

  font-family:
    var(--font-sans);

  font-size: .8rem;

  font-weight: 500;

  text-align: left;

  cursor: pointer;

  transition:
    all .13s;

  -webkit-tap-highlight-color:
    transparent;
}


.chip:hover:not(.chip--active) {
  border-color: #b0bbd4;

  background:
    rgba(0, 0, 0, .04);
}


.chip--active,
.chip--active:hover,
.chip--active:focus,
.chip--active:focus-visible,
.chip--active:active {
  background:
    var(--color-structure-base) !important;

  border-color:
    var(--color-structure-base) !important;

  color: #ffffff !important;

  font-weight: 600;
}


.chip:focus {
  outline: none;
}


/* =========================
   STOCK ALERT
   ========================= */

.stock-alerta {
  margin-top: 16px;

  padding: 10px 12px;

  background: #fff5f5;

  border:
    1px solid #fde8e8;

  border-radius: 8px;
}


.stock-alerta__titulo {
  margin: 0 0 4px;

  color: #c03a3a;

  font-size: .82rem;

  font-weight: 700;
}


.stock-alerta__texto {
  margin: 0;

  color: #c03a3a;

  font-size: .78rem;

  line-height: 1.4;
}


/* =========================
   IMPORT
   ========================= */

.filtros-footer {
  margin-top: auto;

  padding-top: 20px;
}


.btn-import {
  width: 100%;

  box-sizing: border-box;

  padding: 9px 12px;

  border:
    1.5px solid
    var(--color-structure-subtle);

  border-radius: 8px;

  background: #ffffff;

  color: var(--color-text);

  font-family:
    var(--font-sans);

  font-size: .82rem;

  font-weight: 600;

  text-align: center;

  cursor: pointer;

  transition:
    border-color .15s,
    background .15s;
}


.btn-import:hover {
  border-color:
    var(--color-structure-base);

  background:
    var(--color-structure-subtle);
}


/* =========================================================
   TABLET / RESPONSIVE
   FILTROS PRIMERO -> INVENTARIO DESPUÉS
   ========================================================= */

@media (max-width: 900px) {

  .inventario-page {
    width: 100%;

    max-width: 100%;

    padding: 20px 16px;

    box-sizing: border-box;

    overflow-x: hidden;
  }


  .mobile-header {
    display: block;

    margin-bottom: 20px;
  }


  .desktop-header {
    display: none;
  }


  .mobile-header .page-subtitle {
    margin-bottom: 0;
  }


  .content-container {
    display: flex;

    flex-direction: column;

    width: 100%;

    max-width: 100%;

    gap: 20px;
  }


  /* Filtros primero */

  .filtros-panel {
    order: 1;

    width: 100%;

    box-sizing: border-box;

    padding: 18px;

    background: #ffffff;

    border:
      1px solid #dde3ec;

    border-radius: 12px;

    box-shadow:
      var(--shadow-card);
  }


  /* Inventario después */

  .table-section {
    order: 2;

    width: 100%;

    min-width: 0;
  }


  .page-title {
    font-size: 1.6rem;
  }


  .page-subtitle {
    font-size: .88rem;

    line-height: 1.4;
  }


  /* Filtros */

  .filtros-list {
    display: grid;

    grid-template-columns:
      repeat(
        2,
        minmax(0, 1fr)
      );

    gap: 6px 16px;
  }


  .filtros-chips {
    flex-direction: row;

    flex-wrap: wrap;

    gap: 8px;
  }


  .chip {
    text-align: center;
  }


  .filtros-footer {
    padding-top: 16px;
  }


  /* Contenedor productos */

  .table-container {
    width: 100%;

    max-width: 100%;

    overflow: hidden;

    border:
      1px solid #dde3ec;

    border-radius: 12px;
  }


  /* =========================
     TABLA -> LISTADO COMPACTO
     ========================= */

  .inventory-table,
  .inventory-table tbody {
    display: block;

    width: 100%;
  }


  .inventory-table thead {
    display: none;
  }


  .inventory-table tbody {
    padding: 0;
  }


  .inventory-table tbody tr {
    display: block;

    width: 100%;

    box-sizing: border-box;

    padding: 14px 16px;

    border-bottom:
      1px solid #dde3ec;
  }


  .inventory-table tbody tr:last-child {
    border-bottom: none;
  }


  /*
    Igual que Reportes:
    etiqueta izquierda
    valor derecha
  */

  .inventory-table td {
    display: flex;

    flex-direction: row;

    align-items: flex-start;

    justify-content: space-between;

    gap: 14px;

    width: 100%;

    box-sizing: border-box;

    padding: 6px 0;

    border: none;

    color:
      var(--color-text-secondary);

    font-size: .78rem;

    line-height: 1.35;

    text-align: right;

    white-space: normal;

    overflow-wrap: anywhere;
  }


  .inventory-table td::before {
    content: attr(data-label);

    flex: 0 0 38%;

    color:
      var(--color-text);

    font-size: .75rem;

    font-weight: 700;

    text-align: left;
  }


  /*
    ID puede ser largo.
    Lo mantenemos dentro del ancho.
  */

  .inventory-table td[data-label="ID"] {
    align-items: flex-start;

    word-break: break-all;
  }


  .inventory-table td > * {
    min-width: 0;
  }


  /* Nombre + badge */

  .cell-content {
    display: flex;

    justify-content: flex-end;

    align-items: center;

    flex-wrap: wrap;

    gap: 5px;

    min-width: 0;

    text-align: right;
  }


  /* Cantidad */

  .cantidad-badge {
    padding: 0;

    background: transparent;

    font-size: inherit;
  }


  .cantidad-badge--low {
    padding: 2px 7px;

    background: #fde8e8;
  }


  /* Empty */

  .inventory-table .empty-state {
    display: block;

    padding: 30px 14px;

    text-align: center;
  }


  .inventory-table .empty-state::before {
    display: none;
  }
}


/* =========================================================
   TELÉFONO
   ========================================================= */

@media (max-width: 600px) {

  .inventario-page {
    padding: 20px 16px;
  }


  .mobile-header {
    margin-bottom: 16px;
  }


  .mobile-header .page-title {
    font-size: 1.5rem;
  }


  .mobile-header .page-subtitle {
    font-size: .82rem;
  }


  .content-container {
    gap: 16px;
  }


  /* Filtros */

  .filtros-panel {
    padding: 16px 14px;
  }


  .filtros-titulo {
    font-size: 1rem;
  }


  .filtros-list {
    grid-template-columns:
      repeat(
        2,
        minmax(0, 1fr)
      );

    gap: 5px 12px;
  }


  .filtros-list li {
    min-width: 0;

    font-size: .78rem;
  }


  .filtros-chips {
    gap: 6px;
  }


  .chip {
    padding: 6px 12px;

    font-size: .76rem;
  }


  /* Productos compactos */

  .inventory-table tbody tr {
    padding: 12px 14px;
  }


  .inventory-table td {
    gap: 12px;

    padding: 5px 0;

    font-size: .72rem;
  }


  .inventory-table td::before {
    flex-basis: 40%;

    font-size: .70rem;
  }
}


/* =========================================================
   390 x 844
   ========================================================= */

@media (max-width: 390px) {

  .inventario-page {
    padding-left: 14px;

    padding-right: 14px;
  }


  .filtros-panel {
    padding: 14px 12px;
  }


  .filtros-list {
    grid-template-columns:
      repeat(
        2,
        minmax(0, 1fr)
      );

    gap: 5px 8px;
  }


  .inventory-table tbody tr {
    padding: 11px 12px;
  }


  .inventory-table td {
    gap: 10px;

    padding: 4px 0;

    font-size: .68rem;
  }


  .inventory-table td::before {
    flex-basis: 38%;

    font-size: .67rem;
  }
}
</style>