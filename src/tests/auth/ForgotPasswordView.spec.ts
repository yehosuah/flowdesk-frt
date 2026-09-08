import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";

import ForgotPasswordView from "@/features/auth/views/ForgotPasswordView.vue";

vi.mock("vue-router", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
  useRoute: vi.fn(() => ({ query: {} })),
  RouterLink: {
    template: "<a><slot /></a>",
  },
}));

vi.mock("@/features/auth/api", () => ({
  forgotPassword: vi.fn(),
}));

vi.mock("@/services/apiClient", () => ({
  getApiErrorMessage: vi.fn(() => "Error"),
}));

function createWrapper() {
  return mount(ForgotPasswordView);
}

describe("ForgotPasswordView", () => {
  it("renderiza correctamente el formulario", () => {
    const wrapper = createWrapper();

    expect(wrapper.exists()).toBe(true);

    expect(wrapper.find("#email").exists()).toBe(true);

    expect(wrapper.find("button[type='submit']").exists()).toBe(true);

    expect(wrapper.text()).toContain("Volver al login");
  });

  it("muestra error cuando el correo está vacío", async () => {
    const wrapper = createWrapper();

    await wrapper.find("form").trigger("submit.prevent");
    await nextTick();

    expect(wrapper.text()).toContain("El correo es obligatorio.");
  });

  it("muestra error cuando el correo tiene un formato inválido", async () => {
    const wrapper = createWrapper();

    await wrapper.find("#email").setValue("correo");

    await wrapper.find("form").trigger("submit.prevent");
    await nextTick();

    expect(wrapper.text()).toContain("Ingresa un correo válido.");
  });

  it("permite enviar el formulario cuando el correo es válido", async () => {
    const wrapper = createWrapper();

    await wrapper.find("#email").setValue("usuario@correo.com");

    await wrapper.find("form").trigger("submit.prevent");
    await nextTick();

    expect(wrapper.text()).not.toContain("El correo es obligatorio.");
    expect(wrapper.text()).not.toContain("Ingresa un correo válido.");
  });
});