import { describe, it, expect, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';

import ToastContainer from '@/app/components/ToastContainer.vue';
import { useToast } from '@/composables/useToast';

// useToast es una cola compartida a nivel de módulo: se limpia a mano entre
// pruebas para no arrastrar toasts de un test a otro.
function clearAllToasts() {
  const { toasts, dismiss } = useToast();
  [...toasts].forEach((toast) => dismiss(toast.id));
}

describe('ToastContainer / useToast', () => {
  afterEach(() => {
    clearAllToasts();
  });

  it('muestra un toast de éxito', async () => {
    const wrapper = mount(ToastContainer, { attachTo: document.body });
    const { success } = useToast();

    success('Cliente creado correctamente.');
    await wrapper.vm.$nextTick();

    expect(document.body.textContent).toContain('Cliente creado correctamente.');
    expect(document.querySelector('.toast--success')).not.toBeNull();

    wrapper.unmount();
  });

  it('muestra un toast de error', async () => {
    const wrapper = mount(ToastContainer, { attachTo: document.body });
    const { error } = useToast();

    error('Ocurrió un error al descargar el reporte.');
    await wrapper.vm.$nextTick();

    expect(document.querySelector('.toast--error')).not.toBeNull();

    wrapper.unmount();
  });

  it('se puede cerrar manualmente con el botón de cerrar', async () => {
    const wrapper = mount(ToastContainer, { attachTo: document.body });
    const { info } = useToast();

    info('Nueva actualización disponible.');
    await wrapper.vm.$nextTick();
    expect(document.querySelectorAll('.toast').length).toBe(1);

    const closeBtn = document.querySelector<HTMLButtonElement>('.toast__close');
    closeBtn?.click();
    await wrapper.vm.$nextTick();

    expect(document.querySelectorAll('.toast').length).toBe(0);

    wrapper.unmount();
  });

  it('se autodescarta pasado el tiempo configurado', async () => {
    const wrapper = mount(ToastContainer, { attachTo: document.body });
    const { success } = useToast();

    success('Se va a desaparecer solo.', 10);
    await wrapper.vm.$nextTick();
    expect(document.querySelectorAll('.toast').length).toBe(1);

    await new Promise((resolve) => setTimeout(resolve, 30));
    await wrapper.vm.$nextTick();

    expect(document.querySelectorAll('.toast').length).toBe(0);

    wrapper.unmount();
  });

  it('apila varios toasts a la vez', async () => {
    const wrapper = mount(ToastContainer, { attachTo: document.body });
    const { success, error } = useToast();

    success('Primero');
    error('Segundo');
    await wrapper.vm.$nextTick();

    expect(document.querySelectorAll('.toast').length).toBe(2);

    wrapper.unmount();
  });
});
