import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";

import InventoryView from "@/features/inventory/views/InventoryView.vue";

vi.mock("@/features/inventory/api", () => ({
  fetchInventoryProducts: vi.fn(() => Promise.resolve([])),
}));

vi.mock("@/services/apiClient", () => ({
  getApiErrorMessage: vi.fn(() => "Error"),
}));

// La vista se prueba con permisos completos; el gating por rol tiene sus
// propios tests en src/tests/core/permissions.spec.ts.
vi.mock("@/composables/useAuth", () => ({
  useAuth: () => ({
    role: { value: "admin" },
    is: () => true,
    can: () => true,
    canAccessRoute: () => true,
  }),
}));

vi.mock("@/features/inventory/components/ImportExcelModal.vue", () => ({
  default: {
    template: "<div>Mock ImportExcelModal</div>",
  },
}));

function createWrapper() {
  return mount(InventoryView);
}

describe("InventoryView", () => {

  it("renderiza correctamente la vista de inventario", async () => {
    const wrapper = createWrapper();

    await nextTick();
    await Promise.resolve();
    await nextTick();

    expect(wrapper.exists()).toBe(true);

    expect(wrapper.text()).toContain("Inventario");
    expect(wrapper.text()).toContain("Filtros");
    expect(wrapper.text()).toContain("Importar Excel");
  });

  it("muestra mensaje cuando no hay productos", async () => {
    const wrapper = createWrapper();

    await nextTick();
    await Promise.resolve();
    await nextTick();

    expect(wrapper.text()).toContain(
      "No hay productos que coincidan con los filtros."
    );
  });

  it("abre el modal de importar excel", async () => {
    const wrapper = createWrapper();

    await nextTick();
    await Promise.resolve();
    await nextTick();

    await wrapper.find(".btn-import").trigger("click");

    expect(wrapper.text()).toContain("Mock ImportExcelModal");
  });

  it("permite mostrar y ocultar columnas", async () => {
    const wrapper = createWrapper();

    await nextTick();
    await Promise.resolve();
    await nextTick();

    const primeraColumna = wrapper.find(".filtros-list li");

    await primeraColumna.trigger("click");

    expect(wrapper.find("th").exists()).toBe(true);
  });

  it("permite cambiar el filtro de estado", async () => {
    const wrapper = createWrapper();

    await nextTick();
    await Promise.resolve();
    await nextTick();

    const botones = wrapper.findAll(".chip");

    await botones[1].trigger("click");

    expect(botones[1].classes()).toContain("chip--active");
  });

  it("permite cambiar el filtro de stock", async () => {
    const wrapper = createWrapper();

    await nextTick();
    await Promise.resolve();
    await nextTick();

    const botones = wrapper.findAll(".chip");

    await botones[3].trigger("click");

    expect(botones[3].classes()).toContain("chip--active");
  });

});