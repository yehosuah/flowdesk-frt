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

      <div v-else class="tax-dashboard-body">
        <TaxMetricCards :metrics="metrics" />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { Skeleton } from '@/app/components/ui';
import TaxFiltersBar from '../components/TaxFiltersBar.vue';
import TaxMetricCards from '../components/TaxMetricCards.vue';
import { fetchTaxPeriodMetrics } from '../api';
import type { TaxPeriodMetrics } from '../types';

const selectedMonth = ref<number>(new Date().getMonth() + 1);
const selectedYear = ref<number>(new Date().getFullYear());
const isLoading = ref<boolean>(true);

const metrics = ref<TaxPeriodMetrics>({
  tax_debit: 0,
  tax_credit: 0,
  net_tax: 0,
  tax_payable: 0,
  carry_forward: 0,
  withholding_tax: 0,
  input_documents_count: 0,
});

async function loadMetrics() {
  isLoading.value = true;
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
</style>
