<template>
  <div class="modal-backdrop" @click.self="$emit('close')">
    <div
      ref="modalRef"
      class="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-product-modal-title"
      tabindex="-1"
    >
      <header class="modal-header">
        <div class="header-content">
          <h2
            id="new-product-modal-title"
            class="modal__title"
          >
            Crear Producto Nuevo
          </h2>
        </div>
        <button class="btn-close" @click="$emit('close')">✕</button>
      </header>

      <div class="modal-body">
        <p class="modal-desc">
          Registra un nuevo producto y su cantidad inicial de stock.
        </p>
        
        <form @submit.prevent="submit" class="form-grid">
          <div class="form-group full-width">
            <label class="form-label">Nombre del producto *</label>
            <input v-model="form.nombre" type="text" class="form-input" required placeholder="Ej. Lápiz HB" />
          </div>

          <div v-if="similarProducts.length > 0" class="warning-alert full-width">
            <strong>⚠️ Posibles duplicados:</strong> Ya existen productos con nombres similares:
            <ul>
              <li v-for="prod in similarProducts" :key="prod.id">{{ prod.nombre }}</li>
            </ul>
          </div>

          <div class="form-group full-width">
            <label class="form-label">Descripción</label>
            <textarea v-model="form.descripcion" class="form-input" rows="2" placeholder="Detalles del producto..."></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Precio de Venta (Q) *</label>
            <input v-model.number="form.precio_venta" type="number" step="0.01" min="0" class="form-input" required />
          </div>

          <div class="form-group">
            <label class="form-label">Stock Inicial *</label>
            <input v-model.number="form.stockInicial" type="number" min="0" class="form-input" required />
          </div>

          <div class="form-group">
            <label class="form-label">Stock Mínimo (Alerta) *</label>
            <input v-model.number="form.stock_minimo" type="number" min="0" class="form-input" required />
          </div>

          <div class="form-group">
            <label class="form-label">Unidad de medida</label>
            <select v-model="form.unidad_medida" class="form-input">
              <option value="unidad">Unidad</option>
              <option value="kg">Kilogramo (kg)</option>
              <option value="lb">Libra (lb)</option>
              <option value="litro">Litro (l)</option>
              <option value="caja">Caja</option>
            </select>
          </div>

          <div v-if="error" class="error-alert">{{ error }}</div>

          <div class="form-actions full-width">
            <button type="button" class="btn-cancel" @click="$emit('close')" :disabled="isSubmitting">Cancelar</button>
            <button type="submit" class="btn-submit" :disabled="isSubmitting">
              {{ isSubmitting ? 'Guardando...' : 'Crear Producto' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue';
import { createInventoryProduct } from '@/features/inventory/api';
import { createMovement } from '@/features/inventorymovement/api';
import { getApiErrorMessage } from '@/services/apiClient';
import type { InventoryProduct } from '@/features/inventory/types';
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
  nombre: '',
  descripcion: '',
  precio_venta: 0,
  stock_minimo: 0,
  stockInicial: 0,
  unidad_medida: 'unidad',
});

const isSubmitting = ref(false);
const error = ref('');

const similarProducts = computed(() => {
  if (form.nombre.length < 3) return [];
  const search = form.nombre.toLowerCase();
  return props.products
    .filter(p => p.nombre.toLowerCase().includes(search))
    .slice(0, 3); // Solo mostrar los primeros 3 para no saturar
});

async function submit() {
  if (!form.nombre || form.precio_venta < 0 || form.stockInicial < 0 || form.stock_minimo < 0) {
    error.value = 'Por favor revisa los campos requeridos y que no haya valores negativos.';
    return;
  }

  isSubmitting.value = true;
  error.value = '';

  try {
    // Generar SKU automáticamente: PRD-XXXXXX (donde X son los milisegundos finales)
    const generatedSku = `PRD-${Date.now().toString().slice(-6)}`;

    // 1. Crear Producto
    const producto = await createInventoryProduct({
      sku: generatedSku,
      nombre: form.nombre,
      descripcion: form.descripcion,
      precio_venta: form.precio_venta,
      stock_minimo: form.stock_minimo,
      unidad_medida: form.unidad_medida,
    });

    if (form.stockInicial > 0) {
      await createMovement({
        producto_id: producto.id,
        tipo_movimiento: 'entrada_manual',
        cantidad: form.stockInicial,
        motivo: 'Inventario inicial al crear el producto',
      });
    }

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
  max-width: 500px;
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
  grid-template-columns: 1fr 1fr;
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

.warning-alert {
  padding: 12px;
  background: var(--color-warning-bg);
  color: var(--color-warning-text);
  border-left: 4px solid var(--color-warning);
  border-radius: 6px;
  font-size: 0.85rem;
  margin-bottom: 8px;
}

.warning-alert ul {
  margin: 6px 0 0 0;
  padding-left: 20px;
}

.error-alert {
  grid-column: 1 / -1;
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