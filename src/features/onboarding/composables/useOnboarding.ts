import { ref, onMounted } from 'vue';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import '../styles/onboarding.css';

const ONBOARDING_KEY = 'flowdesk_has_seen_onboarding';

export function useOnboarding() {
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

    // Selector helper para garantizar que el elemento existe antes de resaltarlo
    const resolveSelector = (selector: string): string | undefined => {
      return document.querySelector(selector) ? selector : undefined;
    };

    const navSelector = isMobile ? '.mobile-menu-button' : '.sidebar';
    const headerSelector = isMobile ? '.mobile-header' : '.desktop-header';

    const tourSteps = [
      {
        popover: {
          title: '¡Bienvenido a FlowDesk!',
          description: 'Descubre cómo gestionar tu inventario, clientes, ventas y tareas de forma sencilla y eficiente. ¡Hagamos un recorrido rápido!',
          side: 'bottom' as const,
          align: 'center' as const
        }
      },
      {
        element: resolveSelector(navSelector) || navSelector,
        popover: {
          title: isMobile ? 'Menú Principal' : 'Panel de Navegación',
          description: isMobile
            ? 'Pulsa este botón en cualquier momento para desplegar el menú y acceder a Inventario, Movimientos, Clientes, Reportes y Perfil.'
            : 'Tu barra de navegación lateral. Desde aquí tienes acceso directo a Inventario, Movimientos, Tareas, Calendario, Clientes, Reportes y Perfil.',
          side: isMobile ? 'bottom' as const : 'right' as const,
          align: 'start' as const
        }
      },
      {
        element: resolveSelector(headerSelector),
        popover: {
          title: 'Módulo Activo',
          description: 'Aquí visualizas en qué módulo estás trabajando y una breve descripción de sus funciones actuales.',
          side: 'bottom' as const,
          align: isMobile ? 'center' as const : 'start' as const
        }
      },
      {
        element: resolveSelector('.filtros-panel'),
        popover: {
          title: 'Filtros y Personalización',
          description: 'Elige qué columnas ver en la tabla (ID, precio, cantidad) y filtra rápidamente por Estado (Activo/Inactivo) o nivel de Stock (Normal, Stock bajo, Agotado).',
          side: isMobile ? 'bottom' as const : 'left' as const,
          align: 'start' as const
        }
      },
      {
        element: resolveSelector('.table-container'),
        popover: {
          title: 'Catálogo de Inventario',
          description: 'Aquí monitoreas las existencias de tus productos en tiempo real, precios unitarios y advertencias visuales automáticas cuando el stock esté bajo.',
          side: isMobile ? 'top' as const : 'top' as const,
          align: 'center' as const
        }
      },
      {
        element: resolveSelector('.chat-widget-btn'),
        popover: {
          title: 'Asistente Virtual IA',
          description: '¿Tienes alguna duda o necesitas ayuda? Nuestro Chatbot IA está integrado y listo para asistirte 24/7 con cualquier consulta.',
          side: isMobile ? 'top' as const : 'left' as const,
          align: isMobile ? 'end' as const : 'end' as const
        }
      },
      {
        popover: {
          title: '¡Todo Listo para Empezar!',
          description: 'Ya conoces las herramientas esenciales de FlowDesk. Recuerda que puedes repetir este tutorial en cualquier momento haciendo clic en "Ver Tutorial" desde el menú lateral.',
          side: 'bottom' as const,
          align: 'center' as const
        }
      }
    ].filter(step => !('element' in step) || Boolean(step.element));

    const tourConfig = {
      showProgress: true,
      progressText: 'Paso {{current}} de {{total}}',
      nextBtnText: 'Siguiente',
      prevBtnText: 'Anterior',
      doneBtnText: '¡Comenzar!',
      allowClose: true,
      showButtons: ['next', 'previous', 'close'],
      steps: tourSteps
    };

    const driverObj = driver(tourConfig);

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
