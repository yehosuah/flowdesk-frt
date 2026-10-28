<template>
  <div class="tax-dashboard-page">
    <header class="tax-dashboard-header">
      <div class="tax-header-info">
        <div class="tax-header-title-row">
          <h1 class="tax-title">Dashboard Tributario</h1>
          <button
            v-if="false"
            type="button"
            class="tax-regime-badge"
            :class="{ 'tax-regime-badge--inactive': activeProfile?.active === false }"
            @click="openProfileModal"
            title="Haz clic para ver o gestionar el perfil tributario"
          >
            <ShieldCheck :size="14" class="badge-icon" />
            <span>{{ activeProfile?.name || 'Régimen General IVA (12%)' }}</span>
            <span class="badge-status-dot" :class="activeProfile?.active === false ? 'dot--inactive' : 'dot--active'"></span>
          </button>
        </div>
        <p class="tax-subtitle">
          Consulta y proyecta tus obligaciones tributarias, IVA débito/crédito y retenciones del período.
        </p>
      </div>

      <div class="tax-header-actions">
        <Button
          variant="secondary"
          size="sm"
          class="action-btn profile-action-btn"
          type="button"
          @click="openProfileModal"
        >
          <ShieldCheck :size="15" />
          <span>Perfil Fiscal</span>
        </Button>

        <Button
          variant="secondary"
          size="sm"
          :disabled="isLoading"
          class="action-btn"
          @click="loadMetrics"
        >
          <RefreshCw :size="15" :class="{ 'spin-icon': isLoading }" />
          <span>Actualizar</span>
        </Button>

        <Button
          variant="primary"
          size="sm"
          :disabled="isLoading || isExporting"
          class="action-btn"
          @click="exportTaxReport"
        >
          <Download :size="15" />
          <span>{{ isExporting ? 'Exportando...' : 'Exportar Libro' }}</span>
        </Button>
      </div>
    </header>

    <main class="tax-dashboard-content">
      <TaxFiltersBar
        :month="selectedMonth"
        :year="selectedYear"
        @update:month="selectedMonth = $event"
        @update:year="selectedYear = $event"
      />

      <section v-if="isAdmin" class="tax-rate-settings" aria-labelledby="tax-rate-settings-title">
        <div>
          <h2 id="tax-rate-settings-title">Configuración de IVA</h2>
          <p>Esta tasa se aplicará a las nuevas ventas de la empresa.</p>
        </div>
        <form class="tax-rate-form" @submit.prevent="saveCommercialRate">
          <label for="commercial-tax-rate">Tasa (%)</label>
          <input id="commercial-tax-rate" v-model.number="commercialRate" type="number" min="0" max="100" step="0.01" required />
          <Button type="submit" variant="primary" size="sm" :disabled="isSavingCommercialRate">
            {{ isSavingCommercialRate ? 'Guardando...' : 'Guardar tasa' }}
          </Button>
        </form>
      </section>

      <!-- Estado de Error -->
      <Alert
        v-if="errorMessage"
        variant="danger"
        title="Error al consultar métricas fiscales"
      >
        <p class="error-text">{{ errorMessage }}</p>

        <div v-if="isNoProfileError" class="no-profile-callout">
          <p class="no-profile-hint">
            No se encontró un perfil fiscal activo para el período seleccionado. Puedes activar el
            <strong>Régimen General de IVA (12%)</strong> con un solo clic para habilitar el cálculo de métricas en tu empresa:
          </p>
          <div class="no-profile-action-row">
            <Button
              variant="primary"
              size="sm"
              :disabled="isActivatingProfile"
              class="btn-activate-profile"
              @click="activateDefaultProfile"
            >
              <CheckCircle2 :size="15" />
              <span>{{ isActivatingProfile ? 'Activando...' : 'Activar Perfil Tributario (12%)' }}</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              @click="openProfileModal"
            >
              Ver perfil
            </Button>
          </div>
        </div>

        <div class="error-action">
          <Button variant="secondary" size="sm" @click="loadMetrics">
            Reintentar
          </Button>
        </div>
      </Alert>

      <!-- Estado de Carga -->
      <div v-if="isLoading" class="tax-metrics-skeleton-grid">
        <div v-for="i in 7" :key="i" class="metric-card-skeleton">
          <div class="skeleton-header">
            <Skeleton width="55%" height="16px" />
            <Skeleton width="36px" height="36px" />
          </div>
          <div class="skeleton-body">
            <Skeleton width="75%" height="28px" />
            <Skeleton width="90%" height="14px" />
          </div>
        </div>
      </div>

      <!-- Estado Vacío -->
      <div v-else-if="!errorMessage && isEmpty" class="empty-state-wrapper">
        <EmptyState
          title="Sin movimientos fiscales registrados"
          description="No se registraron transacciones comerciales ni documentos tributarios en el período seleccionado."
        >
          <template #icon>
            <FileQuestion :size="48" class="empty-icon-custom" />
          </template>
          <template #action>
            <Button variant="secondary" size="sm" @click="resetToCurrentPeriod">
              Ver período actual
            </Button>
          </template>
        </EmptyState>
      </div>

      <!-- Dashboard con Datos -->
      <div v-else-if="!errorMessage" class="tax-dashboard-body">
        <TaxMetricCards :metrics="metrics" />

        <!-- Resumen de Liquidación / Nota explicativa -->
        <div class="tax-summary-callout" :class="summaryCalloutClass">
          <div class="tax-summary-callout__icon">
            <CheckCircle2 v-if="metrics.tax_payable === 0" :size="20" />
            <AlertCircle v-else :size="20" />
          </div>
          <div class="tax-summary-callout__content">
            <h4 class="tax-summary-callout__title">{{ summaryTitle }}</h4>
            <p class="tax-summary-callout__text">{{ summaryDescription }}</p>
          </div>
        </div>
      </div>
    </main>

    <!-- Modal de Perfil Tributario -->
    <div v-if="showProfileModal" class="profile-modal-backdrop" @click.self="showProfileModal = false">
      <div class="profile-modal" role="dialog" aria-modal="true" aria-labelledby="tax-profile-title">
        <header class="profile-modal-header">
          <div class="profile-modal-title-wrap">
            <ShieldCheck :size="20" class="profile-modal-icon" />
            <h3 id="tax-profile-title" class="profile-modal-title">Perfil Tributario de la Empresa</h3>
          </div>
          <button class="profile-modal-close" @click="showProfileModal = false">✕</button>
        </header>

        <div class="profile-modal-body">
          <div v-if="isLoadingProfile" class="profile-loading">
            <RefreshCw :size="20" class="spin-icon" />
            <span>Consultando perfil tributario...</span>
          </div>

          <div v-else class="profile-content">
            <div
              class="profile-status-box"
              :class="activeProfile && activeProfile.active ? 'status-box--active' : 'status-box--inactive'"
            >
              <div class="status-indicator">
                <span class="status-dot"></span>
                <strong>{{ activeProfile && activeProfile.active ? 'Perfil Tributario Activo' : 'Perfil Tributario Inactivo o Sin Configurar' }}</strong>
              </div>
              <p class="status-explanation">
                {{
                  activeProfile && activeProfile.active
                    ? 'El cálculo de débito fiscal, compras deducibles y retenciones está habilitado para este período.'
                    : 'No hay un perfil activo vigente. Activa el Régimen General para consultar el dashboard y emitir facturas con IVA.'
                }}
              </p>
            </div>

            <div class="profile-grid">
              <div class="profile-field">
                <span class="field-label">Nombre del Régimen</span>
                <span class="field-val">{{ activeProfile?.name || 'Régimen General IVA (12%)' }}</span>
              </div>
              <div class="profile-field">
                <span class="field-label">Jurisdicción</span>
                <span class="field-val">{{ activeProfile?.jurisdiction || 'Guatemala (GT)' }}</span>
              </div>
              <div class="profile-field">
                <span class="field-label">Moneda Predeterminada</span>
                <span class="field-val">{{ activeProfile?.default_currency || 'GTQ (Quetzales)' }}</span>
              </div>
              <div class="profile-field">
                <span class="field-label">Vigencia</span>
                <span class="field-val">
                  Desde {{ activeProfile?.effective_from || '2026-01-01' }}
                  {{ activeProfile?.effective_until ? `hasta ${activeProfile.effective_until}` : '(Vigente)' }}
                </span>
              </div>
            </div>

            <div class="profile-taxes-section">
              <h4 class="section-subtitle">Impuestos y Tasas Aplicables</h4>
              <div class="taxes-cards">
                <div
                  v-for="tax in (activeProfile?.taxes && activeProfile.taxes.length > 0 ? activeProfile.taxes : defaultTaxes)"
                  :key="tax.tax_code"
                  class="tax-card-pill"
                >
                  <div class="tax-card-pill__left">
                    <span class="tax-pill-code">{{ tax.tax_code }}</span>
                    <span class="tax-pill-name">{{ tax.name }}</span>
                  </div>
                  <div class="tax-card-pill__right">
                    <span class="tax-pill-rate">{{ tax.rate ?? 12 }}%</span>
                    <span v-if="tax.eligible_for_input_credit" class="tax-pill-badge">Crédito deducible</span>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="profileFeedback" class="profile-feedback-alert" :class="profileFeedback.success ? 'feedback--success' : 'feedback--error'">
              <CheckCircle2 v-if="profileFeedback.success" :size="16" />
              <AlertCircle v-else :size="16" />
              <span>{{ profileFeedback.message }}</span>
            </div>
          </div>
        </div>

        <footer class="profile-modal-footer">
          <Button variant="secondary" size="sm" @click="showProfileModal = false">
            Cerrar
          </Button>
          <Button
            v-if="!activeProfile || !activeProfile.active"
            variant="primary"
            size="sm"
            :disabled="isActivatingProfile"
            @click="activateDefaultProfile"
          >
            <CheckCircle2 :size="15" />
            <span>{{ isActivatingProfile ? 'Activando...' : 'Activar Perfil Tributario (12%)' }}</span>
          </Button>
          <Button
            v-else
            variant="secondary"
            size="sm"
            :disabled="isActivatingProfile"
            @click="toggleProfileActive"
          >
            <Power :size="15" />
            <span>{{ activeProfile.active ? 'Desactivar Perfil' : 'Activar Perfil' }}</span>
          </Button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { Skeleton, Alert, EmptyState, Button } from '@/app/components/ui';
import {
  FileQuestion,
  RefreshCw,
  Download,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Power,
} from 'lucide-vue-next';
import { appStore } from '@/stores/app.store';
import TaxFiltersBar from '../components/TaxFiltersBar.vue';
import TaxMetricCards from '../components/TaxMetricCards.vue';
import { fetchTaxPeriodMetrics, fetchCommercialTaxConfiguration, updateCommercialTaxConfiguration } from '../api';
import {
  fetchTaxProfiles,
  saveTaxProfile,
  DEFAULT_GT_TAX_PROFILE,
} from '../profileApi';
import type { TaxPeriodMetrics, TaxProfile } from '../types';
import { useAuth } from '@/composables/useAuth';
import { useToast } from '@/composables/useToast';

const selectedMonth = ref<number>(new Date().getMonth() + 1);
const selectedYear = ref<number>(new Date().getFullYear());
const isLoading = ref<boolean>(true);
const isExporting = ref<boolean>(false);
const errorMessage = ref<string | null>(null);
const { role } = useAuth();
const isAdmin = computed(() => role?.value === 'admin');
const commercialRate = ref<number | null>(null);
const isSavingCommercialRate = ref(false);
const { success: showSuccess, error: showError } = useToast();

// Perfil tributario
const activeProfile = ref<TaxProfile | null>(null);
const showProfileModal = ref<boolean>(false);
const isLoadingProfile = ref<boolean>(false);
const isActivatingProfile = ref<boolean>(false);
const profileFeedback = ref<{ message: string; success: boolean } | null>(null);

async function loadCommercialRate() {
  if (!isAdmin.value) return;
  try {
    commercialRate.value = Number((await fetchCommercialTaxConfiguration()).tasa_impuesto);
  } catch {
    showError('No se pudo cargar la tasa configurada.');
  }
}

async function saveCommercialRate() {
  if (commercialRate.value === null || commercialRate.value < 0 || commercialRate.value > 100) return;
  isSavingCommercialRate.value = true;
  try {
    const response = await updateCommercialTaxConfiguration(commercialRate.value);
    commercialRate.value = Number(response.tasa_impuesto);
    showSuccess('Tasa de IVA actualizada correctamente.');
  } catch {
    showError('No se pudo actualizar la tasa de IVA.');
  } finally {
    isSavingCommercialRate.value = false;
  }
}

const defaultTaxes = [
  {
    tax_code: 'IVA',
    name: 'Impuesto al Valor Agregado',
    rate: 12,
    eligible_for_input_credit: true,
  },
];

const isNoProfileError = computed(() => {
  if (!errorMessage.value) return false;
  const msg = errorMessage.value.toLowerCase();
  return msg.includes('no tax profile') || msg.includes('perfil') || msg.includes('tax profile');
});

const metrics = ref<TaxPeriodMetrics>({
  tax_debit: 0,
  tax_credit: 0,
  net_tax: 0,
  tax_payable: 0,
  carry_forward: 0,
  withholding_tax: 0,
  input_documents_count: 0,
});

const isEmpty = computed(() => {
  return (
    !isLoading.value &&
    !errorMessage.value &&
    metrics.value.input_documents_count === 0 &&
    metrics.value.tax_debit === 0 &&
    metrics.value.tax_credit === 0 &&
    metrics.value.tax_payable === 0
  );
});

const summaryCalloutClass = computed(() => {
  if (metrics.value.tax_payable > 0) return 'tax-summary-callout--payable';
  if (metrics.value.carry_forward > 0) return 'tax-summary-callout--credit';
  return 'tax-summary-callout--neutral';
});

const summaryTitle = computed(() => {
  if (metrics.value.tax_payable > 0) {
    return 'Obligación tributaria líquida por pagar';
  }
  if (metrics.value.carry_forward > 0) {
    return 'Crédito fiscal acumulado a favor del contribuyente';
  }
  return 'Período fiscal equilibrado';
});

const summaryDescription = computed(() => {
  if (metrics.value.tax_payable > 0) {
    return 'El débito fiscal de ventas superó las compras deducibles. Se debe enterar el monto a pagar a la Administración Tributaria.';
  }
  if (metrics.value.carry_forward > 0) {
    return 'El crédito fiscal por compras o retenciones superó el débito del período. El remanente quedará disponible para compensar en meses futuros.';
  }
  return 'No hay saldo a liquidar ni créditos pendientes para el período seleccionado.';
});

function resetToCurrentPeriod() {
  selectedMonth.value = new Date().getMonth() + 1;
  selectedYear.value = new Date().getFullYear();
}

function openProfileModal() {
  profileFeedback.value = null;
  showProfileModal.value = true;
  loadProfile();
}

async function loadProfile() {
  if (!appStore.state.session?.accessToken) return;
  isLoadingProfile.value = true;
  try {
    const res = await fetchTaxProfiles();
    const profiles = res?.profiles || [];
    const padMonth = String(selectedMonth.value || 1).padStart(2, '0');
    const onDate = `${selectedYear.value}-${padMonth}-01`;
    const matched = profiles.find(
      (p) => p.active && p.effective_from <= onDate && (!p.effective_until || onDate < p.effective_until)
    );
    activeProfile.value = matched || (profiles.length > 0 ? profiles[profiles.length - 1] : null);
  } catch (err: any) {
    if (err?.status !== 401) {
      console.warn('No se pudo consultar el perfil tributario:', err);
    }
  } finally {
    isLoadingProfile.value = false;
  }
}

async function activateDefaultProfile() {
  isActivatingProfile.value = true;
  profileFeedback.value = null;
  try {
    const profileToActivate: TaxProfile = {
      ...DEFAULT_GT_TAX_PROFILE,
      effective_from: `${selectedYear.value}-01-01`,
      active: true,
    };
    await saveTaxProfile(profileToActivate);
    activeProfile.value = profileToActivate;
    profileFeedback.value = {
      message: '¡Perfil tributario activado con éxito! Recalculando métricas...',
      success: true,
    };
    await loadMetrics();
    await loadProfile();
  } catch (error) {
    console.error('Error al activar perfil tributario:', error);
    profileFeedback.value = {
      message: error instanceof Error ? error.message : 'No se pudo activar el perfil tributario. Verifica tus permisos.',
      success: false,
    };
  } finally {
    isActivatingProfile.value = false;
  }
}

async function toggleProfileActive() {
  if (!activeProfile.value) return;
  isActivatingProfile.value = true;
  profileFeedback.value = null;
  try {
    const updated: TaxProfile = {
      ...activeProfile.value,
      active: !activeProfile.value.active,
    };
    await saveTaxProfile(updated);
    activeProfile.value = updated;
    profileFeedback.value = {
      message: updated.active
        ? '¡Perfil tributario reactivado con éxito!'
        : 'Perfil tributario desactivado.',
      success: true,
    };
    await loadMetrics();
  } catch (error) {
    console.error('Error al actualizar estado del perfil:', error);
    profileFeedback.value = {
      message: error instanceof Error ? error.message : 'Error al actualizar el estado del perfil.',
      success: false,
    };
  } finally {
    isActivatingProfile.value = false;
  }
}

async function exportTaxReport() {
  isExporting.value = true;
  try {
    const token = appStore.state.session?.accessToken;
    const year = selectedYear.value;
    const url = `/api/v1/reports/tributario?regime=GENERAL_VAT&year=${year}`;
    const response = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!response.ok) {
      throw new Error(`Error en el servidor al generar reporte (${response.status})`);
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `reporte_tributario_${year}.xlsx`;
    document.body.appendChild(link);
    link.click();
    window.URL.revokeObjectURL(downloadUrl);
    link.remove();
  } catch (err) {
    console.warn('Descarga de reporte tributario vía backend falló, usando exportación de contingencia:', err);
    // Exportación CSV de contingencia con los datos del período
    const csvContent = [
      'Métrica,Monto (GTQ)',
      `Débito Fiscal (Ventas),${metrics.value.tax_debit.toFixed(2)}`,
      `Crédito Fiscal (Compras),${metrics.value.tax_credit.toFixed(2)}`,
      `Impuesto Neto,${metrics.value.net_tax.toFixed(2)}`,
      `Impuesto a Pagar,${metrics.value.tax_payable.toFixed(2)}`,
      `Remanente a Favor,${metrics.value.carry_forward.toFixed(2)}`,
      `Retenciones Aplicadas,${metrics.value.withholding_tax.toFixed(2)}`,
      `Documentos Fiscales,${metrics.value.input_documents_count}`,
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `resumen_fiscal_${selectedYear.value}_${selectedMonth.value || 'anual'}.csv`;
    document.body.appendChild(link);
    link.click();
    window.URL.revokeObjectURL(downloadUrl);
    link.remove();
  } finally {
    isExporting.value = false;
  }
}

async function loadMetrics() {
  isLoading.value = true;
  errorMessage.value = null;
  const year = selectedYear.value;
  const month = selectedMonth.value;

  let startDate: string;
  let endDate: string;

  if (month > 0) {
    const padMonth = String(month).padStart(2, '0');
    const lastDay = new Date(year, month, 0).getDate();
    startDate = `${year}-${padMonth}-01`;
    endDate = `${year}-${padMonth}-${String(lastDay).padStart(2, '0')}`;
  } else {
    startDate = `${year}-01-01`;
    endDate = `${year}-12-31`;
  }

  try {
    const data = await fetchTaxPeriodMetrics({
      start_date: startDate,
      end_date: endDate,
    });
    metrics.value = data;
  } catch (error) {
    console.error('Error al cargar métricas tributarias:', error);
    errorMessage.value = error instanceof Error ? error.message : 'No se pudo conectar con el servicio de cálculo tributario.';
  } finally {
    isLoading.value = false;
  }
}

watch([selectedMonth, selectedYear], () => {
  loadMetrics();
  loadProfile();
});

onMounted(() => {
  loadMetrics();
  loadProfile();
  loadCommercialRate();
});
</script>

<style scoped>
.tax-dashboard-page {
  padding: 24px 32px;
  background-color: var(--color-bg-app, #f8fafc);
  min-height: 100vh;
  box-sizing: border-box;
}

.tax-rate-settings {
  display: flex;
  align-items: center;
  gap: 20px;
  margin: 0 0 24px;
  padding: 16px 20px;
  background: var(--color-bg-surface);
  border: 1px solid var(--color-bg-border);
  border-radius: 12px;
}

.tax-rate-settings h2 { margin: 0 0 4px; font-size: 1rem; color: var(--color-heading); }
.tax-rate-settings p { margin: 0; color: var(--color-text-muted); font-size: .82rem; }
.tax-rate-form { display: flex; align-items: center; gap: 8px; margin-left: auto; }
.tax-rate-form label { font-size: .82rem; font-weight: 600; }
.tax-rate-form input { width: 90px; padding: 8px 10px; border: 1px solid var(--color-bg-border); border-radius: 7px; }

.tax-dashboard-header {
  margin-bottom: 24px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.tax-header-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.tax-regime-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 9999px;
  background-color: #e0e7ff;
  color: #3730a3;
  border: 1px solid #c7d2fe;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tax-regime-badge:hover {
  background-color: #c7d2fe;
  transform: translateY(-1px);
}

.tax-regime-badge--inactive {
  background-color: #fef3c7;
  color: #92400e;
  border-color: #fde68a;
}

.badge-status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  display: inline-block;
}

.dot--active {
  background-color: #10b981;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
}

.dot--inactive {
  background-color: #f59e0b;
  box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.2);
}

.tax-header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.profile-action-btn {
  min-width: 132px;
}

.spin-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.tax-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-heading, #0f172a);
  margin: 0 0 6px 0;
}

.tax-subtitle {
  font-size: 0.95rem;
  color: var(--color-text-secondary, #64748b);
  margin: 0;
}

.tax-dashboard-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.tax-metrics-skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
  width: 100%;
}

.metric-card-skeleton {
  background: var(--color-bg-surface, #ffffff);
  border: 1px solid var(--color-bg-border, #e2e8f0);
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.skeleton-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.skeleton-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.error-action {
  margin-top: 12px;
}

.empty-state-wrapper {
  background: var(--color-bg-surface, #ffffff);
  border: 1px solid var(--color-bg-border, #e2e8f0);
  border-radius: 14px;
  padding: 48px 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.empty-icon-custom {
  color: var(--color-text-secondary, #94a3b8);
}

.tax-summary-callout {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 18px 22px;
  border-radius: 12px;
  margin-top: 8px;
  border: 1px solid transparent;
}

.tax-summary-callout__icon {
  margin-top: 2px;
  flex-shrink: 0;
}

.tax-summary-callout__content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tax-summary-callout__title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
}

.tax-summary-callout__text {
  margin: 0;
  font-size: 0.88rem;
  line-height: 1.45;
}

.tax-summary-callout--payable {
  background-color: #fffbeb;
  border-color: #fde68a;
  color: #92400e;
}

.tax-summary-callout--payable .tax-summary-callout__icon {
  color: #d97706;
}

.tax-summary-callout--payable .tax-summary-callout__text {
  color: #b45309;
}

.tax-summary-callout--credit {
  background-color: #f0fdf4;
  border-color: #bbf7d0;
  color: #166534;
}

.tax-summary-callout--credit .tax-summary-callout__icon {
  color: #16a34a;
}

.tax-summary-callout--credit .tax-summary-callout__text {
  color: #15803d;
}

.tax-summary-callout--neutral {
  background-color: #f8fafc;
  border-color: #e2e8f0;
  color: #334155;
}

.tax-summary-callout--neutral .tax-summary-callout__icon {
  color: #64748b;
}

.tax-summary-callout--neutral .tax-summary-callout__text {
  color: #64748b;
}

@media (max-width: 768px) {
  .tax-dashboard-page {
    padding: 16px 20px;
  }

  .tax-title {
    font-size: 1.5rem;
  }

  .tax-subtitle {
    font-size: 0.88rem;
  }

  .tax-metrics-skeleton-grid {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 16px;
  }
}

@media (max-width: 640px) {
  .tax-dashboard-header {
    flex-direction: column;
    align-items: stretch;
  }

  .tax-header-actions {
    width: 100%;
    justify-content: stretch;
  }

  .tax-header-actions .action-btn {
    flex: 1;
    justify-content: center;
  }

  .tax-summary-callout {
    padding: 14px 16px;
  }
}

@media (max-width: 480px) {
  .tax-dashboard-page {
    padding: 12px 14px;
  }

  .tax-title {
    font-size: 1.35rem;
  }

  .tax-metrics-skeleton-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .empty-state-wrapper {
    padding: 32px 16px;
  }
}

/* Callout para error cuando no hay perfil */
.no-profile-callout {
  margin-top: 14px;
  padding: 14px 16px;
  background: rgba(254, 242, 242, 0.85);
  border: 1px solid #fecaca;
  border-radius: 10px;
}

.no-profile-hint {
  font-size: 0.88rem;
  color: #7f1d1d;
  margin: 0 0 12px 0;
  line-height: 1.45;
}

.no-profile-action-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.btn-activate-profile {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

/* Modal de Perfil Tributario */
.profile-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  overflow-y: auto;
}

.profile-modal {
  background: var(--color-bg-surface, #ffffff);
  border-radius: 16px;
  width: 100%;
  max-width: 540px;
  max-height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  animation: modalIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.profile-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--color-bg-border, #e2e8f0);
  flex-shrink: 0;
}

.profile-modal-title-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.profile-modal-icon {
  color: var(--color-structure-base, #3b82f6);
}

.profile-modal-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--color-heading, #0f172a);
  margin: 0;
}

.profile-modal-close {
  background: none;
  border: none;
  font-size: 1.2rem;
  color: var(--color-text-secondary, #64748b);
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  transition: all 0.2s;
}

.profile-modal-close:hover {
  background: var(--color-bg-hover, #f1f5f9);
  color: var(--color-heading, #0f172a);
}

.profile-modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1 1 auto;
  min-height: 0;
}

.profile-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px;
  border-top: 1px solid var(--color-bg-border, #e2e8f0);
  background: var(--color-bg-subtle, #f8fafc);
  flex-shrink: 0;
}

.profile-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  gap: 12px;
  color: var(--color-text-secondary, #64748b);
  font-size: 0.9rem;
}

.profile-status-box {
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 20px;
}

.status-box--active {
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  color: #065f46;
}

.status-box--inactive {
  background: #fffbeb;
  border: 1px solid #fde68a;
  color: #92400e;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem;
  margin-bottom: 6px;
}

.status-indicator .status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-box--active .status-dot {
  background: #10b981;
}

.status-box--inactive .status-dot {
  background: #f59e0b;
}

.status-explanation {
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.4;
  opacity: 0.9;
}

.profile-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 20px;
}

.profile-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  background: var(--color-bg-subtle, #f8fafc);
  border: 1px solid var(--color-bg-border, #e2e8f0);
  border-radius: 8px;
}

.field-label {
  font-size: 0.75rem;
  color: var(--color-text-secondary, #64748b);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.field-val {
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--color-heading, #0f172a);
}

.profile-taxes-section {
  margin-top: 16px;
}

.section-subtitle {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--color-heading, #0f172a);
  margin: 0 0 10px 0;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.taxes-cards {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tax-card-pill {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: var(--color-bg-subtle, #f8fafc);
  border: 1px solid var(--color-bg-border, #e2e8f0);
  border-radius: 8px;
}

.tax-card-pill__left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tax-pill-code {
  font-weight: 700;
  font-size: 0.85rem;
  background: #e0e7ff;
  color: #3730a3;
  padding: 2px 8px;
  border-radius: 6px;
}

.tax-pill-name {
  font-size: 0.9rem;
  color: var(--color-text, #334155);
}

.tax-card-pill__right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.tax-pill-rate {
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--color-heading, #0f172a);
}

.tax-pill-badge {
  font-size: 0.72rem;
  background: #ecfdf5;
  color: #065f46;
  border: 1px solid #a7f3d0;
  padding: 2px 6px;
  border-radius: 9999px;
  font-weight: 600;
}

.profile-feedback-alert {
  margin-top: 16px;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 0.86rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.feedback--success {
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  color: #065f46;
}

.feedback--error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
}
</style>
