<template>
  <div class="tax-filters-bar">
    <div class="filter-group">
      <label for="month-select" class="filter-label">
        <Calendar :size="16" class="filter-icon" />
        <span>Mes:</span>
      </label>
      <select
        id="month-select"
        :value="month"
        class="filter-select"
        @change="$emit('update:month', Number(($event.target as HTMLSelectElement).value))"
      >
        <option :value="0">Todos los meses (Año completo)</option>
        <option v-for="m in months" :key="m.value" :value="m.value">
          {{ m.label }}
        </option>
      </select>
    </div>

    <div class="filter-group">
      <label for="year-select" class="filter-label">
        <Clock :size="16" class="filter-icon" />
        <span>Año:</span>
      </label>
      <select
        id="year-select"
        :value="year"
        class="filter-select"
        @change="$emit('update:year', Number(($event.target as HTMLSelectElement).value))"
      >
        <option v-for="y in years" :key="y" :value="y">
          {{ y }}
        </option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Calendar, Clock } from 'lucide-vue-next';

defineProps<{
  month: number;
  year: number;
}>();

defineEmits<{
  (e: 'update:month', value: number): void;
  (e: 'update:year', value: number): void;
}>();

const currentYear = new Date().getFullYear();
const years = [currentYear + 1, currentYear, currentYear - 1, currentYear - 2, currentYear - 3];

const months = [
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' },
];
</script>

<style scoped>
.tax-filters-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  background: var(--color-bg-surface, #ffffff);
  border: 1px solid var(--color-bg-border, #e2e8f0);
  border-radius: 12px;
  padding: 14px 20px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--color-text-secondary, #475569);
}

.filter-icon {
  color: var(--color-structure-base, #3b82f6);
}

.filter-select {
  padding: 8px 14px;
  font-size: 0.88rem;
  font-family: inherit;
  color: var(--color-heading, #0f172a);
  background-color: var(--color-bg-app, #f8fafc);
  border: 1px solid var(--color-bg-border, #cbd5e1);
  border-radius: 8px;
  outline: none;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.filter-select:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}
</style>
