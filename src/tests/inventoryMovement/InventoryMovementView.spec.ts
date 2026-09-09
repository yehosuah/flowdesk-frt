import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";

import InventoryMovementView from "@/features/inventorymovement/views/InventoryMovementView.vue";

vi.mock("@/features/inventorymovement/api", () => ({
  fetchMovements: vi.fn().mockResolvedValue([]),
  isInbound: vi.fn(() => true),
}));

vi.mock("@/features/inventory/api", () => ({
  fetchInventoryProducts: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/services/apiClient", () => ({
  ApiError: class extends Error {
    status = 404;
  },
}));

vi.mock("@/composables/useAuth", () => ({
  useAuth: () => ({
    role: { value: "admin" },
    is: () => true,
    can: () => true,
    canAccessRoute: () => true,
  }),
}));

vi.mock(
  "@/features/inventorymovement/components/NewMovementModal.vue",
  () => ({
    default: {
      name: "NewMovementModal",
      template: "<div data-testid='new-movement-modal'></div>",
    },
  })
);

function createWrapper() {
  return mount(InventoryMovementView);
}

describe("InventoryMovementView", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("renderiza correctamente la vista", async () => {
    const wrapper = createWrapper();

    await nextTick();

    expect(wrapper.text()).toContain("Movimiento de Inventario");
    expect(wrapper.text()).toContain("Nuevo Registro");
    expect(wrapper.text()).toContain("Filtros");
  });

  it("muestra mensaje cuando no hay movimientos", async () => {
    const wrapper = createWrapper();

    await nextTick();
    await Promise.resolve();
    await nextTick();

    expect(wrapper.text()).toContain("No hay movimientos registrados.");
  });

  it("abre el modal de nuevo movimiento", async () => {
    const wrapper = createWrapper();

    await wrapper.find(".btn-add").trigger("click");
    await nextTick();
    
    const dropdownItems = wrapper.findAll(".dropdown-item");
    const otherItem = dropdownItems.find(item => item.text().includes("Ajuste (Otro)"));
    await otherItem!.trigger("click");
    await nextTick();

    expect(
      wrapper.find("[data-testid='new-movement-modal']").exists()
    ).toBe(true);
  });

  it("permite cambiar el filtro de tipo", async () => {
    const wrapper = createWrapper();

    await nextTick();

    const chips = wrapper.findAll(".chip");

    await chips[1].trigger("click");

    expect(chips[1].classes()).toContain("chip--active");
  });

  it("permite limpiar filtros", async () => {
    const wrapper = createWrapper();

    await nextTick();

    const chips = wrapper.findAll(".chip");

    await chips[1].trigger("click");

    await wrapper.find(".btn-limpiar-text").trigger("click");

    expect(chips[0].classes()).toContain("chip--active");
  });

  it("permite mostrar u ocultar columnas", async () => {
    const wrapper = createWrapper();

    await nextTick();

    const columnas = wrapper.findAll(".filtros-list li");

    await columnas[0].trigger("click");

    expect(wrapper.find(".checkbox").exists()).toBe(true);
  });
});