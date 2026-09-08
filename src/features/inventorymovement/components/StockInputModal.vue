<template>
  <div class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal">
      <header class="modal-header">
        <div class="header-content">
          <h2 class="modal-title">Ingresar Stock (Compra)</h2>
        </div>
        <button class="btn-close" @click="$emit('close')">✕</button>
      </header>

      <div class="modal-body">
        <p class="modal-desc">
          Agrega nuevo inventario a un producto existente (reabastecimiento).
        </p>
        
        <form @submit.prevent="submit" class="form-grid">
          <div class="form-group full-width">
            <label class="form-label">Producto *</label>
            <select v-model="form.producto_id" class="form-input" required>
              <option value="" disabled>Selecciona un producto...</option>
              <option v-for="prod in products" :key="prod.id" :value="prod.id">
                {{ prod.nombre }} (Stock actual: {{ prod.cantidad }})
              </option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Cantidad a ingresar *</label>
            <input v-model.number="form.cantidad" type="number" min="1" class="form-input" required />
          </div>

          <div class="form-group full-width">
            <label class="form-label">Motivo / Notas</label>
            <textarea v-model="form.motivo" class="form-input" rows="2" placeholder="Ej. Compra a proveedor X..."></textarea>
          </div>

          <div v-if="error" class="error-alert">{{ error }}</div>

          <div class="form-actions full-width">
            <button type="button" class="btn-cancel" @click="$emit('close')" :disabled="isSubmitting">Cancelar</button>
            <button type="submit" class="btn-submit" :disabled="isSubmitting">
              {{ isSubmitting ? 'Guardando...' : 'Ingresar Stock' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { createMovement } from '@/features/inventorymovement/api';
import type { InventoryProduct } from '@/features/inventory/types';
import { getApiErrorMessage } from '@/services/apiClient';

defineProps<{
  products: InventoryProduct[];
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'created'): void;
}>();

const form = reactive({
  producto_id: '',
  cantidad: 1,
  motivo: '',
});

const isSubmitting = ref(false);
const error = ref('');

async function submit() {
  if (!form.producto_id || form.cantidad <= 0) {
    error.value = 'Por favor selecciona un producto e ingresa una cantidad válida.';
    return;
  }

  isSubmitting.value = true;
  error.value = '';

  try {
    await createMovement({
      producto_id: form.producto_id,
      tipo_movimiento: 'entrada_compra',
      cantidad: form.cantidad,
      motivo: form.motivo || 'Ingreso de stock (Compra)',
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
/* Reutilizando los mismos estilos modernos del NewProductModal */
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
  background: var(--color-bg-surface);
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
  border-bottom: 1px solid var(--color-bg-border);
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
  color: var(--color-structure-base, #3b82f6);
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
  border-color: var(--color-structure-base, #3b82f6);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
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
  margin-top: 16px;
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
  background: var(--color-structure-base, #3b82f6);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.25);
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.35);
}

.btn-submit:disabled, .btn-cancel:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
