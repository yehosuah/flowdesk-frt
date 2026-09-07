<template>
  <div class="filters-container">

    <div class="search-container">
      <Search class="search-icon" :size="18" />

      <input
        v-model="search"
        type="text"
        placeholder="Buscar tarea..."
        @input="emitFilters"
      />
    </div>

    <details ref="statusDropdown" class="filter-dropdown">
      <summary class="filter-select">
        {{ status || 'Todos los estados' }}
      </summary>

      <div class="filter-options">
        <button
          type="button"
          class="filter-option"
          :class="{ 'filter-option--active': status === '' }"
          @click="changeStatus('')"
        >
          Todos los estados
        </button>

        <button
          type="button"
          class="filter-option"
          :class="{ 'filter-option--active': status === 'Pendiente' }"
          @click="changeStatus('Pendiente')"
        >
          Pendiente
        </button>

        <button
          type="button"
          class="filter-option"
          :class="{ 'filter-option--active': status === 'En progreso' }"
          @click="changeStatus('En progreso')"
        >
          En progreso
        </button>

        <button
          type="button"
          class="filter-option"
          :class="{ 'filter-option--active': status === 'Completada' }"
          @click="changeStatus('Completada')"
        >
          Completada
        </button>
      </div>
    </details>
    <details ref="priorityDropdown" class="filter-dropdown">
      <summary class="filter-select">
        {{ priority || 'Todas las prioridades' }}
      </summary>

      <div class="filter-options">
        <button
          type="button"
          class="filter-option"
          :class="{ 'filter-option--active': priority === '' }"
          @click="changePriority('')"
        >
          Todas las prioridades
        </button>

        <button
          type="button"
          class="filter-option"
          :class="{ 'filter-option--active': priority === 'Alta' }"
          @click="changePriority('Alta')"
        >
          Alta
        </button>

        <button
          type="button"
          class="filter-option"
          :class="{ 'filter-option--active': priority === 'Media' }"
          @click="changePriority('Media')"
        >
          Media
        </button>

        <button
          type="button"
          class="filter-option"
          :class="{ 'filter-option--active': priority === 'Baja' }"
          @click="changePriority('Baja')"
        >
          Baja
        </button>
      </div>
    </details>   
    <button
      class="btn-clear"
      @click="clearFilters"
    >
      Limpiar
    </button>

  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Search } from 'lucide-vue-next';

const emit = defineEmits<{
  (
    e: 'change',
    filters: {
      search: string;
      status: string;
      priority: string;
    }
  ): void;
}>();

const search = ref('');
const status = ref('');
const priority = ref('');

const statusDropdown = ref<HTMLDetailsElement | null>(null);
const priorityDropdown = ref<HTMLDetailsElement | null>(null);

function emitFilters() {
  emit('change', {
    search: search.value,
    status: status.value,
    priority: priority.value,
  });
}

function changeStatus(value: string) {
  status.value = value;

  if (statusDropdown.value) {
    statusDropdown.value.open = false;
  }

  emitFilters();
}

function changePriority(value: string) {
  priority.value = value;

  if (priorityDropdown.value) {
    priorityDropdown.value.open = false;
  }

  emitFilters();
}

function clearFilters() {
  search.value = '';
  status.value = '';
  priority.value = '';

  emitFilters();
}
</script>

<style scoped>
.filters-container {
  display: flex;
  align-items: center;
  gap: 16px;

  background: white;
  padding: 18px 22px;
  margin-bottom: 24px;

  border-radius: 12px;
  box-shadow: var(--shadow-card);
}

.search-container {
  flex: 2;

  display: flex;
  align-items: center;

  border: 1px solid #dbe3ef;
  border-radius: 8px;

  padding: 0 12px;
}

.search-icon {
  color: #9aa7bd;
  flex-shrink: 0;
}

.search-container input {
  width: 100%;
  border: none;
  outline: none;
  padding: 12px;
  font-size: .9rem;
  font-family: var(--font-sans);
  background: transparent;
}

.filter-dropdown {
  position: relative;
  flex: 1;
  min-width: 0;
}

.filter-dropdown summary {
  list-style: none;
}

.filter-dropdown summary::-webkit-details-marker {
  display: none;
}

.filter-select {
  position: relative;
  width: 100%;
  box-sizing: border-box;
  padding: 12px 34px 12px 12px;
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  background: white;
  color: var(--color-text);
  font-size: .9rem;
  font-family: var(--font-sans);
  cursor: pointer;
  user-select: none;
}

.filter-select::after {
  content: '⌄';
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-55%);
  color: #9aa7bd;
}

.filter-dropdown[open] .filter-select {
  border-radius: 8px 8px 0 0;
}

.filter-options {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 50;
  width: 100%;
  box-sizing: border-box;
  background: white;
  border: 1px solid #dbe3ef;
  border-top: none;
  border-radius: 0 0 8px 8px;
  box-shadow: 0 8px 16px rgba(15, 23, 42, 0.12);
  overflow: hidden;
}

.filter-option {
  display: block;
  width: 100%;
  box-sizing: border-box;
  padding: 10px 12px;
  border: none;
  border-bottom: 1px solid #f1f5f9;
  background: white;
  color: var(--color-text);
  text-align: left;
  font-family: var(--font-sans);
  font-size: .9rem;
  cursor: pointer;
}

.filter-option:last-child {
  border-bottom: none;
}

.filter-option:hover {
  background: #f8fafc;
}

.filter-option--active {
  background: #eff6ff;
  color: var(--color-structure-base);
  font-weight: 600;
}

.btn-clear {
  padding: 12px 18px;

  border: none;
  border-radius: 8px;

  background: var(--color-structure-base);
  color: white;

  font-weight: 600;
  cursor: pointer;

  transition: opacity .2s;
}

.btn-clear:hover {
  opacity: .9;
}

@media (max-width: 900px) {
  .filters-container {
    flex-direction: column;
    align-items: stretch;
  }

  .search-container,
  .filter-dropdown,
  .btn-clear {
    width: 100%;
    box-sizing: border-box;
  }

  .filter-options {
    max-width: 100%;
  }
}
</style>