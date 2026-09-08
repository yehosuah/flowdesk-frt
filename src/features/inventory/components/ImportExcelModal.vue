<template>
  <Teleport to="body">
    <div class="modal-backdrop" @click.self="$emit('close')">
      <div
        ref="modalRef"
        class="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-excel-modal-title"
        tabindex="-1"
      >
        <div class="modal__header">
          <h2
            id="import-excel-modal-title"
            class="modal__title"
          >
            Importar productos desde Excel
          </h2>
          <button class="modal__close" type="button" @click="$emit('close')">✕</button>
        </div>

        <!-- Paso 1: Upload -->
        <div v-if="step === 'upload'">
          <p class="upload-hint">
            Sube un archivo <strong>.xlsx</strong> con columnas:
            <code>sku, nombre, descripcion, precio_venta, stock_minimo, unidad_medida, proveedor_id</code>.
            <span><code>proveedor_id</code> debe ser un UUID existente, no el nombre del proveedor.</span>
          </p>
          <div class="dropzone" :class="{ 'dropzone--over': isDragging, 'dropzone--error': !!fileError }"
            @dragenter.prevent="isDragging = true" @dragleave.prevent="isDragging = false"
            @dragover.prevent @drop.prevent="onDrop" @click="fileInput?.click()">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <p class="dropzone__text">
              <span v-if="!selectedFile">Arrastra tu archivo aquí o <span class="link">haz clic para buscar</span></span>
              <span v-else>{{ selectedFile.name }} ({{ fileSizeLabel }})</span>
            </p>
            <input ref="fileInput" type="file" accept=".xlsx" hidden @change="onFileChange" />
          </div>
          <p v-if="fileError" class="error-msg" style="margin-top:6px;">{{ fileError }}</p>
          <div class="modal__footer">
            <button type="button" class="btn-secondary" @click="$emit('close')">Cancelar</button>
            <button type="button" class="btn-primary" style="width:auto;padding:10px 24px;"
              :disabled="!selectedFile || isLoading" @click="loadPreview">
              <span v-if="isLoading" class="spinner" aria-hidden="true"></span>
              <span>{{ isLoading ? 'Leyendo…' : 'Vista previa' }}</span>
            </button>
          </div>
        </div>

        <!-- Paso 2: Preview -->
        <div v-else-if="step === 'preview'">
          <div class="preview-info">
            <span class="preview-badge">{{ previewRows.length }} filas (preview)</span>
            <span class="preview-file">{{ selectedFile?.name }}</span>
          </div>
          <div class="preview-scroll">
            <table class="preview-table">
              <thead><tr><th v-for="col in previewColumns" :key="col">{{ col }}</th></tr></thead>
              <tbody>
                <tr v-for="(row, i) in previewRows" :key="i">
                  <td v-for="col in previewColumns" :key="col">{{ row[col] ?? '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-if="submitError" class="alert alert-error" style="margin-top:14px;">
            <span>{{ submitError }}</span>
            <button class="alert-close" type="button" @click="submitError = ''">✕</button>
          </div>
          <div class="modal__footer">
            <button type="button" class="btn-secondary" @click="step = 'upload'">← Volver</button>
            <button type="button" class="btn-primary" style="width:auto;padding:10px 24px;"
              :disabled="isSubmitting" @click="submitImport">
              <span v-if="isSubmitting" class="spinner" aria-hidden="true"></span>
              <span>{{ isSubmitting ? 'Importando…' : 'Confirmar importación' }}</span>
            </button>
          </div>
        </div>

        <!-- Paso 3: Done -->
        <div v-else-if="step === 'done'" class="done-state">
          <div class="done-icon">✓</div>
          <p class="done-title">¡Importación completada!</p>
          <p class="done-sub">Se importaron <strong>{{ importedCount }}</strong> producto(s).</p>
          <div class="modal__footer" style="justify-content:center;">
            <button type="button" class="btn-primary" style="width:auto;padding:10px 32px;" @click="$emit('close')">Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { importProductsExcel } from '@/features/inventory/import';
import { getApiErrorMessage } from '@/services/apiClient';
import { useAccessibleModal } from '@/composables/useAccessibleModal';

const emit = defineEmits<{ close: []; imported: [] }>();

const modalRef = ref<HTMLElement | null>(null);
function closeModal(): void {
  emit('close');
}
useAccessibleModal(modalRef, closeModal);

type Step = 'upload' | 'preview' | 'done';

const step = ref<Step>('upload');
const selectedFile = ref<File | null>(null);
const fileError = ref('');
const isDragging = ref(false);
const isLoading = ref(false);
const isSubmitting = ref(false);
const submitError = ref('');
const importedCount = ref(0);
const fileInput = ref<HTMLInputElement | null>(null);
const previewColumns = ref<string[]>([]);
const previewRows = ref<Record<string, string>[]>([]);

const fileSizeLabel = computed(() => {
  if (!selectedFile.value) return '';
  const kb = selectedFile.value.size / 1024;
  return kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.round(kb)} KB`;
});

function validateFile(file: File): boolean {
  fileError.value = '';
  if (!file.name.endsWith('.xlsx')) { fileError.value = 'Solo se aceptan archivos .xlsx'; return false; }
  if (file.size > 5 * 1024 * 1024) { fileError.value = 'El archivo no puede superar 5 MB.'; return false; }
  return true;
}

function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file && validateFile(file)) selectedFile.value = file;
}

function onDrop(e: DragEvent) {
  isDragging.value = false;
  const file = e.dataTransfer?.files[0];
  if (file && validateFile(file)) selectedFile.value = file;
}

async function loadPreview() {
  if (!selectedFile.value) return;
  isLoading.value = true;
  try {
    const rows = await parseXlsxPreview(selectedFile.value, 5);
    if (rows.length === 0) { fileError.value = 'El archivo está vacío.'; return; }
    previewColumns.value = Object.keys(rows[0]);
    previewRows.value = rows;
    step.value = 'preview';
  } catch { fileError.value = 'No se pudo leer el archivo.'; }
  finally { isLoading.value = false; }
}

async function submitImport() {
  if (!selectedFile.value) return;
  submitError.value = ''; isSubmitting.value = true;
  try {
    const result = await importProductsExcel(selectedFile.value);
    importedCount.value = result.inserted;
    step.value = 'done';
    emit('imported');
  } catch (err) { submitError.value = getApiErrorMessage(err); }
  finally { isSubmitting.value = false; }
}

async function parseXlsxPreview(file: File, maxRows: number): Promise<Record<string, string>[]> {
  const buffer = await file.arrayBuffer();
  const zip = await unzip(buffer);
  const sharedStrings = parseSharedStrings(zip['xl/sharedStrings.xml'] ?? '');
  const doc = new DOMParser().parseFromString(zip['xl/worksheets/sheet1.xml'] ?? '', 'application/xml');
  const ns = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
  const matrix: string[][] = Array.from(doc.getElementsByTagNameNS(ns, 'row')).map(row => {
    const result: string[] = [];
    Array.from(row.getElementsByTagNameNS(ns, 'c')).forEach(cell => {
      const colIdx = colIndex(cell.getAttribute('r') ?? '');
      while (result.length < colIdx) result.push('');
      const val = cell.getElementsByTagNameNS(ns, 'v')[0]?.textContent ?? '';
      result[colIdx] = cell.getAttribute('t') === 's' ? (sharedStrings[parseInt(val)] ?? '') : val;
    });
    return result;
  });
  if (!matrix.length) return [];
  const headers = matrix[0].map(h => h.trim());
  return matrix.slice(1, maxRows + 1).filter(r => r.some(v => v.trim()))
    .map(r => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ''])));
}

function parseSharedStrings(xml: string): string[] {
  if (!xml) return [];
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  const ns = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
  return Array.from(doc.getElementsByTagNameNS(ns, 'si'))
    .map(si => Array.from(si.getElementsByTagNameNS(ns, 't')).map(t => t.textContent ?? '').join(''));
}

function colIndex(ref: string): number {
  const m = ref.match(/^([A-Z]+)/);
  if (!m) return 0;
  let idx = 0;
  for (const c of m[1]) idx = idx * 26 + (c.charCodeAt(0) - 64);
  return idx - 1;
}

async function unzip(buffer: ArrayBuffer): Promise<Record<string, string>> {
  const view = new Uint8Array(buffer);
  const files: Record<string, string> = {};
  let i = 0;
  while (i < view.length - 4) {
    if (view[i] === 0x50 && view[i+1] === 0x4b && view[i+2] === 0x03 && view[i+3] === 0x04) {
      const compression = view[i+8] | (view[i+9] << 8);
      const compressedSize = view[i+18] | (view[i+19] << 8) | (view[i+20] << 16) | (view[i+21] << 24);
      const filenameLen = view[i+26] | (view[i+27] << 8);
      const extraLen = view[i+28] | (view[i+29] << 8);
      const filename = new TextDecoder().decode(view.slice(i+30, i+30+filenameLen));
      const dataStart = i + 30 + filenameLen + extraLen;
      const compressedData = view.slice(dataStart, dataStart + compressedSize);
      if (filename.endsWith('.xml')) {
        try {
          let text: string;
          if (compression === 0) { text = new TextDecoder().decode(compressedData); }
          else {
            const ds = new DecompressionStream('deflate-raw');
            const writer = ds.writable.getWriter(); writer.write(compressedData); writer.close();
            const chunks: Uint8Array[] = [];
            const reader = ds.readable.getReader();
            while (true) { const { done, value } = await reader.read(); if (done) break; chunks.push(value); }
            const total = chunks.reduce((s, c) => s + c.length, 0);
            const out = new Uint8Array(total); let offset = 0;
            for (const c of chunks) { out.set(c, offset); offset += c.length; }
            text = new TextDecoder().decode(out);
          }
          files[filename] = text;
        } catch { /* skip */ }
      }
      i = dataStart + compressedSize;
    } else { i++; }
  }
  return files;
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, .45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.modal {
  background: #fff;
  border-radius: 14px;
  width: 100%;
  max-width: 600px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, .18);
  padding: 28px 32px 24px;
  max-height: 92vh;
  overflow-y: auto;
}

.modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.modal__title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-structure-base);
  margin: 0;
}

.modal__close {
  background: none;
  border: none;
  font-size: 1rem;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 4px;
}

.modal__close:hover {
  background: #f0f4f9;
}

.modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 24px;
}

.upload-hint {
  font-size: .82rem;
  color: var(--color-text-muted);
  margin-bottom: 16px;
  line-height: 1.6;
}

.upload-hint code {
  background: #f0f4f9;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: .78rem;
  color: var(--color-structure-base);
}

.dropzone {
  border: 2px dashed var(--color-structure-subtle);
  border-radius: 10px;
  padding: 40px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  color: var(--color-text-muted);
  transition: all .15s;
  background: #fafbfc;
}

.dropzone:hover,
.dropzone--over {
  border-color: var(--color-structure-base);
  background: var(--color-structure-subtle);
  color: var(--color-structure-base);
}

.dropzone--error {
  border-color: var(--color-accent);
}

.dropzone__text {
  font-size: .88rem;
  text-align: center;
  margin: 0;
}

.link {
  color: var(--color-structure-base);
  text-decoration: underline;
}

.preview-info {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.preview-badge {
  background: var(--color-structure-subtle);
  color: var(--color-structure-base);
  font-size: .75rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 99px;
}

.preview-file {
  font-size: .8rem;
  color: var(--color-text-muted);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-scroll {
  overflow-x: auto;
  border: 1px solid #e8eef6;
  border-radius: 8px;
  max-height: 240px;
  overflow-y: auto;
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
  font-size: .8rem;
}

.preview-table th {
  background: var(--color-structure-base);
  color: #f0f4f9;
  padding: 10px 14px;
  text-align: left;
  font-weight: 700;
  white-space: nowrap;
  position: sticky;
  top: 0;
}

.preview-table td {
  padding: 9px 14px;
  border-bottom: 1px solid #f0f4f9;
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.preview-table tr:last-child td {
  border-bottom: none;
}

.done-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 20px 0 10px;
  text-align: center;
}

.done-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--color-success-bg);
  color: var(--color-success);
  font-size: 1.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.done-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--color-structure-base);
  margin: 0;
}

.done-sub {
  font-size: .9rem;
  color: var(--color-text-muted);
  margin: 0;
}

.btn-secondary {
  padding: 10px 20px;
  border: 1.5px solid var(--color-structure-subtle);
  border-radius: 8px;
  background: #fff;
  color: var(--color-text-muted);
  font-size: .88rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: all .13s;
}

.btn-secondary:hover {
  border-color: var(--color-structure-base);
  color: var(--color-structure-base);
}
</style>
