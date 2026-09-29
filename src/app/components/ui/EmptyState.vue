<template>
  <div class="empty-state">
    <div v-if="$slots.icon" class="empty-icon">
      <slot name="icon"></slot>
    </div>
    <h3 v-if="title" class="empty-title">{{ title }}</h3>
    <p v-if="description" class="empty-description">{{ description }}</p>
    
    <div v-if="$slots.action" class="empty-action">
      <slot name="action"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title?: string;
  description?: string;
}>();
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 48px 20px;
  color: var(--color-text-muted, #6b7280);
}

.empty-icon {
  color: var(--color-text-faint, #9ca3af);
  margin-bottom: 16px;
  display: flex;
  justify-content: center;
}

.empty-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-heading, #111827);
  margin: 0 0 8px 0;
}

.empty-description {
  font-size: 0.95rem;
  max-width: 400px;
  margin: 0 auto;
  line-height: 1.5;
}

.empty-action {
  margin-top: 24px;
}
</style>
