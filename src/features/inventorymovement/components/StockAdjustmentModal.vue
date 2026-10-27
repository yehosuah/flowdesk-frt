<template>
  <Teleport to="body">
    <div class="modal-backdrop" data-testid="stock-adjustment-modal" @click.self="closeModal">
      <div
        ref="modalRef"
        class="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="stock-adjustment-modal-title"
        tabindex="-1"
      >
        <div class="modal__header">
          <h2 id="stock-adjustment-modal-title" class="modal__title">Ajuste por Conteo Físico</h2>
          <button class="modal__close" type="button" aria-label="Cerrar" @click="closeModal">✕</button>
        </div>

        <p class="modal__desc">
          Ingresa la cantidad contada en bodega. Se registrará un ajuste por la diferencia con el stock del sistema.
        </p>

        <form novalidate @submit.prevent="submit">
          <div class="form-group">
            <label class="form-label" for="adjustment-product">Producto *</label>
            <select
              id="adjustment-product"
              v-model="form.producto_id"
              class="form-input"
              :class="{ 'input-error': errors.producto_id }"
              @change="errors.producto_id = ''"
            >
              <option value="" disabled>Seleccionar producto…</option>
              <option v-for="p in products" :key="p.id" :value="p.id">
                {{ p.nombre }}{{ p.is_active ? '' : ' (inactivo)' }}
              </option>
            </select>
            <span v-if="errors.producto_id" class="error-msg">{{ errors.producto_id }}</span>
          </div>

          <div class="stock-row">
            <div class="form-group">
              <span class="form-label">Stock en sistema</span>
              <div class="stock-system" data-testid="system-stock">
                {{ selectedProduct ? selectedProduct.cantidad : '—' }}
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="adjustment-count">Conteo físico *</label>
              <input
                id="adjustment-count"
                v-model.number="form.conteo"
                type="number"
                min="0"
                step="0.01"
                class="form-input"
                :class="{ 'input-error': errors.conteo }"
                placeholder="0"
                @input="errors.conteo = ''"
              />
              <span v-if="errors.conteo" class="error-msg">{{ errors.conteo }}</span>
            </div>
          </div>

          <div
            v-if="difference !== null"
            class="preview"
            :class="{
              'preview--positive': difference > 0,
              'preview--negative': difference < 0,
            }"
            data-testid="adjustment-preview"
          >
            <template v-if="difference === 0">
              El conteo coincide con el sistema. No hay diferencia que ajustar.
            </template>
            <template v-else>
              <strong>{{ difference > 0 ? 'Ajuste positivo' : 'Ajuste negativo' }}</strong>
              de {{ formatQty(Math.abs(difference)) }} unidades.
              El stock quedará en {{ formatQty(Number(form.conteo)) }}.
            </template>
          </div>

          <p v-if="selectedProduct && !selectedProduct.is_active" class="field-hint">
            El producto está inactivo; solo admite ajustes para corregir existencias.
          </p>

          <div class="form-group">
            <label class="form-label" for="adjustment-reason">Motivo *</label>
            <textarea
              id="adjustment-reason"
              v-model="form.motivo"
              class="form-input textarea"
              :class="{ 'input-error': errors.motivo }"
              rows="2"
              :maxlength="MOVEMENT_REASON_MAX_LENGTH"
              placeholder="Ej. Conteo mensual, producto dañado, merma…"
              @input="errors.motivo = ''"
            ></textarea>
            <div class="field-footer">
              <span v-if="errors.motivo" class="error-msg">{{ errors.motivo }}</span>
              <span class="char-count">{{ form.motivo.length }}/{{ MOVEMENT_REASON_MAX_LENGTH }}</span>
            </div>
          </div>

          <div v-if="submitError" class="alert alert-error">
            <span>{{ submitError }}</span>
            <button class="alert-close" type="button" @click="submitError = ''">✕</button>
          </div>

          <div class="modal__footer">
            <button type="button" class="btn-secondary" :disabled="isSubmitting" @click="closeModal">Cancelar</button>
            <button type="submit" class="btn-primary btn-submit" :disabled="isSubmitting">
              <span v-if="isSubmitting" class="spinner" aria-hidden="true"></span>
              <span>{{ isSubmitting ? 'Guardando…' : 'Registrar ajuste' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { createMovement, MOVEMENT_REASON_MAX_LENGTH } from '@/features/inventorymovement/api';
import type { InventoryProduct } from '@/features/inventory/types';
import { ApiError, getApiErrorMessage } from '@/services/apiClient';
import { useAccessibleModal } from '@/composables/useAccessibleModal';

const props = defineProps<{ products: InventoryProduct[] }>();

const emit = defineEmits<{ close: []; created: [] }>();

const modalRef = ref<HTMLElement | null>(null);
function closeModal(): void {
  if (isSubmitting.value) return;
  emit('close');
}
useAccessibleModal(modalRef, closeModal);

interface FormData {
  producto_id: string;
  conteo: number | '';
  motivo: string;
}

const form = reactive<FormData>({ producto_id: '', conteo: '', motivo: '' });
const errors = reactive<Record<'producto_id' | 'conteo' | 'motivo', string>>({
  producto_id: '', conteo: '', motivo: '',
});
const isSubmitting = ref(false);
const submitError = ref('');

const selectedProduct = computed(() =>
  props.products.find(product => product.id === form.producto_id) ?? null,
);

// El backend guarda cantidades con 2 decimales; redondeamos para no enviar ruido de coma flotante.
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

const difference = computed<number | null>(() => {
  if (!selectedProduct.value || form.conteo === '' || Number.isNaN(Number(form.conteo))) return null;
  if (Number(form.conteo) < 0) return null;
  return round2(Number(form.conteo) - selectedProduct.value.cantidad);
});

function validate(): boolean {
  let ok = true;
  if (!form.producto_id) { errors.producto_id = 'Selecciona un producto.'; ok = false; }
  if (form.conteo === '' || Number.isNaN(Number(form.conteo))) {
    errors.conteo = 'Ingresa la cantidad contada.'; ok = false;
  } else if (Number(form.conteo) < 0) {
    errors.conteo = 'El conteo no puede ser negativo.'; ok = false;
  } else if (difference.value === 0) {
    errors.conteo = 'El conteo coincide con el stock del sistema.'; ok = false;
  }
  if (!form.motivo.trim()) { errors.motivo = 'El motivo del ajuste es obligatorio.'; ok = false; }
  return ok;
}

function translateError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 403) return 'No tienes permisos para registrar ajustes.';
    if (err.message === 'Insufficient stock for this movement') {
      return 'El stock cambió desde que se cargó la página. Recarga e intenta de nuevo.';
    }
  }
  return getApiErrorMessage(err);
}

async function submit() {
  submitError.value = '';
  if (!validate() || difference.value === null) return;

  isSubmitting.value = true;
  try {
    await createMovement({
      producto_id: form.producto_id,
      tipo_movimiento: difference.value > 0 ? 'ajuste_positivo' : 'ajuste_negativo',
      cantidad: Math.abs(difference.value),
      motivo: form.motivo.trim(),
    });
    emit('created');
    emit('close');
  } catch (err) {
    submitError.value = translateError(err);
  } finally {
    isSubmitting.value = false;
  }
}

function formatQty(value: number): string {
  return String(round2(value));
}
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
  margin-bottom: 8px;
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

.modal__desc {
  margin: 0 0 20px;
  font-size: .85rem;
  color: var(--color-text-muted);
  line-height: 1.45;
}

.stock-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.stock-system {
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--color-bg-border);
  color: var(--color-text);
  font-weight: 700;
  font-size: .95rem;
}

.preview {
  border-radius: 8px;
  padding: 10px 14px;
  font-size: .85rem;
  margin-bottom: 16px;
  background: var(--color-bg-border);
  color: var(--color-text-muted);
}

.preview--positive {
  background: var(--color-success-bg);
  border: 1px solid var(--color-success-border);
  color: var(--color-success-text);
}

.preview--negative {
  background: var(--color-danger-bg);
  border: 1px solid var(--color-danger-border);
  color: var(--color-danger-text);
}

.field-hint {
  margin: -4px 0 14px;
  font-size: .78rem;
  color: var(--color-warning-text);
}

.textarea {
  resize: vertical;
  min-height: 56px;
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

.btn-submit {
  width: auto;
  padding: 10px 28px;
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

@media (max-width: 480px) {
  .modal {
    padding: 22px 18px 18px;
  }

  .stock-row {
    grid-template-columns: 1fr;
    gap: 0;
  }
}
</style>
