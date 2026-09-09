import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";

import ForgotPasswordView from "@/features/auth/views/ForgotPasswordView.vue";

const mockQuery: Record<string, string> = {};

vi.mock("vue-router", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
  useRoute: vi.fn(() => ({ query: {} })),
  RouterLink: {
    props: ["to"],
    template: "<a><slot /></a>",
  },
  useRoute: () => ({
    query: mockQuery,
  }),
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
  beforeEach(() => {
    delete mockQuery.email;
    delete mockQuery.redirect;
  });

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

  it("muestra volver al login cuando no existe ruta de retorno", () => {
    const wrapper = createWrapper();

    expect(wrapper.text()).toContain("Volver al login");
    expect(wrapper.text()).not.toContain("Volver a mi perfil");
  });

  it("muestra volver a mi perfil cuando el retorno es profile", () => {
    mockQuery.redirect = "/profile";

    const wrapper = createWrapper();

    expect(wrapper.text()).toContain("Volver a mi perfil");
    expect(wrapper.text()).not.toContain("Volver al login");
  });
});