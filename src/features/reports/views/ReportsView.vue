<template>
  <div class="reports-page">
    <div class="reports-header">
      <h1 class="page-title">Generador de Reportes</h1>
      <p class="page-subtitle">
        Configura, filtra y exporta la información clave de tu negocio.
      </p>
    </div>

    <div class="content-container">
      <aside class="filtros-panel">
        <div class="panel-header">
          <h3 class="filtros-titulo">Filtros</h3>
        </div>

        <form class="config-form" @submit.prevent="generatePreview">
          <div class="filtro-group">
            <p class="filtros-sub">Módulo</p>

            <div class="filtros-chips">
              <button
                type="button"
                class="chip"
                :class="{ 'chip--active': form.module === 'inventory' }"
                @click="form.module = 'inventory'"
              >
                Inventario
              </button>

              <button
                type="button"
                class="chip"
                :class="{ 'chip--active': form.module === 'commercial' }"
                @click="form.module = 'commercial'"
              >
                Comercial / Ventas
              </button>
            </div>
          </div>

          <div class="filtros-divider"></div>

          <div class="filtro-group">
            <p class="filtros-sub">Tipo de Reporte</p>

            <details
              ref="reportTypeDropdown"
              class="custom-select"
            >
              <summary class="custom-select__trigger">
                {{ reportTypeLabel }}
              </summary>

              <div class="custom-select__options">
                <button
                  v-for="option in reportTypeOptions"
                  :key="option.value"
                  type="button"
                  class="custom-select__option"
                  :class="{
                    'custom-select__option--active':
                      form.type === option.value
                  }"
                  @click="changeReportType(option.value)"
                >
                  {{ option.label }}
                </button>
              </div>
            </details>
          </div>

          <div class="filtros-divider"></div>

          <div class="filtro-group">
            <p class="filtros-sub">Rango de fechas</p>

            <div class="fecha-inputs">
              <div class="input-group">
                <label>Desde</label>

                <details
                  ref="startDateDropdown"
                  class="date-picker"
                >
                  <summary
                    class="date-picker__trigger"
                    :class="{ 'input-error': dateError }"
                    @click="prepareStartCalendar"
                  >
                    <span
                      :class="{
                        'date-placeholder': !form.startDate
                      }"
                    >
                      {{ formatDisplayDate(form.startDate) }}
                    </span>

                    <CalendarDays :size="16" />
                  </summary>

                  <div class="date-picker__calendar">
                    <div class="calendar-header">
                      <button
                        type="button"
                        class="calendar-nav"
                        @click.prevent="previousStartMonth"
                      >
                        ‹
                      </button>

                      <strong>
                        {{ startCalendarLabel }}
                      </strong>

                      <button
                        type="button"
                        class="calendar-nav"
                        @click.prevent="nextStartMonth"
                      >
                        ›
                      </button>
                    </div>

                    <div class="calendar-weekdays">
                      <span>Do</span>
                      <span>Lu</span>
                      <span>Ma</span>
                      <span>Mi</span>
                      <span>Ju</span>
                      <span>Vi</span>
                      <span>Sa</span>
                    </div>

                    <div class="calendar-days">
                      <template
                        v-for="(day, index) in startCalendarCells"
                        :key="index"
                      >
                        <span
                          v-if="day === null"
                          class="calendar-day calendar-day--empty"
                        ></span>

                        <button
                          v-else
                          type="button"
                          class="calendar-day"
                          :class="{
                            'calendar-day--selected':
                              isStartSelected(day),
                            'calendar-day--today':
                              isCalendarToday(
                                day,
                                startCalendarYear,
                                startCalendarMonth
                              )
                          }"
                          @click="selectStartDate(day)"
                        >
                          {{ day }}
                        </button>
                      </template>
                    </div>

                    <div class="calendar-footer">
                      <button
                        type="button"
                        class="calendar-footer-btn"
                        @click="clearStartDate"
                      >
                        Borrar
                      </button>

                      <button
                        type="button"
                        class="calendar-footer-btn"
                        @click="selectStartToday"
                      >
                        Hoy
                      </button>
                    </div>
                  </div>
                </details>
              </div>

              <div class="input-group">
                <label>Hasta</label>

                <details
                  ref="endDateDropdown"
                  class="date-picker"
                >
                  <summary
                    class="date-picker__trigger"
                    :class="{ 'input-error': dateError }"
                    @click="prepareEndCalendar"
                  >
                    <span
                      :class="{
                        'date-placeholder': !form.endDate
                      }"
                    >
                      {{ formatDisplayDate(form.endDate) }}
                    </span>

                    <CalendarDays :size="16" />
                  </summary>

                  <div class="date-picker__calendar">
                    <div class="calendar-header">
                      <button
                        type="button"
                        class="calendar-nav"
                        @click.prevent="previousEndMonth"
                      >
                        ‹
                      </button>

                      <strong>
                        {{ endCalendarLabel }}
                      </strong>

                      <button
                        type="button"
                        class="calendar-nav"
                        @click.prevent="nextEndMonth"
                      >
                        ›
                      </button>
                    </div>

                    <div class="calendar-weekdays">
                      <span>Do</span>
                      <span>Lu</span>
                      <span>Ma</span>
                      <span>Mi</span>
                      <span>Ju</span>
                      <span>Vi</span>
                      <span>Sa</span>
                    </div>

                    <div class="calendar-days">
                      <template
                        v-for="(day, index) in endCalendarCells"
                        :key="index"
                      >
                        <span
                          v-if="day === null"
                          class="calendar-day calendar-day--empty"
                        ></span>

                        <button
                          v-else
                          type="button"
                          class="calendar-day"
                          :class="{
                            'calendar-day--selected':
                              isEndSelected(day),
                            'calendar-day--today':
                              isCalendarToday(
                                day,
                                endCalendarYear,
                                endCalendarMonth
                              )
                          }"
                          @click="selectEndDate(day)"
                        >
                          {{ day }}
                        </button>
                      </template>
                    </div>

                    <div class="calendar-footer">
                      <button
                        type="button"
                        class="calendar-footer-btn"
                        @click="clearEndDate"
                      >
                        Borrar
                      </button>

                      <button
                        type="button"
                        class="calendar-footer-btn"
                        @click="selectEndToday"
                      >
                        Hoy
                      </button>
                    </div>
                  </div>
                </details>
              </div>
            </div>

            <p
              v-if="dateError"
              class="error-msg"
            >
              {{ dateError }}
            </p>
          </div>

          <div class="filtros-divider"></div>

          <div class="filtro-group">
            <p class="filtros-sub">
              Estado de los registros
            </p>

            <details
              ref="statusDropdown"
              class="custom-select"
            >
              <summary class="custom-select__trigger">
                {{ statusLabel }}
              </summary>

              <div class="custom-select__options">
                <button
                  v-for="option in statusOptions"
                  :key="option.value"
                  type="button"
                  class="custom-select__option"
                  :class="{
                    'custom-select__option--active':
                      form.status === option.value
                  }"
                  @click="changeStatus(option.value)"
                >
                  {{ option.label }}
                </button>
              </div>
            </details>
          </div>

          <div class="filtros-divider"></div>

          <div class="filtro-group">
            <div class="column-header">
              <p class="filtros-sub">
                Columnas Visibles
              </p>

              <button
                type="button"
                class="btn-check-all"
                @click="checkAllColumns"
              >
                Todas
              </button>
            </div>

            <ul class="filtros-list">
              <li
                v-for="col in availableColumns"
                :key="col"
                class="col-item"
                @click="toggleColumn(col)"
              >
                <span
                  class="checkbox"
                  :class="{
                    checked:
                      form.selectedColumns.includes(col)
                  }"
                >
                  <svg
                    v-if="form.selectedColumns.includes(col)"
                    class="checkbox__check"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </span>

                {{ col }}
              </li>
            </ul>

            <p
              v-if="form.selectedColumns.length === 0"
              class="error-msg"
            >
              Selecciona al menos una.
            </p>
          </div>

          <button
            type="submit"
            class="btn-generate"
            :disabled="isLoading || !isFormValid"
          >
            <span v-if="isLoading">
              Generando...
            </span>

            <span v-else>
              Generar Vista Previa
            </span>
          </button>
        </form>

        <div
          v-if="hasPreview"
          class="export-actions"
        >
          <div class="filtros-divider"></div>

          <p class="filtros-sub export-title">
            Exportar
          </p>

          <div class="export-buttons">
            <button
              class="btn-export csv"
              @click="exportCSV"
            >
              CSV / Excel
            </button>

            <button
              class="btn-export pdf"
              @click="exportPDF"
            >
              PDF
            </button>
          </div>
        </div>
      </aside>

      <main class="preview-panel">
        <div
          v-if="!hasPreview && !isLoading"
          class="empty-state"
        >
          <div class="empty-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <rect
                width="18"
                height="18"
                x="3"
                y="3"
                rx="2"
              />
              <path d="M21 9H3"/>
              <path d="M21 15H3"/>
              <path d="M9 3v18"/>
            </svg>
          </div>

          <h3>Área de Vista Previa</h3>

          <p>
            Ajusta los filtros y presiona "Generar Vista Previa"
            para previsualizar los datos antes de exportarlos.
          </p>
        </div>

        <div
          v-else-if="isLoading"
          class="loading-state"
        >
          <div class="spinner"></div>
          <p>Procesando datos...</p>
        </div>

        <div
          v-else
          class="preview-content"
        >
          <div class="preview-header">
            <h3>{{ getReportTitle() }}</h3>

            <span class="badge">
              Mostrando primeras 50 filas
            </span>
          </div>

          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th
                    v-for="col in previewData.columns"
                    :key="col"
                  >
                    {{ col }}
                  </th>
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="(row, idx) in previewData.rows"
                  :key="idx"
                >
                  <td
                    v-for="col in previewData.columns"
                    :key="col"
                    :data-label="col"
                  >
                    {{ row[col] }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  reactive,
  watch,
  computed,
  onMounted,
} from 'vue';

import { CalendarDays } from 'lucide-vue-next';

const COLUMNS_MAP: Record<string, string[]> = {
  current_stock: [
    'SKU',
    'Producto',
    'Categoría',
    'Stock',
    'Valor Unitario',
    'Valor Total',
    'Estado',
  ],

  movements: [
    'ID',
    'Fecha',
    'Tipo',
    'Producto',
    'Cantidad',
    'Usuario',
  ],

  dead_stock: [
    'SKU',
    'Producto',
    'Categoría',
    'Días sin mover',
    'Stock Actual',
  ],

  sales_summary: [
    'ID Venta',
    'Fecha',
    'Cliente',
    'Total Facturado',
    'Vendedor',
  ],

  clients_list: [
    'ID',
    'Cliente',
    'RUT',
    'Última Compra',
    'Total Facturado',
    'Estado',
  ],
};

const inventoryReportOptions = [
  {
    value: 'current_stock',
    label: 'Stock Actual Valorado',
  },
  {
    value: 'movements',
    label: 'Historial de Movimientos',
  },
  {
    value: 'dead_stock',
    label: 'Reporte de Stock Muerto',
  },
];

const commercialReportOptions = [
  {
    value: 'sales_summary',
    label: 'Resumen de Ventas',
  },
  {
    value: 'clients_list',
    label: 'Directorio de Clientes',
  },
];

const statusOptions = [
  {
    value: 'all',
    label: 'Todos',
  },
  {
    value: 'active',
    label: 'Solo Activos',
  },
  {
    value: 'inactive',
    label: 'Solo Inactivos',
  },
];

const form = reactive({
  module: 'inventory',
  type: 'current_stock',
  startDate: '',
  endDate: '',
  status: 'all',
  selectedColumns: [] as string[],
});

const reportTypeDropdown =
  ref<HTMLDetailsElement | null>(null);

const statusDropdown =
  ref<HTMLDetailsElement | null>(null);

const startDateDropdown =
  ref<HTMLDetailsElement | null>(null);

const endDateDropdown =
  ref<HTMLDetailsElement | null>(null);

const today = new Date();

const startCalendarYear =
  ref(today.getFullYear());

const startCalendarMonth =
  ref(today.getMonth());

const endCalendarYear =
  ref(today.getFullYear());

const endCalendarMonth =
  ref(today.getMonth());

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

const availableColumns = computed(() => {
  return COLUMNS_MAP[form.type] || [];
});

const reportTypeOptions = computed(() => {
  return form.module === 'inventory'
    ? inventoryReportOptions
    : commercialReportOptions;
});

const reportTypeLabel = computed(() => {
  return (
    reportTypeOptions.value.find(
      (option) =>
        option.value === form.type,
    )?.label || 'Seleccionar'
  );
});

const statusLabel = computed(() => {
  return (
    statusOptions.find(
      (option) =>
        option.value === form.status,
    )?.label || 'Todos'
  );
});

const startCalendarLabel = computed(() => {
  return `${
    monthNames[startCalendarMonth.value]
  } ${startCalendarYear.value}`;
});

const endCalendarLabel = computed(() => {
  return `${
    monthNames[endCalendarMonth.value]
  } ${endCalendarYear.value}`;
});

const startCalendarCells = computed(() => {
  return buildCalendarCells(
    startCalendarYear.value,
    startCalendarMonth.value,
  );
});

const endCalendarCells = computed(() => {
  return buildCalendarCells(
    endCalendarYear.value,
    endCalendarMonth.value,
  );
});

watch(
  () => form.type,
  () => {
    form.selectedColumns = [
      ...availableColumns.value,
    ];
  },
);

watch(
  () => form.module,
  (newVal) => {
    if (newVal === 'inventory') {
      form.type = 'current_stock';
    } else {
      form.type = 'sales_summary';
    }
  },
);

onMounted(() => {
  form.selectedColumns = [
    ...availableColumns.value,
  ];
});

function changeReportType(value: string) {
  form.type = value;

  if (reportTypeDropdown.value) {
    reportTypeDropdown.value.open = false;
  }
}

function changeStatus(value: string) {
  form.status = value;

  if (statusDropdown.value) {
    statusDropdown.value.open = false;
  }
}

function checkAllColumns() {
  form.selectedColumns = [
    ...availableColumns.value,
  ];
}

function toggleColumn(col: string) {
  const idx =
    form.selectedColumns.indexOf(col);

  if (idx === -1) {
    form.selectedColumns.push(col);
  } else {
    form.selectedColumns.splice(idx, 1);
  }
}

function buildCalendarCells(
  year: number,
  month: number,
): Array<number | null> {
  const firstDay =
    new Date(year, month, 1).getDay();

  const daysInMonth =
    new Date(
      year,
      month + 1,
      0,
    ).getDate();

  const cells: Array<number | null> = [];

  for (let i = 0; i < firstDay; i++) {
    cells.push(null);
  }

  for (
    let day = 1;
    day <= daysInMonth;
    day++
  ) {
    cells.push(day);
  }

  while (cells.length < 42) {
    cells.push(null);
  }

  return cells;
}

function prepareStartCalendar() {
  if (!form.startDate) {
    return;
  }

  const date =
    parseFormDate(form.startDate);

  startCalendarYear.value =
    date.getFullYear();

  startCalendarMonth.value =
    date.getMonth();
}

function prepareEndCalendar() {
  if (!form.endDate) {
    return;
  }

  const date =
    parseFormDate(form.endDate);

  endCalendarYear.value =
    date.getFullYear();

  endCalendarMonth.value =
    date.getMonth();
}

function previousStartMonth() {
  if (startCalendarMonth.value === 0) {
    startCalendarMonth.value = 11;
    startCalendarYear.value--;
  } else {
    startCalendarMonth.value--;
  }
}

function nextStartMonth() {
  if (startCalendarMonth.value === 11) {
    startCalendarMonth.value = 0;
    startCalendarYear.value++;
  } else {
    startCalendarMonth.value++;
  }
}

function previousEndMonth() {
  if (endCalendarMonth.value === 0) {
    endCalendarMonth.value = 11;
    endCalendarYear.value--;
  } else {
    endCalendarMonth.value--;
  }
}

function nextEndMonth() {
  if (endCalendarMonth.value === 11) {
    endCalendarMonth.value = 0;
    endCalendarYear.value++;
  } else {
    endCalendarMonth.value++;
  }
}

function selectStartDate(day: number) {
  form.startDate = createDateString(
    startCalendarYear.value,
    startCalendarMonth.value,
    day,
  );

  if (startDateDropdown.value) {
    startDateDropdown.value.open = false;
  }
}

function selectEndDate(day: number) {
  form.endDate = createDateString(
    endCalendarYear.value,
    endCalendarMonth.value,
    day,
  );

  if (endDateDropdown.value) {
    endDateDropdown.value.open = false;
  }
}

function selectStartToday() {
  startCalendarYear.value =
    today.getFullYear();

  startCalendarMonth.value =
    today.getMonth();

  form.startDate = createDateString(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  if (startDateDropdown.value) {
    startDateDropdown.value.open = false;
  }
}

function selectEndToday() {
  endCalendarYear.value =
    today.getFullYear();

  endCalendarMonth.value =
    today.getMonth();

  form.endDate = createDateString(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  if (endDateDropdown.value) {
    endDateDropdown.value.open = false;
  }
}

function clearStartDate() {
  form.startDate = '';

  if (startDateDropdown.value) {
    startDateDropdown.value.open = false;
  }
}

function clearEndDate() {
  form.endDate = '';

  if (endDateDropdown.value) {
    endDateDropdown.value.open = false;
  }
}

function isStartSelected(day: number) {
  if (!form.startDate) {
    return false;
  }

  return (
    form.startDate ===
    createDateString(
      startCalendarYear.value,
      startCalendarMonth.value,
      day,
    )
  );
}

function isEndSelected(day: number) {
  if (!form.endDate) {
    return false;
  }

  return (
    form.endDate ===
    createDateString(
      endCalendarYear.value,
      endCalendarMonth.value,
      day,
    )
  );
}

function isCalendarToday(
  day: number,
  year: number,
  month: number,
) {
  return (
    day === today.getDate() &&
    month === today.getMonth() &&
    year === today.getFullYear()
  );
}

function createDateString(
  year: number,
  month: number,
  day: number,
) {
  const formattedMonth =
    String(month + 1).padStart(2, '0');

  const formattedDay =
    String(day).padStart(2, '0');

  return `${year}-${formattedMonth}-${formattedDay}`;
}

function parseFormDate(value: string) {
  return new Date(`${value}T00:00:00`);
}

function formatDisplayDate(value: string) {
  if (!value) {
    return 'dd/mm/aaaa';
  }

  const [year, month, day] =
    value.split('-');

  return `${day}/${month}/${year}`;
}

const dateError = computed(() => {
  if (
    form.startDate &&
    form.endDate &&
    form.startDate > form.endDate
  ) {
    return 'Fecha inicial no puede ser mayor a la final.';
  }

  return '';
});

const isFormValid = computed(() => {
  if (
    form.selectedColumns.length === 0
  ) {
    return false;
  }

  if (
    !form.startDate ||
    !form.endDate
  ) {
    return false;
  }

  if (dateError.value) {
    return false;
  }

  return true;
});

const isLoading = ref(false);
const hasPreview = ref(false);

const previewData = reactive({
  columns: [] as string[],
  rows: [] as any[],
});

function getReportTitle() {
  const titles: Record<string, string> = {
    current_stock:
      'Stock Actual Valorado',

    movements:
      'Historial de Movimientos',

    dead_stock:
      'Reporte de Stock Muerto',

    sales_summary:
      'Resumen de Ventas',

    clients_list:
      'Directorio de Clientes',
  };

  return (
    titles[form.type] ||
    'Reporte Personalizado'
  );
}

async function generatePreview() {
  if (
    form.selectedColumns.length === 0
  ) {
    return;
  }

  isLoading.value = true;
  hasPreview.value = false;

  setTimeout(() => {
    isLoading.value = false;
    hasPreview.value = true;

    previewData.columns = [
      ...form.selectedColumns,
    ];

    let rawRows: any[] = [];

    if (
      form.module === 'inventory' &&
      form.type === 'current_stock'
    ) {
      rawRows = [
        {
          SKU: 'PRD-001',
          Producto: 'Demo Frijol',
          Categoría: 'Granos',
          Stock: 120,
          'Valor Unitario': '$15.00',
          'Valor Total': '$1,800.00',
          Estado: 'Activo',
        },

        {
          SKU: 'PRD-002',
          Producto: 'Demo Arroz',
          Categoría: 'Granos',
          Stock: 350,
          'Valor Unitario': '$10.00',
          'Valor Total': '$3,500.00',
          Estado: 'Activo',
        },

        {
          SKU: 'PRD-003',
          Producto: 'Aceite de Girasol',
          Categoría: 'Abarrotes',
          Stock: 45,
          'Valor Unitario': '$22.50',
          'Valor Total': '$1,012.50',
          Estado: 'Activo',
        },

        {
          SKU: 'PRD-004',
          Producto: 'Galletas Surtidas',
          Categoría: 'Snacks',
          Stock: 80,
          'Valor Unitario': '$12.00',
          'Valor Total': '$960.00',
          Estado: 'Inactivo',
        },
      ];
    } else if (
      form.module === 'commercial' &&
      form.type === 'clients_list'
    ) {
      rawRows = [
        {
          ID: 'C-101',
          Cliente: 'Supermercados del Norte',
          RUT: '76.123.456-7',
          'Última Compra': '15/08/2026',
          'Total Facturado': '$15,400.00',
          Estado: 'Activo',
        },

        {
          ID: 'C-102',
          Cliente: 'Minimarket La Esquina',
          RUT: '77.890.123-K',
          'Última Compra': '10/08/2026',
          'Total Facturado': '$3,200.00',
          Estado: 'Activo',
        },
      ];
    }

    previewData.rows =
      rawRows.map((row) => {
        const filteredRow: any = {};

        form.selectedColumns.forEach(
          (col) => {
            filteredRow[col] =
              row[col] !== undefined
                ? row[col]
                : '-';
          },
        );

        return filteredRow;
      });
  }, 600);
}

function exportCSV() {
  alert(
    'Iniciando descarga CSV (Pronto conectado al backend)',
  );
}

function exportPDF() {
  alert(
    'Iniciando descarga PDF (Pronto conectado al backend)',
  );
}
</script>

<style scoped>
.reports-page {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  padding: 32px 36px;
  box-sizing: border-box;
  font-family: var(--font-sans);
  color: var(--color-text);
}

.reports-header {
  margin-bottom: 24px;
}

.page-title {
  margin: 0 0 8px;
  font-size: 2rem;
  font-weight: 700;
}

.page-subtitle {
  margin: 0;
  color: var(--color-text-muted);
  font-size: .95rem;
  line-height: 1.45;
}

.content-container {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 220px;
  grid-template-areas: "preview filters";
  gap: 32px;
  align-items: start;
  width: 100%;
}

.preview-panel {
  grid-area: preview;
  width: 100%;
  min-width: 0;
  min-height: 400px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--color-bg-surface);
  border: 1.5px solid #dde3ec;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, .03);
}

.filtros-panel {
  grid-area: filters;
  width: 220px;
  min-width: 0;
  box-sizing: border-box;
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
  margin: 0;
  color: var(--color-text);
  font-size: .95rem;
  font-weight: 700;
}

.config-form {
  width: 100%;
}

.filtro-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
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

.filtros-chips {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.chip {
  width: 100%;
  box-sizing: border-box;
  padding: 7px 10px;
  border: 1.5px solid #dde3ec;
  border-radius: 99px;
  background: transparent;
  color: var(--color-text-secondary);
  font-family: var(--font-sans);
  font-size: .8rem;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  transition:
    background .13s,
    border-color .13s,
    color .13s;
  -webkit-tap-highlight-color: transparent;
}

.chip:hover:not(.chip--active) {
  border-color: #b0bbd4;
  background: rgba(0, 0, 0, .04);
}

.chip--active,
.chip--active:hover,
.chip--active:focus,
.chip--active:focus-visible,
.chip--active:active {
  background: var(--color-structure-base) !important;
  border-color: var(--color-structure-base) !important;
  color: #ffffff !important;
  font-weight: 600;
}

.chip:focus {
  outline: none;
}

.chip:focus-visible {
  outline: 2px solid var(--color-structure-base);
  outline-offset: 2px;
}

.custom-select,
.date-picker {
  position: relative;
  width: 100%;
  min-width: 0;
}

.custom-select summary,
.date-picker summary {
  list-style: none;
}

.custom-select summary::-webkit-details-marker,
.date-picker summary::-webkit-details-marker {
  display: none;
}

.custom-select__trigger {
  position: relative;
  width: 100%;
  box-sizing: border-box;
  padding: 9px 32px 9px 10px;
  border: 1.5px solid #dde3ec;
  border-radius: 8px;
  background: white;
  color: var(--color-text-secondary);
  font-family: var(--font-sans);
  font-size: .8rem;
  cursor: pointer;
  user-select: none;
}

.custom-select__trigger::after {
  content: '⌄';
  position: absolute;
  right: 11px;
  top: 50%;
  transform: translateY(-55%);
  color: #94a3b8;
}

.custom-select[open] .custom-select__trigger {
  border-color: var(--color-structure-base);
  border-radius: 8px 8px 0 0;
}

.custom-select__options {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 100;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
  background: white;
  border: 1.5px solid #dde3ec;
  border-top: none;
  border-radius: 0 0 8px 8px;
  box-shadow: 0 8px 18px rgba(15, 23, 42, .14);
}

.custom-select__option {
  display: block;
  width: 100%;
  box-sizing: border-box;
  padding: 9px 10px;
  border: none;
  border-bottom: 1px solid #f1f5f9;
  background: white;
  color: var(--color-text-secondary);
  text-align: left;
  font-family: var(--font-sans);
  font-size: .8rem;
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

.fecha-inputs {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-group {
  min-width: 0;
}

.input-group label {
  display: block;
  margin-bottom: 4px;
  color: #94a3b8;
  font-size: .7rem;
}

.date-picker__trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  box-sizing: border-box;
  padding: 9px 10px;
  border: 1.5px solid #dde3ec;
  border-radius: 8px;
  background: white;
  color: var(--color-text-secondary);
  font-family: var(--font-sans);
  font-size: .8rem;
  cursor: pointer;
}

.date-picker[open] .date-picker__trigger {
  border-color: var(--color-structure-base);
}

.date-picker__trigger.input-error {
  border-color: #ef4444;
}

.date-placeholder {
  color: var(--color-text-secondary);
}

.date-picker__calendar {
  position: absolute;
  bottom: calc(100% + 7px);
  right: 0;
  z-index: 120;
  width: 280px;
  max-width: min(280px, calc(100vw - 32px));
  box-sizing: border-box;
  padding: 14px;
  background: white;
  border: 1px solid #dbe3ef;
  border-radius: 12px;
  box-shadow: 0 12px 28px rgba(15, 23, 42, .18);
}

.calendar-header {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) 34px;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  text-align: center;
}

.calendar-header strong {
  color: var(--color-text);
  font-size: .85rem;
}

.calendar-nav {
  width: 34px;
  height: 34px;
  padding: 0;
  border: none;
  border-radius: 8px;
  background: #f8fafc;
  color: var(--color-text);
  font-size: 1.2rem;
  cursor: pointer;
}

.calendar-nav:hover {
  background: #eef2f7;
}

.calendar-weekdays,
.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 3px;
}

.calendar-weekdays {
  margin-bottom: 5px;
}

.calendar-weekdays span {
  padding: 5px 0;
  text-align: center;
  color: var(--color-structure-base);
  font-size: .68rem;
  font-weight: 700;
}

.calendar-days {
  grid-template-rows: repeat(6, 32px);
  height: 207px;
}

.calendar-day {
  width: 100%;
  height: 32px;
  min-width: 0;
  padding: 0;
  border: none;
  border-radius: 7px;
  background: transparent;
  color: var(--color-text);
  font-family: var(--font-sans);
  font-size: .75rem;
  cursor: pointer;
}

.calendar-day:hover {
  background: #f1f5f9;
}

.calendar-day--empty {
  pointer-events: none;
}

.calendar-day--today {
  border: 1px solid var(--color-structure-base);
}

.calendar-day--selected {
  background: var(--color-structure-base);
  color: white;
  font-weight: 700;
}

.calendar-day--selected:hover {
  background: var(--color-structure-base);
}

.calendar-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
  padding-top: 9px;
  border-top: 1px solid #edf1f7;
}

.calendar-footer-btn {
  padding: 5px 7px;
  border: none;
  background: transparent;
  color: var(--color-structure-base);
  font-family: var(--font-sans);
  font-size: .75rem;
  font-weight: 600;
  cursor: pointer;
}

.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.btn-check-all {
  padding: 0;
  border: none;
  background: none;
  color: var(--color-structure-base);
  font-size: .65rem;
  font-weight: 600;
  cursor: pointer;
}

.filtros-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.col-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 2px;
  border-radius: 6px;
  color: var(--color-text-secondary);
  font-size: .83rem;
  cursor: pointer;
  user-select: none;
  transition: background .12s;
}

.col-item:hover {
  background: rgba(0, 0, 0, .04);
}

.checkbox {
  width: 16px;
  height: 16px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 2px solid #b0bbd4;
  border-radius: 3px;
  background: white;
}

.checkbox.checked {
  background: #4a90d9;
  border-color: #4a90d9;
}

.checkbox__check {
  width: 10px;
  height: 10px;
  color: white;
}

.error-msg {
  margin: 2px 0 0;
  color: #ef4444;
  font-size: .7rem;
}

.btn-generate {
  width: 100%;
  box-sizing: border-box;
  margin-top: 12px;
  padding: 10px;
  border: none;
  border-radius: 8px;
  background: var(--color-structure-base);
  color: white;
  font-size: .85rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-generate:disabled {
  opacity: .6;
  cursor: not-allowed;
}

.export-title {
  margin-bottom: 8px;
}

.export-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.btn-export {
  width: 100%;
  box-sizing: border-box;
  padding: 8px;
  border: 1px solid #dde3ec;
  border-radius: 8px;
  background: white;
  color: var(--color-text-secondary);
  font-weight: 600;
  cursor: pointer;
}

.preview-content {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

.empty-state,
.loading-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  text-align: center;
  color: var(--color-text-muted);
}

.empty-icon {
  margin-bottom: 16px;
  color: #cbd5e1;
}

.empty-state h3,
.loading-state p {
  margin: 0 0 8px;
  color: var(--color-text-secondary);
}

.empty-state p {
  max-width: 320px;
  margin-bottom: 0;
  font-size: .85rem;
  line-height: 1.5;
}

.spinner {
  width: 36px;
  height: 36px;
  margin-bottom: 16px;
  border: 3px solid #dde3ec;
  border-top-color: var(--color-structure-base);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  border-bottom: 1px solid #dde3ec;
}

.preview-header h3 {
  margin: 0;
  font-size: 1rem;
}

.badge {
  padding: 4px 10px;
  border-radius: 12px;
  background: #f1f5f9;
  color: #64748b;
  font-size: .7rem;
  font-weight: 600;
}

.table-container {
  width: 100%;
  min-width: 0;
  max-width: 100%;
  flex: 1;
  overflow: hidden;
}

.data-table {
  width: 100%;
  max-width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  min-width: 0;
  padding: 12px 10px;
  text-align: left;
  border-bottom: 1px solid #dde3ec;
  font-size: .78rem;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: normal;
}

.data-table thead {
  background: var(--color-structure-base);
}

.data-table th {
  background: var(--color-structure-base);
  color: #ffffff;
  font-weight: 700;
  border-bottom: none;
}

@media (max-width: 900px) {
  .reports-page {
    padding: 20px 16px;
    overflow-x: hidden;
  }

  .page-title {
    font-size: 1.6rem;
  }

  .page-subtitle {
    font-size: .88rem;
  }

  .content-container {
    grid-template-columns: 1fr;
    grid-template-areas:
      "filters"
      "preview";
    gap: 18px;
  }

  .filtros-panel {
    width: 100%;
    padding: 18px;
    background: white;
    border: 1px solid #dde3ec;
    border-radius: 12px;
    box-shadow: var(--shadow-card);
  }

  .filtros-chips {
    flex-direction: row;
  }

  .chip {
    flex: 1;
    text-align: center;
  }

  .fecha-inputs {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .preview-panel {
    min-height: 320px;
  }

  .export-buttons {
    flex-direction: row;
  }

  .btn-export {
    flex: 1;
  }
}

@media (max-width: 600px) {
  .reports-page {
    padding: 20px 16px;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .page-subtitle {
    font-size: .82rem;
  }

  .content-container {
    gap: 16px;
  }

  .filtros-panel {
    padding: 16px 14px;
    overflow: visible;
  }

  .filtros-chips {
    flex-direction: column;
  }

  .chip {
    flex: none;
    width: 100%;
  }

  .chip--active,
  .chip--active:hover,
  .chip--active:focus,
  .chip--active:focus-visible,
  .chip--active:active {
    background: var(--color-structure-base) !important;
    border-color: var(--color-structure-base) !important;
    color: #ffffff !important;
  }

  .fecha-inputs {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .custom-select__options {
    width: 100%;
    max-width: 100%;
  }

  .date-picker__calendar {
    left: 0;
    right: auto;
    width: 100%;
    max-width: 100%;
  }

  .calendar-days {
    grid-template-rows: repeat(6, 30px);
    height: 195px;
  }

  .calendar-day {
    height: 30px;
    font-size: .7rem;
  }

  .calendar-weekdays span {
    font-size: .64rem;
  }

  .preview-panel {
    min-height: 280px;
  }

  .empty-state,
  .loading-state {
    padding: 28px 16px;
  }

  .preview-header {
    flex-direction: column;
    align-items: flex-start;
    padding: 14px;
  }

  .export-buttons {
    flex-direction: column;
  }

  .table-container {
  width: 100%;
  max-width: 100%;
  overflow: hidden;
}

.data-table,
.data-table tbody {
  display: block;
  width: 100%;
}

.data-table thead {
  display: none;
}

.data-table tr {
  display: block;
  width: 100%;
  box-sizing: border-box;
  padding: 10px 12px;
  border-bottom: 1px solid #dde3ec;
}

.data-table td {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;

  width: 100%;
  box-sizing: border-box;

  padding: 6px 0;

  border: none;

  font-size: .75rem;
  text-align: right;
  overflow-wrap: anywhere;
}

.data-table td::before {
  content: attr(data-label);

  flex: 0 0 42%;

  color: var(--color-text);
  font-weight: 700;
  text-align: left;
}
}
</style>