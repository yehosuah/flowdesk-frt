<template>
  <div class="reports-page">
    <div class="content-container">
      
      <div class="table-section">
        <div class="section-header">
          <div>
            <h1 class="page-title">Generador de Reportes</h1>
            <p class="page-subtitle">Configura, filtra y exporta la información clave de tu negocio.</p>
          </div>
        </div>

        <main class="preview-panel">
          <div v-if="!hasPreview && !isLoading" class="empty-state">
            <div class="empty-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M21 9H3"/><path d="M21 15H3"/><path d="M9 3v18"/></svg>
            </div>
            <h3>Área de Vista Previa</h3>
            <p>Ajusta los filtros en el panel derecho y presiona "Generar Vista Previa" para previsualizar los datos antes de exportarlos.</p>
          </div>

          <div v-else-if="isLoading" class="loading-state">
            <div class="spinner"></div>
            <p>Procesando datos...</p>
          </div>

          <div v-else class="preview-content">
            <div class="preview-header">
              <h3>{{ getReportTitle() }}</h3>
              <span class="badge">Mostrando primeras 50 filas</span>
            </div>
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th v-for="col in previewData.columns" :key="col">{{ col }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, idx) in previewData.rows" :key="idx">
                    <td v-for="col in previewData.columns" :key="col">{{ row[col] }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      <aside class="filtros-panel">
        <div class="panel-header">
          <h3 class="filtros-titulo">Filtros</h3>
        </div>
        
        <form class="config-form" @submit.prevent="generatePreview">
          
          <div class="filtro-group">
            <p class="filtros-sub">Módulo</p>
            <div class="filtros-chips">
              <button type="button" class="chip"
                :class="{ 'chip--active': form.module === 'inventory' }" @click="form.module = 'inventory'">
                Inventario
              </button>
              <button type="button" class="chip"
                :class="{ 'chip--active': form.module === 'commercial' }" @click="form.module = 'commercial'">
                Comercial / Ventas
              </button>
            </div>
          </div>

          <div class="filtros-divider" />

          <div class="filtro-group">
            <p class="filtros-sub">Tipo de Reporte</p>
            <div class="select-wrapper">
              <select v-model="form.type" class="filtro-input">
                <template v-if="form.module === 'inventory'">
                  <option value="current_stock">Stock Actual Valorado</option>
                  <option value="movements">Historial de Movimientos</option>
                  <option value="dead_stock">Reporte de Stock Muerto</option>
                </template>
                <template v-else>
                  <option value="sales_summary">Resumen de Ventas</option>
                  <option value="clients_list">Directorio de Clientes</option>
                </template>
              </select>
              <div class="select-arrow">▼</div>
            </div>
          </div>

          <div class="filtros-divider" />

          <div class="filtro-group">
            <p class="filtros-sub">Rango de fechas</p>
            <div class="fecha-inputs">
              <div class="input-group">
                <label>Desde</label>
                <input type="date" v-model="form.startDate" class="filtro-input-fecha" :class="{'input-error': dateError}" />
              </div>
              <div class="input-group">
                <label>Hasta</label>
                <input type="date" v-model="form.endDate" class="filtro-input-fecha" :class="{'input-error': dateError}" />
              </div>
            </div>
            <p v-if="dateError" class="error-msg">{{ dateError }}</p>
          </div>

          <div class="filtros-divider" />

          <div class="filtro-group">
            <p class="filtros-sub">Estado de los registros</p>
            <div class="select-wrapper">
              <select v-model="form.status" class="filtro-input">
                <option value="all">Todos</option>
                <option value="active">Solo Activos</option>
                <option value="inactive">Solo Inactivos</option>
              </select>
              <div class="select-arrow">▼</div>
            </div>
          </div>

          <div class="filtros-divider" />

          <div class="filtro-group">
            <div class="column-header">
              <p class="filtros-sub">Columnas Visibles</p>
              <button type="button" class="btn-check-all" @click="checkAllColumns">Todas</button>
            </div>
            <ul class="filtros-list">
              <li v-for="col in availableColumns" :key="col" @click="toggleColumn(col)" class="col-item">
                <span class="checkbox" :class="{ checked: form.selectedColumns.includes(col) }">
                  <svg v-if="form.selectedColumns.includes(col)" class="checkbox__check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </span>
                {{ col }}
              </li>
            </ul>
            <p v-if="form.selectedColumns.length === 0" class="error-msg">Selecciona al menos una.</p>
          </div>

          <button type="submit" class="btn-generate" :disabled="isLoading || !isFormValid">
            <span v-if="isLoading">Generando...</span>
            <span v-else>Generar Vista Previa</span>
          </button>
        </form>

        <div class="export-actions" v-if="hasPreview">
          <div class="filtros-divider" />
          <p class="filtros-sub" style="margin-bottom: 8px;">Exportar</p>
          <div class="export-buttons">
            <button class="btn-export csv" @click="exportCSV">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              CSV / Excel
            </button>
            <button class="btn-export pdf" @click="exportPDF">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M10.42 12.61a2.1 2.1 0 1 1 2.97 2.97L7.95 21 4 22l.99-3.95 5.43-5.44Z"/></svg>
              PDF
            </button>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed, onMounted } from 'vue';

const COLUMNS_MAP: Record<string, string[]> = {
  current_stock: ['SKU', 'Producto', 'Categoría', 'Stock', 'Valor Unitario', 'Valor Total', 'Estado'],
  movements: ['ID', 'Fecha', 'Tipo', 'Producto', 'Cantidad', 'Usuario'],
  dead_stock: ['SKU', 'Producto', 'Categoría', 'Días sin mover', 'Stock Actual'],
  sales_summary: ['ID Venta', 'Fecha', 'Cliente', 'Total Facturado', 'Vendedor'],
  clients_list: ['ID', 'Cliente', 'RUT', 'Última Compra', 'Total Facturado', 'Estado']
};

const form = reactive({
  module: 'inventory',
  type: 'current_stock',
  startDate: '',
  endDate: '',
  status: 'all',
  selectedColumns: [] as string[]
});

const availableColumns = computed(() => {
  return COLUMNS_MAP[form.type] || [];
});

watch(() => form.type, () => {
  form.selectedColumns = [...availableColumns.value];
});

watch(() => form.module, (newVal) => {
  if (newVal === 'inventory') form.type = 'current_stock';
  else form.type = 'sales_summary';
});

onMounted(() => {
  form.selectedColumns = [...availableColumns.value];
});

function checkAllColumns() {
  form.selectedColumns = [...availableColumns.value];
}

function toggleColumn(col: string) {
  const idx = form.selectedColumns.indexOf(col);
  if (idx === -1) {
    form.selectedColumns.push(col);
  } else {
    form.selectedColumns.splice(idx, 1);
  }
}

const dateError = computed(() => {
  if (form.startDate && form.endDate) {
    if (new Date(form.startDate) > new Date(form.endDate)) {
      return 'Fecha inicial no puede ser mayor a la final.';
    }
  }
  return '';
});

const isFormValid = computed(() => {
  if (form.selectedColumns.length === 0) return false;
  if (!form.startDate || !form.endDate) return false;
  if (dateError.value) return false;
  return true;
});

const isLoading = ref(false);
const hasPreview = ref(false);

const previewData = reactive({
  columns: [] as string[],
  rows: [] as any[]
});

function getReportTitle() {
  const titles: Record<string, string> = {
    current_stock: 'Stock Actual Valorado',
    movements: 'Historial de Movimientos',
    dead_stock: 'Reporte de Stock Muerto',
    sales_summary: 'Resumen de Ventas',
    clients_list: 'Directorio de Clientes'
  };
  return titles[form.type] || 'Reporte Personalizado';
}

async function generatePreview() {
  if (form.selectedColumns.length === 0) return;
  
  isLoading.value = true;
  hasPreview.value = false;
  
  setTimeout(() => {
    isLoading.value = false;
    hasPreview.value = true;
    
    previewData.columns = [...form.selectedColumns];
    
    let rawRows: any[] = [];
    
    if (form.module === 'inventory') {
      if (form.type === 'current_stock') {
        rawRows = [
          { 'SKU': 'PRD-001', 'Producto': 'Demo Frijol', 'Categoría': 'Granos', 'Stock': 120, 'Valor Unitario': '$15.00', 'Valor Total': '$1,800.00', 'Estado': 'Activo' },
          { 'SKU': 'PRD-002', 'Producto': 'Demo Arroz', 'Categoría': 'Granos', 'Stock': 350, 'Valor Unitario': '$10.00', 'Valor Total': '$3,500.00', 'Estado': 'Activo' },
          { 'SKU': 'PRD-003', 'Producto': 'Aceite de Girasol', 'Categoría': 'Abarrotes', 'Stock': 45, 'Valor Unitario': '$22.50', 'Valor Total': '$1,012.50', 'Estado': 'Activo' },
          { 'SKU': 'PRD-004', 'Producto': 'Galletas Surtidas', 'Categoría': 'Snacks', 'Stock': 80, 'Valor Unitario': '$12.00', 'Valor Total': '$960.00', 'Estado': 'Inactivo' },
        ];
      }
    } else {
      if (form.type === 'clients_list') {
        rawRows = [
          { 'ID': 'C-101', 'Cliente': 'Supermercados del Norte', 'RUT': '76.123.456-7', 'Última Compra': '15/08/2026', 'Total Facturado': '$15,400.00', 'Estado': 'Activo' },
          { 'ID': 'C-102', 'Cliente': 'Minimarket La Esquina', 'RUT': '77.890.123-K', 'Última Compra': '10/08/2026', 'Total Facturado': '$3,200.00', 'Estado': 'Activo' },
        ];
      }
    }
    
    previewData.rows = rawRows.map(row => {
      const filteredRow: any = {};
      form.selectedColumns.forEach(col => {
        filteredRow[col] = row[col] !== undefined ? row[col] : '-';
      });
      return filteredRow;
    });
    
  }, 600);
}

import { appStore } from '@/stores/app.store';

async function downloadReport(format: 'csv' | 'pdf') {
  let endpoint = '';
  if (form.module === 'inventory') {
     if (form.type === 'current_stock') endpoint = `/api/v1/reports/inventario?format=${format}`;
     else if (form.type === 'movements') endpoint = `/api/v1/reports/movimientos?format=${format}`;
     else if (form.type === 'dead_stock') endpoint = `/api/v1/reports/inventario?format=${format}&only_low_stock=true`;
  }
  
  if (!endpoint) {
    alert("Este reporte aún no está disponible en el servidor (Ej. módulo comercial).");
    return;
  }
  
  const token = appStore.state.token;
  try {
    const response = await fetch(endpoint, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) throw new Error("Error al descargar");
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_${form.type}.${format}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  } catch (e) {
    alert("Ocurrió un error al descargar el reporte.");
  }
}

function exportCSV() {
  downloadReport('csv');
}

function exportPDF() {
  downloadReport('pdf');
}
</script>

<style scoped>
.reports-page {
  padding: 32px 36px;
  max-width: 1440px;
  margin: 0 auto;
  font-family: var(--font-sans);
  color: var(--color-text);
}

.content-container {
  display: flex;
  gap: 32px;
  align-items: flex-start;
}

.table-section {
  flex: 1;
  min-width: 0; 
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 4px;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 8px 0;
}
.page-subtitle {
  color: var(--color-text-muted);
  margin: 0;
  font-size: 0.95rem;
}

.filtros-panel {
  width: 180px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  padding-top: 4px;
}
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.filtros-titulo {
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--color-text);
  margin: 0;
}

.filtro-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.filtros-sub {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--color-text-muted);
  margin: 0;
}
.filtros-divider {
  border-top: 1px solid #dde3ec;
  margin: 14px 0;
}

.filtros-chips {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.chip {
  padding: 5px 10px;
  border-radius: 99px;
  border: 1.5px solid #dde3ec;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  text-align: left;
  transition: all 0.13s;
  font-family: var(--font-sans);
}
.chip:hover {
  border-color: #b0bbd4;
  background: rgba(0, 0, 0, 0.04);
}
.chip--active {
  background: var(--color-structure-base);
  border-color: var(--color-structure-base);
  color: #fff;
  font-weight: 600;
}

.select-wrapper {
  position: relative;
  width: 100%;
}
.filtro-input, .filtro-input-fecha {
  box-sizing: border-box;
  width: 100%;
  padding: 7px 28px 7px 10px;
  border: 1.5px solid #dde3ec;
  border-radius: 8px;
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  background-color: transparent;
  outline: none;
  appearance: none;
  cursor: pointer;
  font-family: var(--font-sans);
  transition: border-color 0.2s, box-shadow 0.2s;
}
.filtro-input:focus, .filtro-input-fecha:focus {
  border-color: var(--color-structure-base);
}
.select-arrow {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  font-size: 0.6rem;
  color: #94a3b8;
}

.fecha-inputs {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.input-group label {
  font-size: 0.7rem;
  color: #94a3b8;
  margin-bottom: 4px;
  display: block;
}
.filtro-input-fecha {
  padding: 7px 10px;
}
.filtro-input-fecha.input-error {
  border-color: #ef4444;
}

.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.btn-check-all {
  background: none;
  border: none;
  color: var(--color-structure-base);
  font-size: 0.65rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
}
.filtros-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.col-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 2px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.83rem;
  color: var(--color-text-secondary);
  transition: background 0.12s;
  user-select: none;
}
.col-item:hover {
  background: rgba(0, 0, 0, 0.04);
}
.checkbox {
  width: 16px;
  height: 16px;
  border: 2px solid #b0bbd4;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: #fff;
  transition: all 0.14s;
}
.checkbox.checked {
  background: #4a90d9;
  border-color: #4a90d9;
}
.checkbox__check {
  width: 10px;
  height: 10px;
  color: #fff;
}
.error-msg {
  color: #ef4444;
  font-size: 0.7rem;
  margin: 2px 0 0 0;
}

.btn-generate {
  margin-top: 12px;
  width: 100%;
  padding: 10px;
  background: var(--color-structure-base);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: opacity 0.2s;
}
.btn-generate:hover:not(:disabled) {
  opacity: 0.9;
}
.btn-generate:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.export-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.btn-export {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px;
  border: 1px solid #dde3ec;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
  background: #fff;
  color: var(--color-text-secondary);
}
.btn-export.csv:hover {
  border-color: #10B981;
  color: #059669;
  background: #ECFDF5;
}
.btn-export.pdf:hover {
  border-color: #EF4444;
  color: #DC2626;
  background: #FEF2F2;
}

.preview-panel {
  background: var(--color-bg-surface);
  border: 1.5px solid #dde3ec;
  border-radius: 12px;
  min-height: 400px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.03);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.empty-state, .loading-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  text-align: center;
  color: var(--color-text-muted);
}
.empty-icon {
  margin-bottom: 16px;
  color: #cbd5e1;
}
.empty-state h3, .loading-state p {
  margin: 0 0 8px 0;
  color: var(--color-text-secondary);
}
.empty-state p {
  max-width: 320px;
  font-size: 0.85rem;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid #dde3ec;
  border-top-color: var(--color-structure-base);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

.preview-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #dde3ec;
}
.preview-header h3 {
  margin: 0;
  font-size: 1rem;
}
.badge {
  background: #f1f5f9;
  color: #64748b;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
}

.table-container {
  overflow-x: auto;
  flex: 1;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
}
.data-table th, .data-table td {
  padding: 12px 20px;
  text-align: left;
  border-bottom: 1px solid #dde3ec;
  font-size: 0.85rem;
  white-space: nowrap;
}
.data-table th {
  background: #f8fafc;
  font-weight: 600;
  color: var(--color-text-secondary);
}
.data-table tr:last-child td {
  border-bottom: none;
}
.data-table tr:hover td {
  background: #f8fafc;
}
</style>
