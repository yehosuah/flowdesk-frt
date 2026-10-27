
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
} from 'vitest';

import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { createI18n } from 'vue-i18n';

import LoginView from '@/features/auth/views/LoginView.vue';
import es from '@/i18n/locales/es';
import en from '@/i18n/locales/en';

const mocks = vi.hoisted(() => ({
  loginWithPassword: vi.fn(),
  routerPush: vi.fn(),
  setSession: vi.fn(),
  clearSession: vi.fn(),
  isValidRole: vi.fn(),
  resolveHomeByRole: vi.fn(),
  getApiErrorMessage: vi.fn(),
  routeQuery: {} as Record<string, string>,
}));

vi.mock('vue-router', () => ({
  RouterLink: {
    template: '<a><slot /></a>',
  },
  useRouter: () => ({
    push: mocks.routerPush,
  }),
  useRoute: () => ({
    query: mocks.routeQuery,
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

// Crear una instancia independiente de vue-i18n
// para cada prueba.
function createWrapper(locale: 'es' | 'en' = 'es') {
  const testI18n = createI18n({
    legacy: false,
    locale,
    fallbackLocale: 'es',
    messages: {
      es,
      en,
    },
  });

  return mount(LoginView, {
    global: {
      plugins: [testI18n],
    },
  });
}

describe('LoginView - SCRUM-765', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.isValidRole.mockReturnValue(true);
    mocks.resolveHomeByRole.mockReturnValue('/inventory');
    mocks.getApiErrorMessage.mockReturnValue('Error');
    mocks.routeQuery = {};
  });

  it('renderiza correctamente el formulario de login', () => {
    const wrapper = createWrapper();

    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find('#email').exists()).toBe(true);
    expect(wrapper.find('#password').exists()).toBe(true);

    const button = wrapper.find("button[type='submit']");

    expect(button.exists()).toBe(true);
    expect(button.text()).toContain('Iniciar Sesión');

    expect(wrapper.text()).toContain('Registrar empresa');
    expect(wrapper.text()).toContain('¿Olvidaste tu contraseña?');
    expect(wrapper.text()).toContain('Volver al inicio');

    expect(wrapper.find('.back-home-btn').exists()).toBe(true);

    wrapper.unmount();
  });

  it('muestra errores cuando el formulario está vacío', async () => {
    const wrapper = createWrapper();

    await wrapper.find('form').trigger('submit.prevent');
    await nextTick();

    expect(wrapper.text()).toContain(
      'El correo es obligatorio.',
    );

    expect(wrapper.text()).toContain(
      'La contraseña es obligatoria.',
    );

    wrapper.unmount();
  });

  it('muestra error cuando el correo no tiene un formato válido', async () => {
    const wrapper = createWrapper();

    await wrapper.find('#email').setValue('correoinvalido');
    await wrapper.find('#password').setValue('123456');

    await wrapper.find('form').trigger('submit.prevent');
    await nextTick();

    expect(wrapper.text()).toContain(
      'Ingresa un correo valido.',
    );

    wrapper.unmount();
  });

  it('muestra error cuando la contraseña tiene menos de 6 caracteres', async () => {
    const wrapper = createWrapper();

    await wrapper.find('#email').setValue('usuario@correo.com');
    await wrapper.find('#password').setValue('123');

    await wrapper.find('form').trigger('submit.prevent');
    await nextTick();

    expect(wrapper.text()).toContain(
      'La contraseña debe tener al menos 6 caracteres.',
    );

    wrapper.unmount();
  });

  it('muestra error cuando la contraseña supera los 20 caracteres', async () => {
    const wrapper = createWrapper();

    await wrapper.find('#email').setValue('usuario@correo.com');
    await wrapper.find('#password').setValue('123456789012345678901');

    await wrapper.find('form').trigger('submit.prevent');
    await nextTick();

    expect(wrapper.text()).toContain(
      'La contraseña no puede exceder 20 caracteres.',
    );

    wrapper.unmount();
  });

  it('permite mostrar y ocultar la contraseña', async () => {
    const wrapper = createWrapper();

    expect(
      wrapper.find('#password').attributes('type'),
    ).toBe('password');

    const toggleButton = wrapper.find('.input-password-toggle');

    await toggleButton.trigger('click');

    expect(
      wrapper.find('#password').attributes('type'),
    ).toBe('text');

    await toggleButton.trigger('click');

    expect(
      wrapper.find('#password').attributes('type'),
    ).toBe('password');

    wrapper.unmount();
  });

  it('inicia sesión correctamente y redirige según el rol', async () => {
    const tokenResponse = {
      access_token: 'token-prueba',
      token_type: 'bearer',
    };

    mocks.loginWithPassword.mockResolvedValue(tokenResponse);

    const wrapper = createWrapper();

    await wrapper.find('#email').setValue('USUARIO@CORREO.COM');
    await wrapper.find('#password').setValue('123456');

    await wrapper.find('form').trigger('submit.prevent');
    await nextTick();

    expect(mocks.loginWithPassword).toHaveBeenCalledWith({
      email: 'usuario@correo.com',
      password: '123456',
    });

    expect(mocks.setSession).toHaveBeenCalledWith(tokenResponse);
    expect(mocks.resolveHomeByRole).toHaveBeenCalledWith('admin');
    expect(mocks.routerPush).toHaveBeenCalledWith('/inventory');

    wrapper.unmount();
  });

  it('muestra el error cuando el inicio de sesión falla', async () => {
    mocks.loginWithPassword.mockRejectedValue(
      new Error('Credenciales incorrectas'),
    );

    mocks.getApiErrorMessage.mockReturnValue(
      'Credenciales incorrectas',
    );

    const wrapper = createWrapper();

    await wrapper.find('#email').setValue('usuario@correo.com');
    await wrapper.find('#password').setValue('123456');

    await wrapper.find('form').trigger('submit.prevent');
    await nextTick();

    expect(wrapper.text()).toContain('Credenciales incorrectas');
    expect(mocks.setSession).not.toHaveBeenCalled();
    expect(mocks.routerPush).not.toHaveBeenCalled();

    wrapper.unmount();
  });

  it('limpia la sesión cuando el usuario tiene un rol inválido', async () => {
    const tokenResponse = {
      access_token: 'token-prueba',
      token_type: 'bearer',
    };

    mocks.loginWithPassword.mockResolvedValue(tokenResponse);
    mocks.isValidRole.mockReturnValue(false);

    const wrapper = createWrapper();

    await wrapper.find('#email').setValue('usuario@correo.com');
    await wrapper.find('#password').setValue('123456');

    await wrapper.find('form').trigger('submit.prevent');
    await nextTick();

    expect(mocks.setSession).toHaveBeenCalledWith(tokenResponse);
    expect(mocks.clearSession).toHaveBeenCalled();
    expect(mocks.routerPush).not.toHaveBeenCalled();

    expect(wrapper.text()).toContain(
      'Tu cuenta no tiene un rol',
    );

    wrapper.unmount();
  });

  it('redirige a la ruta solicitada después del inicio de sesión', async () => {
    const tokenResponse = {
      access_token: 'token-prueba',
      token_type: 'bearer',
    };

    mocks.routeQuery.redirect = '/profile';
    mocks.loginWithPassword.mockResolvedValue(tokenResponse);

    const wrapper = createWrapper();

    await wrapper.find('#email').setValue('usuario@correo.com');
    await wrapper.find('#password').setValue('123456');

    await wrapper.find('form').trigger('submit.prevent');
    await nextTick();

    expect(mocks.routerPush).toHaveBeenCalledWith('/profile');

    wrapper.unmount();
  });

  // SCRUM-765: Verificar traducciones al inglés.
  it('muestra el formulario en inglés', () => {
    const wrapper = createWrapper('en');

    expect(wrapper.text()).toContain('Log In');
    expect(wrapper.text()).toContain('Register Company');
    expect(wrapper.text()).toContain('Forgot your password?');
    expect(wrapper.text()).toContain('Back to Home');

    expect(wrapper.find('#email').attributes('placeholder'))
      .toBe('email@example.com');

    expect(wrapper.find('#password').attributes('placeholder'))
      .toBe('Minimum 6 characters');

    wrapper.unmount();
  });
});
