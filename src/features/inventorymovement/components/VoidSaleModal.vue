<template>
  <Teleport to="body">
    <div class="modal-backdrop" data-testid="void-sale-modal" @click.self="closeModal">
      <div
        ref="modalRef"
        class="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="void-sale-modal-title"
        tabindex="-1"
      >
        <div class="modal__header">
          <h2 id="void-sale-modal-title" class="modal__title">Anular Venta</h2>
          <button class="modal__close" type="button" aria-label="Cerrar" @click="closeModal">✕</button>
        </div>

        <div v-if="isLoading" class="state-msg">Cargando venta…</div>

        <div v-else-if="loadError" class="alert alert-error">
          <span>{{ loadError }}</span>
        </div>

        <template v-else-if="sale">
          <dl class="sale-summary">
            <div class="sale-summary__row">
              <dt>Venta</dt>
              <dd class="mono">{{ sale.id.slice(0, 8).toUpperCase() }}</dd>
            </div>
            <div class="sale-summary__row">
              <dt>Fecha</dt>
              <dd>{{ formatDate(sale.fecha) }}</dd>
            </div>
            <div class="sale-summary__row">
              <dt>Cliente</dt>
              <dd>{{ sale.cliente_nombre ?? 'Consumidor final' }}</dd>
            </div>
            <div class="sale-summary__row">
              <dt>Total</dt>
              <dd class="sale-summary__total">{{ formatMoney(sale.total) }}</dd>
            </div>
          </dl>

          <div class="items">
            <p class="items__title">Productos que regresarán al inventario</p>
            <ul class="items__list">
              <li v-for="item in sale.items" :key="item.id" class="items__row">
                <span>{{ getProductName(item.producto_id) }}</span>
                <span class="items__qty">+{{ Number(item.cantidad) }}</span>
              </li>
            </ul>
          </div>

          <div v-if="isVoided" class="alert alert-info" data-testid="already-voided">
            <span>
              Esta venta ya fue anulada<template v-if="sale.anulada_en"> el {{ formatDate(sale.anulada_en) }}</template>.
              <template v-if="sale.motivo_anulacion">Motivo: {{ sale.motivo_anulacion }}</template>
            </span>
          </div>

          <div v-else-if="!isCompleted" class="alert alert-error">
            <span>Solo se pueden anular ventas completadas.</span>
          </div>

          <form v-else novalidate @submit.prevent="submit">
            <div class="warning">
              La venta y sus movimientos se conservan en el historial. Esta acción no se puede deshacer.
            </div>

            <div class="form-group">
              <label class="form-label" for="void-sale-reason">Motivo de la anulación *</label>
              <textarea
                id="void-sale-reason"
                v-model="motivo"
                class="form-input textarea"
                :class="{ 'input-error': motivoError }"
                rows="3"
                :maxlength="SALE_VOID_REASON_MAX_LENGTH"
                placeholder="Ej. Error al registrar la cantidad, devolución del cliente…"
                @input="motivoError = ''"
              ></textarea>
              <div class="field-footer">
                <span v-if="motivoError" class="error-msg">{{ motivoError }}</span>
                <span class="char-count">{{ motivo.length }}/{{ SALE_VOID_REASON_MAX_LENGTH }}</span>
              </div>
            </div>

            <div v-if="submitError" class="alert alert-error">
              <span>{{ submitError }}</span>
              <button class="alert-close" type="button" @click="submitError = ''">✕</button>
            </div>

            <div class="modal__footer">
              <button type="button" class="btn-secondary" :disabled="isSubmitting" @click="closeModal">Cancelar</button>
              <button type="submit" class="btn-danger" :disabled="isSubmitting">
                {{ isSubmitting ? 'Anulando…' : 'Anular venta' }}
              </button>
            </div>
          </form>
        </template>

        <div v-if="!sale || isVoided || !isCompleted" class="modal__footer">
          <button type="button" class="btn-secondary" @click="closeModal">Cerrar</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useCurrency } from '@/features/currency';
import { getSale, voidSale } from '@/features/sales/api';
import {
  SALE_STATE_COMPLETED,
  SALE_STATE_VOIDED,
  SALE_VOID_REASON_MAX_LENGTH,
  type Sale,
} from '@/features/sales/types';
import type { InventoryProduct } from '@/features/inventory/types';
import { ApiError, getApiErrorMessage } from '@/services/apiClient';
import { useAccessibleModal } from '@/composables/useAccessibleModal';

const props = defineProps<{
  saleId: string;
  products: InventoryProduct[];
}>();

const emit = defineEmits<{
  close: [];
  voided: [sale: Sale];
}>();

const modalRef = ref<HTMLElement | null>(null);
function closeModal(): void {
  if (isSubmitting.value) return;
  emit('close');
}
useAccessibleModal(modalRef, closeModal);

const sale = ref<Sale | null>(null);
const isLoading = ref(true);
const loadError = ref('');

const motivo = ref('');
const motivoError = ref('');
const isSubmitting = ref(false);
const submitError = ref('');

const isVoided = computed(() => sale.value?.estado === SALE_STATE_VOIDED);
const isCompleted = computed(() => sale.value?.estado === SALE_STATE_COMPLETED);

onMounted(async () => {
  try {
    sale.value = await getSale(props.saleId);
  } catch (err) {
    loadError.value = err instanceof ApiError && err.status === 404
      ? 'La venta no existe o ya no está disponible.'
      : getApiErrorMessage(err);
  } finally {
    isLoading.value = false;
  }
});

// El backend responde en inglés; traducimos los casos que el usuario puede provocar.
function translateVoidError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 403) return 'No tienes permisos para anular ventas.';
    if (err.status === 404) return 'La venta no existe o ya no está disponible.';
    if (err.message === 'Sale is already voided') return 'Esta venta ya fue anulada.';
    if (err.message === 'Only completed sales can be voided') return 'Solo se pueden anular ventas completadas.';
  }
  return getApiErrorMessage(err);
}

async function submit() {
  submitError.value = '';
  const reason = motivo.value.trim();
  if (!reason) {
    motivoError.value = 'El motivo de la anulación es obligatorio.';
    return;
  }

  isSubmitting.value = true;
  try {
    const updated = await voidSale(props.saleId, { motivo: reason });
    sale.value = updated;
    emit('voided', updated);
  } catch (err) {
    submitError.value = translateVoidError(err);
  } finally {
    isSubmitting.value = false;
  }
}

function getProductName(id: string): string {
  return props.products.find(product => product.id === id)?.nombre ?? id.slice(0, 8) + '…';
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return (
    `${String(date.getDate()).padStart(2, '0')}/` +
    `${String(date.getMonth() + 1).padStart(2, '0')}/` +
    `${date.getFullYear()}`
  );
}

const { formatCurrency: formatMoney } = useCurrency();
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, .45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.modal {
  background: var(--color-bg-surface);
  border-radius: 14px;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, .18);
  padding: 28px 32px 24px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.modal__title {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--color-heading);
  margin: 0;
}

.modal__close {
  background: none;
  border: none;
  font-size: 1rem;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 4px;
}

.modal__close:hover {
  background: var(--color-bg-border);
}

.state-msg {
  padding: 24px 0;
  text-align: center;
  color: var(--color-text-muted);
  font-size: .9rem;
}

.sale-summary {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 16px;
  margin: 0 0 16px;
}

.sale-summary__row dt {
  font-size: .75rem;
  color: var(--color-text-muted);
  font-weight: 600;
}

.sale-summary__row dd {
  margin: 2px 0 0;
  font-size: .9rem;
  color: var(--color-text);
  font-weight: 600;
}

.sale-summary__total {
  color: var(--color-heading);
}

.mono {
  font-family: ui-monospace, monospace;
}

.items {
  border: 1px solid var(--color-bg-border);
  border-radius: 10px;
  padding: 12px 14px;
  margin-bottom: 16px;
}

.items__title {
  margin: 0 0 8px;
  font-size: .78rem;
  font-weight: 700;
  color: var(--color-text-muted);
}

.items__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.items__row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: .86rem;
  color: var(--color-text);
}

.items__qty {
  font-weight: 700;
  color: var(--color-success);
  white-space: nowrap;
}

.warning {
  background: var(--color-warning-bg);
  border: 1px solid var(--color-warning-border);
  color: var(--color-warning-text);
  border-radius: 8px;
  padding: 10px 14px;
  font-size: .82rem;
  margin-bottom: 16px;
}

.alert-info {
  background: var(--color-warning-bg);
  border: 1px solid var(--color-warning-border);
  color: var(--color-warning-text);
}

.textarea {
  resize: vertical;
  min-height: 72px;
  font-family: inherit;
}

.field-footer {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.char-count {
  margin-left: auto;
  font-size: .72rem;
  color: var(--color-text-muted);
}

.modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.btn-secondary {
  padding: 10px 20px;
  border: 1.5px solid var(--color-structure-subtle);
  border-radius: 8px;
  background: var(--color-bg-surface);
  color: var(--color-text-muted);
  font-size: .88rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: all .13s;
}

.btn-secondary:hover:not(:disabled) {
  border-color: var(--color-structure-hover);
  color: var(--color-structure-hover);
}

.btn-danger {
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  background: var(--color-danger);
  color: #fff;
  font-size: .88rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: opacity .13s;
}

.btn-danger:hover:not(:disabled) {
  opacity: .9;
}

.btn-danger:disabled,
.btn-secondary:disabled {
  opacity: .6;
  cursor: not-allowed;
}

@media (max-width: 480px) {
  .modal {
    padding: 22px 18px 18px;
  }

  .sale-summary {
    grid-template-columns: 1fr;
  }
}
</style>
