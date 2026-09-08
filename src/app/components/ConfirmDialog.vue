<template>
  <div class="confirm-overlay" @click.self="onCancel">
    <div
      class="confirm-box"
      role="alertdialog"
      aria-modal="true"
      :aria-label="title"
    >
      <h3 class="confirm-title">{{ title }}</h3>
      <p class="confirm-message">{{ message }}</p>

      <p v-if="error" class="confirm-error">{{ error }}</p>

      <div class="confirm-actions">
        <button
          type="button"
          class="confirm-btn confirm-btn--ghost"
          :disabled="loading"
          @click="onCancel"
        >
          {{ cancelLabel }}
        </button>
        <button
          ref="confirmBtn"
          type="button"
          class="confirm-btn"
          :class="variant === 'danger' ? 'confirm-btn--danger' : 'confirm-btn--primary'"
          :disabled="loading"
          @click="$emit('confirm')"
        >
          {{ loading ? 'Procesando...' : confirmLabel }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';

const props = withDefaults(
  defineProps<{
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'default' | 'danger';
    loading?: boolean;
    error?: string;
  }>(),
  {
    confirmLabel: 'Confirmar',
    cancelLabel: 'Cancelar',
    variant: 'default',
    loading: false,
    error: '',
  },
);

const emit = defineEmits<{
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}>();

const confirmBtn = ref<HTMLButtonElement | null>(null);

function onCancel() {
  if (props.loading) return;
  emit('cancel');
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    onCancel();
  }
}

onMounted(() => {
  confirmBtn.value?.focus();
  document.addEventListener('keydown', onKeydown);
});

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown);
});
</script>

<style scoped>
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  padding: 20px;
}

.confirm-box {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-bg-border);
  border-radius: 14px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.2);
  padding: 24px;
  width: 100%;
  max-width: 420px;
  animation: confirm-in 0.22s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes confirm-in {
  from { opacity: 0; transform: translateY(12px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.confirm-title {
  margin: 0 0 8px;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-heading);
}

.confirm-message {
  margin: 0;
  font-size: 0.92rem;
  line-height: 1.5;
  color: var(--color-text-secondary);
}

.confirm-error {
  margin: 14px 0 0;
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--color-danger-bg);
  color: var(--color-danger-text);
  font-size: 0.85rem;
  font-weight: 500;
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 22px;
}

.confirm-btn {
  padding: 9px 18px;
  border-radius: 8px;
  border: 1px solid transparent;
  font-family: inherit;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, filter 0.15s;
}

.confirm-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.confirm-btn--ghost {
  background: var(--color-bg-hover);
  color: var(--color-text-secondary);
}

.confirm-btn--ghost:hover:not(:disabled) {
  background: var(--color-bg-subtle);
}

.confirm-btn--primary {
  background: var(--color-structure-base);
  color: #fff;
}

.confirm-btn--primary:hover:not(:disabled) {
  filter: brightness(1.1);
}

.confirm-btn--danger {
  background: var(--color-danger);
  color: #fff;
}

.confirm-btn--danger:hover:not(:disabled) {
  filter: brightness(1.05);
}

@media (max-width: 480px) {
  .confirm-actions {
    flex-direction: column-reverse;
  }

  .confirm-btn {
    width: 100%;
  }
}
</style>
