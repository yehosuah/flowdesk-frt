<template>
  <div class="tax-dashboard-page">
    <header class="tax-dashboard-header">
      <div class="tax-header-info">
        <h1 class="tax-title">Dashboard Tributario</h1>
        <p class="tax-subtitle">
          Consulta y proyecta tus obligaciones tributarias, IVA débito/crédito y retenciones del período.
        </p>
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
        :message="errorMessage"
      >
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
      <div v-else-if="isEmpty" class="empty-state-wrapper">
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
      <div v-else class="tax-dashboard-body">
        <TaxMetricCards :metrics="metrics" />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { Skeleton, Alert, EmptyState, Button } from '@/app/components/ui';
import { FileQuestion } from 'lucide-vue-next';
import TaxFiltersBar from '../components/TaxFiltersBar.vue';
import TaxMetricCards from '../components/TaxMetricCards.vue';
import { fetchTaxPeriodMetrics } from '../api';
import type { TaxPeriodMetrics } from '../types';

const selectedMonth = ref<number>(new Date().getMonth() + 1);
const selectedYear = ref<number>(new Date().getFullYear());
const isLoading = ref<boolean>(true);
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

function resetToCurrentPeriod() {
  selectedMonth.value = new Date().getMonth() + 1;
  selectedYear.value = new Date().getFullYear();
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
