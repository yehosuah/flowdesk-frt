<template>
  <!-- Las pantallas de autenticación siempre se muestran en tema claro. -->
  <div class="auth-page" data-theme="light">
    <RouterView />
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router';
</script>
