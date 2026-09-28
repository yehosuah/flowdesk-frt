<template>
  <div v-if="modelValue" class="modal-overlay" @click.self="closeOnOverlay ? close() : null">
    <div
      class="modal-box"
      role="dialog"
      aria-modal="true"
      :style="{ maxWidth: maxWidth }"
    >
      <div v-if="$slots.header || title" class="modal-header">
        <slot name="header">
          <h3 class="modal-title">{{ title }}</h3>
        </slot>
        <button v-if="showClose" class="modal-close-btn" @click="close" aria-label="Cerrar">
          &times;
        </button>
      </div>

      <div class="modal-body">
        <slot></slot>
      </div>

      <div v-if="$slots.footer" class="modal-footer">
        <slot name="footer"></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, watch } from 'vue';

const props = withDefaults(defineProps<{
  modelValue: boolean
  title?: string
  maxWidth?: string
  showClose?: boolean
  closeOnOverlay?: boolean
}>(), {
  maxWidth: '500px',
  showClose: true,
  closeOnOverlay: true
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'close'): void
}>()

function close() {
  emit('update:modelValue', false);
  emit('close');
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.modelValue) {
    close();
  }
}

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
});

onMounted(() => {
  document.addEventListener('keydown', onKeydown);
  if (props.modelValue) {
    document.body.style.overflow = 'hidden';
  }
});

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown);
  document.body.style.overflow = '';
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-box {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-bg-border);
  border-radius: 14px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  animation: modal-in 0.22s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes modal-in {
  from { opacity: 0; transform: translateY(12px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-bg-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-heading);
}

.modal-close-btn {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  line-height: 1;
  color: var(--color-text-faint);
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.modal-close-btn:hover {
  color: var(--color-danger, #ef4444);
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid var(--color-bg-border);
  background: var(--color-bg-subtle);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  border-radius: 0 0 14px 14px;
}
</style>
