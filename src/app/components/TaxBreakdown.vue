<template>
  <div class="tax-breakdown">
    <h4 v-if="title" class="tax-breakdown__title">{{ title }}</h4>

    <dl class="tax-breakdown__lines">
      <div class="tax-breakdown__line">
        <dt>Subtotal</dt>
        <dd>Q {{ formatMoney(subtotal) }}</dd>
      </div>

      <div class="tax-breakdown__line">
        <dt>IVA ({{ taxRatePercent }}%)</dt>
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
 * Solo necesita el subtotal: el IVA y el total se calculan acá mismo con la
 * tasa fija de Guatemala (12%), para que ningún componente que lo use tenga
 * que repetir esa cuenta. `taxRate` existe como prop (no como literal suelto
 * en el cálculo) por si alguna vez hay que mostrar una venta histórica con
 * una tasa distinta, pero su valor por defecto es siempre 12%.
 */
const props = withDefaults(
  defineProps<{
    /** Suma de los subtotales de cada línea de la venta, antes de impuestos. */
    subtotal: number;
    /** Tasa de IVA a aplicar sobre el subtotal (0.12 = 12%). */
    taxRate?: number;
    /** Título opcional, p. ej. "Resumen de la venta". */
    title?: string;
  }>(),
  {
    taxRate: 0.12,
    title: '',
  },
);

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function formatMoney(value: number): string {
  return Number.isFinite(value) ? value.toFixed(2) : '0.00';
}

const taxRatePercent = computed(() => Math.round(props.taxRate * 100));
const impuesto = computed(() => round2(props.subtotal * props.taxRate));
const total = computed(() => round2(props.subtotal + impuesto.value));

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
</style>
