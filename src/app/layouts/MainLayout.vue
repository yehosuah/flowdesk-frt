<template>
  <div class="main-layout">
    <button
      class="mobile-menu-button"
      type="button"
      aria-label="Abrir menú"
      @click="toggleSidebar"
    >
      <Menu :size="24" />
    </button>

    <Transition name="fade">
      <div
        v-if="sidebarOpen"
        class="sidebar-overlay"
        @click="closeSidebar"
      />
    </Transition>

    <aside
      class="sidebar"
      :class="{ 'sidebar--open': sidebarOpen }"
    >
      <div class="sidebar__brand">
        <img
          src="../../logo/logo.png"
          alt="FlowDesk"
          class="sidebar__logo"
        />
      </div>

      <nav class="sidebar__nav">
        <RouterLink
          v-for="item in visibleNavItems"
          :key="item.name"
          :to="item.to"
          class="sidebar__link"
          active-class="sidebar__link--active"
          @click="closeSidebar"
        >
          <component :is="item.icon" :size="18" class="sidebar__icon" />
          <span class="sidebar__label">{{ item.label }}</span>
        </RouterLink>
      </nav>

      <button
        class="sidebar__logout"
        type="button"
        @click="resetOnboarding"
        style="padding-bottom: 4px;"
      >
        <HelpCircle :size="18" class="sidebar__icon" />
        <span class="sidebar__label">Ver Tutorial</span>
      </button>

      <button
        class="sidebar__logout"
        type="button"
        @click="cerrarSesion"
      >
        <LogOut :size="18" class="sidebar__icon" />
        <span class="sidebar__label">Cerrar sesión</span>
      </button>
    </aside>

    <main class="main-layout__content">
      <RouterView />
    </main>

    <WelcomeModal
      v-model="isWelcomeVisible"
      @skip="skipTour"
      @startTour="startTour"
    />
  </div>
</template>

<script setup lang="ts">
import { RouterLink, useRouter } from 'vue-router';
import { computed, ref, watch } from 'vue';
import { Menu, LogOut, HelpCircle, Package, ArrowRightLeft, ClipboardList, Calendar, Shield, BarChart3, Users, Truck, UserCircle, FileText, User } from 'lucide-vue-next';
import { appStore } from '@/stores/app.store';
import { useAuth } from '@/composables/useAuth';
import WelcomeModal from '@/features/onboarding/components/WelcomeModal.vue';
import { useOnboarding } from '@/features/onboarding/composables/useOnboarding';

const router = useRouter();
const sidebarOpen = ref(false);
const { canAccessRoute } = useAuth();
const { isWelcomeVisible, skipTour, startTour, resetOnboarding } = useOnboarding();

function toggleSidebar(): void {
  sidebarOpen.value = !sidebarOpen.value;
}

function closeSidebar(): void {
  sidebarOpen.value = false;
}

watch(sidebarOpen, (isOpen) => {
  if (window.innerWidth <= 1000) {
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }
});

const navItems = [
  { name: 'inventory', label: 'Inventario', to: { name: 'inventory' }, icon: Package },
  { name: 'inventorymovement', label: 'Movimiento de Inventario', to: { name: 'inventorymovement' }, icon: ArrowRightLeft },
  { name: 'tasks', label: 'Gestión de tareas', to: { name: 'tasks' }, icon: ClipboardList },
  { name: 'tasks-calendar', label: 'Calendario', to: { name: 'tasks-calendar' }, icon: Calendar },
  { name: 'superAdmin', label: 'Manejo de Cuentas', to: { name: 'superAdmin' }, icon: Shield },
  { name: 'analytics', label: 'Análisis', to: { name: 'analytics' }, icon: BarChart3 },
  { name: 'employees', label: 'Empleados', to: { name: 'employees' }, icon: Users },
  { name: 'suppliers', label: 'Proveedores', to: { name: 'suppliers' }, icon: Truck },
  { name: 'clients', label: 'Clientes', to: { name: 'clients' }, icon: UserCircle },
  { name: 'reports', label: 'Reportes', to: { name: 'reports' }, icon: FileText },
  { name: 'profile', label: 'Mi Perfil', to: { name: 'profile' }, icon: User },
];

// Solo se muestran las páginas a las que el rol de la sesión puede entrar
// (misma matriz que usan los guards del router: src/utils/permissions.ts).
const visibleNavItems = computed(() =>
  navItems.filter((item) => canAccessRoute(item.name)),
);

async function cerrarSesion(): Promise<void> {
  closeSidebar();
  appStore.clearSession();
  await router.push({ name: 'login' });
}
</script>

<style scoped>
.main-layout {
  display: flex;
  width: 100%;
  min-height: 100vh;
  background: var(--color-bg-app);
}

.sidebar {
  width: 280px;
  flex-shrink: 0;

  position: sticky;
  top: 0;

  display: flex;
  flex-direction: column;

  height: 100vh;
  box-sizing: border-box;

  background: var(--color-structure-base);

  overflow: hidden;
}

.sidebar__brand {
  flex-shrink: 0;

  display: flex;
  align-items: center;
  justify-content: center;

  height: 190px;

  padding: 20px;

  box-sizing: border-box;

  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.sidebar__logo {
  display: block;

  width: 150px;
  max-width: 100%;
  height: auto;
}

.sidebar__nav {
  flex: 1;
  min-height: 0;

  display: flex;
  flex-direction: column;

  gap: 2px;

  padding: 10px;

  box-sizing: border-box;

  overflow: hidden;
}

.sidebar__link {
  display: flex;
  align-items: center;

  gap: 10px;

  padding: 8px 12px;

  border-radius: 8px;

  color: rgba(255, 255, 255, 0.6);

  font-size: 0.82rem;
  font-weight: 500;

  line-height: 1.2;

  text-decoration: none;

  transition:
    background 0.15s,
    color 0.15s;
}

.sidebar__link:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.sidebar__link--active {
  background: rgba(255, 255, 255, 0.13);
  color: #fff;
  font-weight: 600;
}

.sidebar__icon {
  display: flex;
  align-items: center;
  justify-content: center;

  flex-shrink: 0;
}

.sidebar__label {
  min-width: 0;
}

.sidebar__logout {
  flex-shrink: 0;

  display: flex;
  align-items: center;

  gap: 10px;

  width: 100%;

  box-sizing: border-box;

  padding: 10px 22px 16px;

  border: none;

  background: none;

  color: rgba(255, 255, 255, 0.45);

  font-family: inherit;
  font-size: 0.82rem;

  text-align: left;

  cursor: pointer;

  transition: color 0.15s;
}

.sidebar__logout:hover {
  color: rgba(255, 255, 255, 0.8);
}

.main-layout__content {
  flex: 1;

  width: 100%;
  min-width: 0;

  box-sizing: border-box;

  overflow: visible;
}

.mobile-menu-button {
  display: none;
}

.sidebar-overlay {
  display: none;
}

@media (max-height: 850px) and (min-width: 1001px) {
  .sidebar__brand {
    height: 150px;
    padding: 14px 18px;
  }

  .sidebar__logo {
    width: 120px;
  }

  .sidebar__nav {
    padding-top: 6px;
    padding-bottom: 6px;
    gap: 1px;
  }

  .sidebar__link {
    padding-top: 6px;
    padding-bottom: 6px;

    font-size: 0.76rem;
  }

  .sidebar__logout {
    padding-top: 7px;
    padding-bottom: 10px;

    font-size: 0.76rem;
  }
}

@media (max-width: 1000px) {
  .main-layout {
    display: block;

    width: 100%;
    min-height: 100vh;
  }

  .main-layout__content {
    width: 100%;
    min-width: 0;
    min-height: 100vh;

    padding-top: 64px;

    box-sizing: border-box;

    overflow: visible;
  }

  .mobile-menu-button {
    display: flex;
    align-items: center;
    justify-content: center;

    position: fixed;

    top: 16px;
    left: 16px;

    z-index: 1100;

    width: 44px;
    height: 44px;

    padding: 0;

    border: none;
    border-radius: 8px;

    background: var(--color-structure-base);
    color: #fff;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

    font-size: 24px;
    line-height: 1;

    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .mobile-menu-button:active {
    transform: scale(0.95);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  }

  .sidebar {
    position: fixed;

    top: 0;
    left: 0;

    z-index: 1200;

    width: 280px;
    max-width: 85vw;

    height: 100dvh;

    box-sizing: border-box;

    transform: translateX(-100%);

    transition: transform 0.25s ease;

    box-shadow: 4px 0 16px rgba(0, 0, 0, 0.2);

    overflow: hidden;
  }

  .sidebar--open {
    transform: translateX(0);
  }

  .sidebar__brand {
    height: 120px;

    padding: 14px 18px;
  }

  .sidebar__logo {
    width: 110px;
  }

  .sidebar__nav {
    flex: 1;
    min-height: 0;

    display: flex;
    flex-direction: column;

    gap: 1px;

    padding: 6px 8px;

    overflow-y: auto;
    overflow-x: hidden;

    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .sidebar__nav::-webkit-scrollbar {
    display: none;
  }

  .sidebar__link {
    flex-shrink: 0;

    padding: 8px 10px;

    font-size: 0.8rem;
  }

  .sidebar__logout {
    flex-shrink: 0;

    padding: 9px 18px 12px;

    font-size: 0.8rem;
  }

  .sidebar-overlay {
    display: block;

    position: fixed;

    inset: 0;

    z-index: 1150;

    background: rgba(0, 0, 0, 0.45);
  }
}

@media (max-width: 480px) {
  .mobile-menu-button {
    top: 12px;
    left: 12px;

    width: 42px;
    height: 42px;
  }

  .main-layout__content {
    padding-top: 60px;
  }

  .sidebar {
    width: 250px;
    max-width: 82vw;
  }

  .sidebar__brand {
    height: 105px;

    padding: 12px 16px;
  }

  .sidebar__logo {
    width: 95px;
  }

  .sidebar__nav {
    padding: 5px 7px;
  }

  .sidebar__link {
    gap: 12px;
    padding: 12px 14px;
    font-size: 0.9rem;
  }

  .sidebar__logout {
    padding: 8px 16px 10px;

    font-size: 0.76rem;
  }
}
</style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}







