import { computed, reactive, watch } from 'vue';
import { fetchAlerts, type InventoryAlertResponse } from '@/features/analytics/api';
import { appStore } from '@/stores/app.store';

/**
 * Estado compartido (singleton a nivel de módulo, mismo patrón que
 * src/stores/app.store.ts) de las alertas de bajo stock. Lo consumen tanto
 * la campana del sidebar como el badge del botón ☰ en mobile, para no pedir
 * el endpoint dos veces y para que ambos muestren siempre el mismo número.
 */

// El backend hoy solo genera estos dos tipos (app/services/inventory.py:
// LOW_STOCK_ALERT_TYPES); se filtra igual acá por si en el futuro
// /inventory/alerts devuelve otros tipos que esta campana no debe mostrar.
const LOW_STOCK_TYPES = new Set(['stock_bajo', 'sin_stock']);

interface State {
  alerts: InventoryAlertResponse[];
  isLoading: boolean;
  error: string;
  loaded: boolean;
}

const state = reactive<State>({
  alerts: [],
  isLoading: false,
  error: '',
  loaded: false,
});

async function refresh(): Promise<void> {
  state.isLoading = true;
  state.error = '';

  try {
    const result = await fetchAlerts(true);
    state.alerts = result.filter((alert) => LOW_STOCK_TYPES.has(alert.tipo));
  } catch {
    state.error = 'No se pudieron cargar las notificaciones.';
  } finally {
    state.isLoading = false;
    state.loaded = true;
  }
}

const count = computed(() => state.alerts.length);

// El estado es un singleton de módulo: si no se resetea, un cierre de
// sesión seguido de un login con OTRO usuario/empresa (sin recargar la
// página) seguiría mostrando las alertas de la empresa anterior, porque
// "loaded" ya estaría en true y nunca se volvería a pedir el endpoint.
// companyId cambia tanto en un logout manual como en el logout automático
// por 401 de apiClient.ts, así que cubre los dos casos.
//
// El watcher se arma perezosamente (recién cuando alguien llama
// useInventoryAlerts() de verdad) y no al importar el módulo: el router
// importa todas las vistas de forma eager, así que cualquier archivo de
// test que mockee appStore sin companyId (p. ej. router.spec.ts, que solo
// necesita isAuthenticated/roleName) rompía con un TypeError apenas se
// cargaba el módulo, aunque nadie estuviera usando la campana ahí.
let companyWatcherStarted = false;

function ensureCompanyWatcher(): void {
  if (companyWatcherStarted) return;
  companyWatcherStarted = true;

  watch(
    () => appStore.companyId.value,
    () => {
      state.alerts = [];
      state.error = '';
      state.loaded = false;
    },
  );
}

export function useInventoryAlerts() {
  ensureCompanyWatcher();

  if (!state.loaded && !state.isLoading) {
    refresh();
  }

  return {
    alerts: computed(() => state.alerts),
    count,
    isLoading: computed(() => state.isLoading),
    error: computed(() => state.error),
    refresh,
  };
}
