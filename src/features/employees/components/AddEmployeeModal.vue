<template>
  <Teleport to="body">
    <div
      class="modal-backdrop"
      @click.self="emit('close')"
    >
      <div class="modal">
        <div class="modal__header">
          <h2 class="modal__title">
            Agregar Empleado
          </h2>

          <button
            class="modal__close"
            type="button"
            @click="emit('close')"
          >
            ✕
          </button>
        </div>

        <div
          v-if="submitError"
          class="alert alert-error"
        >
          <span>{{ submitError }}</span>

          <button
            class="alert-close"
            type="button"
            @click="submitError = ''"
          >
            ✕
          </button>
        </div>

        <form @submit.prevent="submit">
          <!-- Nombre -->
          <div class="form-group">
            <label class="form-label">
              Nombre de usuario
            </label>

            <input
              v-model="form.username"
              type="text"
              class="form-input"
              :class="{
                'input-error': errors.username
              }"
              placeholder="john_doe"
              @input="errors.username = ''"
            />

            <span
              v-if="errors.username"
              class="error-msg"
            >
              {{ errors.username }}
            </span>
          </div>

          <!-- Correo -->
          <div class="form-group">
            <label class="form-label">
              Correo electrónico
            </label>

            <input
              v-model="form.email"
              type="email"
              class="form-input"
              :class="{
                'input-error': errors.email
              }"
              placeholder="correo@empresa.com"
              @input="errors.email = ''"
            />

            <span
              v-if="errors.email"
              class="error-msg"
            >
              {{ errors.email }}
            </span>
          </div>

          <!-- Rol -->
          <div class="form-group">
            <label class="form-label">
              Rol
            </label>

            <details
              ref="roleDropdown"
              class="custom-select"
              :class="{
                'custom-select--error': errors.role_id
              }"
            >
              <summary class="custom-select__trigger">
                <span
                  :class="{
                    'custom-select__placeholder':
                      !form.role_id
                  }"
                >
                  {{ selectedRoleLabel }}
                </span>
              </summary>

              <div class="custom-select__options">
                <button
                  type="button"
                  class="custom-select__option"
                  :class="{
                    'custom-select__option--active':
                      form.role_id === ''
                  }"
                  @click="clearRole"
                >
                  Seleccionar rol...
                </button>

                <button
                  v-for="role in availableRoles"
                  :key="role.id"
                  type="button"
                  class="custom-select__option"
                  :class="{
                    'custom-select__option--active':
                      form.role_id === role.id
                  }"
                  @click="selectRole(role.id)"
                >
                  {{ role.name }}
                </button>
              </div>
            </details>

            <span
              v-if="errors.role_id"
              class="error-msg"
            >
              {{ errors.role_id }}
            </span>
          </div>

          <!-- Footer -->
          <div class="modal__footer">
            <button
              type="button"
              class="btn-secondary"
              :disabled="isSubmitting"
              @click="emit('close')"
            >
              Cancelar
            </button>

            <button
              type="submit"
              class="btn-primary"
              :disabled="isSubmitting"
            >
              <span
                v-if="isSubmitting"
                class="spinner"
                aria-hidden="true"
              ></span>

              <span>
                {{
                  isSubmitting
                    ? 'Guardando...'
                    : 'Agregar empleado'
                }}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import {
  reactive,
  ref,
  computed,
  onMounted,
} from 'vue';

import {
  createEmployee,
  fetchRoles,
} from '@/features/employees/api';

import {
  getApiErrorMessage,
} from '@/services/apiClient';

const emit = defineEmits<{
  close: [];
  created: [];
}>();

interface FormData {
  username: string;
  email: string;
  role_id: number | '';
}

interface RoleOption {
  id: number;
  name: string;
  description: string | null;
}

const EXCLUDED_ROLES = [
  'superadmin',
];

const form = reactive<FormData>({
  username: '',
  email: '',
  role_id: '',
});

const errors = reactive<
  Record<keyof FormData, string>
>({
  username: '',
  email: '',
  role_id: '',
});

const isSubmitting = ref(false);

const submitError = ref('');

const availableRoles =
  ref<RoleOption[]>([]);

const roleDropdown =
  ref<HTMLDetailsElement | null>(null);

const selectedRoleLabel = computed(() => {
  if (!form.role_id) {
    return 'Seleccionar rol...';
  }

  const selected =
    availableRoles.value.find(
      (role) =>
        role.id === form.role_id,
    );

  return selected?.name ??
    'Seleccionar rol...';
});

onMounted(async () => {
  try {
    const roles =
      await fetchRoles();

    availableRoles.value =
      roles.filter(
        (role) =>
          !EXCLUDED_ROLES.includes(
            role.name,
          ),
      );
  } catch {
    // Si no cargan los roles,
    // la validación impedirá enviar.
  }
});

function selectRole(
  roleId: number,
) {
  form.role_id = roleId;

  errors.role_id = '';

  if (roleDropdown.value) {
    roleDropdown.value.open = false;
  }
}

function clearRole() {
  form.role_id = '';

  if (roleDropdown.value) {
    roleDropdown.value.open = false;
  }
}

function validate(): boolean {
  let ok = true;

  errors.username = '';
  errors.email = '';
  errors.role_id = '';

  if (!form.username.trim()) {
    errors.username =
      'El nombre de usuario es obligatorio.';

    ok = false;
  }

  if (!form.email.trim()) {
    errors.email =
      'El correo es obligatorio.';

    ok = false;
  } else if (
    !/.+@.+\..+/.test(form.email)
  ) {
    errors.email =
      'Ingresa un correo válido.';

    ok = false;
  }

  if (!form.role_id) {
    errors.role_id =
      'Selecciona un rol.';

    ok = false;
  }

  return ok;
}

async function submit() {
  submitError.value = '';

  if (!validate()) {
    return;
  }

  isSubmitting.value = true;

  try {
    await createEmployee({
      username:
        form.username.trim(),

      email:
        form.email
          .trim()
          .toLowerCase(),

      role_id:
        form.role_id as number,
    });

    emit('created');
    emit('close');
  } catch (err) {
    submitError.value =
      getApiErrorMessage(err);
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;

  z-index: 1000;

  display: flex;
  align-items: center;
  justify-content: center;

  box-sizing: border-box;

  padding: 16px;

  background:
    rgba(0, 0, 0, .45);
}

.modal {
  width: 100%;
  max-width: 460px;
  max-height: calc(100dvh - 32px);

  box-sizing: border-box;

  padding: 28px 32px 24px;

  overflow-y: auto;
  overflow-x: visible;

  background: #ffffff;

  border-radius: 14px;

  box-shadow:
    0 8px 40px
    rgba(0, 0, 0, .18);
}

.modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 16px;

  margin-bottom: 20px;
}

.modal__title {
  margin: 0;

  color:
    var(--color-structure-base);

  font-size: 1.15rem;
  font-weight: 700;
}

.modal__close {
  flex-shrink: 0;

  padding: 4px 6px;

  border: none;
  border-radius: 4px;

  background: none;

  color:
    var(--color-text-muted);

  font-size: 1rem;

  cursor: pointer;
}

.modal__close:hover {
  background: #f0f4f9;
}

.alert {
  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 12px;

  margin-bottom: 16px;

  padding: 10px 12px;

  border-radius: 8px;

  font-size: .82rem;
}

.alert-error {
  background: #fef2f2;

  border: 1px solid #fecaca;

  color: #b91c1c;
}

.alert-close {
  flex-shrink: 0;

  padding: 0;

  border: none;

  background: transparent;

  color: inherit;

  cursor: pointer;
}

.form-group {
  position: relative;

  display: flex;
  flex-direction: column;

  gap: 6px;

  margin-bottom: 16px;
}

.form-label {
  color: var(--color-text);

  font-size: .88rem;
  font-weight: 600;
}

.form-input {
  width: 100%;

  box-sizing: border-box;

  padding: 11px 14px;

  border:
    1px solid #dbe3ef;

  border-radius: 8px;

  background: #ffffff;

  color: var(--color-text);

  font-family: inherit;

  font-size: .9rem;

  transition:
    border-color .15s,
    box-shadow .15s;
}

.form-input:focus {
  outline: none;

  border-color:
    var(--color-structure-base);

  box-shadow:
    0 0 0 3px
    rgba(59, 130, 246, .1);
}

.form-input.input-error {
  border-color: #ef4444;
}

.error-msg {
  color: #dc2626;

  font-size: .75rem;
}

/* =========================
   SELECT PERSONALIZADO
   ========================= */

.custom-select {
  position: relative;

  width: 100%;

  min-width: 0;
}

.custom-select summary {
  list-style: none;
}

.custom-select summary::-webkit-details-marker {
  display: none;
}

.custom-select__trigger {
  position: relative;

  width: 100%;

  box-sizing: border-box;

  padding:
    11px 36px 11px 14px;

  border:
    1px solid #dbe3ef;

  border-radius: 8px;

  background: #ffffff;

  color: var(--color-text);

  font-family: inherit;

  font-size: .9rem;

  cursor: pointer;

  user-select: none;

  transition:
    border-color .15s,
    box-shadow .15s;
}

.custom-select__trigger::after {
  content: '⌄';

  position: absolute;

  top: 50%;
  right: 14px;

  transform:
    translateY(-55%);

  color: #94a3b8;

  font-size: .9rem;
}

.custom-select[open]
.custom-select__trigger {
  border-color:
    var(--color-structure-base);

  border-radius: 8px;

  box-shadow:
    0 0 0 3px
    rgba(59, 130, 246, .08);
}

.custom-select--error
.custom-select__trigger {
  border-color: #ef4444;
}

.custom-select__placeholder {
  color: #94a3b8;
}

.custom-select__options {
  position: absolute;

  bottom: calc(100% + 6px);
  left: 0;

  z-index: 50;

  width: 100%;

  box-sizing: border-box;

  overflow: hidden;

  background: #ffffff;

  border: 1px solid #dbe3ef;

  border-radius: 8px;

  box-shadow:
    0 -8px 18px
    rgba(15, 23, 42, .12);
}

.custom-select__option {
  display: block;

  width: 100%;

  box-sizing: border-box;

  padding: 10px 14px;

  border: none;
  border-bottom:
    1px solid #f1f5f9;

  background: #ffffff;

  color:
    var(--color-text-secondary);

  font-family: inherit;

  font-size: .88rem;

  text-align: left;

  cursor: pointer;
}

.custom-select__option:last-child {
  border-bottom: none;
}

.custom-select__option:hover {
  background: #f8fafc;
}

.custom-select__option--active {
  background: #eff6ff;

  color:
    var(--color-structure-base);

  font-weight: 600;
}

/* =========================
   FOOTER
   ========================= */

.modal__footer {
  display: flex;
  justify-content: flex-end;

  gap: 10px;

  margin-top: 24px;
}

.btn-secondary,
.btn-primary {
  box-sizing: border-box;

  padding: 10px 20px;

  border-radius: 8px;

  font-family: inherit;

  font-size: .88rem;
  font-weight: 600;

  cursor: pointer;
}

.btn-secondary {
  border:
    1.5px solid
    var(--color-structure-subtle);

  background: #ffffff;

  color:
    var(--color-text-muted);
}

.btn-secondary:hover:not(:disabled) {
  border-color:
    var(--color-structure-base);

  color:
    var(--color-structure-base);
}

.btn-primary {
  display: flex;
  align-items: center;
  justify-content: center;

  gap: 8px;

  padding-left: 28px;
  padding-right: 28px;

  border: none;

  background:
    var(--color-structure-base);

  color: #ffffff;
}

.btn-primary:hover:not(:disabled) {
  filter: brightness(1.1);
}

.btn-primary:disabled,
.btn-secondary:disabled {
  opacity: .6;

  cursor: not-allowed;
}

.spinner {
  width: 14px;
  height: 14px;

  border:
    2px solid
    rgba(255, 255, 255, .4);

  border-top-color: #ffffff;

  border-radius: 50%;

  animation:
    spin .8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* =========================
   RESPONSIVE
   ========================= */

@media (max-width: 600px) {
  .modal-backdrop {
    align-items: center;

    padding: 12px;
  }

  .modal {
    width: 100%;
    max-width: 100%;

    max-height:
      calc(100dvh - 24px);

    padding:
      20px 16px 18px;

    overflow-y: auto;
  }

  .modal__header {
    margin-bottom: 18px;
  }

  .modal__title {
    font-size: 1.1rem;
  }

  .form-group {
    margin-bottom: 14px;
  }

  .form-label {
    font-size: .82rem;
  }

  .form-input,
  .custom-select__trigger {
    padding-top: 10px;
    padding-bottom: 10px;

    font-size: .82rem;
  }

  .custom-select__option {
    padding: 9px 12px;

    font-size: .82rem;
  }

  .modal__footer {
    display: grid;

    grid-template-columns:
      1fr 1fr;

    gap: 10px;

    margin-top: 20px;
  }

  .btn-secondary,
  .btn-primary {
    width: 100%;

    padding: 10px 8px;

    font-size: .8rem;
  }
}
</style>