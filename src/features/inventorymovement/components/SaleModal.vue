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
          Registra la salida de un producto por concepto de venta.
        </p>
        
        <form @submit.prevent="submit" class="form-grid">
          <div class="form-group full-width">
            <label class="form-label">Producto *</label>
            <select v-model="form.producto_id" class="form-input" required>
              <option value="" disabled>Selecciona un producto...</option>
              <option v-for="prod in products" :key="prod.id" :value="prod.id" :disabled="prod.cantidad <= 0">
                {{ prod.nombre }} (Stock: {{ prod.cantidad }})
              </option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Cantidad a descontar *</label>
            <input v-model.number="form.cantidad" type="number" min="1" :max="selectedProductMax" class="form-input" required />
            <span v-if="selectedProductMax !== undefined" class="stock-hint">Max: {{ selectedProductMax }}</span>
          </div>

          <div class="form-group full-width">
            <label class="form-label">Motivo / Notas</label>
            <textarea v-model="form.motivo" class="form-input" rows="2" placeholder="Ej. Venta en mostrador..."></textarea>
          </div>

          <div v-if="error" class="error-alert">{{ error }}</div>

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
import { reactive, ref, computed } from 'vue';
import { createMovement } from '@/features/inventorymovement/api';
import type { InventoryProduct } from '@/features/inventory/types';
import { getApiErrorMessage } from '@/services/apiClient';
import { useAccessibleModal } from '@/composables/useAccessibleModal';

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
  motivo: '',
});

const selectedProductMax = computed(() => {
  if (!form.producto_id) return undefined;
  const prod = props.products.find(p => p.id === form.producto_id);
  return prod ? prod.cantidad : undefined;
});

const isSubmitting = ref(false);
const error = ref('');

async function submit() {
  if (!form.producto_id || form.cantidad <= 0) {
    error.value = 'Por favor selecciona un producto e ingresa una cantidad válida.';
    return;
  }

  if (selectedProductMax.value !== undefined && form.cantidad > selectedProductMax.value) {
    error.value = `No hay suficiente stock. Máximo disponible: ${selectedProductMax.value}`;
    return;
  }

  isSubmitting.value = true;
  error.value = '';

  try {
    await createMovement({
      producto_id: form.producto_id,
      tipo_movimiento: 'salida_venta',
      cantidad: form.cantidad,
      motivo: form.motivo || 'Venta registrada',
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
}

.modal {
  background: #ffffff;
  border-radius: 16px;
  width: 100%;
  max-width: 450px;
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
  padding: 24px 24px 16px;
  border-bottom: 1px solid #f1f5f9;
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
  color: #eab308;
}

.modal-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px;
  border-radius: 8px;
  transition: all 0.2s;
}

.btn-close:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.modal-body {
  padding: 24px;
}

.modal-desc {
  margin: 0 0 20px 0;
  font-size: 0.9rem;
  color: #64748b;
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

.form-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #334155;
}

.form-input {
  padding: 10px 14px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: inherit;
  color: #1e293b;
  transition: all 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #eab308;
  box-shadow: 0 0 0 3px rgba(234, 179, 8, 0.1);
}

.stock-hint {
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 4px;
}

.error-alert {
  padding: 12px;
  background: #fef2f2;
  color: #b91c1c;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
}

.btn-cancel {
  padding: 10px 20px;
  background: #f1f5f9;
  color: #475569;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-cancel:hover:not(:disabled) {
  background: #e2e8f0;
  color: #1e293b;
}

.btn-submit {
  padding: 10px 24px;
  background: #eab308; /* Yellow/Orange vibe for sales */
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
  background: #ca8a04;
  box-shadow: 0 4px 12px rgba(234, 179, 8, 0.35);
}

.btn-submit:disabled, .btn-cancel:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>