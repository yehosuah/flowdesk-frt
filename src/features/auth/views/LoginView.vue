
<template>
  <section class="auth-card">
    <div class="auth-nav-top">
      <RouterLink
        to="/"
        class="back-home-btn"
        :title="t('auth.backHomeTitle')"
      >
        <ArrowLeft :size="16" />
        <span>{{ t('auth.backHome') }}</span>
      </RouterLink>
    </div>

    <div class="auth-brand">
      <img
        src="../../../logo/logo-blanco.png"
        alt="FlowDesk Logo"
        class="auth-brand__logo"
      />
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

    <form @submit.prevent="submitLogin">
      <div class="form-group">
        <label
          class="form-label"
          for="email"
        >
          {{ t('auth.email') }}
        </label>

        <input
          id="email"
          v-model="form.email"
          type="email"
          class="form-input"
          :class="{ 'input-error': errors.email }"
          :placeholder="t('auth.emailPlaceholder')"
          @input="clearFieldError('email')"
        />

        <span
          v-if="errors.email"
          class="error-msg"
        >
          {{ errors.email }}
        </span>
      </div>

      <div class="form-group">
        <label
          class="form-label"
          for="password"
        >
          {{ t('auth.password') }}
        </label>

        <div class="input-password-wrapper">
          <input
            id="password"
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            class="form-input"
            :class="{ 'input-error': errors.password }"
            :placeholder="t('auth.passwordPlaceholder')"
            maxlength="20"
            @input="clearFieldError('password')"
          />

          <button
            type="button"
            class="input-password-toggle"
            :aria-label="
              showPassword
                ? t('auth.hidePassword')
                : t('auth.showPassword')
            "
            @click="showPassword = !showPassword"
          >
            <svg
              v-if="!showPassword"
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path
                d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
              />
              <circle cx="12" cy="12" r="3" />
            </svg>

            <svg
              v-else
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path
                d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"
              />
              <path
                d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"
              />
              <line
                x1="1"
                y1="1"
                x2="23"
                y2="23"
              />
            </svg>
          </button>
        </div>

        <span
          v-if="errors.password"
          class="error-msg"
        >
          {{ errors.password }}
        </span>
      </div>

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
              ? t('auth.loggingIn')
              : t('auth.loginButton')
          }}
        </span>
      </button>
    </form>

    <div class="extra-links">
      <RouterLink
        class="auth-link"
        to="/register"
      >
        {{ t('auth.register') }}
      </RouterLink>

      <RouterLink
        class="auth-link"
        to="/forgot-password"
      >
        {{ t('auth.forgotPasswordLink') }}
      </RouterLink>
    </div>
  </section>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ArrowLeft } from 'lucide-vue-next';

import { loginWithPassword } from '@/features/auth/api';
import type { LoginRequest } from '@/features/auth/types';

import { getApiErrorMessage } from '@/services/apiClient';
import { appStore } from '@/stores/app.store';

import {
  resolveHomeByRole,
  isValidRole,
} from '@/utils/roles';

interface LoginErrors {
  email: string;
  password: string;
}

const { t } = useI18n();

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

// Limpiar errores cuando el usuario modifica un campo.
function clearFieldError(
  field: keyof LoginErrors,
): void {
  errors[field] = '';
  submitError.value = '';
}

// Validar los datos antes de iniciar sesión.
function validate(): boolean {
  let isValid = true;

  if (!form.email.trim()) {
    errors.email = t('auth.emailRequired');
    isValid = false;
  } else if (!/.+@.+\..+/.test(form.email)) {
    errors.email = t('auth.emailInvalid');
    isValid = false;
  }

  if (!form.password) {
    errors.password = t('auth.passwordRequired');
    isValid = false;
  } else if (form.password.length < 6) {
    errors.password = t('auth.passwordMinLength');
    isValid = false;
  } else if (form.password.length > 20) {
    errors.password = t('auth.passwordMaxLength');
    isValid = false;
  }

  return isValid;
}

// Autenticar y redirigir según el rol del usuario.
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
      submitError.value = t('auth.invalidRole');
      appStore.clearSession();
      return;
    }

    const redirect =
      typeof route.query.redirect === 'string'
        ? route.query.redirect
        : resolveHomeByRole(role);

    await router.push(redirect);
  } catch (error) {
    // Los errores del backend se internacionalizarán
    // en SCRUM-766 utilizando sus códigos.
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
