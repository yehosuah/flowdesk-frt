<template>
  <Modal
    :model-value="true"
    :title="title"
    max-width="420px"
    :show-close="false"
    :close-on-overlay="!loading"
    @close="onCancel"
  >
    <p class="confirm-message">{{ message }}</p>

    <p v-if="error" class="confirm-error">{{ error }}</p>

    <template #footer>
      <div class="confirm-actions">
        <Button
          variant="ghost"
          :disabled="loading"
          @click="onCancel"
        >
          {{ cancelLabel }}
        </Button>
        <Button
          :variant="variant === 'danger' ? 'danger' : 'primary'"
          :loading="loading"
          @click="$emit('confirm')"
        >
          {{ confirmLabel }}
        </Button>
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { Modal, Button } from './ui';

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

function onCancel() {
  if (props.loading) return;
  emit('cancel');
}
</script>

<style scoped>
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
  width: 100%;
}

@media (max-width: 480px) {
  .confirm-actions {
    flex-direction: column-reverse;
  }
}
</style>
