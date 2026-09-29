<template>
  <button
    class="chat-widget"
    type="button"
    aria-label="Abrir asistente de FlowDesk"
    title="Asistente de FlowDesk"
    @click="emit('open')"
  >
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M8 9h8M8 13h5"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
      />
    </svg>
  </button>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  open: [];
}>();
</script>

<style scoped>
.chat-widget {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 1050;

  display: flex;
  align-items: center;
  justify-content: center;

  width: 56px;
  height: 56px;

  padding: 0;

  border: none;
  border-radius: 50%;

  background: var(--color-structure-base);
  color: #fff;

  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.22);

  cursor: pointer;

  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
}

.chat-widget:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28);
}

.chat-widget:focus-visible {
  outline: 3px solid currentColor;
  outline-offset: 3px;
}

@media (max-width: 480px) {
  .chat-widget {
    right: 16px;
    bottom: 16px;

    width: 52px;
    height: 52px;
  }
}
</style>