<template>
  <div 
    class="spinner" 
    :class="[`spinner--${size}`, `spinner--${variant}`]"
    role="status"
    aria-label="Cargando"
  >
    <span class="sr-only">Cargando...</span>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'primary' | 'white' | 'neutral';
}>(), {
  size: 'md',
  variant: 'primary'
});
</script>

<style scoped>
.spinner {
  display: inline-block;
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* Sizes */
.spinner--sm { width: 16px; height: 16px; border-width: 2px; }
.spinner--md { width: 24px; height: 24px; border-width: 3px; }
.spinner--lg { width: 36px; height: 36px; border-width: 3px; }
.spinner--xl { width: 48px; height: 48px; border-width: 4px; }

/* Variants */
.spinner--primary { border-top-color: var(--color-structure-base, #3b82f6); }
.spinner--white { border-color: rgba(255,255,255,0.2); border-top-color: #ffffff; }
.spinner--neutral { border-top-color: var(--color-text-muted, #9ca3af); }

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
