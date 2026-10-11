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
    // En móvil: cerrar el menú lateral para mostrar la pantalla y opciones principales
    options?.closeSidebar?.();
    completeOnboarding();

    const isMobile = window.innerWidth <= 1000;
    const navSelector = isMobile ? '.mobile-menu-button' : '.sidebar';
    const headerSelector = isMobile ? '.mobile-header' : '.desktop-header';
    const restartSelector = isMobile ? '.mobile-menu-button' : '[data-tour="restart-tutorial"]';

    const tourSteps = [
      {
        popover: {
          title: '¡Bienvenido a tu Espacio de Trabajo!',
          description: 'Vamos a guiarte sección por sección a través de las herramientas principales de FlowDesk para que conozcas la estructura de cada área.',
          side: 'bottom' as const,
          align: 'center' as const
        }
      },
      {
        element: navSelector,
        popover: {
          title: isMobile ? 'Sección 1: Menú Principal' : 'Sección 1: Panel Lateral de Módulos',
          description: isMobile
            ? 'Desde este botón despliegas tu menú de módulos cuando necesites cambiar de área: Inventario, Movimientos de almacén, Tareas del equipo, Calendario, Análisis y Clientes.'
            : 'Tu barra de navegación central: desde aquí accedes a Inventario, Movimientos con cálculo de impuestos, Tareas y flujos de trabajo, Calendario, Análisis con KPIs y Directorio de Clientes.',
          side: isMobile ? 'bottom' as const : 'right' as const,
          align: 'start' as const
        }
      },
      {
        element: headerSelector,
        popover: {
          title: 'Sección 2: Módulo Activo',
          description: 'En la parte superior siempre tendrás la referencia del módulo en el que estás posicionado y su propósito operativo (en este momento, tu vista de Inventario).',
          side: 'bottom' as const,
          align: isMobile ? 'center' as const : 'start' as const
        }
      },
      {
        element: '.filtros-panel',
        popover: {
          title: 'Sección 3: Panel de Filtros',
          description: 'Esta sección te permite personalizar las columnas que deseas ver (ID, precio, existencias) y filtrar por Estado (Activo/Inactivo) o condición de Stock (Normal, Bajo o Agotado).',
          side: isMobile ? 'bottom' as const : 'left' as const,
          align: 'start' as const
        }
      },
      {
        element: '.table-container',
        popover: {
          title: 'Sección 4: Catálogo y Existencias',
          description: 'Tu área de trabajo central: consulta tus productos registrados con existencias en tiempo real y alertas visuales automáticas para artículos con stock crítico.',
          side: isMobile ? 'top' as const : 'top' as const,
          align: 'center' as const
        }
      },
      {
        element: '.chat-widget-btn',
        popover: {
          title: 'Sección 5: Asistente IA 24/7',
          description: 'Siempre visible en la esquina inferior: un asistente con inteligencia artificial preparado para resolver dudas y ayudarte a operar en cualquier pantalla.',
          side: isMobile ? 'top' as const : 'left' as const,
          align: isMobile ? 'end' as const : 'end' as const
        }
      },
      {
        element: restartSelector,
        popover: {
          title: 'Sección 6: Repetir Tutorial',
          description: isMobile
            ? 'Si en cualquier momento deseas repasar estas secciones o capacitar a alguien de tu equipo, abre el menú y selecciona "Ver Tutorial" en la parte inferior.'
            : 'Siempre podrás reactivar este recorrido guiado pulsando la opción "Ver Tutorial" en la barra lateral.',
          side: isMobile ? 'bottom' as const : 'right' as const,
          align: 'start' as const
        }
      },
      {
        popover: {
          title: '¡Todo Listo para Comenzar!',
          description: 'Has completado el recorrido guiado por todas las secciones clave de FlowDesk. ¡Mucho éxito administrando tu negocio!',
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
      onDestroyStarted: () => {
        if (isMobile) {
          options?.closeSidebar?.();
        }
      }
    });

    setTimeout(() => {
      driverObj.drive();
    }, 300);
  }

  return {
    isWelcomeVisible,
    skipTour,
    startTour,
    resetOnboarding
  };
}
