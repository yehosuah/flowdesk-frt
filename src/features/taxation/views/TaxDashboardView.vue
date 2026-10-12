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

      <div class="tax-dashboard-body">
        <TaxMetricCards :metrics="metrics" />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import TaxFiltersBar from '../components/TaxFiltersBar.vue';
import TaxMetricCards from '../components/TaxMetricCards.vue';
import { fetchTaxPeriodMetrics } from '../api';
import type { TaxPeriodMetrics } from '../types';

const selectedMonth = ref<number>(new Date().getMonth() + 1);
const selectedYear = ref<number>(new Date().getFullYear());

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
</style>
