
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

  // ==========================================
  // PRUEBAS ORIGINALES
  // ==========================================

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

  // ==========================================
  // SCRUM-676: NUEVAS PRUEBAS DE TOAST DE ÉXITO
  // ==========================================

  it('SCRUM-676: muestra el mensaje y estilo de éxito correctamente', async () => {
    const wrapper = mount(ToastContainer, { attachTo: document.body });
    const { success } = useToast();

    success('Operación realizada correctamente.', 0);
    await wrapper.vm.$nextTick();

    const toast = document.querySelector('.toast--success');

    expect(toast).not.toBeNull();
    expect(toast?.textContent).toContain('Operación realizada correctamente.');
    expect(toast?.querySelector('.toast__message')).not.toBeNull();

    wrapper.unmount();
  });

  it('SCRUM-676: asigna identificadores únicos a los toasts de éxito', () => {
    const { success, toasts } = useToast();

    const firstId = success('Primera operación', 0);
    const secondId = success('Segunda operación', 0);

    expect(firstId).not.toBe(secondId);

    expect(
      toasts.filter((toast) => toast.variant === 'success'),
    ).toHaveLength(2);
  });

  it('SCRUM-676: mantiene visible el toast sin temporizador hasta cerrarlo', async () => {
    const wrapper = mount(ToastContainer, { attachTo: document.body });
    const { success, dismiss } = useToast();

    const id = success('Guardado correctamente.', 0);
    await wrapper.vm.$nextTick();

    expect(document.body.textContent).toContain('Guardado correctamente.');

    dismiss(id);
    await wrapper.vm.$nextTick();

    expect(document.body.textContent).not.toContain('Guardado correctamente.');

    wrapper.unmount();
  });
});
