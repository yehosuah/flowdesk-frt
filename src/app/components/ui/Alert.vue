<template>
  <div 
    class="alert" 
    :class="`alert--${variant}`"
    role="alert"
  >
    <div v-if="$slots.icon" class="alert-icon">
      <slot name="icon"></slot>
    </div>
    <div class="alert-content">
      <h4 v-if="title" class="alert-title">{{ title }}</h4>
      <div class="alert-message">
        <slot>{{ message }}</slot>
      </div>
    </div>
    <button v-if="dismissible" class="alert-close" @click="$emit('close')" aria-label="Cerrar">
      &times;
    </button>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'info' | 'success' | 'warning' | 'danger';
  title?: string;
  message?: string;
  dismissible?: boolean;
}>(), {
  variant: 'danger',
  dismissible: false
});

defineEmits<{
  (e: 'close'): void;
}>();
</script>

<style scoped>
.alert {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid transparent;
}

.alert-content {
  flex: 1;
}

.alert-title {
  margin: 0 0 4px 0;
  font-size: 1rem;
  font-weight: 700;
}

.alert-message {
  font-size: 0.9rem;
  line-height: 1.4;
}

.alert-close {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  line-height: 1;
  padding: 0;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.alert-close:hover {
  opacity: 1;
}

/* Variants */
.alert--danger {
  background: var(--color-danger-bg, #fef2f2);
  color: var(--color-danger-text, #991b1b);
  border-color: #fecaca;
}

.alert--danger .alert-close {
  color: var(--color-danger-text, #991b1b);
}

.alert--success {
  background: #f0fdf4;
  color: #166534;
  border-color: #bbf7d0;
}

.alert--warning {
  background: #fffbeb;
  color: #92400e;
  border-color: #fde68a;
}

.alert--info {
  background: #eff6ff;
  color: #1e40af;
  border-color: #bfdbfe;
}
</style>
