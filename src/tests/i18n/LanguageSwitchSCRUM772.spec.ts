
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';

import { i18n } from '@/i18n';
import { useLocale } from '@/i18n/useLocale';

import LoginView from '@/features/auth/views/LoginView.vue';

const mocks = vi.hoisted(() => ({
  loginWithPassword: vi.fn(),
  routerPush: vi.fn(),
  setSession: vi.fn(),
  clearSession: vi.fn(),
  isValidRole: vi.fn(),
  resolveHomeByRole: vi.fn(),
  getApiErrorMessage: vi.fn(),
}));

vi.mock('vue-router', () => ({
  RouterLink: {
    props: ['to'],
    template: '<a><slot /></a>',
  },
  useRouter: () => ({
    push: mocks.routerPush,
  }),
  useRoute: () => ({
    query: {},
  }),
}));

vi.mock('@/features/auth/api', () => ({
  loginWithPassword: mocks.loginWithPassword,
}));

vi.mock('@/stores/app.store', () => ({
  appStore: {
    setSession: mocks.setSession,
    clearSession: mocks.clearSession,
    roleName: {
      value: 'admin',
    },
  },
}));

vi.mock('@/utils/roles', () => ({
  resolveHomeByRole: mocks.resolveHomeByRole,
  isValidRole: mocks.isValidRole,
}));

vi.mock('@/services/apiClient', () => ({
  getApiErrorMessage: mocks.getApiErrorMessage,
}));

function createLoginWrapper() {
  return mount(LoginView, {
    global: {
      plugins: [i18n],
    },
  });
}

describe('SCRUM-772: Pruebas de cambio de idioma', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useLocale().setLocale('es');
  });

  afterEach(() => {
    useLocale().setLocale('es');
    localStorage.removeItem('flowdesk.locale');
  });

  it('muestra el inicio de sesión en español', () => {
    const wrapper = createLoginWrapper();

    expect(wrapper.text()).toContain('Iniciar Sesión');
    expect(wrapper.text()).toContain('Registrar empresa');
    expect(wrapper.text()).toContain('¿Olvidaste tu contraseña?');

    wrapper.unmount();
  });

  it('cambia el formulario a inglés sin recargar', async () => {
    const wrapper = createLoginWrapper();

    useLocale().setLocale('en');
    await nextTick();

    expect(wrapper.text()).toContain('Log In');
    expect(wrapper.text()).toContain('Register Company');
    expect(wrapper.text()).toContain('Forgot your password?');

    wrapper.unmount();
  });

  it('regresa el formulario a español sin recargar', async () => {
    const wrapper = createLoginWrapper();

    useLocale().setLocale('en');
    await nextTick();

    useLocale().setLocale('es');
    await nextTick();

    expect(wrapper.text()).toContain('Iniciar Sesión');
    expect(wrapper.text()).toContain('Registrar empresa');

    wrapper.unmount();
  });

  it('actualiza las traducciones de navegación', async () => {
    const { setLocale } = useLocale();

    expect(i18n.global.t('navigation.inventory')).toBe('Inventario');

    setLocale('en');
    await nextTick();

    expect(i18n.global.t('navigation.inventory')).toBe('Inventory');
    expect(i18n.global.t('navigation.sales')).toBe('Sales');

    setLocale('es');
    await nextTick();

    expect(i18n.global.t('navigation.inventory')).toBe('Inventario');
    expect(i18n.global.t('navigation.sales')).toBe('Ventas');
  });

  it('sincroniza el idioma con localStorage', () => {
    const { setLocale } = useLocale();

    setLocale('en');

    expect(localStorage.getItem('flowdesk.locale')).toBe('en');
    expect(i18n.global.locale.value).toBe('en');

    setLocale('es');

    expect(localStorage.getItem('flowdesk.locale')).toBe('es');
    expect(i18n.global.locale.value).toBe('es');
  });

  it('mantiene las traducciones de autenticación sincronizadas', async () => {
    const { setLocale } = useLocale();

    setLocale('en');
    await nextTick();

    expect(i18n.global.t('auth.login')).toBe('Log in');
    expect(i18n.global.t('auth.password')).toBe('Password');

    setLocale('es');
    await nextTick();

    expect(i18n.global.t('auth.login')).toBe('Iniciar sesión');
    expect(i18n.global.t('auth.password')).toBe('Contraseña');
  });
});
