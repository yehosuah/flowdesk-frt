<template>
  <div class="analytics-page">
    <div class="page-header">
      <div class="header-main">
        <h1 class="page-title">Análisis de Datos</h1>
        <div class="tabs-container">
          <button class="tab-btn" :class="{ active: activeTab === 'inventory' }" @click="activeTab = 'inventory'">Inventario</button>
          <button class="tab-btn" :class="{ active: activeTab === 'sales' }" @click="activeTab = 'sales'">Ventas</button>
          <button class="tab-btn" :class="{ active: activeTab === 'products' }" @click="activeTab = 'products'">Productos</button>
        </div>
      </div>
      <div class="header-actions">
        <button class="btn-filter" @click="showFilters = true">
          <Filter :size="16" /> Filtros Avanzados
        </button>
        <div class="period-selector">
          <button
            v-for="opt in periodOptions"
            :key="opt.value"
            class="period-btn"
            :class="{ 'period-btn--active': selectedPeriod === opt.value }"
            @click="changePeriod(opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="globalError" class="alert alert-error" style="margin-bottom:20px;">
      <span>{{ globalError }}</span>
      <button class="alert-close" @click="globalError = ''">✕</button>
    </div>

    <!-- TAB INVENTARIO -->
    <div v-if="activeTab === 'inventory'" class="tab-content">
      <section class="metrics-grid">
      <div v-for="card in metricCards" :key="card.key" class="metric-card">
        <div class="metric-card__icon" :style="{ background: card.iconBg }">
          <span v-html="card.icon"></span>
        </div>
        <div class="metric-card__body">
          <p class="metric-card__label">{{ card.label }}</p>
          <div v-if="metricsLoading" class="skeleton skeleton--value"></div>
          <p v-else class="metric-card__value" :style="{ color: card.valueColor }">
            {{ card.format(metrics) }}
          </p>
        </div>
      </div>
    </section>

      <div class="dashboard-grid">
        <section class="chart-section" style="padding: 24px;">
          <div class="section-header">
            <h2 class="section-title">Tendencia de movimientos</h2>
          </div>
          <div class="chart-wrapper">
            <div v-if="trendLoading" class="chart-skeleton">
              <div class="skeleton skeleton--chart"></div>
            </div>
            <div v-else-if="trendError" class="chart-empty chart-empty--error">
              {{ trendError }}
            </div>
            <div v-else-if="trendData.length === 0" class="chart-empty">
              No hay movimientos en este período.
            </div>
            <div v-else class="trend-chart" style="height: 100%; min-height: 250px;">
              <Bar :data="trendChartData" :options="trendChartOptions" />
            </div>
          </div>
        </section>

        <section class="chart-section" style="padding: 24px;">
          <h2 class="section-title">Feed de Movimientos</h2>
          <div class="feed-list" style="margin-top: 16px; display: flex; flex-direction: column; gap: 12px; max-height: 320px; overflow-y: auto;">
            <div v-for="item in mockFeed" :key="item.id" style="display: flex; gap: 12px; align-items: center; padding: 12px; background: #f8fafc; border-radius: 8px;">
              <div :style="{ color: item.type === 'in' ? '#2e7d32' : '#e65100' }">
                <ArrowDownRight v-if="item.type === 'in'" />
                <ArrowUpRight v-else />
              </div>
              <div style="flex: 1; font-size: 0.88rem;">
                <strong>{{ item.user }}</strong> {{ item.action }} <strong>{{ item.product }}</strong>
              </div>
              <span style="font-size: 0.75rem; color: var(--color-text-muted);">{{ item.time }}</span>
            </div>
          </div>
        </section>
      </div>

      <div class="dashboard-grid dashboard-grid--1-1">
        <section class="products-section" style="padding: 24px;">
          <div class="section-header">
            <h2 class="section-title">Top Productos</h2>
            <div class="sort-selector">
              <select v-model="selectedSort" class="sort-select" @change="loadProductAnalytics">
                <option value="outbound">Mayor salida</option>
                <option value="inbound">Mayor entrada</option>
                <option value="stock_risk">Mayor riesgo</option>
              </select>
            </div>
          </div>
          <div class="table-container">
            <div v-if="productsLoading" class="table-loading">Cargando productos…</div>
            <div v-else-if="productsError" class="table-empty table-empty--error">{{ productsError }}</div>
            <table v-else class="products-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Entradas</th>
                  <th>Salidas</th>
                  <th>Stock</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in topProducts" :key="p.product_id">
                  <td class="td-name">{{ p.nombre }}</td>
                  <td class="td-in">+{{ fmt(p.inbound_quantity) }}</td>
                  <td class="td-out">-{{ fmt(p.outbound_quantity) }}</td>
                  <td>{{ fmt(p.ending_stock) }}</td>
                </tr>
                <tr v-if="topProducts.length === 0">
                  <td colspan="4" class="table-empty">Sin datos.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="products-section" style="padding: 24px;">
          <h2 class="section-title">Alertas de Reabastecimiento</h2>
          <div class="table-container" style="margin-top: 16px;">
            <table class="products-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Stock</th>
                  <th>Mínimo</th>
                  <th>Proveedor</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="alert in mockAlerts" :key="alert.id">
                  <td class="td-name">{{ alert.name }}</td>
                  <td style="color: #c62828; font-weight: bold;">{{ alert.stock }}</td>
                  <td>{{ alert.min }}</td>
                  <td style="color: var(--color-text-muted);">{{ alert.supplier }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>

    <!-- TAB VENTAS (DUMMY) -->
    <div v-else-if="activeTab === 'sales'" class="tab-content">
      <section class="metrics-grid">
        <div class="metric-card">
          <div class="metric-card__icon" style="background: #e8f5e9;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2e7d32" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <div class="metric-card__body">
            <p class="metric-card__label">Ingresos Totales</p>
            <p class="metric-card__value" style="color: #2e7d32;">Q12,450</p>
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-card__icon" style="background: #e3f2fd;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1565c0" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5.5"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
          </div>
          <div class="metric-card__body">
            <p class="metric-card__label">Nuevos Clientes</p>
            <p class="metric-card__value" style="color: #1565c0;">48</p>
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-card__icon" style="background: #f3e5f5;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7b1fa2" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          </div>
          <div class="metric-card__body">
            <p class="metric-card__label">Tickets de Venta</p>
            <p class="metric-card__value" style="color: #7b1fa2;">124</p>
          </div>
        </div>
      </section>
      <div class="dashboard-grid">
        <section class="chart-section" style="padding: 24px;">
          <h2 class="section-title">Valoración Financiera del Inventario</h2>
          <div style="height: 300px; width: 100%; margin-top: 16px;">
            <Line :data="valuationChartData" :options="valuationChartOptions" />
          </div>
        </section>
        <section class="products-section" style="padding: 24px; display:flex; align-items:center; justify-content:center; min-height:300px;">
           <p class="chart-empty">Top Categorías (Datos Simulados)</p>
        </section>
      </div>
    </div>

    <!-- TAB PRODUCTOS (DUMMY) -->
    <div v-else-if="activeTab === 'products'" class="tab-content">
      <section class="metrics-grid">
        <div class="metric-card">
          <div class="metric-card__icon" style="background: #fdf6e3;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b58900" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
          </div>
          <div class="metric-card__body">
            <p class="metric-card__label">Total Productos</p>
            <p class="metric-card__value" style="color: #b58900;">145</p>
          </div>
        </div>
      </section>
      <div class="dashboard-grid dashboard-grid--1-2">
        <section class="chart-section" style="padding: 24px;">
          <h2 class="section-title">Distribución por Categorías</h2>
          <div style="height: 280px; width: 100%; margin-top: 16px;">
            <Doughnut :data="categoryChartData" :options="categoryChartOptions" />
          </div>
        </section>
        <section class="products-section" style="padding: 24px;">
          <h2 class="section-title">Reporte de Stock Muerto</h2>
          <div class="table-container" style="margin-top: 16px;">
            <table class="products-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Días sin movimiento</th>
                  <th>Stock Estancado</th>
                  <th>Valor Congelado</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in mockDeadStock" :key="item.id">
                  <td class="td-name">{{ item.name }}</td>
                  <td style="color: #e65100; font-weight: bold;">{{ item.days }} días</td>
                  <td>{{ item.stock }}</td>
                  <td style="color: #c62828; font-weight: bold;">{{ item.value }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>

    <!-- ADVANCED FILTERS DRAWER -->
    <div class="drawer-overlay" :class="{ 'drawer-overlay--open': showFilters }" @click="showFilters = false"></div>
    <div class="drawer-panel" :class="{ 'drawer-panel--open': showFilters }">
      <div class="drawer-header">
        <h3>Filtros Avanzados</h3>
        <button class="drawer-close" @click="showFilters = false"><X :size="20" /></button>
      </div>
      <div class="drawer-body">
        <div class="filter-group">
          <label>Rango de Fechas</label>
          <div class="date-inputs">
            <input type="date" class="filter-input" />
            <span>a</span>
            <input type="date" class="filter-input" />
          </div>
        </div>
        <div class="filter-group">
          <label>Categoría</label>
          <select class="filter-input">
            <option value="">Todas las categorías</option>
            <option value="lacteos">Lácteos</option>
            <option value="abarrotes">Abarrotes</option>
            <option value="limpieza">Limpieza</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Rango de Stock</label>
          <div class="range-inputs">
            <input type="number" placeholder="Mín" class="filter-input" />
            <span>-</span>
            <input type="number" placeholder="Máx" class="filter-input" />
          </div>
        </div>
      </div>
      <div class="drawer-footer">
        <button class="btn-clear" @click="showFilters = false">Limpiar</button>
        <button class="btn-apply" @click="showFilters = false">Aplicar Filtros</button>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { Filter, ArrowUpRight, ArrowDownRight, AlertTriangle, X } from 'lucide-vue-next';
import { Line, Doughnut, Bar } from 'vue-chartjs';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  CategoryScale,
  ArcElement,
  BarElement
} from 'chart.js';
import {
  fetchMetrics,
  fetchTrend,
  fetchProductAnalytics,
  type AnalyticsPeriod,
  type InventoryMetrics,
  type TrendPoint,
  type ProductAnalyticsRow,
} from '@/features/analytics/api';
import { getApiErrorMessage } from '@/services/apiClient';

ChartJS.register(Title, Tooltip, Legend, LineElement, LinearScale, PointElement, CategoryScale, ArcElement, BarElement);

const valuationChartData = {
  labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul'],
  datasets: [{
    label: 'Valor de Inventario (Q)',
    backgroundColor: '#2e7d32',
    borderColor: '#2e7d32',
    data: [120000, 115000, 130000, 125000, 140000, 135000, 150000],
    tension: 0.4
  }]
};
const chartPlugins = {
  legend: {
    position: 'right' as const,
    labels: {
      font: { size: 9, family: 'var(--font-sans)' },
      usePointStyle: true,
      boxWidth: 12,
      padding: 20
    }
  }
};

const valuationChartOptions = { 
  responsive: true, 
  maintainAspectRatio: false,
  plugins: chartPlugins
};

const categoryChartData = {
  labels: ['Lácteos', 'Abarrotes', 'Limpieza', 'Bebidas'],
  datasets: [{
    data: [45, 25, 20, 10],
    backgroundColor: ['#1565c0', '#2e7d32', '#f57f17', '#c62828'],
    borderWidth: 0
  }]
};
const categoryChartOptions = { 
  responsive: true, 
  maintainAspectRatio: false,
  plugins: chartPlugins
};

const mockFeed = [
  { id: 1, type: 'out', user: 'Juan P.', action: 'retiró 5 unid. de', product: 'Demo Frijol', time: 'Hace 10 min' },
  { id: 2, type: 'in', user: 'María S.', action: 'ingresó 20 unid. de', product: 'Demo Arroz', time: 'Hace 2 horas' },
  { id: 3, type: 'out', user: 'Juan P.', action: 'retiró 2 unid. de', product: 'Cafe demo', time: 'Ayer' },
];

const mockAlerts = [
  { id: 1, name: 'Demo Arroz', stock: 5, min: 10, supplier: 'Granos S.A.' },
  { id: 2, name: 'Aceite 1L', stock: 2, min: 15, supplier: 'Aceitera La Rosa' },
];

const mockDeadStock = [
  { id: 1, name: 'Jabón en Polvo XXL', days: 120, stock: 45, value: 'Q1,350' },
  { id: 2, name: 'Atún en Agua', days: 95, stock: 120, value: 'Q960' },
];

const showFilters = ref(false);
const activeTab = ref<'inventory' | 'sales' | 'products'>('inventory');
const selectedPeriod = ref<AnalyticsPeriod>('30d');
const selectedWindow = ref<'day' | 'week' | 'month'>('day');
const selectedSort = ref<'outbound' | 'inbound' | 'stock_risk'>('outbound');
const globalError = ref('');

const metrics = ref<InventoryMetrics | null>(null);
const metricsLoading = ref(false);

const trendData = ref<TrendPoint[]>([]);
const trendLoading = ref(false);
const trendError = ref('');

const topProducts = ref<ProductAnalyticsRow[]>([]);
const productsLoading = ref(false);
const productsError = ref('');

const CHART_WIDTH = 640;
const CHART_HEIGHT = 220;

const periodOptions = [
  { value: '7d' as AnalyticsPeriod, label: '7 días' },
  { value: '30d' as AnalyticsPeriod, label: '30 días' },
  { value: '90d' as AnalyticsPeriod, label: '90 días' },
  { value: '6m' as AnalyticsPeriod, label: '6 meses' },
];

const windowOptions = [
  { value: 'day' as const, label: 'Día' },
  { value: 'week' as const, label: 'Semana' },
  { value: 'month' as const, label: 'Mes' },
];

const metricCards = [
  {
    key: 'entradas',
    label: 'Entradas',
    iconBg: '#e8f5e9',
    valueColor: '#2e7d32',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2e7d32" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5"/><polyline points="5 12 12 5 19 12"/></svg>`,
    format: (m: InventoryMetrics | null) => m ? fmt(m.entradas) : '—',
  },
  {
    key: 'salidas',
    label: 'Salidas',
    iconBg: '#fff3e0',
    valueColor: '#e65100',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e65100" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><polyline points="19 12 12 19 5 12"/></svg>`,
    format: (m: InventoryMetrics | null) => m ? fmt(m.salidas) : '—',
  },
  {
    key: 'stock_bajo',
    label: 'Productos stock bajo',
    iconBg: '#fff8e1',
    valueColor: '#f57f17',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f57f17" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    format: (m: InventoryMetrics | null) => m != null ? String(m.stock_bajo) : '—',
  },
  {
    key: 'sin_stock',
    label: 'Sin stock',
    iconBg: '#ffebee',
    valueColor: '#c62828',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c62828" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>`,
    format: (m: InventoryMetrics | null) => m != null ? String(m.sin_stock) : '—',
  },
];

interface ChartPoint {
  x: number;
  y: number;
  label: string;
  value: number;
}

function fmt(value: number | null | undefined): string {
  if (value == null) return '—';
  return Number(value) % 1 === 0
    ? Number(value).toLocaleString('es-GT')
    : Number(value).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const trendChartData = computed(() => {
  return {
    labels: trendData.value.map(point => point.period_label),
    datasets: [
      {
        label: 'Entradas',
        backgroundColor: '#2e7d32',
        borderRadius: 4,
        data: trendData.value.map(point => Number(point.inbound_quantity)),
      },
      {
        label: 'Salidas',
        backgroundColor: '#e65100',
        borderRadius: 4,
        data: trendData.value.map(point => Number(point.outbound_quantity)),
      }
    ]
  };
});

const trendChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: chartPlugins,
  scales: {
    y: {
      beginAtZero: true
    }
  }
};

function riskClass(score: number): string {
  const n = Number(score);
  if (n >= 60) return 'risk-badge--high';
  if (n >= 30) return 'risk-badge--mid';
  return 'risk-badge--low';
}

function riskLabel(score: number): string {
  const n = Number(score);
  if (n >= 60) return 'Alto';
  if (n >= 30) return 'Medio';
  return 'Bajo';
}

async function loadMetrics() {
  metricsLoading.value = true;
  try {
    metrics.value = await fetchMetrics(selectedPeriod.value);
  } catch (err) {
    globalError.value = getApiErrorMessage(err);
    metrics.value = null;
  } finally {
    metricsLoading.value = false;
  }
}

async function loadTrend() {
  trendLoading.value = true;
  trendError.value = '';
  try {
    const res = await fetchTrend(selectedPeriod.value, selectedWindow.value);
    trendData.value = res.points;
  } catch (err) {
    trendError.value = getApiErrorMessage(err);
    trendData.value = [];
  } finally {
    trendLoading.value = false;
  }
}

async function loadProductAnalytics() {
  productsLoading.value = true;
  productsError.value = '';
  try {
    const res = await fetchProductAnalytics(selectedPeriod.value, selectedSort.value, 8);
    topProducts.value = res.products;
  } catch (err) {
    productsError.value = getApiErrorMessage(err);
    topProducts.value = [];
  } finally {
    productsLoading.value = false;
  }
}

async function loadAll() {
  await Promise.all([loadMetrics(), loadTrend(), loadProductAnalytics()]);
}

async function changePeriod(period: AnalyticsPeriod) {
  selectedPeriod.value = period;
  if (period === '7d') selectedWindow.value = 'day';
  else if (period === '30d') selectedWindow.value = 'day';
  else if (period === '90d') selectedWindow.value = 'week';
  else selectedWindow.value = 'month';
  await loadAll();
}

async function changeWindow(window: 'day' | 'week' | 'month') {
  selectedWindow.value = window;
  await loadTrend();
}

onMounted(loadAll);
</script>

<style scoped>
.analytics-page {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  padding: 32px 36px;
  min-height: 100vh;
  max-width: 1200px;
  margin: 0 auto;
  font-family: var(--font-sans);
  color: var(--color-text);
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}
.page-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 16px 0;
  color: var(--color-text);
}
.header-main {
  display: flex;
  flex-direction: column;
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
.tabs-container {
  display: flex;
  gap: 8px;
  background: var(--color-bg-surface);
  border: 1.5px solid var(--color-structure-subtle);
  border-radius: 10px;
  padding: 4px;
}
.tab-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 7px;
  background: transparent;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all 0.15s;
}
.tab-btn:hover {
  color: var(--color-text);
}
.tab-btn.active {
  background: var(--color-structure-base);
  color: #fff;
}
.btn-filter {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: #fff;
  border: 1.5px solid var(--color-structure-subtle);
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.15s;
}
.btn-filter:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  margin-top: 24px;
}

@media (min-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: 2fr 1fr;
  }
  .dashboard-grid--1-1 {
    grid-template-columns: 1fr 1fr;
  }
  .dashboard-grid--1-2 {
    grid-template-columns: 1fr 2fr;
  }
}

@media (max-width: 1023px) {
  .analytics-page {
    padding: 20px 16px;
  }
  .chart-section, .products-section {
    padding: 20px !important;
  }
}

@media (max-width: 768px) {
  .analytics-page {
    width: 100%;
    max-width: 100%;
    padding: 20px 16px;
    gap: 20px;
    overflow-x: hidden;
  }

  .page-header {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }

  .header-main {
    width: 100%;
    min-width: 0;
  }

  .page-title {
    font-size: 1.6rem;
    margin-bottom: 14px;
  }

  .tabs-container {
    width: 100%;
    box-sizing: border-box;
    overflow-x: auto;
  }

  .tab-btn {
    flex: 1;
    min-width: max-content;
    padding: 8px 12px;
    white-space: nowrap;
  }

  .header-actions {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .btn-filter {
    width: 100%;
    justify-content: center;
    box-sizing: border-box;
  }

  .period-selector {
    width: 100%;
    box-sizing: border-box;
    overflow-x: auto;
  }

  .period-btn {
    flex: 1;
    min-width: max-content;
    padding: 7px 10px;
    white-space: nowrap;
  }

  .metrics-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .metric-card {
    width: 100%;
    box-sizing: border-box;
    padding: 16px;
  }

  .metric-card__value {
    font-size: 1.5rem;
  }

  .dashboard-grid,
  .dashboard-grid--1-1,
  .dashboard-grid--1-2 {
    grid-template-columns: minmax(0, 1fr);
    width: 100%;
    min-width: 0;
    gap: 16px;
    margin-top: 16px;
  }

  .chart-section,
  .products-section {
    width: 100%;
    min-width: 0;
    max-width: 100%;
    box-sizing: border-box;
    padding: 16px !important;
  }

  .section-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .section-title {
    font-size: 1rem;
  }

  .chart-wrapper {
    width: 100%;
    height: 260px;
    min-width: 0;
    overflow: hidden;
  }

  .trend-chart {
    width: 100%;
    min-width: 0;
  }

  .table-container {
    width: 100%;
    max-width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .products-table {
    min-width: 520px;
  }

  .drawer-panel {
    width: 100%;
    max-width: 100%;
  }

  .drawer-header,
  .drawer-body,
  .drawer-footer {
    padding: 20px 16px;
  }

  .date-inputs,
  .range-inputs {
    flex-direction: column;
    align-items: stretch;
  }

  .date-inputs span,
  .range-inputs span {
    text-align: center;
  }

  .drawer-footer {
    flex-direction: column;
  }
}

.period-selector {
  display: flex;
  gap: 4px;
  background: var(--color-bg-surface);
  border: 1.5px solid var(--color-structure-subtle);
  border-radius: 10px;
  padding: 4px;
}
.period-btn {
  padding: 6px 14px;
  border: none;
  border-radius: 7px;
  background: transparent;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all 0.13s;
  font-family: var(--font-sans);
}
.period-btn--active {
  background: var(--color-structure-base);
  color: #fff;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
@media (max-width: 1100px) { .metrics-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 600px) { .metrics-grid { grid-template-columns: 1fr; } }

.metric-card {
  background: var(--color-bg-surface);
  border: 1.5px solid var(--color-structure-subtle);
  border-radius: 14px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: var(--shadow-card);
}
.metric-card__icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.metric-card__label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 4px;
}
.metric-card__value {
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0;
  line-height: 1;
}

.skeleton {
  background: linear-gradient(90deg, #f0f4f9 25%, #e0e8f0 50%, #f0f4f9 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  border-radius: 6px;
}
.skeleton--value { height: 28px; width: 80px; }
.skeleton--chart { height: 100%; border-radius: 10px; }
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  flex-wrap: wrap;
  gap: 10px;
}
.section-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
}

.chart-section {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  overflow: hidden;
  background: var(--color-bg-surface);
  border: 1.5px solid var(--color-structure-subtle);
  border-radius: 14px;
  padding: 32px;
  box-shadow: var(--shadow-card);
}
.window-selector {
  display: flex;
  gap: 4px;
}
.window-btn {
  padding: 5px 12px;
  border: 1.5px solid var(--color-structure-subtle);
  border-radius: 7px;
  background: transparent;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all 0.13s;
  font-family: var(--font-sans);
}
.window-btn--active {
  background: var(--color-structure-base);
  border-color: var(--color-structure-base);
  color: #fff;
}
.chart-wrapper {
  width: 100%;
  min-width: 0;
  height: 280px;
  position: relative;
}
.chart-skeleton {
  height: 100%;
}
.trend-chart {
  width: 100%;
  min-width: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.chart-legend {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  min-height: 18px;
  font-size: 0.78rem;
  color: var(--color-text-muted);
  font-weight: 600;
}
.chart-legend__item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.chart-legend__swatch {
  width: 10px;
  height: 10px;
  border-radius: 999px;
}
.chart-legend__swatch--in { background: #2e7d32; }
.chart-legend__swatch--out { background: #e65100; }
.chart-plot {
  flex: 1;
  width: 100%;
  min-height: 0;
  min-width: 0;
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr);
  gap: 10px;
}
.chart-y-axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-end;
  color: var(--color-text-muted);
  font-size: 0.72rem;
  line-height: 1;
}
.chart-drawing-area {
  position: relative;
  width: 100%;
  height: 100%;
  min-width: 0;
  overflow: hidden;
}
.chart-svg {
  display: block;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
.chart-grid-line {
  stroke: rgba(0, 0, 0, 0.06);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}
.chart-area {
  opacity: 0.88;
}
.chart-area--in { fill: rgba(46, 125, 50, 0.08); }
.chart-area--out { fill: rgba(230, 81, 0, 0.06); }
.chart-line {
  fill: none;
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
}
.chart-line--in { stroke: #2e7d32; }
.chart-line--out { stroke: #e65100; }

.chart-points-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}
.html-point {
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  border: 2px solid #fff;
  z-index: 2;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
.html-point--in { background: #2e7d32; }
.html-point--out { background: #e65100; }

.chart-x-axis {
  position: relative;
  width: auto;
  min-width: 0;
  height: 18px;
  margin-left: 62px;
  color: var(--color-text-muted);
  font-size: 0.72rem;
}
.chart-x-label {
  position: absolute;
  top: 0;
  max-width: 78px;
  overflow: hidden;
  text-overflow: ellipsis;
  transform: translateX(-50%);
  white-space: nowrap;
}

@media (max-width: 600px) {
  .analytics-page {
    padding: 24px 16px;
  }

  .chart-section,
  .products-section {
    padding: 18px 16px;
  }

  .chart-plot {
    grid-template-columns: 40px minmax(0, 1fr);
    gap: 8px;
  }

  .chart-x-axis {
    margin-left: 48px;
  }
}
.chart-empty {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  font-size: 0.88rem;
}
.chart-empty--error { color: #c03a3a; }

.products-section {
  background: var(--color-bg-surface);
  border: 1.5px solid var(--color-structure-subtle);
  border-radius: 14px;
  padding: 32px;
  box-shadow: var(--shadow-card);
}
.sort-select {
  padding: 6px 10px;
  border: 1.5px solid var(--color-structure-subtle);
  border-radius: 8px;
  font-size: 0.82rem;
  color: var(--color-text-secondary);
  background: #fff;
  outline: none;
  font-family: var(--font-sans);
  cursor: pointer;
}
.table-container { overflow-x: auto; border-radius: 8px; }
.table-loading, .table-empty {
  text-align: center;
  padding: 32px;
  color: var(--color-text-muted);
  font-size: 0.88rem;
}
.table-empty--error { color: #c03a3a; }
.products-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}
.products-table thead tr { background: var(--color-structure-base); }
.products-table th {
  padding: 12px 16px;
  text-align: center;
  font-weight: 700;
  color: #f0f4f9;
  font-size: 0.8rem;
  white-space: nowrap;
}
.products-table tbody tr {
  border-bottom: 1px solid #f0f4f9;
  transition: background 0.12s;
}
.products-table tbody tr:last-child { border-bottom: none; }
.products-table tbody tr:hover { background: #f8fafc; }
.products-table td {
  padding: 12px 16px;
  vertical-align: middle;
  text-align: center;
  color: var(--color-text-secondary);
  font-weight: 600;
}
.td-name { color: var(--color-structure-base); }
.td-sku { font-size: 0.78rem; color: var(--color-text-muted); font-family: monospace; }
.td-in { color: #2e7d32; }
.td-out { color: #e65100; }

.risk-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 99px;
  font-size: 0.75rem;
  font-weight: 700;
}
.risk-badge--low  { background: #e8f5e9; color: #2e7d32; }
.risk-badge--mid  { background: #fff3e0; color: #e65100; }
.risk-badge--high { background: #ffebee; color: #c62828; }

.drawer-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(2px);
  z-index: 100;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
}
.drawer-overlay--open {
  opacity: 1;
  visibility: visible;
}
.drawer-panel {
  position: fixed;
  top: 0; right: 0; bottom: 0;
  width: 360px;
  background: #ffffff;
  z-index: 101;
  box-shadow: -4px 0 24px rgba(0,0,0,0.1);
  transform: translateX(100%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
}
.drawer-panel--open {
  transform: translateX(0);
}
.drawer-header {
  padding: 24px;
  border-bottom: 1.5px solid var(--color-structure-subtle);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.drawer-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-structure-base);
}
.drawer-close {
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--color-text-muted);
  padding: 4px;
  border-radius: 6px;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.drawer-close:hover {
  background: #f1f5f9;
  color: var(--color-text);
}
.drawer-body {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.filter-group label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
}
.filter-input {
  width: 100%;
  padding: 10px 14px;
  border: 1.5px solid var(--color-structure-subtle);
  border-radius: 8px;
  font-size: 0.9rem;
  color: var(--color-text);
  outline: none;
  font-family: var(--font-sans);
  transition: border-color 0.2s;
  box-sizing: border-box;
}
.filter-input:focus {
  border-color: var(--color-structure-base);
}
.date-inputs, .range-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
}
.date-inputs span, .range-inputs span {
  color: var(--color-text-muted);
  font-weight: 600;
}
.drawer-footer {
  padding: 24px;
  border-top: 1.5px solid var(--color-structure-subtle);
  display: flex;
  gap: 12px;
}
.btn-clear, .btn-apply {
  flex: 1;
  padding: 12px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}
.btn-clear {
  background: #f1f5f9;
  color: var(--color-text-secondary);
}
.btn-clear:hover {
  background: #e2e8f0;
}
.btn-apply {
  background: var(--color-structure-base);
  color: #fff;
}
.btn-apply:hover {
  opacity: 0.9;
}
</style>
