<template>
  <RouterView />
  <ToastContainer />
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router';
import ToastContainer from '@/app/components/ToastContainer.vue';
</script>
