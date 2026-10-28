
<template>
  <section class="auth-card auth-card--wide">
    <div class="auth-brand">
      <img
        src="../../../logo/logo-blanco.png"
        alt="FlowDesk Logo"
        class="auth-brand__logo"
      />
    </div>

    <h3 class="auth-title">
      {{ t('auth.resetTitle') }}
    </h3>

    <div v-if="tokenState === 'invalid'" class="alert alert-error">
      <span>{{ t('auth.resetInvalidToken') }}</span>
    </div>

    <div v-if="submitError" class="alert alert-error">
      <span>{{ submitError }}</span>
      <button
        class="alert-close"
        type="button"
        @click="submitError = ''"
      >
        ✕
      </button>
    </div>

    <div v-if="successMessage" class="alert alert-success">
      <span>{{ successMessage }}</span>
    </div>

    <form
      v-if="tokenState === 'valid' && !requestSent"
      @submit.prevent="submitRequest"
    >
      <div class="form-group">
        <label class="form-label" for="password">
          {{ t('auth.resetPasswordLabel') }}
        </label>

        <div class="input-password-wrapper">
          <input
            id="password"
            v-model="form.newPassword"
            :type="showPassword ? 'text' : 'password'"
            class="form-input"
            :class="{ 'input-error': errors.newPassword }"
            :placeholder="t('auth.passwordPlaceholder')"
            maxlength="20"
            @input="clearFieldError('newPassword')"
          />

          <button
            type="button"
            class="input-password-toggle"
            :aria-label="showPassword ? t('auth.hidePassword') : t('auth.showPassword')"
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
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
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
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
              <line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
          </button>
        </div>

        <span v-if="errors.newPassword" class="error-msg">
          {{ errors.newPassword }}
        </span>
      </div>

      <div class="form-group">
        <label class="form-label" for="confirm-password">
          {{ t('auth.confirmPassword') }}
        </label>

        <div class="input-password-wrapper">
          <input
            id="confirm-password"
            v-model="form.confirmPassword"
            :type="showConfirmPassword ? 'text' : 'password'"
            class="form-input"
            :class="{ 'input-error': errors.confirmPassword }"
            :placeholder="t('auth.passwordPlaceholder')"
            maxlength="20"
            @input="clearFieldError('confirmPassword')"
          />

          <button
            type="button"
            class="input-password-toggle"
            :aria-label="showConfirmPassword ? t('auth.hidePassword') : t('auth.showPassword')"
            @click="showConfirmPassword = !showConfirmPassword"
          >
            <svg
              v-if="!showConfirmPassword"
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
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
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
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
              <line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
          </button>
        </div>

        <span v-if="errors.confirmPassword" class="error-msg">
          {{ errors.confirmPassword }}
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
          {{ isSubmitting ? t('auth.resetSubmitting') : t('auth.resetSubmit') }}
        </span>
      </button>
    </form>

    <RouterLink class="auth-link" to="/login">
      {{ t('auth.forgotBackLogin') }}
    </RouterLink>
  </section>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, onUnmounted } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

import { getApiErrorMessage } from '@/services/apiClient';
import { resetPassword } from '@/features/auth/api';

interface ResetPasswordForm {
  newPassword: string;
  confirmPassword: string;
}

type TokenState = 'checking' | 'valid' | 'invalid';

const { t } = useI18n();

const showPassword = ref(false);
const showConfirmPassword = ref(false);

const route = useRoute();
const router = useRouter();

const token = ref<string | null>(null);
const tokenState = ref<TokenState>('checking');

const form = reactive<ResetPasswordForm>({
  newPassword: '',
  confirmPassword: '',
});

const errors = reactive<Record<keyof ResetPasswordForm, string>>({
  newPassword: '',
  confirmPassword: '',
});

const isSubmitting = ref(false);
const submitError = ref('');
const requestSent = ref(false);
const successMessage = ref('');

let redirectTimer: ReturnType<typeof setTimeout> | undefined;

onMounted(() => {
  const raw = route.query.token;
  token.value = typeof raw === 'string' && raw.trim()
    ? raw.trim()
    : null;

  tokenState.value = token.value ? 'valid' : 'invalid';
});

onUnmounted(() => {
  if (redirectTimer !== undefined) {
    clearTimeout(redirectTimer);
  }
});

function clearFieldError(field: keyof ResetPasswordForm): void {
  errors[field] = '';
  submitError.value = '';
}

function validate(): boolean {
  let isValid = true;

  if (!form.newPassword) {
    errors.newPassword = t('auth.passwordRequired');
    isValid = false;
  } else if (form.newPassword.length < 6) {
    errors.newPassword = t('auth.passwordMinLength');
    isValid = false;
  } else if (form.newPassword.length > 20) {
    errors.newPassword = t('auth.passwordMaxLength');
    isValid = false;
  }

  if (!form.confirmPassword) {
    errors.confirmPassword = t('auth.resetConfirmRequired');
    isValid = false;
  } else if (form.newPassword !== form.confirmPassword) {
    errors.confirmPassword = t('auth.resetPasswordMismatch');
    isValid = false;
  }

  return isValid;
}

async function submitRequest(): Promise<void> {
  submitError.value = '';

  if (!validate()) return;

  if (!token.value) {
    tokenState.value = 'invalid';
    return;
  }

  isSubmitting.value = true;

  try {
    await resetPassword(token.value, form.newPassword);

    requestSent.value = true;
    successMessage.value = t('auth.resetSuccess');

    redirectTimer = setTimeout(() => {
      void router.push({ name: 'login' });
    }, 2000);
  } catch (error) {
    const message = getApiErrorMessage(error);

    if (
      message.toLowerCase().includes('token') ||
      message.toLowerCase().includes('expirado')
    ) {
      tokenState.value = 'invalid';
    } else {
      submitError.value = message;
    }
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<style scoped>
input[type="password"]::-ms-reveal,
input[type="password"]::-ms-clear {
  display: none;
}
</style>
