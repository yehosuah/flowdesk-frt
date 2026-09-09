import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";

import NewMovementModal from "@/features/inventorymovement/components/NewMovementModal.vue";

vi.mock("@/features/inventorymovement/api", () => ({
  createMovement: vi.fn(),
}));

vi.mock("@/services/apiClient", () => ({
  getApiErrorMessage: vi.fn(() => "Error"),
}));

const products = [
  {
    id: "1",
    nombre: "Producto A",
    cantidad: 10,
    descripcion: "Producto de prueba",
    precio: 100,
    stockMinimo: 5,
    proveedor: null,
    is_active: true,
  },
];

function createWrapper() {
  return mount(NewMovementModal, {
    props: {
      products,
    },
    global: {
      stubs: {
        teleport: true,
      },
    },
  });
}

describe("NewMovementModal", () => {
  it("renderiza correctamente el modal", () => {
    const wrapper = createWrapper();

    expect(wrapper.exists()).toBe(true);
    expect(wrapper.text()).toContain("Ajuste de Inventario (Otro)");
    expect(wrapper.text()).toContain("Registrar");
  });

  it("muestra error cuando no se selecciona un producto", async () => {
    const wrapper = createWrapper();

    await wrapper.find("form").trigger("submit.prevent");

    expect(wrapper.text()).toContain("Selecciona un producto.");
  });

  it("muestra error cuando no se selecciona el tipo de movimiento", async () => {
    const wrapper = createWrapper();

    const selects = wrapper.findAll("select");

    await selects[0].setValue("1");

    await wrapper.find("form").trigger("submit.prevent");

    expect(wrapper.text()).toContain(
      "Selecciona el tipo de movimiento."
    );
  });

  it("muestra error cuando la cantidad es menor o igual a cero", async () => {
    const wrapper = createWrapper();

    const selects = wrapper.findAll("select");

    await selects[0].setValue("1");
    await selects[1].setValue("entrada_manual");

    await wrapper.find("input[type='number']").setValue("0");

    await wrapper.find("form").trigger("submit.prevent");

    expect(wrapper.text()).toContain(
      "La cantidad debe ser mayor a 0."
    );
  });

  it("emite el evento close al presionar cancelar", async () => {
    const wrapper = createWrapper();

    const cancelar = wrapper.find(".btn-secondary");

    await cancelar.trigger("click");

    expect(wrapper.emitted("close")).toBeTruthy();
  });

  it("renderiza las opciones del tipo de movimiento", () => {
    const wrapper = createWrapper();

    expect(wrapper.text()).toContain("Entrada");
    expect(wrapper.text()).toContain("Salida");
    expect(wrapper.text()).toContain("Ajuste Positivo (+)");
    expect(wrapper.text()).toContain("Ajuste Negativo (-)");
  });

  it("muestra el botón registrar", () => {
    const wrapper = createWrapper();

    expect(wrapper.find(".btn-primary").exists()).toBe(true);
  });
});