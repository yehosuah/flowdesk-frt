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
      <div class="tax-dashboard-body">
        <TaxMetricCards :metrics="metrics" />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TaxMetricCards from '../components/TaxMetricCards.vue';
import type { TaxPeriodMetrics } from '../types';

const metrics = ref<TaxPeriodMetrics>({
  tax_debit: 0,
  tax_credit: 0,
  net_tax: 0,
  tax_payable: 0,
  carry_forward: 0,
  withholding_tax: 0,
  input_documents_count: 0,
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
