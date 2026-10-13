import { reactive, readonly } from 'vue';

/**
 * Cola de toasts compartida a nivel de módulo (mismo patrón que appStore y
 * useInventoryAlerts). Cualquier componente puede llamar a useToast().success()
 * / .error() / .info() desde cualquier parte de la app; ToastContainer.vue
 * (montado una sola vez en App.vue) es quien los renderiza.
 */

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastItem {
  id: number;
  variant: ToastVariant;
  message: string;
}

const DEFAULT_DURATION_MS = 4000;

let nextId = 1;
const toasts = reactive<ToastItem[]>([]);

function dismiss(id: number): void {
  const index = toasts.findIndex((toast) => toast.id === id);
  if (index !== -1) {
    toasts.splice(index, 1);
  }
}

function push(variant: ToastVariant, message: string, durationMs: number): number {
  const id = nextId++;
  toasts.push({ id, variant, message });

  if (durationMs > 0) {
    setTimeout(() => dismiss(id), durationMs);
  }

  return id;
}

export function useToast() {
  return {
    toasts: readonly(toasts) as ToastItem[],
    success: (message: string, durationMs = DEFAULT_DURATION_MS) => push('success', message, durationMs),
    error: (message: string, durationMs = DEFAULT_DURATION_MS) => push('error', message, durationMs),
    info: (message: string, durationMs = DEFAULT_DURATION_MS) => push('info', message, durationMs),
    dismiss,
  };
}
