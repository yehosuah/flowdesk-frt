<template>
  <div class="movimiento-page">
    <div class="content-container">
      <div class="table-section">
        <div class="section-header">
          <div class="header-copy">
            <h1 class="page-title">Movimiento de Inventario</h1>
            <p class="page-subtitle">
              Gestiona las entradas y salidas de tus productos
            </p>
          </div>

          <div class="dropdown-container">
            <button
              class="btn-add"
              type="button"
              @click="isDropdownOpen = !isDropdownOpen"
            >
              <span class="btn-icon">+</span>
              <span>Nuevo Registro</span>
            </button>

            <div
              v-if="isDropdownOpen"
              class="dropdown-menu"
            >
              <button
                class="dropdown-item"
                type="button"
                @click="openModal('product')"
              >
                Crear Producto
              </button>

              <button
                class="dropdown-item"
                type="button"
                @click="openModal('stock')"
              >
                Ingresar Stock
              </button>

              <button
                class="dropdown-item"
                type="button"
                @click="openModal('sale')"
              >
                Registrar Venta
              </button>

              <div class="dropdown-divider"></div>

              <button
                class="dropdown-item"
                type="button"
                @click="openModal('other')"
              >
                Ajuste (Otro)
              </button>
            </div>
          </div>
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
            class="loading-state"
          >
            <div class="spinner"></div>
            <p>Cargando movimientos…</p>
          </div>

          <div v-else class="table-content">
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
                  <tr
                    v-for="mov in movimientosPaginados"
                    :key="mov.id"
                    class="movement-row"
                  >
                    <td
                      v-if="columnasVisibles.id"
                      class="td-id"
                      data-label="ID"
                    >
                      {{ mov.id.slice(0, 8).toUpperCase() }}
                    </td>

                    <td
                      v-if="columnasVisibles.fecha"
                      class="td-fecha"
                      data-label="Fecha"
                    >
                      {{ formatFecha(mov.fecha) }}
                    </td>

                    <td
                      v-if="columnasVisibles.producto"
                      class="td-producto"
                      data-label="Producto"
                    >
                      <div class="product-name">
                        {{ getProductName(mov.producto_id) }}
                      </div>
                    </td>

                    <td
                      v-if="columnasVisibles.tipo"
                      data-label="Tipo"
                    >
                      <span
                        class="tipo-badge"
                        :class="
                          isInbound(mov.tipo_movimiento)
                            ? 'tipo-badge--entrada'
                            : 'tipo-badge--salida'
                        "
                      >
                        {{
                          isInbound(mov.tipo_movimiento)
                            ? 'Entrada'
                            : 'Salida'
                        }}
                      </span>
                    </td>

                    <td
                      v-if="columnasVisibles.cantidad"
                      data-label="Cantidad"
                    >
                      <span
                        class="cantidad-num"
                        :class="
                          isInbound(mov.tipo_movimiento)
                            ? 'cantidad-num--entrada'
                            : 'cantidad-num--salida'
                        "
                      >
                        {{
                          isInbound(mov.tipo_movimiento)
                            ? '+'
                            : '-'
                        }}{{ mov.cantidad }}
                      </span>
                    </td>

                    <td
                      v-if="columnasVisibles.motivo"
                      class="td-motivo"
                      data-label="Motivo"
                    >
                      {{ mov.motivo ?? '—' }}
                    </td>
                  </tr>

                  <tr
                    v-if="loadError"
                    class="empty-row"
                  >
                    <td
                      :colspan="columnaCount"
                      class="empty-state empty-state--error"
                    >
                      {{ loadError }}
                    </td>
                  </tr>

                  <tr
                    v-else-if="movimientosFiltrados.length === 0"
                    class="empty-row"
                  >
                    <td
                      :colspan="columnaCount"
                      class="empty-state"
                    >
                      {{ emptyStateMessage }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div
              v-if="movimientosFiltrados.length > 0"
              class="pagination-footer"
            >
              <span class="pagination-info">
                Mostrando {{ startIndex + 1 }} a
                {{
                  Math.min(
                    endIndex,
                    movimientosFiltrados.length
                  )
                }}
                de {{ movimientosFiltrados.length }} resultados
              </span>

              <div class="pagination-controls">
                <button
                  class="btn-page"
                  :disabled="currentPage === 1"
                  @click="prevPage"
                >
                  Anterior
                </button>

                <div class="page-numbers">
                  <button
                    v-for="page in displayedPages"
                    :key="page"
                    class="btn-page-number"
                    :class="{ active: page === currentPage }"
                    @click="goToPage(page)"
                  >
                    {{ page }}
                  </button>
                </div>

                <button
                  class="btn-page"
                  :disabled="currentPage === totalPages"
                  @click="nextPage"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <aside class="filtros-panel">
        <div class="panel-header">
          <h3 class="filtros-titulo">Filtros</h3>

          <button
            v-if="hasActiveFilters"
            class="btn-limpiar-text"
            type="button"
            @click="limpiarFiltros"
          >
            Limpiar
          </button>
        </div>

        <div class="filtro-group">
          <p class="filtros-sub">Producto</p>

          <details
            ref="productDropdown"
            class="custom-select"
          >
            <summary class="custom-select__trigger">
              {{ selectedProductLabel }}
            </summary>

            <div class="custom-select__options">
              <button
                type="button"
                class="custom-select__option"
                :class="{
                  'custom-select__option--active':
                    filtroProducto === ''
                }"
                @click="selectProduct('')"
              >
                Todos los productos
              </button>

              <button
                v-for="prod in products"
                :key="prod.id"
                type="button"
                class="custom-select__option"
                :class="{
                  'custom-select__option--active':
                    filtroProducto === prod.id
                }"
                @click="selectProduct(prod.id)"
              >
                {{ prod.nombre }}
              </button>
            </div>
          </details>
        </div>

        <div class="filtros-divider"></div>

        <div class="filtro-group">
          <p class="filtros-sub">
            Tipo de Movimiento
          </p>

          <div class="filtros-chips">
            <button
              v-for="op in opcionesTipo"
              :key="op.value"
              type="button"
              class="chip"
              :class="{
                'chip--active':
                  filtroTipo === op.value
              }"
              @click="filtroTipo = op.value"
            >
              {{ op.label }}
            </button>
          </div>
        </div>

        <div class="filtros-divider"></div>

        <div class="filtro-group">
          <p class="filtros-sub">
            Rango de fechas
          </p>

          <div class="fecha-inputs">
            <div class="input-group">
              <label>Desde</label>

              <div class="date-picker">
                <button
                  type="button"
                  class="date-picker__trigger"
                  :class="{
                    'date-picker__trigger--active':
                      activeDatePicker === 'desde'
                  }"
                  @click="toggleDatePicker('desde')"
                >
                  <span
                    :class="{
                      'date-placeholder':
                        !filtroFechaDesde
                    }"
                  >
                    {{
                      filtroFechaDesde
                        ? formatFilterDate(
                            filtroFechaDesde
                          )
                        : 'dd/mm/aaaa'
                    }}
                  </span>

                  <CalendarDays
                    :size="16"
                    class="date-picker__icon"
                  />
                </button>

                <div
                  v-if="activeDatePicker === 'desde'"
                  class="calendar-popover"
                >
                  <div class="calendar-header">
                    <button
                      type="button"
                      class="calendar-nav"
                      @click.stop="changeMonth(-1)"
                    >
                      ‹
                    </button>

                    <strong class="calendar-title">
                      {{ calendarTitle }}
                    </strong>

                    <button
                      type="button"
                      class="calendar-nav"
                      @click.stop="changeMonth(1)"
                    >
                      ›
                    </button>
                  </div>

                  <div class="calendar-weekdays">
                    <span
                      v-for="day in weekDays"
                      :key="day"
                    >
                      {{ day }}
                    </span>
                  </div>

                  <div class="calendar-grid">
                    <button
                      v-for="day in calendarDays"
                      :key="day.value"
                      type="button"
                      class="calendar-day"
                      :class="{
                        'calendar-day--outside':
                          !day.currentMonth,
                        'calendar-day--selected':
                          day.value === filtroFechaDesde,
                        'calendar-day--today':
                          day.value === todayValue
                      }"
                      @click="
                        selectDate(
                          'desde',
                          day.value
                        )
                      "
                    >
                      {{ day.day }}
                    </button>
                  </div>

                  <div class="calendar-footer">
                    <button
                      type="button"
                      @click="clearDate('desde')"
                    >
                      Borrar
                    </button>

                    <button
                      type="button"
                      @click="
                        selectDate(
                          'desde',
                          todayValue
                        )
                      "
                    >
                      Hoy
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="input-group">
              <label>Hasta</label>

              <div class="date-picker">
                <button
                  type="button"
                  class="date-picker__trigger"
                  :class="{
                    'date-picker__trigger--active':
                      activeDatePicker === 'hasta'
                  }"
                  @click="toggleDatePicker('hasta')"
                >
                  <span
                    :class="{
                      'date-placeholder':
                        !filtroFechaHasta
                    }"
                  >
                    {{
                      filtroFechaHasta
                        ? formatFilterDate(
                            filtroFechaHasta
                          )
                        : 'dd/mm/aaaa'
                    }}
                  </span>

                  <CalendarDays
                    :size="16"
                    class="date-picker__icon"
                  />
                </button>

                <div
                  v-if="activeDatePicker === 'hasta'"
                  class="calendar-popover"
                >
                  <div class="calendar-header">
                    <button
                      type="button"
                      class="calendar-nav"
                      @click.stop="changeMonth(-1)"
                    >
                      ‹
                    </button>

                    <strong class="calendar-title">
                      {{ calendarTitle }}
                    </strong>

                    <button
                      type="button"
                      class="calendar-nav"
                      @click.stop="changeMonth(1)"
                    >
                      ›
                    </button>
                  </div>

                  <div class="calendar-weekdays">
                    <span
                      v-for="day in weekDays"
                      :key="day"
                    >
                      {{ day }}
                    </span>
                  </div>

                  <div class="calendar-grid">
                    <button
                      v-for="day in calendarDays"
                      :key="day.value"
                      type="button"
                      class="calendar-day"
                      :class="{
                        'calendar-day--outside':
                          !day.currentMonth,
                        'calendar-day--selected':
                          day.value === filtroFechaHasta,
                        'calendar-day--today':
                          day.value === todayValue
                      }"
                      @click="
                        selectDate(
                          'hasta',
                          day.value
                        )
                      "
                    >
                      {{ day.day }}
                    </button>
                  </div>

                  <div class="calendar-footer">
                    <button
                      type="button"
                      @click="clearDate('hasta')"
                    >
                      Borrar
                    </button>

                    <button
                      type="button"
                      @click="
                        selectDate(
                          'hasta',
                          todayValue
                        )
                      "
                    >
                      Hoy
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="filtros-divider"></div>

        <div class="filtro-group">
          <p class="filtros-sub">
            Columnas Visibles
          </p>

          <ul class="filtros-list">
            <li
              v-for="col in todasColumnas"
              :key="col.key"
              class="col-item"
              @click="toggleColumna(col.key)"
            >
              <span
                class="checkbox"
                :class="{
                  checked:
                    columnasVisibles[col.key]
                }"
              >
                <svg
                  v-if="columnasVisibles[col.key]"
                  class="checkbox__check"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="3"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polyline
                    points="20 6 9 17 4 12"
                  />
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
import {
  ref,
  computed,
  onMounted,
  onUnmounted,
  watch,
} from 'vue';

import {
  CalendarDays,
} from 'lucide-vue-next';

import {
  fetchMovements,
  isInbound,
  type InventoryMovement,
} from '@/features/inventorymovement/api';

import {
  fetchInventoryProducts,
} from '@/features/inventory/api';

import type {
  InventoryProduct,
} from '@/features/inventory/types';

import NewProductModal
  from '@/features/inventory/components/NewProductModal.vue';

import StockInputModal
  from '@/features/inventorymovement/components/StockInputModal.vue';

import SaleModal
  from '@/features/inventorymovement/components/SaleModal.vue';

import NewMovementModal
  from '@/features/inventorymovement/components/NewMovementModal.vue';

import {
  ApiError,
} from '@/services/apiClient';

const movimientos =
  ref<InventoryMovement[]>([]);

const products =
  ref<InventoryProduct[]>([]);

const isLoading = ref(false);
const loadError = ref('');
const successMsg = ref('');

const showNewMovement = ref(false);
const showNewProduct = ref(false);
const showStockInput = ref(false);
const showSale = ref(false);

const isDropdownOpen = ref(false);

function openModal(
  modalName: string
) {
  isDropdownOpen.value = false;

  if (modalName === 'product') {
    showNewProduct.value = true;
  }

  if (modalName === 'stock') {
    showStockInput.value = true;
  }

  if (modalName === 'sale') {
    showSale.value = true;
  }

  if (modalName === 'other') {
    showNewMovement.value = true;
  }
}

function closeDropdown(
  event: MouseEvent
) {
  const target =
    event.target as HTMLElement;

  if (
    !target.closest(
      '.dropdown-container'
    )
  ) {
    isDropdownOpen.value = false;
  }
}

const currentPage = ref(1);
const itemsPerPage = ref(10);

async function load() {
  isLoading.value = true;
  loadError.value = '';

  try {
    const [
      movementsResult,
      productsResult,
    ] = await Promise.allSettled([
      fetchMovements(),
      fetchInventoryProducts(),
    ]);

    if (
      movementsResult.status ===
      'fulfilled'
    ) {
      movimientos.value =
        movementsResult.value;
    } else if (
      movementsResult.reason
        instanceof ApiError &&
      movementsResult.reason.status === 404
    ) {
      movimientos.value = [];
    } else {
      throw movementsResult.reason;
    }

    if (
      productsResult.status ===
      'fulfilled'
    ) {
      products.value =
        productsResult.value;
    }
  } catch {
    loadError.value =
      'No se pudieron cargar los movimientos.';

    movimientos.value = [];
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  load();

  document.addEventListener(
    'click',
    closeDropdown
  );
});

onUnmounted(() => {
  document.removeEventListener(
    'click',
    closeDropdown
  );
});

async function onMovementCreated() {
  successMsg.value =
    'Movimiento registrado correctamente.';

  await load();

  setTimeout(() => {
    successMsg.value = '';
  }, 5000);
}

function getProductName(
  id: string
) {
  return (
    products.value.find(
      product =>
        product.id === id
    )?.nombre ??
    id.slice(0, 8) + '…'
  );
}

function formatFecha(
  iso: string
) {
  if (!iso) {
    return '—';
  }

  const date = new Date(iso);

  return (
    `${String(date.getDate()).padStart(2, '0')}/` +
    `${String(date.getMonth() + 1).padStart(2, '0')}/` +
    `${date.getFullYear()}`
  );
}

const todasColumnas = [
  { key: 'id', label: 'ID' },
  { key: 'fecha', label: 'Fecha' },
  { key: 'producto', label: 'Producto' },
  { key: 'tipo', label: 'Tipo' },
  { key: 'cantidad', label: 'Cantidad' },
  { key: 'motivo', label: 'Motivo' },
] as const;

type ColumnaKey =
  (typeof todasColumnas)[number]['key'];

type FiltroTipo =
  | 'todos'
  | 'entrada'
  | 'salida';

interface MovementFiltersState {
  columnasVisibles?: Partial<
    Record<ColumnaKey, boolean>
  >;

  filtroTipo?: FiltroTipo;
  filtroProducto?: string;
  filtroFechaDesde?: string;
  filtroFechaHasta?: string;
}

const MOVEMENT_FILTERS_STORAGE_KEY =
  'flowdesk.inventoryMovements.filters.v2';

const DEFAULT_COLUMNAS_VISIBLES:
  Record<ColumnaKey, boolean> = {
    id: false,
    fecha: true,
    producto: true,
    tipo: true,
    cantidad: true,
    motivo: true,
  };

function isFiltroTipo(
  value: unknown
): value is FiltroTipo {
  return (
    value === 'todos' ||
    value === 'entrada' ||
    value === 'salida'
  );
}

function isDateFilter(
  value: unknown
): value is string {
  return (
    typeof value === 'string' &&
    (
      /^\d{4}-\d{2}-\d{2}$/.test(value) ||
      value === ''
    )
  );
}

function loadSavedFilters():
  MovementFiltersState {
  try {
    const saved =
      localStorage.getItem(
        MOVEMENT_FILTERS_STORAGE_KEY
      );

    if (!saved) {
      return {};
    }

    const parsed =
      JSON.parse(saved) as
        Partial<MovementFiltersState>;

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
  >
): Record<ColumnaKey, boolean> {
  const columns = {
    ...DEFAULT_COLUMNAS_VISIBLES,
  };

  if (!savedColumns) {
    return columns;
  }

  todasColumnas.forEach(
    ({ key }) => {
      if (
        typeof savedColumns[key] ===
        'boolean'
      ) {
        columns[key] =
          savedColumns[key];
      }
    }
  );

  return columns;
}

const savedFilters =
  loadSavedFilters();

const columnasVisibles =
  ref<Record<ColumnaKey, boolean>>(
    getSavedColumns(
      savedFilters.columnasVisibles
    )
  );

function toggleColumna(
  key: ColumnaKey
) {
  columnasVisibles.value[key] =
    !columnasVisibles.value[key];
}

const columnaCount =
  computed(() =>
    Math.max(
      1,
      Object.values(
        columnasVisibles.value
      ).filter(Boolean).length
    )
  );

const filtroTipo =
  ref<FiltroTipo>(
    isFiltroTipo(
      savedFilters.filtroTipo
    )
      ? savedFilters.filtroTipo
      : 'todos'
  );

const filtroProducto =
  ref(
    typeof savedFilters
      .filtroProducto === 'string'
      ? savedFilters.filtroProducto
      : ''
  );

const filtroFechaDesde =
  ref(
    isDateFilter(
      savedFilters.filtroFechaDesde
    )
      ? savedFilters.filtroFechaDesde
      : ''
  );

const filtroFechaHasta =
  ref(
    isDateFilter(
      savedFilters.filtroFechaHasta
    )
      ? savedFilters.filtroFechaHasta
      : ''
  );

const opcionesTipo = [
  {
    value: 'todos' as const,
    label: 'Todos',
  },
  {
    value: 'entrada' as const,
    label: 'Entrada',
  },
  {
    value: 'salida' as const,
    label: 'Salida',
  },
];

const productDropdown =
  ref<HTMLDetailsElement | null>(
    null
  );

const selectedProductLabel =
  computed(() => {
    if (!filtroProducto.value) {
      return 'Todos los productos';
    }

    return (
      products.value.find(
        product =>
          product.id ===
          filtroProducto.value
      )?.nombre ??
      'Todos los productos'
    );
  });

function selectProduct(
  productId: string
) {
  filtroProducto.value =
    productId;

  if (productDropdown.value) {
    productDropdown.value.open =
      false;
  }
}

type DatePickerTarget =
  | 'desde'
  | 'hasta'
  | null;

const activeDatePicker =
  ref<DatePickerTarget>(null);

const calendarCursor =
  ref(new Date());

const weekDays = [
  'Do',
  'Lu',
  'Ma',
  'Mi',
  'Ju',
  'Vi',
  'Sa',
];

const monthNames = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

function toDateValue(
  date: Date
): string {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, '0');

  const day =
    String(
      date.getDate()
    ).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

const todayValue =
  toDateValue(new Date());

function parseDateValue(
  value: string
): Date | null {
  if (!value) {
    return null;
  }

  const [
    year,
    month,
    day,
  ] = value
    .split('-')
    .map(Number);

  if (
    !year ||
    !month ||
    !day
  ) {
    return null;
  }

  return new Date(
    year,
    month - 1,
    day
  );
}

function formatFilterDate(
  value: string
): string {
  const date =
    parseDateValue(value);

  if (!date) {
    return 'dd/mm/aaaa';
  }

  const day =
    String(
      date.getDate()
    ).padStart(2, '0');

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, '0');

  return (
    `${day}/${month}/` +
    `${date.getFullYear()}`
  );
}

function toggleDatePicker(
  target: Exclude<
    DatePickerTarget,
    null
  >
) {
  if (
    activeDatePicker.value ===
    target
  ) {
    activeDatePicker.value =
      null;

    return;
  }

  activeDatePicker.value =
    target;

  const selected =
    target === 'desde'
      ? filtroFechaDesde.value
      : filtroFechaHasta.value;

  calendarCursor.value =
    parseDateValue(selected) ??
    new Date();
}

const calendarTitle =
  computed(() =>
    `${
      monthNames[
        calendarCursor.value
          .getMonth()
      ]
    } ${
      calendarCursor.value
        .getFullYear()
    }`
  );

const calendarDays =
  computed(() => {
    const year =
      calendarCursor.value
        .getFullYear();

    const month =
      calendarCursor.value
        .getMonth();

    const firstDay =
      new Date(
        year,
        month,
        1
      );

    const startDate =
      new Date(
        year,
        month,
        1 -
          firstDay.getDay()
      );

    return Array.from(
      { length: 42 },
      (_, index) => {
        const date =
          new Date(startDate);

        date.setDate(
          startDate.getDate() +
            index
        );

        return {
          value:
            toDateValue(date),

          day:
            date.getDate(),

          currentMonth:
            date.getMonth() ===
            month,
        };
      }
    );
  });

function changeMonth(
  offset: number
) {
  calendarCursor.value =
    new Date(
      calendarCursor.value
        .getFullYear(),
      calendarCursor.value
        .getMonth() + offset,
      1
    );
}

function selectDate(
  target: Exclude<
    DatePickerTarget,
    null
  >,
  value: string
) {
  if (target === 'desde') {
    filtroFechaDesde.value =
      value;
  } else {
    filtroFechaHasta.value =
      value;
  }

  activeDatePicker.value =
    null;
}

function clearDate(
  target: Exclude<
    DatePickerTarget,
    null
  >
) {
  if (target === 'desde') {
    filtroFechaDesde.value = '';
  } else {
    filtroFechaHasta.value = '';
  }

  activeDatePicker.value =
    null;
}

watch(
  () => ({
    columnasVisibles:
      columnasVisibles.value,

    filtroTipo:
      filtroTipo.value,

    filtroProducto:
      filtroProducto.value,

    filtroFechaDesde:
      filtroFechaDesde.value,

    filtroFechaHasta:
      filtroFechaHasta.value,
  }),

  filters => {
    localStorage.setItem(
      MOVEMENT_FILTERS_STORAGE_KEY,
      JSON.stringify(filters)
    );
  },

  {
    deep: true,
  }
);

watch(
  [
    filtroTipo,
    filtroProducto,
    filtroFechaDesde,
    filtroFechaHasta,
  ],

  () => {
    currentPage.value = 1;
  }
);

const movimientosFiltrados =
  computed(() =>
    movimientos.value.filter(
      movement => {
        if (
          filtroTipo.value ===
            'entrada' &&
          !isInbound(
            movement.tipo_movimiento
          )
        ) {
          return false;
        }

        if (
          filtroTipo.value ===
            'salida' &&
          isInbound(
            movement.tipo_movimiento
          )
        ) {
          return false;
        }

        if (
          filtroProducto.value &&
          movement.producto_id !==
            filtroProducto.value
        ) {
          return false;
        }

        if (movement.fecha) {
          const fecha =
            movement.fecha.slice(
              0,
              10
            );

          if (
            filtroFechaDesde.value &&
            fecha <
              filtroFechaDesde.value
          ) {
            return false;
          }

          if (
            filtroFechaHasta.value &&
            fecha >
              filtroFechaHasta.value
          ) {
            return false;
          }
        }

        return true;
      }
    )
  );

const totalPages =
  computed(() =>
    Math.ceil(
      movimientosFiltrados.value
        .length /
      itemsPerPage.value
    ) || 1
  );

const startIndex =
  computed(() =>
    (
      currentPage.value - 1
    ) *
    itemsPerPage.value
  );

const endIndex =
  computed(() =>
    startIndex.value +
    itemsPerPage.value
  );

const movimientosPaginados =
  computed(() =>
    movimientosFiltrados.value.slice(
      startIndex.value,
      endIndex.value
    )
  );

const displayedPages =
  computed(() => {
    const pages: number[] = [];

    const maxDisplayed = 5;

    let start = Math.max(
      1,
      currentPage.value -
        Math.floor(
          maxDisplayed / 2
        )
    );

    let end =
      start +
      maxDisplayed -
      1;

    if (
      end > totalPages.value
    ) {
      end = totalPages.value;

      start = Math.max(
        1,
        end -
          maxDisplayed +
          1
      );
    }

    for (
      let page = start;
      page <= end;
      page++
    ) {
      pages.push(page);
    }

    return pages;
  });

function nextPage() {
  if (
    currentPage.value <
    totalPages.value
  ) {
    currentPage.value++;
  }
}

function prevPage() {
  if (
    currentPage.value > 1
  ) {
    currentPage.value--;
  }
}

function goToPage(
  page: number
) {
  if (
    page >= 1 &&
    page <= totalPages.value
  ) {
    currentPage.value = page;
  }
}

const hasActiveFilters =
  computed(() =>
    filtroTipo.value !==
      'todos' ||
    Boolean(
      filtroProducto.value
    ) ||
    Boolean(
      filtroFechaDesde.value
    ) ||
    Boolean(
      filtroFechaHasta.value
    )
  );

const emptyStateMessage =
  computed(() =>
    movimientos.value.length ===
      0 &&
    !hasActiveFilters.value
      ? 'No hay movimientos registrados.'
      : 'No hay movimientos para los filtros seleccionados.'
  );

function limpiarFiltros() {
  filtroTipo.value = 'todos';
  filtroProducto.value = '';
  filtroFechaDesde.value = '';
  filtroFechaHasta.value = '';
  activeDatePicker.value = null;
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
  gap: 20px;
}

.header-copy {
  min-width: 0;
}

.page-title {
  font-size: 2.25rem;
  font-weight: 800;
  margin: 0;
  color: #0f172a;
  letter-spacing: -.02em;
}

.page-subtitle {
  margin: 6px 0 0;
  color: #64748b;
  font-size: .95rem;
}

.dropdown-container {
  position: relative;
  flex-shrink: 0;
}

.btn-add {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  max-width: 100%;
  box-sizing: border-box;
  background: var(--color-structure-base, #3b82f6);
  color: #fff;
  border: none;
  border-radius: 12px;
  font-family: inherit;
  font-size: .95rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(37, 99, 235, .2);
  transition: all .2s ease;
}

.btn-add:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(37, 99, 235, .3);
}

.btn-icon {
  font-size: 1.2rem;
  font-weight: 700;
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 100;
  width: 220px;
  padding: 8px 0;
  box-sizing: border-box;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 10px 25px rgba(0, 0, 0, .1);
}

.dropdown-item {
  display: block;
  width: 100%;
  padding: 10px 16px;
  box-sizing: border-box;
  background: none;
  border: none;
  color: #334155;
  font-family: inherit;
  font-size: .9rem;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
}

.dropdown-item:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.dropdown-divider {
  height: 1px;
  margin: 6px 0;
  background: #e2e8f0;
}

.alert {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-radius: 12px;
  font-weight: 500;
}

.alert-success {
  border: 1px solid #bbf7d0;
  background: #dcfce7;
  color: #166534;
}

.alert-close {
  border: none;
  background: none;
  color: inherit;
  font-size: 1.1rem;
  cursor: pointer;
}

.table-container {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  background: #fff;
  box-shadow: var(--shadow-card);
}

.table-content,
.table-wrapper {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.table-wrapper {
  overflow-x: auto;
}

.movimiento-table {
  width: 100%;
  border-collapse: collapse;
  font-size: .875rem;
}

.movimiento-table thead tr {
  border-bottom: 2px solid #e8eef6;
  background: var(--color-structure-base);
}

.movimiento-table th {
  padding: 14px 20px;
  color: #f0f4f9;
  font-size: .85rem;
  font-weight: 700;
  text-align: left;
}

.movimiento-table tbody tr {
  border-bottom: 1px solid #f0f4f9;
}

.movimiento-table tbody tr:last-child {
  border-bottom: none;
}

.movimiento-table td {
  padding: 14px 20px;
  vertical-align: middle;
  color: var(--color-text-secondary);
}

.td-id {
  color: var(--color-text-muted);
  font-family: 'Fira Code', monospace;
  font-size: .8rem;
  font-weight: 600;
}

.td-fecha {
  white-space: nowrap;
  font-weight: 500;
}

.product-name {
  color: var(--color-text);
  font-weight: 600;
}

.td-motivo {
  max-width: 250px;
  color: var(--color-text-muted);
  line-height: 1.4;
}

.tipo-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 99px;
  font-size: .78rem;
  font-weight: 600;
  white-space: nowrap;
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
  font-size: .88rem;
  font-weight: 700;
  white-space: nowrap;
}

.cantidad-num--entrada {
  color: #15803d;
}

.cantidad-num--salida {
  color: #b91c1c;
}

.loading-state,
.empty-state {
  padding: 48px 20px;
  color: var(--color-text-muted);
  font-size: .88rem;
  text-align: center;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.loading-state p {
  margin: 0;
}

.empty-state--error {
  color: #b91c1c;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: var(--color-structure-base, #3b82f6);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.pagination-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  width: 100%;
  box-sizing: border-box;
  padding: 12px 20px;
  border-top: 1px solid #f0f4f9;
  background: #fff;
}

.pagination-info {
  color: var(--color-text-muted);
  font-size: .8rem;
  font-weight: 500;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-page {
  padding: 7px 12px;
  border: 1.5px solid #dde3ec;
  border-radius: 8px;
  background: #fff;
  color: var(--color-text-secondary);
  font-family: var(--font-sans);
  font-size: .8rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-page:disabled {
  opacity: .5;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 4px;
}

.btn-page-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1.5px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: var(--color-text-secondary);
  font-family: var(--font-sans);
  font-size: .8rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-page-number.active {
  border-color: var(--color-structure-base);
  background: var(--color-structure-base);
  color: #fff;
}

.filtros-panel {
  width: 180px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  padding-top: 4px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
}

.filtros-titulo {
  margin: 0;
  color: var(--color-text);
  font-size: .95rem;
  font-weight: 700;
}

.btn-limpiar-text {
  padding: 3px 6px;
  border: none;
  border-radius: 6px;
  background: none;
  color: var(--color-structure-base);
  font-family: var(--font-sans);
  font-size: .72rem;
  font-weight: 600;
  cursor: pointer;
}

.filtro-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filtros-sub {
  margin: 0;
  color: var(--color-text-muted);
  font-size: .72rem;
  font-weight: 600;
}

.filtros-divider {
  margin: 14px 0;
  border-top: 1px solid #dde3ec;
}

.custom-select {
  position: relative;
  width: 100%;
}

.custom-select summary {
  list-style: none;
}

.custom-select summary::-webkit-details-marker {
  display: none;
}

.custom-select__trigger {
  position: relative;
  width: 100%;
  box-sizing: border-box;
  padding: 8px 32px 8px 11px;
  border: 1.5px solid #dde3ec;
  border-radius: 8px;
  background: #fff;
  color: var(--color-text-secondary);
  font-family: var(--font-sans);
  font-size: .8rem;
  cursor: pointer;
}

.custom-select__trigger::after {
  content: '⌄';
  position: absolute;
  top: 50%;
  right: 11px;
  transform: translateY(-55%);
  color: #94a3b8;
}

.custom-select[open]
.custom-select__trigger {
  border-color: var(--color-structure-base);
  box-shadow: 0 0 0 2px var(--color-structure-subtle);
}

.custom-select__options {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 100;
  width: 100%;
  max-height: 220px;
  box-sizing: border-box;
  overflow-y: auto;
  border: 1px solid #dde3ec;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 8px 18px rgba(15, 23, 42, .12);
}

.custom-select__option {
  display: block;
  width: 100%;
  box-sizing: border-box;
  padding: 9px 11px;
  border: none;
  border-bottom: 1px solid #f1f5f9;
  background: #fff;
  color: var(--color-text-secondary);
  font-family: var(--font-sans);
  font-size: .8rem;
  text-align: left;
  cursor: pointer;
}

.custom-select__option:last-child {
  border-bottom: none;
}

.custom-select__option:hover {
  background: #f8fafc;
}

.custom-select__option--active {
  background: #eff6ff;
  color: var(--color-structure-base);
  font-weight: 600;
}

.filtros-chips {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.chip {
  padding: 5px 10px;
  border: 1.5px solid #dde3ec;
  border-radius: 99px;
  background: transparent;
  color: var(--color-text-secondary);
  font-family: var(--font-sans);
  font-size: .8rem;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
}

.chip--active {
  border-color: var(--color-structure-base);
  background: var(--color-structure-base);
  color: #fff;
  font-weight: 600;
}

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
  color: var(--color-text-muted);
  font-size: .72rem;
  font-weight: 500;
}

.date-picker {
  position: relative;
  width: 100%;
}

.date-picker__trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  box-sizing: border-box;
  padding: 8px 10px;
  border: 1.5px solid #dde3ec;
  border-radius: 8px;
  background: #fff;
  color: var(--color-text-secondary);
  font-family: var(--font-sans);
  font-size: .8rem;
  text-align: left;
  cursor: pointer;
}

.date-picker__trigger--active {
  border-color: var(--color-structure-base);
  box-shadow: 0 0 0 2px var(--color-structure-subtle);
}

.date-placeholder {
  color: #94a3b8;
}

.date-picker__icon {
  flex-shrink: 0;
  color: #64748b;
}

.calendar-popover {
  position: absolute;
  bottom: calc(100% + 6px);
  right: 0;
  z-index: 150;
  width: 300px;
  max-width: calc(100vw - 32px);
  box-sizing: border-box;
  padding: 16px;
  border: 1px solid #dde3ec;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 12px 28px rgba(15, 23, 42, .16);
}

.calendar-header {
  display: grid;
  grid-template-columns: 36px 1fr 36px;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.calendar-title {
  color: var(--color-text);
  font-size: .88rem;
  text-align: center;
}

.calendar-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: none;
  border-radius: 8px;
  background: #f8fafc;
  color: var(--color-text);
  font-size: 1.2rem;
  cursor: pointer;
}

.calendar-weekdays,
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

.calendar-weekdays {
  margin-bottom: 4px;
}

.calendar-weekdays span {
  padding: 5px 0;
  color: var(--color-text);
  font-size: .65rem;
  font-weight: 700;
  text-align: center;
}

.calendar-day {
  aspect-ratio: 1;
  padding: 0;
  border: none;
  border-radius: 7px;
  background: transparent;
  color: var(--color-text-secondary);
  font-family: var(--font-sans);
  font-size: .7rem;
  cursor: pointer;
}

.calendar-day:hover {
  background: #f1f5f9;
}

.calendar-day--outside {
  color: #b0bbd4;
}

.calendar-day--today {
  border: 1px solid var(--color-structure-base);
}

.calendar-day--selected {
  border-color: var(--color-structure-base);
  background: var(--color-structure-base);
  color: #fff;
  font-weight: 700;
}

.calendar-footer {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #edf1f7;
}

.calendar-footer button {
  padding: 5px;
  border: none;
  background: transparent;
  color: var(--color-structure-base);
  font-family: var(--font-sans);
  font-size: .72rem;
  font-weight: 600;
  cursor: pointer;
}

.filtros-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.col-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 2px;
  border-radius: 6px;
  color: var(--color-text-secondary);
  font-size: .83rem;
  cursor: pointer;
  user-select: none;
}

.checkbox {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  box-sizing: border-box;
  border: 2px solid #b0bbd4;
  border-radius: 3px;
  background: #fff;
}

.checkbox.checked {
  border-color: #4a90d9;
  background: #4a90d9;
}

.checkbox__check {
  width: 10px;
  height: 10px;
  color: #fff;
}

/* Vista responsive:
   encabezado -> filtros -> tabla */
@media (max-width: 900px) {
  .content-container {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    width: 100%;
    max-width: 100%;
    gap: 24px;
  }

  .table-section {
    display: contents;
  }

  .section-header {
    grid-row: 1;
  }

  .alert {
    grid-row: 2;
  }

  .filtros-panel {
    grid-row: 3;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }

  .table-container {
    grid-row: 4;
  }
}

@media (max-width: 768px) {
  .movimiento-page {
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
    padding: 20px 16px;
    overflow-x: hidden;
  }

  .content-container {
    width: 100%;
    min-width: 0;
    max-width: 100%;
  }

  .section-header {
    width: 100%;
    max-width: 100%;
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
    box-sizing: border-box;
  }

  .page-title {
    font-size: 1.6rem;
    line-height: 1.2;
  }

  .page-subtitle {
    font-size: .88rem;
    line-height: 1.4;
  }

  .dropdown-container {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }

  .btn-add {
    width: 100%;
    max-width: 100%;
    padding: 11px 14px;
    justify-content: center;
    overflow: hidden;
    white-space: nowrap;
  }

  .dropdown-menu {
    right: auto;
    left: 0;
    width: 100%;
    max-width: 100%;
  }

  .filtros-panel {
    padding: 16px;
    border: 1.5px solid #e2e8f0;
    border-radius: 12px;
    background: #fff;
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

  .custom-select__options {
    max-height: 190px;
  }

  .calendar-popover {
    right: 0;
    width: min(300px, 100%);
    max-width: 100%;
  }

  .filtros-list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 4px 12px;
  }

  .table-container,
  .table-content,
  .table-wrapper {
    width: 100%;
    min-width: 0;
    max-width: 100%;
    box-sizing: border-box;
  }

  .table-wrapper {
    overflow: hidden;
  }

  .movimiento-table,
  .movimiento-table tbody {
    display: block;
    width: 100%;
    min-width: 0;
    max-width: 100%;
  }

  .movimiento-table thead {
    display: none;
  }

  .movimiento-table tbody {
    padding: 0;
  }

  .movimiento-table tbody tr.movement-row {
    display: block;
    width: 100%;
    box-sizing: border-box;
    padding: 12px 14px;
    border-bottom: 1px solid #e8eef6;
  }

  .movimiento-table tbody tr.movement-row:last-child {
    border-bottom: none;
  }

  .movimiento-table tbody tr.movement-row td {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 14px;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    padding: 5px 0;
    border: none;
    font-size: .76rem;
    line-height: 1.35;
    text-align: right;
    white-space: normal;
    overflow-wrap: anywhere;
  }

  .movimiento-table tbody tr.movement-row td::before {
    content: attr(data-label);
    flex: 0 0 38%;
    color: var(--color-text);
    font-size: .73rem;
    font-weight: 700;
    text-align: left;
  }

  .movimiento-table .td-id {
    font-size: .72rem;
  }

  .movimiento-table .td-fecha {
    white-space: normal;
  }

  .movimiento-table .td-producto {
    min-width: 0;
  }

  .movimiento-table .product-name {
    min-width: 0;
    max-width: 100%;
    text-align: right;
    overflow-wrap: anywhere;
  }

  .movimiento-table .td-motivo {
    min-width: 0;
    max-width: none;
    text-align: right;
    overflow-wrap: anywhere;
  }

  .tipo-badge {
    flex-shrink: 0;
    padding: 3px 8px;
    font-size: .68rem;
  }

  .cantidad-num {
    font-size: .72rem;
  }

  .empty-row {
    display: block !important;
    width: 100%;
    padding: 0 !important;
  }

  .empty-row .empty-state {
    display: block !important;
    width: 100% !important;
    box-sizing: border-box;
    padding: 28px 14px !important;
    text-align: center !important;
  }

  .empty-row .empty-state::before {
    display: none !important;
    content: none !important;
  }

  .pagination-footer {
    width: 100%;
    max-width: 100%;
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    box-sizing: border-box;
    padding: 14px;
    overflow: hidden;
  }

  .pagination-info {
    display: block;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    line-height: 1.4;
    text-align: center;
    white-space: normal;
    overflow-wrap: anywhere;
  }

  .pagination-controls {
    width: 100%;
    max-width: 100%;
    justify-content: center;
    flex-wrap: wrap;
    box-sizing: border-box;
  }
}

@media (max-width: 480px) {
  .movimiento-page {
    padding: 18px 14px;
  }

  .page-title {
    font-size: 1.45rem;
  }

  .btn-add {
    padding: 10px 12px;
    font-size: .8rem;
  }

  .filtros-list {
    grid-template-columns: 1fr;
  }

  .calendar-popover {
    padding: 13px;
  }

  .calendar-title {
    font-size: .82rem;
  }

  .calendar-day {
    font-size: .66rem;
  }

  .movimiento-table tbody tr.movement-row {
    padding: 10px 12px;
  }

  .movimiento-table tbody tr.movement-row td {
    gap: 10px;
    padding: 4px 0;
    font-size: .68rem;
  }

  .movimiento-table tbody tr.movement-row td::before {
    flex: 0 0 40%;
    font-size: .66rem;
  }

  .movimiento-table .td-id {
    font-size: .65rem;
  }

  .tipo-badge {
    padding: 3px 7px;
    font-size: .61rem;
  }

  .cantidad-num {
    font-size: .66rem;
  }

  .page-numbers {
    display: none;
  }

  .btn-page {
    flex: 1;
  }
}
</style>