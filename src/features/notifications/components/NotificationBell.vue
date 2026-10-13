<template>
  <div class="notif-bell" ref="rootRef">
    <button
      type="button"
      class="notif-bell__trigger"
      :class="{ 'notif-bell__trigger--active': panelOpen }"
      aria-haspopup="true"
      :aria-expanded="panelOpen"
      aria-label="Notificaciones"
      @click="togglePanel"
    >
      <Bell :size="18" class="notif-bell__icon" />
      <span class="notif-bell__label">Notificaciones</span>
      <span v-if="count > 0" class="notif-bell__badge">{{ displayCount }}</span>
    </button>

    <Teleport to="body">
      <div v-if="panelOpen" ref="panelRef" class="notif-bell__panel" :style="panelStyle">
        <div class="notif-bell__panel-header">
          <h3 class="notif-bell__panel-title">Notificaciones</h3>
          <button type="button" class="notif-bell__close" aria-label="Cerrar" @click="panelOpen = false">
            <X :size="16" />
          </button>
        </div>

        <div v-if="isLoading" class="notif-bell__state">Cargando...</div>

        <div v-else-if="error" class="notif-bell__state notif-bell__state--error">
          {{ error }}
        </div>

        <div v-else-if="alerts.length === 0" class="notif-bell__empty">
          <PackageCheck :size="28" class="notif-bell__empty-icon" />
          <p>No tienes alertas pendientes</p>
        </div>

        <ul v-else class="notif-bell__list">
          <li v-for="alert in alerts" :key="alert.id">
            <button type="button" class="notif-bell__item" @click="goToAlert()">
              <AlertTriangle :size="16" class="notif-bell__item-icon" />
              <span class="notif-bell__item-body">
                <span class="notif-bell__item-msg">{{ alert.mensaje }}</span>
                <span class="notif-bell__item-date">{{ formatDate(alert.fecha) }}</span>
              </span>
            </button>
          </li>
        </ul>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, type CSSProperties } from 'vue';
import { useRouter } from 'vue-router';
import { Bell, X, AlertTriangle, PackageCheck } from 'lucide-vue-next';
import { useInventoryAlerts } from '@/features/notifications/useInventoryAlerts';

const emit = defineEmits<{
  (e: 'navigate'): void;
}>();

const router = useRouter();
const { alerts, count, isLoading, error, refresh } = useInventoryAlerts();

const displayCount = computed(() => (count.value > 9 ? '9+' : String(count.value)));

const panelOpen = ref(false);
const rootRef = ref<HTMLElement | null>(null);
const panelRef = ref<HTMLElement | null>(null);

// El panel se teletransporta a <body> (como el panel del chat y los toasts)
// porque el sidebar tiene overflow: hidden — si el panel quedara anidado
// ahí adentro, cualquier cosa que sobresalga del ancho del sidebar se
// recorta y no se ve, aunque técnicamente esté "renderizado".
const panelStyle = ref<CSSProperties>({});

function updatePanelPosition() {
  if (!rootRef.value) return;
  const rect = rootRef.value.getBoundingClientRect();
  panelStyle.value = {
    '--notif-bottom': `${Math.max(12, window.innerHeight - rect.bottom)}px`,
    '--notif-left': `${rect.right + 10}px`,
  } as CSSProperties;
}

function togglePanel() {
  panelOpen.value = !panelOpen.value;
  if (panelOpen.value) {
    updatePanelPosition();
    refresh();
  }
}

function goToAlert() {
  panelOpen.value = false;
  emit('navigate');
  router.push({ name: 'inventory' });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-GT', { day: '2-digit', month: 'short' });
}

function handleOutsideClick(event: MouseEvent) {
  const target = event.target as HTMLElement;
  const clickedTrigger = rootRef.value?.contains(target) ?? false;
  const clickedPanel = panelRef.value?.contains(target) ?? false;

  if (panelOpen.value && !clickedTrigger && !clickedPanel) {
    panelOpen.value = false;
  }
}

function handleEscape(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    panelOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', handleOutsideClick);
  document.addEventListener('keydown', handleEscape);
  window.addEventListener('resize', updatePanelPosition);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleOutsideClick);
  document.removeEventListener('keydown', handleEscape);
  window.removeEventListener('resize', updatePanelPosition);
});
</script>

<style scoped>
.notif-bell {
  position: relative;
}

.notif-bell__trigger {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 10px;
  padding: 8px 12px;
  border: none;
  border-radius: 8px;
  background: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.82rem;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.notif-bell__trigger:hover,
.notif-bell__trigger--active {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.notif-bell__icon {
  flex-shrink: 0;
}

.notif-bell__label {
  flex: 1;
  min-width: 0;
  text-align: left;
}

.notif-bell__badge {
  flex-shrink: 0;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: var(--color-danger);
  color: #fff;
  font-size: 0.68rem;
  font-weight: 700;
}

.notif-bell__panel {
  position: fixed;
  bottom: var(--notif-bottom, 20px);
  left: var(--notif-left, 20px);
  z-index: 1300;

  width: 320px;
  max-width: calc(100vw - 48px);
  max-height: 420px;

  display: flex;
  flex-direction: column;

  background: var(--color-bg-surface);
  border: 1px solid var(--color-bg-border);
  border-radius: 12px;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.18);
  overflow: hidden;
}

.notif-bell__panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--color-bg-border);
  flex-shrink: 0;
}

.notif-bell__panel-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--color-heading);
}

.notif-bell__close {
  display: flex;
  border: none;
  background: none;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 2px;
  border-radius: 6px;
}

.notif-bell__close:hover {
  background: var(--color-bg-hover);
  color: var(--color-heading);
}

.notif-bell__state {
  padding: 28px 16px;
  text-align: center;
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.notif-bell__state--error {
  color: var(--color-danger-text);
}

.notif-bell__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 32px 16px;
  color: var(--color-text-faint);
  text-align: center;
}

.notif-bell__empty p {
  margin: 0;
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.notif-bell__list {
  list-style: none;
  margin: 0;
  padding: 6px;
  overflow-y: auto;
}

.notif-bell__item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  width: 100%;
  padding: 10px;
  border: none;
  border-radius: 8px;
  background: none;
  text-align: left;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s;
}

.notif-bell__item:hover {
  background: var(--color-bg-subtle);
}

.notif-bell__item-icon {
  flex-shrink: 0;
  margin-top: 2px;
  color: var(--color-warning);
}

.notif-bell__item-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.notif-bell__item-msg {
  font-size: 0.85rem;
  color: var(--color-text);
  line-height: 1.35;
}

.notif-bell__item-date {
  font-size: 0.72rem;
  color: var(--color-text-faint);
}

@media (max-width: 1000px) {
  .notif-bell__panel {
    left: 12px;
    right: 12px;
    bottom: auto;
    top: 50%;
    transform: translateY(-50%);
    width: auto;
    max-width: none;
  }
}
</style>
