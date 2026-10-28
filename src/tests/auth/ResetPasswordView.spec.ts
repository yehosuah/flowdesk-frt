
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { createI18n } from 'vue-i18n';

import ResetPasswordView from '@/features/auth/views/ResetPasswordView.vue';
import es from '@/i18n/locales/es';
import en from '@/i18n/locales/en';

const mocks = vi.hoisted(() => ({
  query: { token: 'token-prueba' } as Record<string, string>,
  routerPush: vi.fn(),
  resetPassword: vi.fn(),
  getApiErrorMessage: vi.fn(),
}));

vi.mock('vue-router', () => ({
  RouterLink: {
    template: '<a><slot /></a>',
  },
  useRoute: () => ({
    query: mocks.query,
  }),
  useRouter: () => ({
    push: mocks.routerPush,
  }),
}));

vi.mock('@/features/auth/api', () => ({
  resetPassword: mocks.resetPassword,
}));

vi.mock('@/services/apiClient', () => ({
  getApiErrorMessage: mocks.getApiErrorMessage,
}));

function createWrapper(locale: 'es' | 'en' = 'es') {
  const testI18n = createI18n({
    legacy: false,
    locale,
    fallbackLocale: 'es',
    messages: { es, en },
  });

  return mount(ResetPasswordView, {
    global: {
      plugins: [testI18n],
    },
  });
}

describe('ResetPasswordView - SCRUM-765', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.query = { token: 'token-prueba' };
    mocks.resetPassword.mockResolvedValue(undefined);
    mocks.getApiErrorMessage.mockReturnValue('Error');
  });

  it('renderiza correctamente el formulario', async () => {
    const wrapper = createWrapper();
    await nextTick();

    expect(wrapper.find('#password').exists()).toBe(true);
    expect(wrapper.find('#confirm-password').exists()).toBe(true);
    expect(wrapper.find("button[type='submit']").exists()).toBe(true);
    expect(wrapper.text()).toContain('Volver al login');

    wrapper.unmount();
  });

  it('muestra error cuando la contraseña está vacía', async () => {
    const wrapper = createWrapper();
    await nextTick();

    await wrapper.find('form').trigger('submit.prevent');

    expect(wrapper.text()).toContain('La contraseña es obligatoria.');
    wrapper.unmount();
  });

  it('muestra error cuando la contraseña tiene menos de 6 caracteres', async () => {
    const wrapper = createWrapper();
    await nextTick();

    await wrapper.find('#password').setValue('123');
    await wrapper.find('#confirm-password').setValue('123');
    await wrapper.find('form').trigger('submit.prevent');

    expect(wrapper.text()).toContain(
      'La contraseña debe tener al menos 6 caracteres.',
    );
    wrapper.unmount();
  });

  it('muestra error cuando la contraseña supera los 20 caracteres', async () => {
    const wrapper = createWrapper();
    await nextTick();

    await wrapper.find('#password').setValue('123456789012345678901');
    await wrapper.find('#confirm-password').setValue('123456789012345678901');
    await wrapper.find('form').trigger('submit.prevent');

    expect(wrapper.text()).toContain(
      'La contraseña no puede exceder 20 caracteres.',
    );
    wrapper.unmount();
  });

  it('muestra error cuando la confirmación está vacía', async () => {
    const wrapper = createWrapper();
    await nextTick();

    await wrapper.find('#password').setValue('123456');
    await wrapper.find('form').trigger('submit.prevent');

    expect(wrapper.text()).toContain('Debes confirmar la contraseña.');
    wrapper.unmount();
  });

  it('muestra error cuando las contraseñas no coinciden', async () => {
    const wrapper = createWrapper();
    await nextTick();

    await wrapper.find('#password').setValue('123456');
    await wrapper.find('#confirm-password').setValue('654321');
    await wrapper.find('form').trigger('submit.prevent');

    expect(wrapper.text()).toContain('Las contraseñas no coinciden.');
    wrapper.unmount();
  });

  it('permite mostrar y ocultar la contraseña', async () => {
    const wrapper = createWrapper();
    await nextTick();

    const buttons = wrapper.findAll('.input-password-toggle');

    expect(wrapper.find('#password').attributes('type')).toBe('password');

    await buttons[0].trigger('click');
    expect(wrapper.find('#password').attributes('type')).toBe('text');

    await buttons[0].trigger('click');
    expect(wrapper.find('#password').attributes('type')).toBe('password');

    wrapper.unmount();
  });

  it('permite mostrar y ocultar la confirmación', async () => {
    const wrapper = createWrapper();
    await nextTick();

    const buttons = wrapper.findAll('.input-password-toggle');

    expect(wrapper.find('#confirm-password').attributes('type')).toBe('password');

    await buttons[1].trigger('click');
    expect(wrapper.find('#confirm-password').attributes('type')).toBe('text');

    await buttons[1].trigger('click');
    expect(wrapper.find('#confirm-password').attributes('type')).toBe('password');

    wrapper.unmount();
  });

  it('muestra el formulario en inglés', async () => {
    const wrapper = createWrapper('en');
    await nextTick();

    expect(wrapper.text()).toContain('Reset Password');
    expect(wrapper.text()).toContain('Enter password');
    expect(wrapper.text()).toContain('Change password');
    expect(wrapper.text()).toContain('Back to Login');

    wrapper.unmount();
  });

  it('muestra errores de validación en inglés', async () => {
    const wrapper = createWrapper('en');
    await nextTick();

    await wrapper.find('form').trigger('submit.prevent');

    expect(wrapper.text()).toContain('Password is required.');
    expect(wrapper.text()).toContain('Please confirm your password.');

    wrapper.unmount();
  });

  it('muestra error cuando el enlace no tiene token', async () => {
    mocks.query = {};

    const wrapper = createWrapper();
    await nextTick();

    expect(wrapper.text()).toContain(
      'El enlace es inválido o ha expirado.',
    );
    expect(wrapper.find('form').exists()).toBe(false);

    wrapper.unmount();
  });

  it('envía la nueva contraseña al servicio', async () => {
    const wrapper = createWrapper();
    await nextTick();

    await wrapper.find('#password').setValue('123456');
    await wrapper.find('#confirm-password').setValue('123456');
    await wrapper.find('form').trigger('submit.prevent');
    await nextTick();

    expect(mocks.resetPassword).toHaveBeenCalledWith(
      'token-prueba',
      '123456',
    );

    expect(wrapper.text()).toContain(
      'Contraseña establecida. Redirigiendo...',
    );

    wrapper.unmount();
  });
});
