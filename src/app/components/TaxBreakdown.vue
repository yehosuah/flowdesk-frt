<template>
  <div class="tax-breakdown">
    <h4 v-if="title" class="tax-breakdown__title">{{ title }}</h4>

    <dl class="tax-breakdown__lines">
      <div class="tax-breakdown__line">
        <dt>Subtotal</dt>
        <dd>Q {{ formatMoney(subtotal) }}</dd>
      </div>

      <div v-if="descuento > 0" class="tax-breakdown__line">
        <dt>Descuento</dt>
        <dd>- Q {{ formatMoney(descuento) }}</dd>
      </div>

      <div class="tax-breakdown__line">
        <dt>
          <span v-if="isExempt" class="tax-breakdown__exempt-badge">Exenta de IVA</span>
          <span v-else>IVA ({{ taxRatePercent }}%)</span>
        </dt>
        <dd>Q {{ formatMoney(impuesto) }}</dd>
      </div>
    </dl>

    <div class="tax-breakdown__total">
      <span>Total</span>
      <span>Q {{ formatMoney(total) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

/**
 * Desglose tributario de una venta (subtotal, IVA, total).
 *
 * `taxRate` y `isExempt` NO tienen valores por defecto propios del negocio:
 * la tasa de IVA es configurable por empresa (GET /commercial/tax-configuration,
 * tabla configuracion_tributaria del backend) y `es_exenta` es una decisión por
 * venta — ambos deben venir siempre de quien use este componente, nunca
 * asumirse acá. El monto de impuesto y el total se calculan igual que el
 * backend (app/services/commercial.py::create_sale): impuesto = 0 si está
 * exenta, si no subtotal × tasa/100; total = subtotal - descuento + impuesto.
 */
const props = withDefaults(
  defineProps<{
    /** Suma de (cantidad × precio unitario) de cada línea de la venta. */
    subtotal: number;
    /** Tasa de IVA de la empresa, en porcentaje (12 = 12%), no en fracción. */
    taxRate: number;
    /** Descuento aplicado a la venta. Se resta del subtotal antes del total. */
    descuento?: number;
    /** Si la venta está exenta de IVA: el impuesto es 0 y se rotula distinto. */
    isExempt?: boolean;
    /** Título opcional, p. ej. "Resumen de la venta". */
    title?: string;
  }>(),
  {
    descuento: 0,
    isExempt: false,
    title: '',
  },
);

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function formatMoney(value: number): string {
  return Number.isFinite(value) ? value.toFixed(2) : '0.00';
}

const taxRatePercent = computed(() => round2(props.taxRate));
const impuesto = computed(() =>
  props.isExempt ? 0 : round2(props.subtotal * (props.taxRate / 100)),
);
const total = computed(() => round2(props.subtotal + props.descuento + impuesto.value));

defineExpose({ impuesto, total });
</script>

<style scoped>
.tax-breakdown {
  background: var(--color-bg-subtle);
  border: 1px solid var(--color-bg-border);
  border-radius: 12px;
  padding: 16px 18px;
}

.tax-breakdown__title {
  margin: 0 0 12px;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--color-heading);
}

.tax-breakdown__lines {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
}

.tax-breakdown__line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.tax-breakdown__line dt {
  font-size: 0.88rem;
  color: var(--color-text-secondary);
}

.tax-breakdown__line dd {
  margin: 0;
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--color-text);
  font-variant-numeric: tabular-nums;
}

.tax-breakdown__exempt-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--color-info-bg);
  color: var(--color-info-text);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.tax-breakdown__total {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--color-bg-border);
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--color-heading);
}

.tax-breakdown__total span:last-child {
  font-variant-numeric: tabular-nums;
}

@media (max-width: 420px) {
  .tax-breakdown {
    padding: 14px;
  }

  .tax-breakdown__line dt,
  .tax-breakdown__line dd {
    font-size: 0.82rem;
  }

  .tax-breakdown__total {
    font-size: 0.95rem;
  }
}
</style>
