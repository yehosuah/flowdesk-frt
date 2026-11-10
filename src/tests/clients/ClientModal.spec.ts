import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import ClientView from "@/features/clients/views/ClientView.vue";

vi.mock("@/features/clients/api", () => ({
  fetchClients: vi.fn(() => Promise.resolve([])),
  fetchClientPurchases: vi.fn(() => Promise.resolve([])),
}));

vi.mock("@/features/inventory/api", () => ({
  fetchInventoryProducts: vi.fn(() => Promise.resolve([])),
}));

vi.mock("@/services/apiClient", () => ({
  getApiErrorMessage: vi.fn(() => "Error"),
}));

vi.mock("@/features/clients/components/ClientModal.vue", () => ({
  default: { template: "<div>Modal Cliente</div>" },
}));

describe("ClientView", () => {

  it("renderiza la vista de clientes", async () => {
    const wrapper = mount(ClientView);
    await nextTick();

    expect(wrapper.text()).toContain("Clientes");
    expect(wrapper.text()).toContain("Se registran desde Ventas");
  });

  it("muestra mensaje cuando no hay clientes", async () => {
    const wrapper = mount(ClientView);

    await Promise.resolve();
    await nextTick();

    expect(wrapper.text()).toContain("No hay clientes encontrados.");
  });

  it("no ofrece crear clientes manualmente; se registran desde Ventas", async () => {
    const wrapper = mount(ClientView);
    await nextTick();

    expect(wrapper.find(".btn-add").exists()).toBe(false);
    expect(wrapper.text()).not.toContain("Modal Cliente");
  });

});