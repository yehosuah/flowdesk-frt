<template>
  <div class="profile-page">
    <div v-if="loadError" class="alert alert-error">
      <span>{{ loadError }}</span>
      <button class="alert-close" type="button" @click="loadError = ''">✕</button>
    </div>

    <div v-if="isLoading" class="loading-state">
      <div class="spinner spinner--dark"></div>
    </div>

    <template v-else-if="profile">
      <header class="profile-header card">
        <div class="profile-avatar">{{ initials }}</div>
        <div class="profile-header-info">
          <h1 class="profile-name">{{ profile.username }}</h1>
          <span :class="['role-badge', roleBadgeClass(profile.role_name)]">{{ profile.role_name }}</span>
        </div>
      </header>

      <section class="card section-card">
        <div class="section-header">
          <h2 class="section-title">Datos personales</h2>
          <button v-if="!isEditingData" class="btn-icon-action" type="button" @click="startEditData">
            <Pencil :size="15" /> Editar
          </button>
        </div>

        <div v-if="profileSuccessMsg" class="alert alert-success">
          <span>{{ profileSuccessMsg }}</span>
        </div>
        <div v-if="profileSubmitError" class="alert alert-error">
          <span>{{ profileSubmitError }}</span>
          <button class="alert-close" type="button" @click="profileSubmitError = ''">✕</button>
        </div>

        <dl v-if="!isEditingData" class="data-grid">
          <div class="data-row">
            <dt class="data-label">Nombre de usuario</dt>
            <dd class="data-value">{{ profile.username }}</dd>
          </div>
          <div class="data-row">
            <dt class="data-label">Correo electrónico</dt>
            <dd class="data-value">{{ profile.email }}</dd>
          </div>
          <div class="data-row">
            <dt class="data-label">Miembro desde</dt>
            <dd class="data-value">{{ formatDate(profile.created_at) }}</dd>
          </div>
          <div class="data-row">
            <dt class="data-label">Contraseña</dt>
            <dd class="data-value data-value--with-action">
              <span class="password-dots">••••••••</span>
              <button class="link-btn" type="button" @click="goToChangePassword">Cambiar</button>
            </dd>
          </div>
        </dl>

        <form v-else @submit.prevent="submitProfile">
          <div class="form-group">
            <label class="form-label" for="profile-username">Nombre de usuario</label>
            <input
              id="profile-username"
              v-model="profileForm.username"
              type="text"
              class="form-input"
              :class="{ 'input-error': profileErrors.username }"
              @input="profileErrors.username = ''"
            />
            <span v-if="profileErrors.username" class="error-msg">{{ profileErrors.username }}</span>
          </div>

          <div class="form-group">
            <label class="form-label">Correo electrónico</label>
            <input :value="profile.email" type="email" class="form-input form-input--disabled" disabled />
            <span class="hint-msg">El correo electrónico no se puede modificar.</span>
          </div>

          <div class="form-actions">
            <button type="button" class="btn-secondary" @click="cancelEditData">Cancelar</button>
            <button type="submit" class="btn-primary btn-inline" :disabled="isSavingProfile || !hasProfileChanges">
              <span v-if="isSavingProfile" class="spinner" aria-hidden="true"></span>
              <span>{{ isSavingProfile ? 'Guardando...' : 'Guardar cambios' }}</span>
            </button>
          </div>
        </form>
      </section>

      <section class="card section-card">
        <div class="preference-row">
          <div class="preference-info">
            <span class="preference-label">Modo oscuro</span>
          </div>

          <button
            type="button"
            role="switch"
            :aria-checked="isDark"
            aria-label="Alternar modo oscuro"
            class="theme-switch"
            :class="{ 'theme-switch--on': isDark }"
            @click="toggleTheme"
          >
            <span class="theme-switch__track">
              <span class="theme-switch__thumb">
                <component :is="isDark ? Moon : Sun" :size="12" />
              </span>
            </span>
          </button>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Pencil, Moon, Sun } from 'lucide-vue-next';
import { fetchProfile, updateProfile } from '@/features/profile/api';
import type { ProfileResponse } from '@/features/profile/types';
import { getApiErrorMessage } from '@/services/apiClient';
import { useTheme } from '@/styles/useTheme';

const { theme, toggle: toggleTheme } = useTheme();
const isDark = computed(() => theme.value === 'dark');

interface ProfileFormData {
  username: string;
}

const router = useRouter();

const profile = ref<ProfileResponse | null>(null);
const isLoading = ref(true);
const loadError = ref('');

const isEditingData = ref(false);
const isSavingProfile = ref(false);
const profileSubmitError = ref('');
const profileSuccessMsg = ref('');
const profileForm = reactive<ProfileFormData>({ username: '' });
const profileErrors = reactive<Record<keyof ProfileFormData, string>>({ username: '' });

const hasProfileChanges = computed(() => profileForm.username.trim() !== profile.value?.username);

const initials = computed(() => {
  const name = profile.value?.username ?? '';
  return name.slice(0, 2).toUpperCase();
});

async function loadProfile() {
  isLoading.value = true;
  loadError.value = '';
  try {
    profile.value = await fetchProfile();
  } catch (err) {
    loadError.value = getApiErrorMessage(err);
  } finally {
    isLoading.value = false;
  }
}

onMounted(loadProfile);

function roleBadgeClass(role: string): string {
  if (role === 'admin' || role === 'superadmin') return 'role-badge--admin';
  if (role === 'manager') return 'role-badge--manager';
  return 'role-badge--emp';
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-GT', { year: 'numeric', month: 'short', day: 'numeric' });
}

function startEditData() {
  if (!profile.value) return;
  profileForm.username = profile.value.username;
  profileErrors.username = '';
  profileSubmitError.value = '';
  isEditingData.value = true;
}

function cancelEditData() {
  isEditingData.value = false;
  profileErrors.username = '';
  profileSubmitError.value = '';
}

async function submitProfile() {
  if (!profile.value) return;
  profileSubmitError.value = '';
  if (!profileForm.username.trim()) {
    profileErrors.username = 'El nombre de usuario es obligatorio.';
    return;
  }
  if (!hasProfileChanges.value) {
    isEditingData.value = false;
    return;
  }

  isSavingProfile.value = true;
  try {
    profile.value = await updateProfile(profile.value.id, { username: profileForm.username.trim() });
    isEditingData.value = false;
    profileSuccessMsg.value = 'Datos actualizados correctamente.';
    setTimeout(() => { profileSuccessMsg.value = ''; }, 4000);
  } catch (err) {
    profileSubmitError.value = getApiErrorMessage(err);
  } finally {
    isSavingProfile.value = false;
  }
}

function goToChangePassword() {
  router.push({ name: 'forgot-password', query: profile.value ? { email: profile.value.email } : undefined });
}
</script>

<style scoped>
.profile-page {
  font-family: var(--font-sans);
  padding: 32px 36px;
  min-height: 100vh;
  color: var(--color-text);
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  max-width: 1300px;
  margin: 0 auto;
}

.card {
  background: var(--color-bg-surface);
  border-radius: 12px;
  box-shadow: var(--shadow-card);
  overflow: hidden;
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 60px 0;
}

.spinner--dark {
  border-color: var(--color-structure-subtle);
  border-top-color: var(--color-structure-hover);
  width: 28px;
  height: 28px;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 28px 32px;
}

.profile-avatar {
  width: 64px;
  height: 64px;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--color-structure-base);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  font-weight: 700;
}

.profile-header-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.profile-name {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--color-text);
  margin: 0;
}

.section-card {
  padding: 28px 32px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}

.section-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--color-heading);
  margin: 0 0 18px;
}

.section-header .section-title {
  margin: 0;
}

.btn-icon-action {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border: 1.5px solid var(--color-structure-subtle);
  border-radius: 8px;
  background: none;
  color: var(--color-structure-hover);
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.14s;
}

.btn-icon-action:hover {
  border-color: var(--color-structure-hover);
  background: var(--color-structure-subtle);
}

.data-grid {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin: 0;
}

.data-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--color-structure-subtle);
}

.data-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.data-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text-muted);
  margin: 0;
}

.data-value {
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin: 0;
  text-align: right;
}

.data-value--with-action {
  display: flex;
  align-items: center;
  gap: 14px;
}

.password-dots {
  letter-spacing: 2px;
}

.link-btn {
  background: none;
  border: none;
  padding: 0;
  color: var(--color-structure-hover);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}

.link-btn:hover {
  text-decoration: underline;
}

.form-input--disabled {
  background: var(--color-bg-app);
  color: var(--color-text-muted);
  cursor: not-allowed;
}

.hint-msg {
  display: block;
  margin-top: 5px;
  font-size: 0.78rem;
  color: var(--color-text-muted);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.btn-secondary {
  padding: 10px 20px;
  border: 1.5px solid var(--color-structure-subtle);
  border-radius: 8px;
  background: var(--color-bg-surface);
  color: var(--color-text-muted);
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.13s;
}

.btn-secondary:hover {
  border-color: var(--color-structure-hover);
  color: var(--color-structure-hover);
}

.btn-inline {
  width: auto;
  padding: 10px 28px;
}

.role-badge {
  display: inline-block;
  align-self: flex-start;
  padding: 3px 12px;
  border-radius: 99px;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: capitalize;
}

.role-badge--admin   { background: var(--color-structure-subtle); color: var(--color-structure-hover); border: 1px solid var(--color-info-border); }
.role-badge--manager { background: var(--color-info-bg); color: var(--color-info-text); border: 1px solid var(--color-info-border); }
.role-badge--emp     { background: var(--color-pop-honey); color: var(--color-warning-text); border: 1px solid var(--color-warning-border); }

.preference-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.preference-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.preference-label {
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.preference-desc {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  max-width: 46ch;
}

.theme-switch {
  flex-shrink: 0;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
}

.theme-switch__track {
  display: flex;
  align-items: center;
  width: 52px;
  height: 28px;
  padding: 3px;
  border-radius: 99px;
  background: var(--color-structure-subtle);
  transition: background 0.16s ease;
}

.theme-switch__thumb {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--color-bg-surface);
  color: var(--color-warning);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
  transition: transform 0.16s ease, color 0.16s ease;
}

.theme-switch--on .theme-switch__track {
  background: var(--color-structure-base);
}

.theme-switch--on .theme-switch__thumb {
  transform: translateX(24px);
  color: var(--color-structure-hover);
}

.theme-switch:focus-visible .theme-switch__track {
  outline: 2px solid var(--color-structure-hover);
  outline-offset: 2px;
}

@media (max-width: 600px) {
  .preference-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>
