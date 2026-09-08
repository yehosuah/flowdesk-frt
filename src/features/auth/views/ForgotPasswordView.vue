<template>
  <section class="auth-card auth-card--wide">
    <div class="auth-brand">
      <img src="../../../logo/logo-blanco.png" alt="FlowDesk Logo" class="auth-brand__logo" />
    </div>

    <h3 class="auth-title">Recuperar Contraseña</h3>

    <div v-if="submitError" class="alert alert-error">
      <span>{{ submitError }}</span>
      <button class="alert-close" type="button" @click="submitError = ''">✕</button>
    </div>

    <div v-if="successMessage" class="alert alert-success">
      <span>{{ successMessage }}</span>
    </div>

    <form v-if="!requestSent" @submit.prevent="submitRequest">
      <div class="form-group">
        <label class="form-label" for="company-name">Ingresa tu correo</label>
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
      
      <button type="submit" class="btn-primary" :disabled="isSubmitting">
        <span v-if="isSubmitting" class="spinner" aria-hidden="true"></span>
        <span>{{ isSubmitting ? 'Enviando...' : 'Recuperar' }}</span>
      </button>
    </form>

    <RouterLink class="auth-link" :to="returnRoute">
      {{ returnLabel }}
    </RouterLink>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { forgotPassword } from '@/features/auth/api';
import { getApiErrorMessage } from '@/services/apiClient';


interface ForgotPasswordForm {
    email: string;
}

const route = useRoute();

const returnRoute = computed(() => {
  return route.query.redirect === '/profile'
    ? '/profile'
    : '/login';
});

const returnLabel = computed(() => {
  return returnRoute.value === '/profile'
    ? 'Volver a mi perfil'
    : 'Volver al login';
});

const form = reactive<ForgotPasswordForm>({
  email: typeof route.query.email === 'string' ? route.query.email : '',
});

const errors = reactive<Record<keyof ForgotPasswordForm, string>>({
  email: '',
});

const isSubmitting = ref(false);
const submitError = ref('');
const requestSent = ref(false);
const successMessage = ref('');

function clearFieldError(field: keyof ForgotPasswordForm): void {
  errors[field] = '';
  submitError.value = '';
  successMessage.value = '';
}

function validate(): boolean {
  let isValid = true;

  if (!form.email.trim()) {
    errors.email = 'El correo es obligatorio.';
    isValid = false;
  } 
  else if (!/.+@.+\..+/.test(form.email)) {
    errors.email = 'Ingresa un correo válido.';
    isValid = false;
  }

  return isValid;
}


async function submitRequest(): Promise<void> {
  submitError.value = '';

  if (!validate()) {
    return;
  }

  isSubmitting.value = true;

  try {
    await forgotPassword(form.email);
    requestSent.value = true;
    successMessage.value = 'Revisa tu correo para restablecer tu contraseña.';
  } catch (error) {
    submitError.value = getApiErrorMessage(error);
  } finally {
    isSubmitting.value = false;
  }
}
</script>
