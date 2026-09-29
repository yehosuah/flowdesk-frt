<template>
  <div class="input-wrapper" :class="{ 'has-error': error }">
    <label v-if="label" :for="id" class="input-label">{{ label }}</label>
    <div class="input-container">
      <div v-if="$slots['icon-left']" class="input-icon-left">
        <slot name="icon-left"></slot>
      </div>
      
      <input
        :id="id"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        class="base-input"
        :class="{
          'with-icon-left': $slots['icon-left'],
          'with-icon-right': $slots['icon-right']
        }"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        @focus="$emit('focus', $event)"
        @blur="$emit('blur', $event)"
      />
      
      <div v-if="$slots['icon-right']" class="input-icon-right">
        <slot name="icon-right"></slot>
      </div>
    </div>
    <span v-if="error" class="input-error-msg">{{ error }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  modelValue?: string | number
  label?: string
  placeholder?: string
  type?: string
  error?: string
  disabled?: boolean
  id?: string
}>(), {
  modelValue: '',
  type: 'text',
  placeholder: '',
  disabled: false
})

defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'focus', event: Event): void
  (e: 'blur', event: Event): void
}>()

// Generate a random ID if none provided, useful for a11y linking label & input
const generatedId = `input-${Math.random().toString(36).substring(2, 9)}`;
const id = computed(() => props.id || generatedId);
</script>

<style scoped>
.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}

.input-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-heading);
}

.input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.base-input {
  width: 100%;
  box-sizing: border-box;
  padding: 10px 12px;
  border: 1px solid var(--color-bg-border);
  border-radius: 8px;
  background: var(--color-bg-app, transparent);
  color: var(--color-text);
  font-size: 0.95rem;
  font-family: inherit;
  transition: all 0.2s ease-in-out;
}

.base-input:focus {
  outline: none;
  border-color: var(--color-structure-hover);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.base-input:disabled {
  background: var(--color-bg-subtle);
  color: var(--color-text-faint);
  cursor: not-allowed;
}

.has-error .base-input {
  border-color: var(--color-danger, #ef4444);
}
.has-error .base-input:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.input-icon-left {
  position: absolute;
  left: 12px;
  color: var(--color-text-faint);
  display: flex;
  align-items: center;
}

.input-icon-right {
  position: absolute;
  right: 12px;
  color: var(--color-text-faint);
  display: flex;
  align-items: center;
}

.with-icon-left {
  padding-left: 36px;
}

.with-icon-right {
  padding-right: 36px;
}

.input-error-msg {
  font-size: 0.8rem;
  color: var(--color-danger, #ef4444);
  margin-top: 2px;
}
</style>
