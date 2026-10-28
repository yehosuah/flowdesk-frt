
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

import ForgotPasswordView from '@/features/auth/views/ForgotPasswordView.vue';
import es from '@/i18n/locales/es';
import en from '@/i18n/locales/en';

const mocks = vi.hoisted(() => ({
  query: {} as Record<string, string>,
  forgotPassword: vi.fn(),
  getApiErrorMessage: vi.fn(),
}));

vi.mock('vue-router', () => ({
  RouterLink: {
    props: ['to'],
    template: '<a><slot /></a>',
  },
  useRoute: () => ({
    query: mocks.query,
  }),
}));

vi.mock('@/features/auth/api', () => ({
  forgotPassword: mocks.forgotPassword,
}));

vi.mock('@/services/apiClient', () => ({
  getApiErrorMessage: mocks.getApiErrorMessage,
}));

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

  return mount(ForgotPasswordView, {
    global: {
      plugins: [testI18n],
    },
  });
}

describe('ForgotPasswordView - SCRUM-765', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.query = {};
    mocks.forgotPassword.mockResolvedValue(undefined);
    mocks.getApiErrorMessage.mockReturnValue('Error');
  });

  it('renderiza correctamente el formulario', () => {
    const wrapper = createWrapper();

    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find('#email').exists()).toBe(true);
    expect(wrapper.find("button[type='submit']").exists()).toBe(true);
    expect(wrapper.text()).toContain('Volver al login');

    wrapper.unmount();
  });

  it('muestra error cuando el correo está vacío', async () => {
    const wrapper = createWrapper();

    await wrapper.find('form').trigger('submit.prevent');
    await nextTick();

    expect(wrapper.text()).toContain(
      'El correo es obligatorio.',
    );

    expect(mocks.forgotPassword).not.toHaveBeenCalled();

    wrapper.unmount();
  });

  it('muestra error cuando el correo tiene un formato inválido', async () => {
    const wrapper = createWrapper();

    await wrapper.find('#email').setValue('correo');
    await wrapper.find('form').trigger('submit.prevent');
    await nextTick();

    expect(wrapper.text()).toContain(
      'Ingresa un correo válido.',
    );

    expect(mocks.forgotPassword).not.toHaveBeenCalled();

    wrapper.unmount();
  });

  it('permite enviar el formulario cuando el correo es válido', async () => {
    const wrapper = createWrapper();

    await wrapper.find('#email').setValue('usuario@correo.com');
    await wrapper.find('form').trigger('submit.prevent');
    await nextTick();

    expect(mocks.forgotPassword).toHaveBeenCalledWith(
      'usuario@correo.com',
    );

    expect(wrapper.text()).not.toContain(
      'El correo es obligatorio.',
    );

    expect(wrapper.text()).not.toContain(
      'Ingresa un correo válido.',
    );

    wrapper.unmount();
  });

  it('muestra volver al login cuando no existe ruta de retorno', () => {
    const wrapper = createWrapper();

    expect(wrapper.text()).toContain('Volver al login');
    expect(wrapper.text()).not.toContain('Volver a mi perfil');

    wrapper.unmount();
  });

  it('muestra volver a mi perfil cuando el retorno es profile', () => {
    mocks.query.redirect = '/profile';

    const wrapper = createWrapper();

    expect(wrapper.text()).toContain('Volver a mi perfil');
    expect(wrapper.text()).not.toContain('Volver al login');

    wrapper.unmount();
  });

  it('muestra el formulario en inglés', () => {
    const wrapper = createWrapper('en');

    expect(wrapper.text()).toContain('Recover Password');
    expect(wrapper.text()).toContain('Enter your email');
    expect(wrapper.text()).toContain('Recover');
    expect(wrapper.text()).toContain('Back to Login');

    expect(
      wrapper.find('#email').attributes('placeholder'),
    ).toBe('email@example.com');

    wrapper.unmount();
  });

  it('muestra validaciones en inglés', async () => {
    const wrapper = createWrapper('en');

    await wrapper.find('form').trigger('submit.prevent');
    await nextTick();

    expect(wrapper.text()).toContain('Email is required.');

    wrapper.unmount();
  });

  it('muestra confirmación después de enviar la solicitud', async () => {
    const wrapper = createWrapper();

    await wrapper.find('#email').setValue('usuario@correo.com');
    await wrapper.find('form').trigger('submit.prevent');
    await nextTick();

    expect(wrapper.text()).toContain(
      'Revisa tu correo para restablecer tu contraseña.',
    );

    expect(wrapper.find('form').exists()).toBe(false);

    wrapper.unmount();
  });

  it('muestra el error devuelto por el servicio', async () => {
    mocks.forgotPassword.mockRejectedValue(
      new Error('Error de conexión'),
    );

    mocks.getApiErrorMessage.mockReturnValue(
      'No fue posible enviar la solicitud',
    );

    const wrapper = createWrapper();

    await wrapper.find('#email').setValue('usuario@correo.com');
    await wrapper.find('form').trigger('submit.prevent');
    await nextTick();

    expect(wrapper.text()).toContain(
      'No fue posible enviar la solicitud',
    );

    expect(wrapper.find('form').exists()).toBe(true);

    wrapper.unmount();
  });
});
