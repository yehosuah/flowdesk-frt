<template>
  <Teleport to="body">
    <div class="toast-container" role="status" aria-live="polite">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="toast"
          :class="`toast--${toast.variant}`"
        >
          <component :is="iconFor(toast.variant)" :size="18" class="toast__icon" />
          <p class="toast__message">{{ toast.message }}</p>
          <button type="button" class="toast__close" aria-label="Cerrar" @click="dismiss(toast.id)">
            <X :size="14" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-vue-next';
import { useToast, type ToastVariant } from '@/composables/useToast';

const { toasts, dismiss } = useToast();

function iconFor(variant: ToastVariant) {
  if (variant === 'success') return CheckCircle2;
  if (variant === 'error') return AlertCircle;
  return Info;
}
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 2000;

  display: flex;
  flex-direction: column;
  gap: 10px;

  width: min(360px, calc(100vw - 32px));

  pointer-events: none;
}

.toast {
  display: flex;
  align-items: flex-start;
  gap: 10px;

  padding: 12px 14px;

  border-radius: 10px;
  border: 1px solid var(--color-bg-border);
  background: var(--color-bg-surface);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.16);

  pointer-events: auto;
}

.toast--success {
  border-color: var(--color-success-border);
}

.toast--success .toast__icon {
  color: var(--color-success);
}

.toast--error {
  border-color: var(--color-danger-border);
}

.toast--error .toast__icon {
  color: var(--color-danger);
}

.toast--info {
  border-color: var(--color-info-border);
}

.toast--info .toast__icon {
  color: var(--color-info);
}

.toast__icon {
  flex-shrink: 0;
  margin-top: 1px;
}

.toast__message {
  flex: 1;
  min-width: 0;
  margin: 0;
  font-size: 0.86rem;
  line-height: 1.4;
  color: var(--color-text);
}

.toast__close {
  flex-shrink: 0;
  display: flex;
  border: none;
  background: none;
  color: var(--color-text-faint);
  cursor: pointer;
  padding: 2px;
  border-radius: 6px;
}

.toast__close:hover {
  background: var(--color-bg-hover);
  color: var(--color-heading);
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(24px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(24px);
}

.toast-leave-active {
  position: absolute;
  width: 100%;
}

@media (max-width: 480px) {
  .toast-container {
    top: 12px;
    right: 12px;
    left: 12px;
    width: auto;
  }
}
</style>
