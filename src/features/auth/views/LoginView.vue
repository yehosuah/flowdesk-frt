<template>
  <section class="auth-card">
    <div class="auth-nav-top">
      <RouterLink to="/" class="back-home-btn" title="Volver a la página principal">
        <ArrowLeft :size="16" />
        <span>Volver al inicio</span>
      </RouterLink>
    </div>

    <div class="auth-brand">
      <img src="../../../logo/logo-blanco.png" alt="FlowDesk Logo" class="auth-brand__logo" />
    </div>

    <div v-if="submitError" class="alert alert-error">
      <span>{{ submitError }}</span>
      <button class="alert-close" type="button" @click="submitError = ''">✕</button>
    </div>

    <form @submit.prevent="submitLogin">
      <div class="form-group">
        <label class="form-label" for="email">Correo Electrónico</label>
        <input
          id="email"
          v-model="form.email"
          type="email"
          class="form-input"
          :class="{ 'input-error': errors.email }"
          placeholder="correo@ejemplo.com"
          @input="clearFieldError('email')"
        />
        <span v-if="errors.email" class="error-msg">{{ errors.email }}</span>
      </div>

      <div class="form-group">
        <label class="form-label" for="password">Contraseña</label>
        <div class="input-password-wrapper">
          <input
            id="password"
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            class="form-input"
            :class="{ 'input-error': errors.password }"
            placeholder="Mínimo 6 caracteres"
            maxlength="20"
            @input="clearFieldError('password')"
          />
          <button
            type="button"
            class="input-password-toggle"
            @click="showPassword = !showPassword"
          >
            <svg v-if="!showPassword" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
              <line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
          </button>
        </div>
        <span v-if="errors.password" class="error-msg">{{ errors.password }}</span>
      </div>

      <button type="submit" class="btn-primary" :disabled="isSubmitting">
        <span v-if="isSubmitting" class="spinner" aria-hidden="true"></span>
        <span>{{ isSubmitting ? 'Ingresando...' : 'Iniciar Sesión' }}</span>
      </button>
    </form>

    <div class="extra-links">
      <RouterLink class="auth-link" to="/register">Registrar empresa</RouterLink>
      <RouterLink class="auth-link" to="/forgot-password">¿Olvidaste tu contraseña?</RouterLink>
    </div>
  </section>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { ArrowLeft } from 'lucide-vue-next';

import { loginWithPassword } from '@/features/auth/api';
import type { LoginRequest } from '@/features/auth/types';
import { getApiErrorMessage } from '@/services/apiClient';
import { appStore } from '@/stores/app.store';
import { resolveHomeByRole, isValidRole } from '@/utils/roles';


interface LoginErrors {
  email: string;
  password: string;
}

const showPassword = ref(false);
const router = useRouter();
const route = useRoute();

const form = reactive<LoginRequest>({
  email: '',
  password: '',
});

const errors = reactive<LoginErrors>({
  email: '',
  password: '',
});

const isSubmitting = ref(false);
const submitError = ref('');

function clearFieldError(field: keyof LoginErrors): void {
  errors[field] = '';
  submitError.value = '';
}

function validate(): boolean {
  let isValid = true;

  if (!form.email.trim()) {
    errors.email = 'El correo es obligatorio.';
    isValid = false;
  } else if (!/.+@.+\..+/.test(form.email)) {
    errors.email = 'Ingresa un correo valido.';
    isValid = false;
  }

  if (!form.password) {
    errors.password = 'La contraseña es obligatoria.';
    isValid = false;
  } else if (form.password.length < 6) {
    errors.password = 'La contraseña debe tener al menos 6 caracteres.';
    isValid = false;
  } else if (form.password.length > 20) {
    errors.password = 'La contraseña no puede exceder 20 caracteres.';
    isValid = false;
  }

  return isValid;
}

async function submitLogin(): Promise<void> {
  submitError.value = '';

  if (!validate()) {
    return;
  }

  isSubmitting.value = true;

  try {
    const tokenResponse = await loginWithPassword({
      email: form.email.trim().toLowerCase(),
      password: form.password,
    });

    appStore.setSession(tokenResponse);

    const role = appStore.roleName.value;

    if (!isValidRole(role)) {
      submitError.value = 'Tu cuenta no tiene un rol válido asignado. Contacta al administrador.';
      appStore.clearSession();
      return;
    }


    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : resolveHomeByRole(role);
    await router.push(redirect);
  } catch (error) {
    submitError.value = getApiErrorMessage(error);
  } finally {
    isSubmitting.value = false;
  }
}
</script>
<style scoped>
  .auth-nav-top {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
  }

  .back-home-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--color-text-secondary, #64748b);
    text-decoration: none;
    padding: 6px 10px;
    border-radius: 8px;
    transition: all 0.15s ease;
  }

  .back-home-btn:hover {
    color: var(--color-structure-hover, #2563eb);
    background-color: var(--color-bg-subtle, #f1f5f9);
  }

  .extra-links {
    margin-top: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
</style>

<style scoped>
input[type="password"]::-ms-reveal,
input[type="password"]::-ms-clear {
  display: none;
}
</style>
