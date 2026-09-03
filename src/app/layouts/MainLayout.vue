<template>
  <div class="main-layout">
    <button
      class="mobile-menu-button"
      type="button"
      aria-label="Abrir menú"
      @click="toggleSidebar"
    >
      ☰
    </button>

    <div
      v-if="sidebarOpen"
      class="sidebar-overlay"
      @click="closeSidebar"
    />

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
          v-for="item in navItems.filter(i => i.roles.includes(roleName ?? ''))"
          :key="item.name"
          :to="item.to"
          class="sidebar__link"
          active-class="sidebar__link--active"
          @click="closeSidebar"
        >
          <span class="sidebar__icon" v-html="item.icon" />
          <span class="sidebar__label">{{ item.label }}</span>
        </RouterLink>
      </nav>

      <button
        class="sidebar__logout"
        type="button"
        @click="cerrarSesion"
      >
        <span class="sidebar__icon" v-html="iconLogout" />
        <span class="sidebar__label">Cerrar sesión</span>
      </button>
    </aside>

    <main class="main-layout__content">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { RouterLink, useRouter } from 'vue-router';
import { ref } from 'vue';
import { appStore } from '@/stores/app.store';

const router = useRouter();

const sidebarOpen = ref(false);

const roleName = appStore.roleName;

function toggleSidebar(): void {
  sidebarOpen.value = !sidebarOpen.value;
}

function closeSidebar(): void {
  sidebarOpen.value = false;
}

const navItems = [
  {
    name: 'inventory',
    label: 'Inventario',
    to: { name: 'inventory' },
    roles: ['admin', 'manager', 'employee'],
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2"/>
            <path d="M8 21h8M12 17v4"/>
          </svg>`,
  },
  {
    name: 'inventorymovement',
    label: 'Movimiento de Inventario',
    to: { name: 'inventorymovement' },
    roles: ['admin', 'manager', 'employee'],
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 4h16v16H4z"/>
            <path d="M8 2v4M16 2v4M8 18v4M16 18v4M2 8h4M2 16h4M18 8h4M18 16h4"/>
          </svg>`,
  },
  {
    name: 'tasks',
    label: 'Gestión de tareas',
    to: { name: 'tasks' },
    roles: ['admin', 'manager', 'employee'],
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 11l3 3L22 4"/>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>`,
  },
  {
    name: 'tasks-calendar',
    label: 'Calendario',
    to: { name: 'tasks-calendar' },
    roles: ['admin', 'manager', 'employee'],
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>`,
  },
  {
    name: 'superAdmin',
    label: 'Manejo de Cuentas',
    to: { name: 'superAdmin' },
    roles: ['superadmin'],
    icon: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="18" height="18">
      <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
      <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
      <g id="SVGRepo_iconCarrier">
        <path d="M13.5 4.29076C13.0368 4.10325 12.5305 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12C13.1947 12 14.2671 11.4762 15 10.6458M18.2015 1.21321C18.1111 1.34235 18.1111 1.52453 18.1111 1.88889V2.48507C18.0219 2.5166 17.9349 2.55273 17.8504 2.59319L17.4287 2.17155C17.1711 1.91391 17.0423 1.78509 16.887 1.75772C16.8296 1.74759 16.7708 1.74759 16.7134 1.75772C16.5581 1.78509 16.4293 1.91391 16.1716 2.17155C15.914 2.4292 15.7852 2.55802 15.7578 2.71327C15.7477 2.77071 15.7477 2.82948 15.7578 2.88692C15.7852 3.04217 15.914 3.17099 16.1716 3.42863L16.5932 3.85024C16.5528 3.93483 16.5166 4.02188 16.4851 4.11111H15.8889C15.5245 4.11111 15.3424 4.11111 15.2132 4.20154C15.1654 4.23499 15.1239 4.27655 15.0904 4.32432C15 4.45346 15 4.63564 15 5C15 5.36436 15 5.54654 15.0904 5.67568C15.1239 5.72345 15.1654 5.76501 15.2132 5.79846C15.3423 5.88889 15.5245 5.88889 15.8889 5.88889H16.4851C16.5166 5.9781 16.5527 6.06512 16.5932 6.14968L16.1716 6.57134C15.9139 6.82898 15.7851 6.9578 15.7577 7.11305C15.7476 7.17049 15.7476 7.22926 15.7577 7.2867C15.7851 7.44196 15.9139 7.57078 16.1716 7.82842C16.4292 8.08606 16.558 8.21488 16.7133 8.24225C16.7707 8.25238 16.8295 8.25238 16.8869 8.24225C17.0422 8.21488 17.171 8.08606 17.4286 7.82842L17.8503 7.40677C17.9349 7.44725 18.0219 7.48339 18.1111 7.51493V8.11111C18.1111 8.47547 18.1111 8.65765 18.2015 8.78679C18.235 8.83457 18.2765 8.87612 18.3243 8.90958C18.4535 9 18.6356 9 19 9C19.3644 9 19.5465 9 19.6757 8.90958C19.7235 8.87612 19.765 8.83457 19.7985 8.78679C19.8889 8.65765 19.8889 8.47547 19.8889 8.11111V7.51493C19.9781 7.48339 20.0652 7.44724 20.1498 7.40675L20.5714 7.82841C20.8291 8.08605 20.9579 8.21487 21.1131 8.24225C21.1706 8.25237 21.2293 8.25237 21.2868 8.24225C21.442 8.21487 21.5709 8.08605 21.8285 7.82841C22.0861 7.57077 22.215 7.44195 22.2423 7.28669C22.2525 7.22925 22.2525 7.17049 22.2423 7.11305C22.215 6.95779 22.0861 6.82897 21.8285 6.57133L21.4068 6.14965C21.4473 6.0651 21.4834 5.97808 21.5149 5.88889H22.1111C22.4755 5.88889 22.6576 5.88889 22.7868 5.79846C22.8346 5.76501 22.8761 5.72345 22.9096 5.67568C23 5.54654 23 5.36436 23 5C23 4.63564 23 4.45346 22.9096 4.32432C22.8761 4.27655 22.8346 4.23499 22.7868 4.20154C22.6576 4.11111 22.4755 4.11111 22.1111 4.11111H21.5149C21.4834 4.02189 21.4472 3.93485 21.4068 3.85028L21.8284 3.42864C22.0861 3.171 22.2149 3.04218 22.2422 2.88693C22.2524 2.82949 22.2524 2.77072 22.2422 2.71328C22.2149 2.55802 22.086 2.4292 21.8284 2.17156C21.5708 1.91392 21.4419 1.7851 21.2867 1.75773C21.2293 1.7476 21.1705 1.7476 21.113 1.75773C20.9578 1.7851 20.829 1.91392 20.5713 2.17156L20.1497 2.59321C20.0651 2.55274 19.9781 2.5166 19.8889 2.48507V1.88889C19.8889 1.52453 19.8889 1.34235 19.7985 1.21321C19.765 1.16543 19.7235 1.12388 19.6757 1.09042C19.5465 1 19.3644 1 19 1C18.6356 1 18.4535 1 18.3243 1.09042C18.2765 1.12388 18.235 1.16543 18.2015 1.21321ZM20 5C20 5.55228 19.5523 6 19 6C18.4477 6 18 5.55228 18 5C18 4.44772 18.4477 4 19 4C19.5523 4 20 4.44772 20 5ZM9.31765 14H14.6824C15.1649 14 15.4061 14 15.6219 14.0461C16.3688 14.2056 17.0147 14.7661 17.3765 15.569C17.4811 15.8009 17.5574 16.0765 17.71 16.6278C17.8933 17.2901 17.985 17.6213 17.9974 17.8884C18.0411 18.8308 17.5318 19.6817 16.7756 19.9297C16.5613 20 16.2714 20 15.6916 20H8.30844C7.72864 20 7.43875 20 7.22441 19.9297C6.46818 19.6817 5.95888 18.8308 6.00261 17.8884C6.01501 17.6213 6.10668 17.2901 6.29003 16.6278C6.44262 16.0765 6.51891 15.8009 6.62346 15.569C6.9853 14.7661 7.63116 14.2056 8.37806 14.0461C8.59387 14 8.83513 14 9.31765 14Z"
          stroke="#FFFFFF"
          stroke-linecap="round"
          stroke-linejoin="round">
        </path>
      </g>
    </svg>`,
  },
  {
    name: 'analytics',
    label: 'Análisis',
    to: { name: 'analytics' },
    roles: ['admin', 'manager'],
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"/>
            <line x1="12" y1="20" x2="12" y2="4"/>
            <line x1="6" y1="20" x2="6" y2="14"/>
          </svg>`,
  },
  {
    name: 'employees',
    label: 'Empleados',
    to: { name: 'employees' },
    roles: ['admin', 'manager'],
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>`,
  },
  {
    name: 'suppliers',
    label: 'Proveedores',
    to: { name: 'suppliers' },
    roles: ['admin', 'manager', 'employee'],
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <rect width="16" height="16" x="4" y="4" rx="2" />
            <rect width="6" height="6" x="9" y="9" rx="1" />
            <path d="M15 2v2" />
            <path d="M15 20v2" />
            <path d="M2 15h2" />
            <path d="M2 9h2" />
            <path d="M20 15h2" />
            <path d="M20 9h2" />
            <path d="M9 2v2" />
            <path d="M9 20v2" />
          </svg>`,
  },
  {
    name: 'clients',
    label: 'Clientes',
    to: { name: 'clients' },
    roles: ['admin', 'manager', 'employee'],
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="m11 17 2 2a1 1 0 1 0 3-3"/>
            <path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"/>
            <path d="m21 3 1 11h-2"/>
            <path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"/>
            <path d="M3 4h8"/>
          </svg>`,
  },
  {
    name: 'reports',
    label: 'Reportes',
    to: { name: 'reports' },
    roles: ['admin', 'manager'],
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>`,
  },
  {
    name: 'profile',
    label: 'Mi Perfil',
    to: { name: 'profile' },
    roles: ['superadmin', 'admin', 'manager', 'employee'],
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>`,
  },
];

const iconLogout = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
  fill="none" stroke="currentColor" stroke-width="2"
  stroke-linecap="round" stroke-linejoin="round">
  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
  <polyline points="16 17 21 12 16 7"/>
  <line x1="21" y1="12" x2="9" y2="12"/>
</svg>`;

async function cerrarSesion(): Promise<void> {
  closeSidebar();
  appStore.clearSession();
  await router.push({ name: 'login' });
}
</script>

<style scoped>
.main-layout {
  display: flex;
  min-height: 100vh;
  background: var(--color-bg-app);
}

/* Sidebar */

.sidebar {
  width: 280px;
  flex-shrink: 0;
  background: var(--color-structure-base);
  display: flex;
  flex-direction: column;
  padding: 0 0 24px;
  position: sticky;
  top: 0;
  height: 100vh;
}

.sidebar__brand {
  padding: 24px 20px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  margin-bottom: 12px;
  display: flex;
  justify-content: center;
}

.sidebar__logo {
  width: 180px;
  max-width: 100%;
  height: auto;
}

.sidebar__nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 10px;
  flex: 1;
  overflow-y: auto;
}

.sidebar__link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  transition: background 0.15s, color 0.15s;
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
  flex-shrink: 0;
}

.sidebar__logout {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 22px;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.45);
  font-size: 0.875rem;
  cursor: pointer;
  transition: color 0.15s;
  margin-top: auto;
}

.sidebar__logout:hover {
  color: rgba(255, 255, 255, 0.8);
}

/* Contenido principal */

.main-layout__content {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
}

/* Controles móviles ocultos en escritorio */

.mobile-menu-button {
  display: none;
}

.sidebar-overlay {
  display: none;
}

/* Responsive */

@media (max-width: 768px) {
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

    font-size: 24px;
    line-height: 1;

    cursor: pointer;
  }

  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 1200;

    width: 280px;
    max-width: 85vw;
    height: 100vh;

    transform: translateX(-100%);
    transition: transform 0.25s ease;

    box-shadow: 4px 0 16px rgba(0, 0, 0, 0.2);
  }

  .sidebar--open {
    transform: translateX(0);
  }

  .sidebar-overlay {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 1150;
    background: rgba(0, 0, 0, 0.45);
  }
}
</style>