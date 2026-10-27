<template>
  <div class="modal-backdrop" @click.self="$emit('close')">
    <div
      ref="modalRef"
      class="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sale-modal-title"
      tabindex="-1"
    >
      <header class="modal-header">
        <div class="header-content">
          <h2 id="sale-modal-title" class="modal-title">Registrar Venta</h2>
        </div>
        <button class="btn-close" @click="$emit('close')">✕</button>
      </header>

      <div class="modal-body">
        <p class="modal-desc">
          Registra la venta de un producto. El precio, el impuesto y el total se calculan automáticamente.
        </p>

        <form @submit.prevent="submit" class="form-grid" novalidate>
          <div class="form-group full-width">
            <label class="form-label">Producto *</label>
            <select
              v-model="form.producto_id"
              class="form-input"
              :class="{ 'input-error': errors.producto_id }"
              @change="errors.producto_id = ''"
            >
              <option value="" disabled>Selecciona un producto...</option>
              <option v-for="prod in products" :key="prod.id" :value="prod.id" :disabled="prod.cantidad <= 0">
                {{ prod.nombre }} (Stock: {{ prod.cantidad }})
              </option>
            </select>
            <span v-if="errors.producto_id" class="error-msg">{{ errors.producto_id }}</span>
          </div>

          <div class="form-group">
            <label class="form-label">Cantidad a vender *</label>
            <input
              v-model.number="form.cantidad"
              type="number"
              min="1"
              :max="selectedProductMax"
              class="form-input"
              :class="{ 'input-error': errors.cantidad }"
              @input="errors.cantidad = ''"
            />
            <span v-if="selectedProductMax !== undefined && !errors.cantidad" class="stock-hint">Max: {{ selectedProductMax }}</span>
            <span v-if="errors.cantidad" class="error-msg">{{ errors.cantidad }}</span>
          </div>

          <div class="form-group full-width form-group--checkbox">
            <label class="checkbox-label">
              <input v-model="form.es_exenta" type="checkbox" class="checkbox-input" />
              Venta exenta de IVA
            </label>
            <span class="checkbox-hint">Márcalo solo si esta venta no debe llevar impuesto.</span>
          </div>

          <div class="form-group full-width">
            <div class="tax-rate-header">
              <label class="form-label" for="sale-tax-rate">Porcentaje de IVA (%) *</label>
              <div v-if="false" class="tax-presets">
                <button
                  type="button"
                  class="preset-chip"
                  :class="{ 'preset-chip--active': form.tasa_iva === 12 }"
                >
                  12% (General)
                </button>
                <button
                  type="button"
                  class="preset-chip"
                  :class="{ 'preset-chip--active': form.tasa_iva === 5 }"
                >
                  5% (Pequeño Contribuyente)
                </button>
                <button
                  type="button"
                  class="preset-chip"
                  :class="{ 'preset-chip--active': form.tasa_iva === 0 }"
                >
                  0%
                </button>
              </div>
            </div>
            <div class="tax-rate-readonly">
              {{ form.es_exenta ? 'Exenta' : `${form.tasa_iva}% (configurado por la empresa)` }}
            </div>
            <div v-if="false" class="input-suffix-wrapper">
              <input
                id="sale-tax-rate"
                v-model.number="form.tasa_iva"
                type="number"
                min="0"
                max="100"
                step="any"
                class="form-input"
                :class="{ 'input-error': errors.tasa_iva }"
                :disabled="form.es_exenta"
                placeholder="12"
                @input="errors.tasa_iva = ''"
              />
              <span class="input-suffix">%</span>
            </div>
            <span v-if="form.es_exenta" class="field-hint">
              Deshabilitado porque la venta fue marcada como exenta de IVA.
            </span>
            <span v-else-if="errors.tasa_iva" class="error-msg">{{ errors.tasa_iva }}</span>
            <span v-else class="field-hint">
              Puedes ajustar el porcentaje de IVA para esta venta específica.
            </span>
          </div>

          <TaxBreakdown
            v-if="selectedProduct && effectiveTaxRate !== null"
            class="full-width"
            title="Resumen de la venta"
            :subtotal="subtotalPreview"
            :tax-rate="effectiveTaxRate"
            :is-exempt="form.es_exenta"
          />
          <p v-else-if="taxConfigError" class="tax-config-error full-width">{{ taxConfigError }}</p>
          <p v-if="isTemporaryTaxRate" class="tax-config-warning full-width">
            Vista previa temporal al 12%. El backend todavía puede registrar la venta con IVA 0%.
          </p>

          <div v-if="error" class="error-alert full-width">{{ error }}</div>

          <div class="form-actions full-width">
            <button type="button" class="btn-cancel" @click="$emit('close')" :disabled="isSubmitting">Cancelar</button>
            <button type="submit" class="btn-submit btn-submit--sale" :disabled="isSubmitting">
              {{ isSubmitting ? 'Registrando...' : 'Registrar Venta' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue';
import { createSale, fetchTaxConfiguration } from '@/features/sales/api';
import type { InventoryProduct } from '@/features/inventory/types';
import { getApiErrorMessage } from '@/services/apiClient';
import { useAccessibleModal } from '@/composables/useAccessibleModal';
import TaxBreakdown from '@/app/components/TaxBreakdown.vue';

const props = defineProps<{
  products: InventoryProduct[];
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'created'): void;
}>();

const modalRef = ref<HTMLElement | null>(null);
function closeModal(): void {
  emit('close');
}
useAccessibleModal(modalRef, closeModal);

const form = reactive({
  producto_id: '',
  cantidad: 1,
  es_exenta: false,
  tasa_iva: 12,
});

const defaultTaxRate = ref<number>(12);
const selectedProduct = computed(() => props.products.find(p => p.id === form.producto_id) ?? null);

const selectedProductMax = computed(() => selectedProduct.value?.cantidad);

// Tasa de impuesto efectiva usada en el cálculo en vivo:
// Si la venta está marcada como exenta, el IVA es 0%.
// Si no, se utiliza la tasa configurada o personalizada para esta venta.
const effectiveTaxRate = computed(() => {
  if (form.es_exenta) return 0;
  if (isBlank(form.tasa_iva)) return 0;
  return Number(form.tasa_iva);
});

// Vista previa en vivo: se recalcula con producto/cantidad y tasa de IVA elegida.
const subtotalPreview = computed(() => {
  const producto = selectedProduct.value;
  if (!producto || isBlank(form.cantidad)) return 0;
  return Number(form.cantidad) * producto.precio;
});

const isSubmitting = ref(false);
const error = ref('');

// Fallback temporal solo para la vista previa mientras se corrige el backend.
const TEMPORARY_TAX_RATE_FALLBACK = 12;
const taxRate = ref<number | null>(null);
const taxConfigError = ref('');
const isTemporaryTaxRate = ref(false);

onMounted(async () => {
  try {
    const config = await fetchTaxConfiguration();
    const configuredRate = Number(config.tasa_impuesto);
    isTemporaryTaxRate.value = configuredRate === 0;
    const resolvedRate = isTemporaryTaxRate.value
      ? TEMPORARY_TAX_RATE_FALLBACK
      : configuredRate;
    taxRate.value = resolvedRate;
    defaultTaxRate.value = resolvedRate;
    form.tasa_iva = resolvedRate;
  } catch (err) {
    // Si falla la consulta de la configuración, se permite editar manualmente.
    taxConfigError.value = 'No se pudo cargar la tasa de IVA configurada. Puedes ingresar el porcentaje manualmente.';
    taxRate.value = TEMPORARY_TAX_RATE_FALLBACK;
    defaultTaxRate.value = TEMPORARY_TAX_RATE_FALLBACK;
    form.tasa_iva = TEMPORARY_TAX_RATE_FALLBACK;
  }
});

const errors = reactive({
  producto_id: '',
  cantidad: '',
  tasa_iva: '',
});

function isBlank(value: number | string): boolean {
  return String(value).trim() === '';
}

function validateForm(): boolean {
  errors.producto_id = '';
  errors.cantidad = '';
  errors.tasa_iva = '';

  let isValid = true;

  if (!form.producto_id) {
    errors.producto_id = 'Selecciona un producto.';
    isValid = false;
  }

  if (isBlank(form.cantidad)) {
    errors.cantidad = 'Ingresa la cantidad a vender.';
    isValid = false;
  } else if (Number(form.cantidad) <= 0) {
    errors.cantidad = 'La cantidad debe ser mayor a 0.';
    isValid = false;
  } else if (selectedProductMax.value !== undefined && Number(form.cantidad) > selectedProductMax.value) {
    errors.cantidad = `No hay suficiente stock. Máximo disponible: ${selectedProductMax.value}.`;
    isValid = false;
  }

  if (!form.es_exenta) {
    if (isBlank(form.tasa_iva)) {
      errors.tasa_iva = 'Ingresa el porcentaje de IVA.';
      isValid = false;
    } else if (Number(form.tasa_iva) < 0 || Number(form.tasa_iva) > 100) {
      errors.tasa_iva = 'El porcentaje de IVA debe estar entre 0% y 100%.';
      isValid = false;
    }
  }

  return isValid;
}

async function submit() {
  error.value = '';

  if (!validateForm()) {
    return;
  }

  isSubmitting.value = true;

  try {
    await createSale({
      items: [{ producto_id: form.producto_id, cantidad: Number(form.cantidad) }],
      es_exenta: form.es_exenta,
    });

    emit('created');
    emit('close');
  } catch (err) {
    error.value = getApiErrorMessage(err);
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<style scoped>
/* Reutilizando los estilos base */
.tax-rate-readonly {
  display: flex;
  align-items: center;
  min-height: 42px;
  padding: 10px 14px;
  border: 1px solid var(--color-bg-border, #e2e8f0);
  border-radius: 8px;
  background: var(--color-bg-subtle, #f8fafc);
  color: var(--color-text-secondary, #475569);
  font-weight: 600;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  overflow-y: auto;
}

.modal {
  background: var(--color-bg-surface);
  border-radius: 16px;
  width: 100%;
  max-width: 480px;
  max-height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  animation: modalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes modalIn {
  from { opacity: 0; transform: translateY(20px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--color-bg-border);
  flex-shrink: 0;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-warning);
}

.modal-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-heading);
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: var(--color-text-faint);
  cursor: pointer;
  padding: 4px;
  border-radius: 8px;
  transition: all 0.2s;
}

.btn-close:hover {
  background: var(--color-bg-hover);
  color: var(--color-heading);
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1 1 auto;
  min-height: 0;
  overscroll-behavior: contain;
}

.modal-body::-webkit-scrollbar {
  width: 6px;
}

.modal-body::-webkit-scrollbar-track {
  background: transparent;
}

.modal-body::-webkit-scrollbar-thumb {
  background: var(--color-bg-border);
  border-radius: 9999px;
}

.modal-body::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-faint);
}

.modal-desc {
  margin: 0 0 20px 0;
  font-size: 0.9rem;
  color: var(--color-text-muted);
  line-height: 1.5;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.full-width {
  grid-column: 1 / -1;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group--checkbox {
  gap: 4px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text);
  cursor: pointer;
}

.checkbox-input {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: var(--color-structure-base);
}

.checkbox-hint {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-left: 24px;
}

.tax-config-error {
  margin: 0;
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--color-warning-bg);
  color: var(--color-warning-text);
  font-size: 0.82rem;
}

.tax-config-warning {
  margin: 0;
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--color-warning-bg);
  color: var(--color-warning-text);
  font-size: 0.82rem;
}

.form-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text);
}

.form-input {
  padding: 10px 14px;
  border: 1px solid var(--color-border-strong);
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: inherit;
  color: var(--color-heading);
  transition: all 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-warning);
  box-shadow: 0 0 0 3px rgba(234, 179, 8, 0.1);
}

.tax-rate-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}

.tax-presets {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.preset-chip {
  background: var(--color-bg-subtle, #f1f5f9);
  border: 1px solid var(--color-bg-border, #cbd5e1);
  border-radius: 9999px;
  padding: 2px 8px;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--color-text-secondary, #475569);
  cursor: pointer;
  transition: all 0.15s ease;
}

.preset-chip:hover {
  background: var(--color-bg-hover, #e2e8f0);
  color: var(--color-heading, #0f172a);
}

.preset-chip--active {
  background: #dbeafe;
  border-color: #3b82f6;
  color: #1d4ed8;
}

.input-suffix-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-suffix-wrapper .form-input {
  padding-right: 32px;
  width: 100%;
}

.input-suffix {
  position: absolute;
  right: 12px;
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--color-text-muted, #94a3b8);
  pointer-events: none;
}

.field-hint {
  font-size: 0.75rem;
  color: var(--color-text-muted, #64748b);
  margin-top: 2px;
}

.stock-hint {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-top: 4px;
}

.form-input.input-error {
  border-color: var(--color-danger);
}

.error-msg {
  color: var(--color-danger-text);
  font-size: 0.78rem;
}

.error-alert {
  padding: 12px;
  background: var(--color-danger-bg);
  color: var(--color-danger-text);
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
  padding-bottom: 4px;
}

.btn-cancel {
  padding: 10px 20px;
  background: var(--color-bg-hover);
  color: var(--color-text-secondary);
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-cancel:hover:not(:disabled) {
  background: var(--color-bg-hover);
  color: var(--color-heading);
}

.btn-submit {
  padding: 10px 24px;
  background: var(--color-warning); /* Yellow/Orange vibe for sales */
  color: #fff;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(234, 179, 8, 0.25);
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-1px);
  background: var(--color-warning-text);
  box-shadow: 0 4px 12px rgba(234, 179, 8, 0.35);
}

.btn-submit:disabled, .btn-cancel:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 480px) {
  .modal-backdrop {
    padding: 12px;
  }

  .modal {
    max-width: 100%;
    max-height: calc(100vh - 24px);
    margin: 0;
  }

  .modal-header {
    padding: 16px 18px 14px;
  }

  .modal-body {
    padding: 16px 18px;
  }
}
</style>
