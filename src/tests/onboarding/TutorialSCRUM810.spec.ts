
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import {
  defineComponent,
  nextTick,
} from 'vue';

import { mount } from '@vue/test-utils';

import {
  useOnboarding,
  type UseOnboardingOptions,
} from '@/features/onboarding/composables/useOnboarding';

import { routerKey } from 'vue-router';
import type { Router } from 'vue-router';

const mocks = vi.hoisted(() => ({
  drive: vi.fn(),
  driver: vi.fn(),
}));

vi.mock('driver.js', () => ({
  driver: mocks.driver,
}));

const STORAGE_KEY = 'flowdesk_has_seen_onboarding';

function createWrapper(
  options?: UseOnboardingOptions,
) {
  const TestComponent = defineComponent({
    setup() {
      return useOnboarding(options);
    },

    template: '<div>Prueba de onboarding</div>',
  });

  const routerMock = {
    currentRoute: {
      value: {
        name: 'inventory',
      },
    },
    push: vi.fn(),
  } as unknown as Router;

  return mount(TestComponent, {
    global: {
      provide: {
        [routerKey as symbol]: routerMock,
      },
    },
  });
}

describe('SCRUM-810: Tutorial de bienvenida', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    vi.clearAllMocks();

    mocks.driver.mockReturnValue({
      drive: mocks.drive,
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    localStorage.clear();
  });

  it('muestra la bienvenida al ingresar por primera vez', () => {
    const wrapper = createWrapper();

    expect(
      wrapper.vm.isWelcomeVisible,
    ).toBe(true);

    wrapper.unmount();
  });

  it('no muestra la bienvenida cuando ya fue completada', () => {
    localStorage.setItem(STORAGE_KEY, 'true');

    const wrapper = createWrapper();

    expect(
      wrapper.vm.isWelcomeVisible,
    ).toBe(false);

    wrapper.unmount();
  });

  it('guarda la preferencia al omitir el tutorial', () => {
    const wrapper = createWrapper();

    wrapper.vm.skipTour();

    expect(
      wrapper.vm.isWelcomeVisible,
    ).toBe(false);

    expect(
      localStorage.getItem(STORAGE_KEY),
    ).toBe('true');

    wrapper.unmount();
  });

  it('permite reiniciar el tutorial', () => {
    localStorage.setItem(STORAGE_KEY, 'true');

    const wrapper = createWrapper();

    wrapper.vm.resetOnboarding();

    expect(
      wrapper.vm.isWelcomeVisible,
    ).toBe(true);

    expect(
      localStorage.getItem(STORAGE_KEY),
    ).toBeNull();

    wrapper.unmount();
  });

  it('cierra el menú lateral al omitir el tutorial', () => {
    const closeSidebar = vi.fn();

    const wrapper = createWrapper({
      closeSidebar,
    });

    wrapper.vm.skipTour();

    expect(closeSidebar).toHaveBeenCalledTimes(1);

    wrapper.unmount();
  });

  it('navega al inventario antes de iniciar el recorrido', async () => {
    const navigateToInventory = vi.fn()
      .mockResolvedValue(undefined);

    const wrapper = createWrapper({
      navigateToInventory,
    });

    await wrapper.vm.startTour();

    expect(
      navigateToInventory,
    ).toHaveBeenCalledTimes(1);

    expect(
      localStorage.getItem(STORAGE_KEY),
    ).toBe('true');

    wrapper.unmount();
  });

  it('configura los pasos del recorrido guiado', async () => {
    const wrapper = createWrapper({
      navigateToInventory: vi.fn(),
    });

    await wrapper.vm.startTour();

    expect(mocks.driver).toHaveBeenCalledTimes(1);

    const config = mocks.driver.mock.calls[0][0];

    expect(config.showProgress).toBe(true);
    expect(config.steps).toHaveLength(10);

    expect(config.nextBtnText).toBe('Siguiente');
    expect(config.prevBtnText).toBe('Anterior');

    wrapper.unmount();
  });

  it('inicia el recorrido después de preparar la navegación', async () => {
    const wrapper = createWrapper({
      navigateToInventory: vi.fn(),
    });

    await wrapper.vm.startTour();
    await nextTick();

    expect(mocks.drive).not.toHaveBeenCalled();

    vi.advanceTimersByTime(350);

    expect(mocks.drive).toHaveBeenCalledTimes(1);

    wrapper.unmount();
  });
});
