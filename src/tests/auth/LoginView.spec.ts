import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import LoginView from "@/features/auth/views/LoginView.vue";

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

// Mock
vi.mock("vue-router", () => ({
  RouterLink: {
    template: "<a><slot /></a>",
  },
  useRouter: () => ({
    push: mocks.routerPush,
  }),
  useRoute: () => ({
    query: mocks.routeQuery,
  }),
}));

vi.mock("@/features/auth/api", () => ({
  loginWithPassword: mocks.loginWithPassword,
}));

vi.mock("@/stores/app.store", () => ({
  appStore: {
    setSession: mocks.setSession,
    clearSession: mocks.clearSession,
    roleName: {
      value: "admin",
    },
  },
}));

vi.mock("@/utils/roles", () => ({
  resolveHomeByRole: mocks.resolveHomeByRole,
  isValidRole: mocks.isValidRole,
}));

vi.mock("@/services/apiClient", () => ({
  getApiErrorMessage: mocks.getApiErrorMessage,
}));


describe("LoginView", () => {

  beforeEach(() => {
    vi.clearAllMocks();

    mocks.isValidRole.mockReturnValue(true);
    mocks.resolveHomeByRole.mockReturnValue("/inventory");
    mocks.getApiErrorMessage.mockReturnValue("Error");
    mocks.routeQuery = {};
  });

  it("renderiza correctamente el formulario de login", () => {
    const wrapper = mount(LoginView);

    expect(wrapper.exists()).toBe(true);

    expect(wrapper.find("#email").exists()).toBe(true);
    expect(wrapper.find("#password").exists()).toBe(true);

    const button = wrapper.find("button[type='submit']");
    expect(button.exists()).toBe(true);
    expect(button.text()).toContain("Iniciar Sesión");

    expect(wrapper.text()).toContain("Registrar empresa");
    expect(wrapper.text()).toContain("¿Olvidaste tu contraseña?");
  });

  it("muestra errores cuando el formulario está vacío", async () => {
    const wrapper = mount(LoginView);

    await wrapper.find("form").trigger("submit.prevent");
    await nextTick();

    expect(wrapper.text()).toContain("El correo es obligatorio.");
    expect(wrapper.text()).toContain("La contraseña es obligatoria.");
  });

  it("muestra error cuando el correo no tiene un formato válido", async () => {
    const wrapper = mount(LoginView);

    await wrapper.find("#email").setValue("correoinvalido");
    await wrapper.find("#password").setValue("123456");

    await wrapper.find("form").trigger("submit.prevent");
    await nextTick();

    expect(wrapper.text()).toContain("Ingresa un correo valido.");
  });

  it("muestra error cuando la contraseña tiene menos de 6 caracteres", async () => {
    const wrapper = mount(LoginView);

    await wrapper.find("#email").setValue("usuario@correo.com");
    await wrapper.find("#password").setValue("123");

    await wrapper.find("form").trigger("submit.prevent");
    await nextTick();

    expect(wrapper.text()).toContain(
        "La contraseña debe tener al menos 6 caracteres."
    );
  });

  it("muestra error cuando la contraseña supera los 20 caracteres", async () => {
    const wrapper = mount(LoginView);

    await wrapper.find("#email").setValue("usuario@correo.com");
    await wrapper.find("#password").setValue("123456789012345678901");

    await wrapper.find("form").trigger("submit.prevent");
    await nextTick();

    expect(wrapper.text()).toContain(
        "La contraseña no puede exceder 20 caracteres."
    );
  });

  it("permite mostrar y ocultar la contraseña", async () => {
    const wrapper = mount(LoginView);

    const passwordInput = wrapper.find("#password");

    // Inicialmente debe ser password
    expect(passwordInput.attributes("type")).toBe("password");

    // Botón para mostrar contraseña
    const toggleButton = wrapper.find(".input-password-toggle");

    await toggleButton.trigger("click");

    // Ahora debe ser text
    expect(wrapper.find("#password").attributes("type")).toBe("text");

    // Segundo click

    await toggleButton.trigger("click");

    expect(wrapper.find("#password").attributes("type")).toBe("password");
  });

  it("inicia sesión correctamente y redirige según el rol", async () => {
    const tokenResponse = {
      access_token: "token-prueba",
      token_type: "bearer",
    };

    mocks.loginWithPassword.mockResolvedValue(tokenResponse);

    const wrapper = mount(LoginView);

    await wrapper.find("#email").setValue("USUARIO@CORREO.COM");
    await wrapper.find("#password").setValue("123456");

    await wrapper.find("form").trigger("submit.prevent");
    await nextTick();

    expect(mocks.loginWithPassword).toHaveBeenCalledWith({
      email: "usuario@correo.com",
      password: "123456",
    });

    expect(mocks.setSession).toHaveBeenCalledWith(tokenResponse);
    expect(mocks.resolveHomeByRole).toHaveBeenCalledWith("admin");
    expect(mocks.routerPush).toHaveBeenCalledWith("/inventory");
  });

  it("muestra el error cuando el inicio de sesión falla", async () => {
    mocks.loginWithPassword.mockRejectedValue(new Error("Credenciales incorrectas"));
    mocks.getApiErrorMessage.mockReturnValue("Credenciales incorrectas");

    const wrapper = mount(LoginView);

    await wrapper.find("#email").setValue("usuario@correo.com");
    await wrapper.find("#password").setValue("123456");

    await wrapper.find("form").trigger("submit.prevent");
    await nextTick();

    expect(wrapper.text()).toContain("Credenciales incorrectas");
    expect(mocks.setSession).not.toHaveBeenCalled();
    expect(mocks.routerPush).not.toHaveBeenCalled();
  });

  it("limpia la sesión cuando el usuario tiene un rol inválido", async () => {
    const tokenResponse = {
      access_token: "token-prueba",
      token_type: "bearer",
    };

    mocks.loginWithPassword.mockResolvedValue(tokenResponse);
    mocks.isValidRole.mockReturnValue(false);

    const wrapper = mount(LoginView);

    await wrapper.find("#email").setValue("usuario@correo.com");
    await wrapper.find("#password").setValue("123456");

    await wrapper.find("form").trigger("submit.prevent");
    await nextTick();

    expect(mocks.setSession).toHaveBeenCalledWith(tokenResponse);
    expect(mocks.clearSession).toHaveBeenCalled();
    expect(mocks.routerPush).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain("Tu cuenta no tiene un rol");
  });

  it("redirige a la ruta solicitada después del inicio de sesión", async () => {
    const tokenResponse = {
      access_token: "token-prueba",
      token_type: "bearer",
    };

    mocks.routeQuery.redirect = "/profile";
    mocks.loginWithPassword.mockResolvedValue(tokenResponse);

    const wrapper = mount(LoginView);

    await wrapper.find("#email").setValue("usuario@correo.com");
    await wrapper.find("#password").setValue("123456");

    await wrapper.find("form").trigger("submit.prevent");
    await nextTick();

    expect(mocks.routerPush).toHaveBeenCalledWith("/profile");
  });

});