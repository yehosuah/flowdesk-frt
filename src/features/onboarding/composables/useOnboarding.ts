import { ref, onMounted } from 'vue';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import '../styles/onboarding.css';

const ONBOARDING_KEY = 'flowdesk_has_seen_onboarding';

export interface UseOnboardingOptions {
  openSidebar?: () => void;
  closeSidebar?: () => void;
}

export function useOnboarding(options?: UseOnboardingOptions) {
  const isWelcomeVisible = ref(false);

  onMounted(() => {
    checkOnboardingStatus();
  });

  function checkOnboardingStatus() {
    const hasSeen = localStorage.getItem(ONBOARDING_KEY);
    if (!hasSeen) {
      isWelcomeVisible.value = true;
    }
  }

  function skipTour() {
    isWelcomeVisible.value = false;
    options?.closeSidebar?.();
    completeOnboarding();
  }

  function completeOnboarding() {
    localStorage.setItem(ONBOARDING_KEY, 'true');
  }

  function resetOnboarding() {
    localStorage.removeItem(ONBOARDING_KEY);
    isWelcomeVisible.value = true;
  }

  function startTour() {
    isWelcomeVisible.value = false;
    completeOnboarding();

    const isMobile = window.innerWidth <= 1000;

    const tourSteps = [
      {
        popover: {
          title: '¡Bienvenido a FlowDesk!',
          description: 'FlowDesk te permite organizar tu negocio de forma integral. Cada módulo del panel está diseñado con una estructura específica según su función: catálogos, transacciones, flujos de trabajo en equipo y analítica. ¡Veámoslos uno a uno!',
          side: 'bottom' as const,
          align: 'center' as const
        }
      },
      ...(isMobile
        ? [
            {
              element: '.mobile-menu-button',
              popover: {
                title: 'Menú de Navegación Móvil',
                description: 'En celulares o pantallas pequeñas, pulsa este botón para desplegar tu panel de módulos y herramientas.',
                side: 'bottom' as const,
                align: 'start' as const
              }
            }
          ]
        : []),
      {
        element: '[data-nav-item="inventory"]',
        popover: {
          title: 'Módulo: Inventario',
          description: 'Estructura de Catálogo y Almacén: Controla existencias en tiempo real, códigos de producto, precios de venta y avisos automáticos de stock mínimo.',
          side: isMobile ? 'bottom' as const : 'right' as const,
          align: 'start' as const
        }
      },
      {
        element: '[data-nav-item="inventorymovement"]',
        popover: {
          title: 'Módulo: Movimiento de Inventario',
          description: 'Estructura Transaccional: No es solo un listado; aquí registras entradas (compras a proveedores) y salidas (ventas a clientes) con cálculo de impuestos y subtotales.',
          side: isMobile ? 'bottom' as const : 'right' as const,
          align: 'start' as const
        }
      },
      {
        element: '[data-nav-item="tasks"]',
        popover: {
          title: 'Módulo: Gestión de Tareas',
          description: 'Estructura de Flujo de Trabajo: A diferencia de las tablas de productos, aquí organizas actividades del equipo, prioridades, estados de avance y responsables asignados.',
          side: isMobile ? 'bottom' as const : 'right' as const,
          align: 'start' as const
        }
      },
      {
        element: '[data-nav-item="tasks-calendar"]',
        popover: {
          title: 'Módulo: Calendario de Actividades',
          description: 'Estructura Temporal: Planifica y visualiza compromisos, entregas y eventos en una cuadrícula de calendario interactivo para evitar cuellos de botella.',
          side: isMobile ? 'bottom' as const : 'right' as const,
          align: 'start' as const
        }
      },
      {
        element: '[data-nav-item="analytics"]',
        popover: {
          title: 'Módulo: Análisis y Rendimiento',
          description: 'Estructura Gráfica y Ejecutiva: En lugar de tablas, cuentas con tableros interactivos con KPIs clave, ingresos, productos de mayor demanda y métricas de crecimiento.',
          side: isMobile ? 'bottom' as const : 'right' as const,
          align: 'start' as const
        }
      },
      {
        element: '[data-nav-item="clients"]',
        popover: {
          title: 'Módulo: Clientes',
          description: 'Directorio Comercial: Administra tu cartera de compradores, historial de compras, información de facturación (NIT/RFC) y datos de contacto.',
          side: isMobile ? 'bottom' as const : 'right' as const,
          align: 'start' as const
        }
      },
      {
        element: '[data-nav-item="suppliers"]',
        popover: {
          title: 'Módulo: Proveedores',
          description: 'Directorio de Abastecimiento: Registra tus distribuidores y aliados comerciales para gestionar fácilmente la reposición de mercancía en inventario.',
          side: isMobile ? 'bottom' as const : 'right' as const,
          align: 'start' as const
        }
      },
      {
        element: '[data-nav-item="reports"]',
        popover: {
          title: 'Módulo: Reportes Oficiales',
          description: 'Estructura Documental: Filtra por rangos de fechas y genera balances contables y reportes ejecutivos oficiales listos para imprimir o exportar.',
          side: isMobile ? 'bottom' as const : 'right' as const,
          align: 'start' as const
        }
      },
      {
        element: '[data-nav-item="profile"]',
        popover: {
          title: 'Módulo: Mi Perfil',
          description: 'Gestiona la información de tu cuenta, preferencias personales y credenciales de acceso.',
          side: isMobile ? 'bottom' as const : 'right' as const,
          align: 'start' as const
        }
      },
      {
        element: '[data-tour="restart-tutorial"]',
        popover: {
          title: 'Repetir Tutorial',
          description: '¿Deseas repasar este recorrido más adelante o capacitar a alguien de tu equipo? Puedes reactivarlo con un solo clic desde este botón en el menú.',
          side: isMobile ? 'bottom' as const : 'right' as const,
          align: 'start' as const
        }
      },
      {
        element: '.filtros-panel',
        popover: {
          title: 'Espacio de Trabajo: Panel de Filtros',
          description: 'En las vistas con tablas como Inventario, este panel te permite activar/desactivar columnas visibles y filtrar por Estado (Activo/Inactivo) o nivel de Stock.',
          side: isMobile ? 'bottom' as const : 'left' as const,
          align: 'start' as const
        }
      },
      {
        element: '.table-container',
        popover: {
          title: 'Espacio de Trabajo: Catálogo de Productos',
          description: 'Tu tabla principal de existencias en almacén con alertas visuales de colores para advertirte sobre productos con stock crítico.',
          side: isMobile ? 'top' as const : 'top' as const,
          align: 'center' as const
        }
      },
      {
        element: '.chat-widget-btn',
        popover: {
          title: 'Asistente IA Integrado 24/7',
          description: 'Siempre visible en la esquina inferior: Un chatbot inteligente preparado para resolver dudas sobre el sistema y asistirte en cualquier pantalla.',
          side: isMobile ? 'top' as const : 'left' as const,
          align: isMobile ? 'end' as const : 'end' as const
        }
      },
      {
        popover: {
          title: '¡Todo Listo para Empezar!',
          description: 'Ahora ya conoces la estructura de cada módulo de FlowDesk y cómo sacarles el máximo provecho. ¡Mucho éxito en la gestión de tu negocio!',
          side: 'bottom' as const,
          align: 'center' as const
        }
      }
    ];

    const driverObj = driver({
      showProgress: true,
      progressText: 'Paso {{current}} de {{total}}',
      nextBtnText: 'Siguiente',
      prevBtnText: 'Anterior',
      doneBtnText: '¡Comenzar!',
      allowClose: true,
      skipMissingElement: true,
      showButtons: ['next', 'previous', 'close'],
      steps: tourSteps,
      onHighlightStarted: (element, step, opts) => {
        if (!isMobile) return;

        const isSidebarElement = element?.closest?.('.sidebar') !== null;
        if (isSidebarElement) {
          options?.openSidebar?.();
          setTimeout(() => {
            opts.driver.refresh();
          }, 280);
        } else if (element?.matches?.('.filtros-panel, .table-container, .chat-widget-btn')) {
          options?.closeSidebar?.();
          setTimeout(() => {
            opts.driver.refresh();
          }, 280);
        }
      },
      onDestroyStarted: () => {
        if (isMobile) {
          options?.closeSidebar?.();
        }
      }
    });

    setTimeout(() => {
      driverObj.drive();
    }, 250);
  }

  return {
    isWelcomeVisible,
    skipTour,
    startTour,
    resetOnboarding
  };
}
