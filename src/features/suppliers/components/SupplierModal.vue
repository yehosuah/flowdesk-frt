<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <header class="modal-header">
        <h3 class="modal-title">{{ isEditing ? 'Editar Proveedor' : 'Nuevo Proveedor' }}</h3>
        <button class="btn-close" @click="$emit('close')">
          <X :size="20" />
        </button>
      </header>

      <div class="modal-body">
        <p class="modal-description">
          {{ isEditing ? 'Actualiza los datos de contacto de este proveedor.' : 'Ingresa la información básica para registrar a este nuevo proveedor.' }}
        </p>

        <div v-if="isEditing && can('suppliers.setStatus')" class="status-row">
          <span
            class="status-pill"
            :class="localSupplier?.is_active ? 'status-pill--active' : 'status-pill--inactive'"
          >
            {{ localSupplier?.is_active ? 'Activo' : 'Inactivo' }}
          </span>
          <button
            type="button"
            class="btn-status-toggle"
            @click="requestToggle"
            :disabled="isTogglingStatus"
          >
            {{ isTogglingStatus ? 'Actualizando...' : (localSupplier?.is_active ? 'Desactivar proveedor' : 'Activar proveedor') }}
          </button>
        </div>

        <p v-if="statusFeedback" class="status-feedback">{{ statusFeedback }}</p>

        <form @submit.prevent="submit" class="form-grid" novalidate>
          <div class="form-group full-width">
            <label class="form-label">Nombre o Razón Social *</label>
            <input
              v-model="form.nombre"
              type="text"
              class="form-input"
              :class="{ 'input-error': errors.nombre }"
              maxlength="100"
              placeholder="Ej. Distribuidora San Juan (Bebidas)"
              @input="errors.nombre = ''"
            />
            <span v-if="errors.nombre" class="error-msg">{{ errors.nombre }}</span>
          </div>

          <div class="form-group">
            <label class="form-label">Teléfono</label>
            <input
              v-model="form.telefono"
              type="tel"
              class="form-input"
              :class="{ 'input-error': errors.telefono }"
              maxlength="20"
              placeholder="Ej. +502 12345678"
              @input="errors.telefono = ''"
            />
            <span v-if="errors.telefono" class="error-msg">{{ errors.telefono }}</span>
          </div>

          <div class="form-group">
            <label class="form-label">Correo Electrónico</label>
            <input
              v-model="form.correo"
              type="email"
              class="form-input"
              :class="{ 'input-error': errors.correo }"
              maxlength="150"
              placeholder="Ej. contacto@empresa.com"
              @input="errors.correo = ''"
            />
            <span v-if="errors.correo" class="error-msg">{{ errors.correo }}</span>
          </div>

          <div class="form-group full-width">
            <label class="form-label">Dirección Física</label>
            <textarea
              v-model="form.direccion"
              class="form-input"
              rows="2"
              maxlength="200"
              placeholder="Ej. 5ta Avenida 12-34 Zona 1"
              @input="errors.direccion = ''"
            ></textarea>
            <span v-if="errors.direccion" class="error-msg">{{ errors.direccion }}</span>
          </div>

          <div v-if="error" class="error-alert full-width">{{ error }}</div>

          <div class="form-actions full-width">
            <button type="button" class="btn-secondary" @click="$emit('close')" :disabled="isSubmitting">
              Cancelar
            </button>
            <button type="submit" class="btn-primary" :disabled="isSubmitting">
              {{ isSubmitting ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Crear Proveedor') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <ConfirmDialog
      v-if="showConfirm"
      title="Desactivar proveedor"
      :message="confirmMessage"
      confirm-label="Desactivar"
      cancel-label="Cancelar"
      variant="danger"
      :loading="isTogglingStatus"
      :error="confirmError"
      @confirm="runToggle"
      @cancel="cancelConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onBeforeUnmount } from 'vue';
import { X } from 'lucide-vue-next';
import { createSupplier, updateSupplier, toggleSupplierStatus, type Supplier } from '@/features/suppliers/api';
import { getApiErrorMessage } from '@/services/apiClient';
import ConfirmDialog from '@/app/components/ConfirmDialog.vue';
import { useAuth } from '@/composables/useAuth';

const { can } = useAuth();

const props = defineProps<{
  supplier?: Supplier | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'saved', supplier: Supplier): void;
  (e: 'status-changed', supplier: Supplier): void;
}>();

const isEditing = computed(() => !!props.supplier);

// Copia local editable para reflejar el estado activo/inactivo al instante.
const localSupplier = ref<Supplier | null>(props.supplier ?? null);

const form = reactive({
  nombre: props.supplier?.nombre || '',
  telefono: props.supplier?.telefono || '',
  correo: props.supplier?.correo || '',
  direccion: props.supplier?.direccion || '',
});

const isSubmitting = ref(false);
const isTogglingStatus = ref(false);
const error = ref('');

// Límites y formato alineados con app/schemas/inventory.py (backend):
// nombre max 100, correo max 150, telefono max 20, direccion max 200.
const NOMBRE_MAX = 100;
const CORREO_MAX = 150;
const TELEFONO_MAX = 20;
const DIRECCION_MAX = 200;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TELEFONO_CHARS_RE = /^[0-9+\-\s()]+$/;

const errors = reactive({
  nombre: '',
  correo: '',
  telefono: '',
  direccion: '',
});

function validateForm(): boolean {
  errors.nombre = '';
  errors.correo = '';
  errors.telefono = '';
  errors.direccion = '';

  let isValid = true;

  const nombre = form.nombre.trim();
  if (!nombre) {
    errors.nombre = 'El nombre del proveedor es obligatorio.';
    isValid = false;
  } else if (nombre.length > NOMBRE_MAX) {
    errors.nombre = `El nombre no puede superar los ${NOMBRE_MAX} caracteres.`;
    isValid = false;
  }

  const correo = form.correo.trim();
  if (correo) {
    if (!EMAIL_RE.test(correo)) {
      errors.correo = 'El correo electrónico no tiene un formato válido.';
      isValid = false;
    } else if (correo.length > CORREO_MAX) {
      errors.correo = `El correo no puede superar los ${CORREO_MAX} caracteres.`;
      isValid = false;
    }
  }

  const telefono = form.telefono.trim();
  if (telefono) {
    if (!TELEFONO_CHARS_RE.test(telefono) || !/\d/.test(telefono)) {
      errors.telefono = 'El teléfono solo puede contener números, espacios y + - ( ).';
      isValid = false;
    } else if (telefono.length < 6 || telefono.length > TELEFONO_MAX) {
      errors.telefono = `El teléfono debe tener entre 6 y ${TELEFONO_MAX} caracteres.`;
      isValid = false;
    }
  }

  const direccion = form.direccion.trim();
  if (direccion.length > DIRECCION_MAX) {
    errors.direccion = `La dirección no puede superar los ${DIRECCION_MAX} caracteres.`;
    isValid = false;
  }

  return isValid;
}

// --- Confirmación visual del cambio de estado ---
const showConfirm = ref(false);
const confirmError = ref('');
const statusFeedback = ref('');
let feedbackTimer: ReturnType<typeof setTimeout> | undefined;

const confirmMessage = computed(
  () =>
    `«${localSupplier.value?.nombre ?? 'Este proveedor'}» dejará de aparecer en los listados y ` +
    'selecciones. Se conserva su historial y podrás reactivarlo cuando quieras.',
);

function showFeedback(text: string) {
  statusFeedback.value = text;
  clearTimeout(feedbackTimer);
  feedbackTimer = setTimeout(() => {
    statusFeedback.value = '';
  }, 4000);
}

onBeforeUnmount(() => clearTimeout(feedbackTimer));

function requestToggle() {
  if (!localSupplier.value) return;
  error.value = '';
  statusFeedback.value = '';

  if (localSupplier.value.is_active) {
    confirmError.value = '';
    showConfirm.value = true;
  } else {
    runToggle();
  }
}

function cancelConfirm() {
  if (isTogglingStatus.value) return;
  showConfirm.value = false;
  confirmError.value = '';
}

async function runToggle() {
  if (!localSupplier.value) return;

  const willActivate = !localSupplier.value.is_active;
  isTogglingStatus.value = true;
  confirmError.value = '';
  error.value = '';

  try {
    const updated = await toggleSupplierStatus(localSupplier.value.id, willActivate);
    localSupplier.value = updated;
    emit('status-changed', updated);
    showConfirm.value = false;
    showFeedback(willActivate ? 'Proveedor activado.' : 'Proveedor desactivado.');
  } catch (err) {
    const message = getApiErrorMessage(err);
    if (showConfirm.value) {
      confirmError.value = message;
    } else {
      error.value = message;
    }
  } finally {
    isTogglingStatus.value = false;
  }
}

async function submit() {
  error.value = '';

  if (!validateForm()) {
    return;
  }

  isSubmitting.value = true;

  try {
    const payload = {
      nombre: form.nombre.trim(),
      telefono: form.telefono.trim() || null,
      correo: form.correo.trim().toLowerCase() || null,
      direccion: form.direccion.trim() || null,
    };

    let result: Supplier;
    
    if (isEditing.value && props.supplier) {
      result = await updateSupplier(props.supplier.id, payload);
    } else {
      result = await createSupplier(payload);
    }

    emit('saved', result);
  } catch (err) {
    error.value = getApiErrorMessage(err);
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: var(--color-bg-surface);
  border-radius: 16px;
  width: 100%;
  max-width: 550px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  animation: modal-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes modal-in {
  from { opacity: 0; transform: translateY(20px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-bg-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-heading);
  margin: 0;
}

.btn-close {
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-close:hover {
  background: var(--color-bg-hover);
  color: var(--color-heading);
}

.modal-body {
  padding: 24px;
}

.modal-description {
  color: var(--color-text-muted);
  font-size: 0.95rem;
  margin-top: 0;
  margin-bottom: 24px;
}

.status-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--color-bg-border);
}

.status-pill {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
}
.status-pill--active { background: var(--color-success-bg); color: var(--color-success-text); }
.status-pill--inactive { background: var(--color-bg-hover); color: var(--color-text-secondary); }

.btn-status-toggle {
  padding: 6px 14px;
  background: var(--color-bg-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border-strong);
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
}
.btn-status-toggle:hover:not(:disabled) {
  background: var(--color-bg-subtle);
  border-color: var(--color-text-faint);
}
.btn-status-toggle:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.status-feedback {
  margin: -8px 0 20px;
  padding: 8px 12px;
  border-radius: 8px;
  background: var(--color-success-bg);
  color: var(--color-success-text);
  border: 1px solid var(--color-success-border);
  font-size: 0.85rem;
  font-weight: 600;
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
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text);
}

.form-input {
  padding: 10px 12px;
  border: 1px solid var(--color-border-strong);
  border-radius: 8px;
  font-size: 0.95rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  font-family: inherit;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-structure-base, #3b82f6);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
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
  margin-top: 16px;
  padding-top: 20px;
  border-top: 1px solid var(--color-bg-border);
}

.btn-secondary {
  padding: 10px 20px;
  background: var(--color-bg-hover);
  color: var(--color-text-secondary);
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-secondary:hover:not(:disabled) {
  background: var(--color-bg-hover);
}

.btn-primary {
  padding: 10px 24px;
  background: var(--color-structure-base, #3b82f6);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover:not(:disabled) {
  filter: brightness(1.1);
}

.btn-primary:disabled, .btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 600px) {
  .status-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .full-width {
    grid-column: 1;
  }

  .form-actions {
    flex-direction: column-reverse;
    align-items: stretch;
  }
}
</style>
