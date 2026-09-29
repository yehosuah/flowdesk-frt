<template>
  <div 
    class="skeleton" 
    :class="{ 'skeleton--circle': circle }"
    :style="{ width, height }"
  ></div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  width?: string;
  height?: string;
  circle?: boolean;
}>(), {
  width: '100%',
  height: '20px',
  circle: false
});
</script>

<style scoped>
.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-bg-subtle, #f3f4f6) 25%,
    var(--color-bg-border, #e5e7eb) 50%,
    var(--color-bg-subtle, #f3f4f6) 75%
  );
  background-size: 200% 100%;
  animation: pulse 1.5s infinite ease-in-out;
  border-radius: 6px;
}

.skeleton--circle {
  border-radius: 50%;
}

@keyframes pulse {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
