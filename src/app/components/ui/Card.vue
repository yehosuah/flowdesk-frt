<template>
  <div class="base-card">
    <div v-if="$slots.header" class="card-header">
      <slot name="header"></slot>
    </div>
    <div class="card-body">
      <slot></slot>
    </div>
    <div v-if="$slots.footer" class="card-footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
// Simple card wrapper component
</script>

<style scoped>
.base-card {
  background: var(--color-bg-surface, #ffffff);
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  border: 1px solid var(--color-bg-border, #e5e7eb);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.card-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-bg-border, #e5e7eb);
}

.card-body {
  padding: 20px;
  flex: 1;
}

.card-footer {
  padding: 16px 20px;
  background: var(--color-bg-subtle, #f9fafb);
  border-top: 1px solid var(--color-bg-border, #e5e7eb);
}
</style>
