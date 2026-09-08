import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';

import AuthLayout from '@/app/layouts/AuthLayout.vue';
import MainLayout from '@/app/layouts/MainLayout.vue';
import LoginView from '@/features/auth/views/LoginView.vue';
import ForgotPasswordView from '@/features/auth/views/ForgotPasswordView.vue';
import RegisterCompanyView from '@/features/auth/views/RegisterCompanyView.vue';
import TaskView from '@/features/tasks/views/TaskView.vue';
import SuperAdminView from '@/features/roles/views/SuperAdminView.vue';
import { appStore } from '@/stores/app.store';
import { resolveHomeByRole } from '@/utils/roles';
import InventoryMovementView from '@/features/inventorymovement/views/InventoryMovementView.vue';
import SetPasswordView from '@/features/auth/views/SetPasswordView.vue';
import WelcomeView from '@/features/auth/views/WelcomeView.vue';
import ResetPasswordView from '@/features/auth/views/ResetPasswordView.vue';
import AnalyticsView from '@/features/analytics/views/AnalyticsView.vue';
import EmployeesView from '@/features/employees/views/EmployeeView.vue';
import SuppliersView from '@/features/suppliers/views/SuppliersView.vue';
import LandingPageView from '@/features/landingPage/LandingPageView.vue';
import TaskCalendarView from '@/features/tasks/views/TaskCalendarView.vue';
import InventoryView from '@/features/inventory/views/InventoryView.vue';
import ClientView from '@/features/clients/views/ClientView.vue';
import ProfileView from '@/features/profile/views/ProfileView.vue';
import ReportsView from '@/features/reports/views/ReportsView.vue';

declare module 'vue-router' {
  interface RouteMeta {
    guestOnly?: boolean;
    requiresAuth?: boolean;
    requiresRole?: string[];
    title?: string;
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'landing',
    component: LandingPageView,
    meta: {
      guestOnly: true,
      title: 'FlowDesk',
    },
  },
  {
    path: '/',
    component: AuthLayout,
    meta: {
      guestOnly: true,
    },
    children: [
      {
        path: 'login',
        name: 'login',
        component: LoginView,
        meta: {
          title: 'Iniciar Sesion',
        },
      },
      {
        path: 'register',
        name: 'register',
        component: RegisterCompanyView,
        meta: {
          title: 'Registrar Empresa',
        },
      },
      {
        path: 'forgot-password',
        name: 'forgot-password',
        component: ForgotPasswordView,
        meta: {
          // Accesible también con sesión iniciada: el perfil enlaza aquí para cambiar la contraseña.
          guestOnly: false,
          title: 'Olvide Contraseña',
        },
      },
      {
        path: 'reset-password',
        name: 'reset-password',
        component: ResetPasswordView,
        meta: {
          // El enlace del correo debe completarse aunque el usuario siga con sesión iniciada.
          guestOnly: false,
          title: 'Recuperar Contraseña',
        },
      },
      {
        path: 'set-password',
        name: 'set-password',
        component: SetPasswordView,
        meta: {
          title: 'Establecer Contraseña',
        },
      },
      {
        path: 'welcome',
        name: 'welcome',
        component: WelcomeView,
        meta: {
          title: 'Bienvenido',
        },
      },
    ],
  },
  {
    path: '/',
    name: 'MainLayout',
    component: MainLayout,
    meta: {
      requiresAuth: true,
    },
    children: [
      {
        path: "inventory",
        name: "inventory",
        component: InventoryView,
        meta: {
          requiresAuth: true,
          requiresRole: ['admin', 'manager', 'employee'],
          title: "Inventario",
        },
      },
      {
        path: "inventorymovement",
        name: "inventorymovement",
        component: InventoryMovementView,
        meta: {
          requiresAuth: true, 
          requiresRole: ['admin', 'manager', 'employee'],
          title: "Movimiento de Inventario",
        }
      },
      {
        path: "tasks",
        name: "tasks",
        component: TaskView,
        meta: {
          requiresAuth: true,
          requiresRole: ['admin', 'manager', 'employee'],
          title: "Gestión de tareas",
        },
      },
      {
        path: 'tasks/calendar',
        name: 'tasks-calendar',
        component: TaskCalendarView,
        meta: {
          requiresAuth: true,
          requiresRole: ['admin', 'manager', 'employee'],
          title: 'Calendario de tareas',
        },
      },
      {
        path: '/superAdmin',
        name: 'superAdmin',
        component: SuperAdminView,
        meta: {
          requiresAuth: true, 
          requiresRole: ['superadmin'],
          title: 'SuperAdmin',
        },
      },
      {
        path: 'analytics',
        name: 'analytics',
        component: AnalyticsView,
        meta: {
          requiresAuth: true,
          requiresRole: ['admin', 'manager'],
          title: 'Análisis',
        },
      },
      {
        path: 'employees',
        name: 'employees',
        component: EmployeesView,
        meta: {
          requiresAuth: true,
          requiresRole: ['admin', 'manager'],
          title: 'Empleados',
        },
      },
      {
        path: 'suppliers',
        name: 'suppliers',
        component: SuppliersView,
        meta: {
          requiresAuth: true,
          requiresRole: ['admin', 'manager', 'employee'],
          title: 'Proveedores',
        },
      },
      {
        path: 'clients',
        name: 'clients',
        component: ClientView,
        meta: {
          requiresAuth: true,
          requiresRole: ['admin', 'manager', 'employee'],
          title: 'Clientes',
        },
      },
      {
        path: 'profile',
        name: 'profile',
        component: ProfileView,
        meta: {
          requiresAuth: true,
          requiresRole: ['superadmin', 'admin', 'manager', 'employee'],
          title: 'Mi Perfil',
        },
      },
      {
        path: 'reports',
        name: 'reports',
        component: ReportsView,
        meta: {
          requiresAuth: true,
          requiresRole: ['admin', 'manager'],
          title: 'Reportes',
        },
      },
      //Se agregan nuevas features al menú principal aquí, como movimiento, análisis, clientes, etc.
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: { name: 'login' },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: { name: 'login' },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

//comprobación que se tenga el rol correcto 
function hasRequiredRole(userRole: string | null, requiredRoles: string[]): boolean {
  if (!userRole) return false;
  return requiredRoles.includes(userRole);
}


router.beforeEach((to) => {
  const isAuthenticated = appStore.isAuthenticated.value;
  const role = appStore.roleName.value;

  if (to.meta.requiresAuth && !isAuthenticated) {
    return {
      name: 'login',
      query: typeof to.fullPath === 'string' && to.fullPath !== '/login'
        ? { redirect: to.fullPath }
        : {},
    };
  }

  if (to.meta.guestOnly && isAuthenticated) {
    return resolveHomeByRole(role);
  }

  if (to.meta.requiresRole && !hasRequiredRole(role, to.meta.requiresRole)){
    return resolveHomeByRole(role);
  }

  return true;
});

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} | FlowDesk` : 'FlowDesk';
});

export default router;
