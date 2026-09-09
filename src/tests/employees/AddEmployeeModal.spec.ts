import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";

import AddEmployeeModal from "@/features/employees/components/AddEmployeeModal.vue";

vi.mock("@/features/employees/api", () => ({
  fetchRoles: vi.fn(() =>
    Promise.resolve([
      { id: 1, name: "admin", description: null },
      { id: 2, name: "employee", description: null },
    ])
  ),
  createEmployee: vi.fn(),
}));

vi.mock("@/services/apiClient", () => ({
  getApiErrorMessage: vi.fn(() => "Error"),
}));

function createWrapper() {
  return mount(AddEmployeeModal, {
    global: {
      stubs: {
        teleport: true,
      },
    },
  });
}

describe("AddEmployeeModal", () => {

  it("renderiza correctamente el modal", async () => {
    const wrapper = createWrapper();
    await nextTick();
    await Promise.resolve();
    await nextTick();

    expect(wrapper.exists()).toBe(true);

    expect(wrapper.text()).toContain("Agregar Empleado");
    expect(wrapper.text()).toContain("Cancelar");
    expect(wrapper.text()).toContain("Agregar empleado");
  });

  it("muestra error cuando el nombre de usuario está vacío", async () => {
    const wrapper = createWrapper();

    await wrapper.find("form").trigger("submit.prevent");
    await nextTick();

    expect(wrapper.text()).toContain(
      "El nombre de usuario es obligatorio."
    );
  });

  it("muestra error cuando el correo está vacío", async () => {
    const wrapper = createWrapper();

    await wrapper.find("input[type='text']").setValue("juan");

    await wrapper.find("form").trigger("submit.prevent");
    await nextTick();

    expect(wrapper.text()).toContain(
      "El correo es obligatorio."
    );
  });

  it("muestra error cuando el correo tiene un formato inválido", async () => {
    const wrapper = createWrapper();

    const inputs = wrapper.findAll("input");

    await inputs[0].setValue("juan");
    await inputs[1].setValue("correo");

    await wrapper.find("form").trigger("submit.prevent");
    await nextTick();

    expect(wrapper.text()).toContain(
      "Ingresa un correo válido."
    );
  });

  it("muestra error cuando no se selecciona un rol", async () => {
    const wrapper = createWrapper();

    const inputs = wrapper.findAll("input");

    await inputs[0].setValue("juan");
    await inputs[1].setValue("juan@empresa.com");

    await wrapper.find("form").trigger("submit.prevent");
    await nextTick();

    expect(wrapper.text()).toContain(
      "Selecciona un rol."
    );
  });

  it("muestra el botón cancelar", () => {
    const wrapper = createWrapper();

    expect(wrapper.text()).toContain("Cancelar");
  });

  it("renderiza las opciones de rol", async () => {
    const wrapper = createWrapper();

    await nextTick();
    await Promise.resolve();
    await nextTick();

    expect(wrapper.findAll(".custom-select__option").length).toBeGreaterThan(1);
  });

});