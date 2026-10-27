<template>
  <div class="tax-metrics-grid">
    <!-- Débito Fiscal -->
    <div class="metric-card metric-card--debit">
      <div class="metric-card__header">
        <span class="metric-card__title">Débito Fiscal (Ventas)</span>
        <div class="metric-card__icon-wrapper metric-card__icon-wrapper--debit">
          <ArrowUpRight :size="20" />
        </div>
      </div>
      <div class="metric-card__body">
        <span class="metric-card__value">{{ formatCurrency(metrics.tax_debit) }}</span>
        <p class="metric-card__hint">IVA generado por ventas y servicios prestados</p>
      </div>
    </div>

    <!-- Crédito Fiscal -->
    <div class="metric-card metric-card--credit">
      <div class="metric-card__header">
        <span class="metric-card__title">Crédito Fiscal (Compras)</span>
        <div class="metric-card__icon-wrapper metric-card__icon-wrapper--credit">
          <ArrowDownLeft :size="20" />
        </div>
      </div>
      <div class="metric-card__body">
        <span class="metric-card__value">{{ formatCurrency(metrics.tax_credit) }}</span>
        <p class="metric-card__hint">IVA deducible por compras a proveedores</p>
      </div>
    </div>

    <!-- Impuesto Neto -->
    <div class="metric-card">
      <div class="metric-card__header">
        <span class="metric-card__title">Impuesto Neto</span>
        <div class="metric-card__icon-wrapper metric-card__icon-wrapper--neutral">
          <Scale :size="20" />
        </div>
      </div>
      <div class="metric-card__body">
        <span class="metric-card__value" :class="metrics.net_tax >= 0 ? 'text-danger' : 'text-success'">
          {{ formatCurrency(Math.abs(metrics.net_tax)) }}
        </span>
        <p class="metric-card__hint">
          {{ metrics.net_tax >= 0 ? 'Diferencia a favor de la SAT' : 'Diferencia a favor del contribuyente' }}
        </p>
      </div>
    </div>

    <!-- Impuesto a Pagar -->
    <div class="metric-card metric-card--highlight">
      <div class="metric-card__header">
        <span class="metric-card__title">Impuesto a Pagar</span>
        <div class="metric-card__icon-wrapper metric-card__icon-wrapper--payable">
          <DollarSign :size="20" />
        </div>
      </div>
      <div class="metric-card__body">
        <span class="metric-card__value metric-card__value--large">
          {{ formatCurrency(metrics.tax_payable) }}
        </span>
        <div class="metric-card__footer">
          <span
            class="status-pill"
            :class="metrics.tax_payable > 0 ? 'status-pill--pending' : 'status-pill--settled'"
          >
            {{ metrics.tax_payable > 0 ? 'Por liquidar' : 'Sin pago pendiente' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Remanente a Favor -->
    <div class="metric-card">
      <div class="metric-card__header">
        <span class="metric-card__title">Remanente a Favor</span>
        <div class="metric-card__icon-wrapper metric-card__icon-wrapper--carry">
          <ShieldCheck :size="20" />
        </div>
      </div>
      <div class="metric-card__body">
        <span class="metric-card__value text-success">
          {{ formatCurrency(metrics.carry_forward) }}
        </span>
        <p class="metric-card__hint">Crédito transferible al siguiente período fiscal</p>
      </div>
    </div>

    <!-- Retenciones Soportadas -->
    <div class="metric-card">
      <div class="metric-card__header">
        <span class="metric-card__title">Retenciones Aplicadas</span>
        <div class="metric-card__icon-wrapper metric-card__icon-wrapper--neutral">
          <Receipt :size="20" />
        </div>
      </div>
      <div class="metric-card__body">
        <span class="metric-card__value">{{ formatCurrency(metrics.withholding_tax) }}</span>
        <p class="metric-card__hint">Retenciones de IVA soportadas en el período</p>
      </div>
    </div>

    <!-- Documentos Procesados -->
    <div class="metric-card">
      <div class="metric-card__header">
        <span class="metric-card__title">Documentos Fiscales</span>
        <div class="metric-card__icon-wrapper metric-card__icon-wrapper--neutral">
          <FileText :size="20" />
        </div>
      </div>
      <div class="metric-card__body">
        <span class="metric-card__value">{{ metrics.input_documents_count }}</span>
        <p class="metric-card__hint">Facturas y documentos computados</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowUpRight, ArrowDownLeft, Scale, DollarSign, ShieldCheck, Receipt, FileText } from 'lucide-vue-next';
import type { TaxPeriodMetrics } from '../types';
import { useCurrency } from '@/features/currency';

defineProps<{
  metrics: TaxPeriodMetrics;
}>();

const { formatCurrency } = useCurrency();
</script>

<style scoped>
.tax-metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
  width: 100%;
}

.metric-card {
  background: var(--color-bg-surface, #ffffff);
  border: 1px solid var(--color-bg-border, #e2e8f0);
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px -2px rgba(0, 0, 0, 0.08);
}

.metric-card--highlight {
  border-color: #3b82f6;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.03) 0%, rgba(255, 255, 255, 1) 100%);
}

.metric-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.metric-card__title {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--color-text-secondary, #64748b);
}

.metric-card__icon-wrapper {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.metric-card__icon-wrapper--debit {
  background-color: #fee2e2;
  color: #ef4444;
}

.metric-card__icon-wrapper--credit {
  background-color: #dcfce7;
  color: #10b981;
}

.metric-card__icon-wrapper--payable {
  background-color: #dbeafe;
  color: #2563eb;
}

.metric-card__icon-wrapper--carry {
  background-color: #ecfdf5;
  color: #059669;
}

.metric-card__icon-wrapper--neutral {
  background-color: #f1f5f9;
  color: #475569;
}

.metric-card__body {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.metric-card__value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-heading, #0f172a);
  letter-spacing: -0.02em;
}

.metric-card__value--large {
  font-size: 1.75rem;
  color: #1e40af;
}

.metric-card__hint {
  font-size: 0.8rem;
  color: var(--color-text-muted, #94a3b8);
  margin: 0;
  line-height: 1.4;
}

.metric-card__footer {
  margin-top: 8px;
}

.status-pill {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 9999px;
}

.status-pill--pending {
  background-color: #fef3c7;
  color: #b45309;
}

.status-pill--settled {
  background-color: #dcfce7;
  color: #15803d;
}

.text-danger {
  color: #dc2626 !important;
}

.text-success {
  color: #16a34a !important;
}

@media (max-width: 768px) {
  .tax-metrics-grid {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 16px;
  }

  .metric-card {
    padding: 16px;
  }

  .metric-card__value {
    font-size: 1.35rem;
  }

  .metric-card__value--large {
    font-size: 1.5rem;
  }
}

@media (max-width: 480px) {
  .tax-metrics-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}
</style>

