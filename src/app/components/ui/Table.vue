<template>
  <div class="table-container">
    <table class="base-table">
      <thead>
        <tr>
          <slot name="head"></slot>
        </tr>
      </thead>
      <tbody>
        <slot name="body"></slot>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
// Simple table wrapper component
</script>

<style scoped>
.table-container {
  width: 100%;
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid var(--color-bg-border);
  background: var(--color-bg-surface);
}

.base-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.9rem;
}

.base-table :deep(th) {
  background: var(--color-bg-subtle);
  color: var(--color-text-secondary, var(--color-text));
  font-weight: 600;
  padding: 12px 16px;
  border-bottom: 2px solid var(--color-bg-border);
  white-space: nowrap;
}

.base-table :deep(td) {
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-bg-border);
  color: var(--color-text);
  vertical-align: middle;
}

.base-table :deep(tbody tr:last-child td) {
  border-bottom: none;
}

.base-table :deep(tbody tr:hover) {
  background: var(--color-bg-hover);
}
</style>
