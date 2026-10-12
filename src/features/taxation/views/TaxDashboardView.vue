<template>
  <div class="tax-dashboard-page">
    <header class="tax-dashboard-header">
      <div class="tax-header-info">
        <div class="tax-header-title-row">
          <h1 class="tax-title">Dashboard Tributario</h1>
          <span class="tax-regime-badge">Régimen General IVA (12%)</span>
        </div>
        <p class="tax-subtitle">
          Consulta y proyecta tus obligaciones tributarias, IVA débito/crédito y retenciones del período.
        </p>
      </div>

      <div class="tax-header-actions">
        <Button
          variant="secondary"
          size="sm"
          :disabled="isLoading"
          class="action-btn"
          @click="loadMetrics"
        >
          <RefreshCw :size="15" :class="{ 'spin-icon': isLoading }" />
          <span>Actualizar</span>
        </Button>

        <Button
          variant="primary"
          size="sm"
          :disabled="isLoading || isExporting"
          class="action-btn"
          @click="exportTaxReport"
        >
          <Download :size="15" />
          <span>{{ isExporting ? 'Exportando...' : 'Exportar Libro' }}</span>
        </Button>
      </div>
    </header>

    <main class="tax-dashboard-content">
      <TaxFiltersBar
        :month="selectedMonth"
        :year="selectedYear"
        @update:month="selectedMonth = $event"
        @update:year="selectedYear = $event"
      />

      <!-- Estado de Error -->
      <Alert
        v-if="errorMessage"
        variant="danger"
        title="Error al consultar métricas fiscales"
      >
        <p class="error-text">{{ errorMessage }}</p>
        <div class="error-action">
          <Button variant="secondary" size="sm" @click="loadMetrics">
            Reintentar
          </Button>
        </div>
      </Alert>

      <!-- Estado de Carga -->
      <div v-if="isLoading" class="tax-metrics-skeleton-grid">
        <div v-for="i in 7" :key="i" class="metric-card-skeleton">
          <div class="skeleton-header">
            <Skeleton width="55%" height="16px" />
            <Skeleton width="36px" height="36px" />
          </div>
          <div class="skeleton-body">
            <Skeleton width="75%" height="28px" />
            <Skeleton width="90%" height="14px" />
          </div>
        </div>
      </div>

      <!-- Estado Vacío -->
      <div v-else-if="!errorMessage && isEmpty" class="empty-state-wrapper">
        <EmptyState
          title="Sin movimientos fiscales registrados"
          description="No se registraron transacciones comerciales ni documentos tributarios en el período seleccionado."
        >
          <template #icon>
            <FileQuestion :size="48" class="empty-icon-custom" />
          </template>
          <template #action>
            <Button variant="secondary" size="sm" @click="resetToCurrentPeriod">
              Ver período actual
            </Button>
          </template>
        </EmptyState>
      </div>

      <!-- Dashboard con Datos -->
      <div v-else-if="!errorMessage" class="tax-dashboard-body">
        <TaxMetricCards :metrics="metrics" />

        <!-- Resumen de Liquidación / Nota explicativa -->
        <div class="tax-summary-callout" :class="summaryCalloutClass">
          <div class="tax-summary-callout__icon">
            <CheckCircle2 v-if="metrics.tax_payable === 0" :size="20" />
            <AlertCircle v-else :size="20" />
          </div>
          <div class="tax-summary-callout__content">
            <h4 class="tax-summary-callout__title">{{ summaryTitle }}</h4>
            <p class="tax-summary-callout__text">{{ summaryDescription }}</p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { Skeleton, Alert, EmptyState, Button } from '@/app/components/ui';
import { FileQuestion, RefreshCw, Download, CheckCircle2, AlertCircle } from 'lucide-vue-next';
import { appStore } from '@/stores/app.store';
import TaxFiltersBar from '../components/TaxFiltersBar.vue';
import TaxMetricCards from '../components/TaxMetricCards.vue';
import { fetchTaxPeriodMetrics } from '../api';
import type { TaxPeriodMetrics } from '../types';

const selectedMonth = ref<number>(new Date().getMonth() + 1);
const selectedYear = ref<number>(new Date().getFullYear());
const isLoading = ref<boolean>(true);
const isExporting = ref<boolean>(false);
const errorMessage = ref<string | null>(null);

const metrics = ref<TaxPeriodMetrics>({
  tax_debit: 0,
  tax_credit: 0,
  net_tax: 0,
  tax_payable: 0,
  carry_forward: 0,
  withholding_tax: 0,
  input_documents_count: 0,
});

const isEmpty = computed(() => {
  return (
    !isLoading.value &&
    !errorMessage.value &&
    metrics.value.input_documents_count === 0 &&
    metrics.value.tax_debit === 0 &&
    metrics.value.tax_credit === 0 &&
    metrics.value.tax_payable === 0
  );
});

const summaryCalloutClass = computed(() => {
  if (metrics.value.tax_payable > 0) return 'tax-summary-callout--payable';
  if (metrics.value.carry_forward > 0) return 'tax-summary-callout--credit';
  return 'tax-summary-callout--neutral';
});

const summaryTitle = computed(() => {
  if (metrics.value.tax_payable > 0) {
    return 'Obligación tributaria líquida por pagar';
  }
  if (metrics.value.carry_forward > 0) {
    return 'Crédito fiscal acumulado a favor del contribuyente';
  }
  return 'Período fiscal equilibrado';
});

const summaryDescription = computed(() => {
  if (metrics.value.tax_payable > 0) {
    return 'El débito fiscal de ventas superó las compras deducibles. Se debe enterar el monto a pagar a la Administración Tributaria.';
  }
  if (metrics.value.carry_forward > 0) {
    return 'El crédito fiscal por compras o retenciones superó el débito del período. El remanente quedará disponible para compensar en meses futuros.';
  }
  return 'No hay saldo a liquidar ni créditos pendientes para el período seleccionado.';
});

function resetToCurrentPeriod() {
  selectedMonth.value = new Date().getMonth() + 1;
  selectedYear.value = new Date().getFullYear();
}

async function exportTaxReport() {
  isExporting.value = true;
  try {
    const token = appStore.state.session?.accessToken;
    const year = selectedYear.value;
    const url = `/api/v1/reports/tributario?regime=GENERAL_VAT&year=${year}`;
    const response = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!response.ok) {
      throw new Error(`Error en el servidor al generar reporte (${response.status})`);
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `reporte_tributario_${year}.xlsx`;
    document.body.appendChild(link);
    link.click();
    window.URL.revokeObjectURL(downloadUrl);
    link.remove();
  } catch (err) {
    console.warn('Descarga de reporte tributario vía backend falló, usando exportación de contingencia:', err);
    // Exportación CSV de contingencia con los datos del período
    const csvContent = [
      'Métrica,Monto (GTQ)',
      `Débito Fiscal (Ventas),${metrics.value.tax_debit.toFixed(2)}`,
      `Crédito Fiscal (Compras),${metrics.value.tax_credit.toFixed(2)}`,
      `Impuesto Neto,${metrics.value.net_tax.toFixed(2)}`,
      `Impuesto a Pagar,${metrics.value.tax_payable.toFixed(2)}`,
      `Remanente a Favor,${metrics.value.carry_forward.toFixed(2)}`,
      `Retenciones Aplicadas,${metrics.value.withholding_tax.toFixed(2)}`,
      `Documentos Fiscales,${metrics.value.input_documents_count}`,
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `resumen_fiscal_${selectedYear.value}_${selectedMonth.value || 'anual'}.csv`;
    document.body.appendChild(link);
    link.click();
    window.URL.revokeObjectURL(downloadUrl);
    link.remove();
  } finally {
    isExporting.value = false;
  }
}

async function loadMetrics() {
  isLoading.value = true;
  errorMessage.value = null;
  const year = selectedYear.value;
  const month = selectedMonth.value;

  let startDate: string;
  let endDate: string;

  if (month > 0) {
    const padMonth = String(month).padStart(2, '0');
    const lastDay = new Date(year, month, 0).getDate();
    startDate = `${year}-${padMonth}-01`;
    endDate = `${year}-${padMonth}-${String(lastDay).padStart(2, '0')}`;
  } else {
    startDate = `${year}-01-01`;
    endDate = `${year}-12-31`;
  }

  try {
    const data = await fetchTaxPeriodMetrics({
      start_date: startDate,
      end_date: endDate,
    });
    metrics.value = data;
  } catch (error) {
    console.error('Error al cargar métricas tributarias:', error);
    errorMessage.value = error instanceof Error ? error.message : 'No se pudo conectar con el servicio de cálculo tributario.';
  } finally {
    isLoading.value = false;
  }
}

watch([selectedMonth, selectedYear], () => {
  loadMetrics();
});

onMounted(() => {
  loadMetrics();
});
</script>

<style scoped>
.tax-dashboard-page {
  padding: 24px 32px;
  background-color: var(--color-bg-app, #f8fafc);
  min-height: 100vh;
  box-sizing: border-box;
}

.tax-dashboard-header {
  margin-bottom: 24px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.tax-header-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.tax-regime-badge {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 9999px;
  background-color: #e0e7ff;
  color: #3730a3;
}

.tax-header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.spin-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.tax-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-heading, #0f172a);
  margin: 0 0 6px 0;
}

.tax-subtitle {
  font-size: 0.95rem;
  color: var(--color-text-secondary, #64748b);
  margin: 0;
}

.tax-dashboard-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.tax-metrics-skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
  width: 100%;
}

.metric-card-skeleton {
  background: var(--color-bg-surface, #ffffff);
  border: 1px solid var(--color-bg-border, #e2e8f0);
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.skeleton-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.skeleton-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.error-action {
  margin-top: 12px;
}

.empty-state-wrapper {
  background: var(--color-bg-surface, #ffffff);
  border: 1px solid var(--color-bg-border, #e2e8f0);
  border-radius: 14px;
  padding: 48px 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.empty-icon-custom {
  color: var(--color-text-secondary, #94a3b8);
}

.tax-summary-callout {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 18px 22px;
  border-radius: 12px;
  margin-top: 8px;
  border: 1px solid transparent;
}

.tax-summary-callout__icon {
  margin-top: 2px;
  flex-shrink: 0;
}

.tax-summary-callout__content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tax-summary-callout__title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
}

.tax-summary-callout__text {
  margin: 0;
  font-size: 0.88rem;
  line-height: 1.45;
}

.tax-summary-callout--payable {
  background-color: #fffbeb;
  border-color: #fde68a;
  color: #92400e;
}

.tax-summary-callout--payable .tax-summary-callout__icon {
  color: #d97706;
}

.tax-summary-callout--payable .tax-summary-callout__text {
  color: #b45309;
}

.tax-summary-callout--credit {
  background-color: #f0fdf4;
  border-color: #bbf7d0;
  color: #166534;
}

.tax-summary-callout--credit .tax-summary-callout__icon {
  color: #16a34a;
}

.tax-summary-callout--credit .tax-summary-callout__text {
  color: #15803d;
}

.tax-summary-callout--neutral {
  background-color: #f8fafc;
  border-color: #e2e8f0;
  color: #334155;
}

.tax-summary-callout--neutral .tax-summary-callout__icon {
  color: #64748b;
}

.tax-summary-callout--neutral .tax-summary-callout__text {
  color: #64748b;
}

@media (max-width: 768px) {
  .tax-dashboard-page {
    padding: 16px 20px;
  }

  .tax-title {
    font-size: 1.5rem;
  }

  .tax-subtitle {
    font-size: 0.88rem;
  }

  .tax-metrics-skeleton-grid {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 16px;
  }
}

@media (max-width: 640px) {
  .tax-dashboard-header {
    flex-direction: column;
    align-items: stretch;
  }

  .tax-header-actions {
    width: 100%;
    justify-content: stretch;
  }

  .tax-header-actions .action-btn {
    flex: 1;
    justify-content: center;
  }

  .tax-summary-callout {
    padding: 14px 16px;
  }
}

@media (max-width: 480px) {
  .tax-dashboard-page {
    padding: 12px 14px;
  }

  .tax-title {
    font-size: 1.35rem;
  }

  .tax-metrics-skeleton-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .empty-state-wrapper {
    padding: 32px 16px;
  }
}
</style>
