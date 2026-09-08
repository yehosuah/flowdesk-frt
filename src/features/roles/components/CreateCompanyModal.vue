<template>
  <Teleport to="body">
    <div class="modal-backdrop" @click.self="$emit('close')">
      <div class="modal">
        <div class="modal__header">
          <h2 class="modal__title">Crear empresa</h2>
          <button class="modal__close" type="button" @click="$emit('close')">x</button>
        </div>

        <div v-if="submitError" class="alert alert-error" style="margin: 0 0 16px;">
          <span>{{ submitError }}</span>
          <button class="alert-close" type="button" @click="submitError = ''">x</button>
        </div>

        <form @submit.prevent="submit">
          <div class="form-group">
            <label class="form-label" for="company-name">Nombre de empresa</label>
            <input
              id="company-name"
              v-model="form.name"
              type="text"
              class="form-input"
              :class="{ 'input-error': errors.name }"
              placeholder="Nombre Empresa"
              @input="clearFieldError('name')"
            />
            <span v-if="errors.name" class="error-msg">{{ errors.name }}</span>
          </div>

          <div class="form-group">
            <label class="form-label" for="admin-email">Correo del admin</label>
            <input
              id="admin-email"
              v-model="form.admin_email"
              type="email"
              class="form-input"
              :class="{ 'input-error': errors.admin_email }"
              placeholder="admin@empresa.com"
              @input="clearFieldError('admin_email')"
            />
            <span v-if="errors.admin_email" class="error-msg">{{ errors.admin_email }}</span>
          </div>

          <div class="form-group">
            <label class="form-label" for="admin-username">Usuario admin</label>
            <input
              id="admin-username"
              v-model="form.admin_username"
              type="text"
              class="form-input"
              :class="{ 'input-error': errors.admin_username }"
              placeholder="adminempresa"
              @input="clearFieldError('admin_username')"
            />
            <span v-if="errors.admin_username" class="error-msg">{{ errors.admin_username }}</span>
          </div>

          <div class="modal__footer">
            <button type="button" class="btn-secondary" @click="$emit('close')">Cancelar</button>
            <button type="submit" class="btn-primary" style="width:auto;padding:10px 28px;" :disabled="isSubmitting">
              <span v-if="isSubmitting" class="spinner" aria-hidden="true"></span>
              <span>{{ isSubmitting ? 'Creando...' : 'Crear empresa' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { getApiErrorMessage } from '@/services/apiClient';
import { createCompany, type CompanyResponse, type CreateCompanyPayload } from '@/features/roles/api';

const emit = defineEmits<{ close: []; created: [company: CompanyResponse] }>();

type CompanyFormField = keyof CreateCompanyPayload;

const form = reactive<CreateCompanyPayload>({
  name: '',
  admin_email: '',
  admin_username: '',
});

const errors = reactive<Record<CompanyFormField, string>>({
  name: '',
  admin_email: '',
  admin_username: '',
});

const isSubmitting = ref(false);
const submitError = ref('');

function clearFieldError(field: CompanyFormField): void {
  errors[field] = '';
  submitError.value = '';
}

function validate(): boolean {
  let isValid = true;

  if (!form.name.trim()) {
    errors.name = 'El nombre de empresa es obligatorio.';
    isValid = false;
  }

  if (!form.admin_email.trim()) {
    errors.admin_email = 'El correo del admin es obligatorio.';
    isValid = false;
  } else if (!/.+@.+\..+/.test(form.admin_email)) {
    errors.admin_email = 'Ingresa un correo valido.';
    isValid = false;
  }

  if (!form.admin_username.trim()) {
    errors.admin_username = 'El usuario admin es obligatorio.';
    isValid = false;
  }

  return isValid;
}

async function submit(): Promise<void> {
  submitError.value = '';

  if (!validate()) {
    return;
  }

  isSubmitting.value = true;

  try {
    const company = await createCompany({
      name: form.name.trim(),
      admin_email: form.admin_email.trim().toLowerCase(),
      admin_username: form.admin_username.trim(),
    });

    emit('created', company);
    emit('close');
  } catch (error) {
    submitError.value = getApiErrorMessage(error);
  } finally {
    isSubmitting.value = false;
  }
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
  max-width: 460px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, .18);
  padding: 28px 32px 24px;
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

.modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 24px;
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

.btn-secondary:hover {
  border-color: var(--color-structure-hover);
  color: var(--color-structure-hover);
}
</style>
