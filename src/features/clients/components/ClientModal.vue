<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div
      ref="modalRef"
      class="modal-content"
      role="dialog"
      aria-modal="true"
      aria-labelledby="client-modal-title"
      tabindex="-1"
    >
      <header class="modal-header">
        <h3 id="client-modal-title" class="modal-title">{{ isEditing ? 'Editar Cliente' : 'Nuevo Cliente' }}</h3>
        <button class="btn-close" @click="$emit('close')">
          <X :size="20" />
        </button>
      </header>

      <div class="modal-body">
        <p class="modal-description">
          {{ isEditing ? 'Actualiza los datos de contacto de este cliente.' : 'Ingresa la información básica para registrar a este nuevo cliente.' }}
        </p>

        <div v-if="isEditing" class="status-row">
          <span class="status-pill" :class="localClient?.is_active ? 'status-pill--active' : 'status-pill--inactive'">
            {{ localClient?.is_active ? 'Activo' : 'Inactivo' }}
          </span>
          <button
            type="button"
            class="btn-status-toggle"
            @click="requestToggle"
            :disabled="isTogglingStatus"
          >
            {{ isTogglingStatus ? 'Actualizando...' : (localClient?.is_active ? 'Desactivar cliente' : 'Activar cliente') }}
          </button>
        </div>

        <p v-if="statusFeedback" class="status-feedback">{{ statusFeedback }}</p>

        <form @submit.prevent="submit" class="form-grid">
          <div class="form-group full-width">
            <label class="form-label">Nombre *</label>
            <input v-model="form.nombre" type="text" class="form-input" required placeholder="Ej. Juan Pérez" />
          </div>

          <div class="form-group">
            <label class="form-label">Teléfono</label>
            <input v-model="form.telefono" type="tel" class="form-input" placeholder="Ej. +502 12345678" />
          </div>

          <div class="form-group">
            <label class="form-label">Correo Electrónico</label>
            <input v-model="form.correo" type="email" class="form-input" placeholder="Ej. cliente@correo.com" />
          </div>

          <div class="form-group full-width">
            <label class="form-label">Dirección Física</label>
            <textarea v-model="form.direccion" class="form-input" rows="2" placeholder="Ej. 5ta Avenida 12-34 Zona 1"></textarea>
          </div>

          <div v-if="error" class="error-alert full-width">{{ error }}</div>

          <div class="form-actions full-width">
            <button type="button" class="btn-secondary" @click="$emit('close')" :disabled="isSubmitting">
              Cancelar
            </button>
            <button type="submit" class="btn-primary" :disabled="isSubmitting">
              {{ isSubmitting ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Crear Cliente') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <ConfirmDialog
      v-if="showConfirm"
      title="Desactivar cliente"
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
import { createClient, updateClient, toggleClientStatus, type Client } from '@/features/clients/api';
import { getApiErrorMessage } from '@/services/apiClient';
import { useAccessibleModal } from '@/composables/useAccessibleModal';
import ConfirmDialog from '@/app/components/ConfirmDialog.vue';

const props = defineProps<{
  client?: Client | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'saved', client: Client): void;
  (e: 'status-changed', client: Client): void;
}>();

const modalRef = ref<HTMLElement | null>(null);

function closeModal(): void {
  emit('close');
}
useAccessibleModal(modalRef, closeModal);

const isEditing = computed(() => !!props.client);

// Copia local editable del cliente para reflejar el estado activo/inactivo
// al instante, sin depender de que el padre vuelva a pasar la prop.
const localClient = ref<Client | null>(props.client ?? null);

const form = reactive({
  nombre: props.client?.nombre || '',
  telefono: props.client?.telefono || '',
  correo: props.client?.correo || '',
  direccion: props.client?.direccion || '',
});

const isSubmitting = ref(false);
const isTogglingStatus = ref(false);
const error = ref('');

// --- Confirmación visual del cambio de estado ---
const showConfirm = ref(false);
const confirmError = ref('');
const statusFeedback = ref('');
let feedbackTimer: ReturnType<typeof setTimeout> | undefined;

const confirmMessage = computed(
  () =>
    `«${localClient.value?.nombre ?? 'Este cliente'}» dejará de aparecer en los listados y ` +
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
  if (!localClient.value) return;
  error.value = '';
  statusFeedback.value = '';

  if (localClient.value.is_active) {
    // Desactivar: pedir confirmación.
    confirmError.value = '';
    showConfirm.value = true;
  } else {
    // Activar: acción no destructiva, directo.
    runToggle();
  }
}

function cancelConfirm() {
  if (isTogglingStatus.value) return;
  showConfirm.value = false;
  confirmError.value = '';
}

async function runToggle() {
  if (!localClient.value) return;

  const willActivate = !localClient.value.is_active;
  isTogglingStatus.value = true;
  confirmError.value = '';
  error.value = '';

  try {
    const updated = await toggleClientStatus(localClient.value.id, willActivate);
    localClient.value = updated;
    emit('status-changed', updated);
    showConfirm.value = false;
    showFeedback(willActivate ? 'Cliente activado.' : 'Cliente desactivado.');
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

function validateForm(): string | null {
  if (!form.nombre.trim()) {
    return 'El nombre del cliente es obligatorio.';
  }

  if (form.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo)) {
    return 'El correo electrónico no tiene un formato válido.';
  }

  if (form.telefono && !/^[0-9+\-\s()]{6,20}$/.test(form.telefono)) {
    return 'El teléfono contiene caracteres no válidos o es muy corto/largo.';
  }

  return null;
}

async function submit() {
  const validationError = validateForm();
  if (validationError) {
    error.value = validationError;
    return;
  }

  isSubmitting.value = true;
  error.value = '';

  try {
    const payload = {
      nombre: form.nombre,
      telefono: form.telefono || null,
      correo: form.correo || null,
      direccion: form.direccion || null,
    };

    let result: Client;

    if (isEditing.value && props.client) {
      result = await updateClient(props.client.id, payload);
    } else {
      result = await createClient(payload);
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
  .modal-overlay {
    padding: 12px;
    align-items: flex-start;
    overflow-y: auto;
  }

  .modal-content {
    max-width: 100%;
    margin: 12px 0;
  }

  .modal-header {
    padding: 16px;
  }

  .modal-body {
    padding: 16px;
  }

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
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .btn-secondary,
  .btn-primary {
    width: 100%;
    box-sizing: border-box;
    padding: 10px 8px;
  }
}
</style>
