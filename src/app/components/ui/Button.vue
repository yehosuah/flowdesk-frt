<template>
  <button
    :type="type"
    class="base-btn"
    :class="[`btn-${variant}`, { 'btn-block': block, 'btn-loading': loading }]"
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
  >
    <span v-if="loading" class="btn-spinner"></span>
    <slot v-else name="icon-left"></slot>
    <slot v-if="!loading"></slot>
    <slot v-if="!loading" name="icon-right"></slot>
  </button>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  type?: 'button' | 'submit' | 'reset'
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'icon'
  block?: boolean
  disabled?: boolean
  loading?: boolean
}>(), {
  type: 'button',
  variant: 'primary',
  block: false,
  disabled: false,
  loading: false
})

defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()
</script>

<style scoped>
.base-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  border: 1px solid transparent;
}

.base-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Variants */
.btn-primary {
  background: var(--color-structure-base, #3b82f6);
  color: #fff;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
}

.btn-primary:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.3);
}

.btn-secondary {
  background: var(--color-bg-surface);
  color: var(--color-text);
  border: 1px solid var(--color-bg-border);
}

.btn-secondary:not(:disabled):hover {
  background: var(--color-bg-subtle);
  border-color: var(--color-text-faint);
}

.btn-danger {
  background: var(--color-danger, #ef4444);
  color: #fff;
}

.btn-danger:not(:disabled):hover {
  background: #dc2626; /* a slightly darker red */
}

.btn-ghost {
  background: transparent;
  color: var(--color-text);
}

.btn-ghost:not(:disabled):hover {
  background: var(--color-bg-subtle);
}

.btn-icon {
  padding: 8px;
  border: 1px solid var(--color-bg-border);
  background: var(--color-bg-subtle);
  color: var(--color-text);
}

.btn-icon:not(:disabled):hover {
  background: var(--color-bg-hover);
  border-color: var(--color-text-faint);
}

/* Modifiers */
.btn-block {
  width: 100%;
}

/* Loading */
.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: btn-spin 0.75s linear infinite;
}

@keyframes btn-spin {
  to { transform: rotate(360deg); }
}
</style>
