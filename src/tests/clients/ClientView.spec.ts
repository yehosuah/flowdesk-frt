import {
  beforeEach,
  describe,
  it,
  expect,
  vi,
} from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { nextTick } from "vue";

import ClientView from "@/features/clients/views/ClientView.vue";
import type { Client } from "@/features/clients/api";
import type { Sale } from "@/features/sales/types";

const mocks = vi.hoisted(() => ({
  fetchClients: vi.fn(),
  fetchClientPurchases: vi.fn(),
  getApiErrorMessage: vi.fn(),
}));

vi.mock("@/features/clients/api", () => ({
  fetchClients: mocks.fetchClients,
  fetchClientPurchases: mocks.fetchClientPurchases,
}));

vi.mock("@/services/apiClient", () => ({
  getApiErrorMessage: mocks.getApiErrorMessage,
}));

vi.mock("@/features/clients/components/ClientModal.vue", () => ({
  default: {
    template: "<div>Modal Cliente</div>",
  },
}));

function createWrapper() {
  return mount(ClientView);
}

async function waitForLoad() {
  await nextTick();
  await Promise.resolve();
  await nextTick();
}

function makeClient(overrides: Partial<Client> = {}): Client {
  return {
    id: "c1",
    nombre: "Ana López",
    telefono: null,
    correo: null,
    direccion: null,
    is_active: true,
    created_at: "2026-11-01",
    updated_at: "2026-11-01",
    ...overrides,
  };
}

function makeSale(overrides: Partial<Sale> = {}): Sale {
  return {
    id: "s1",
    usuario_id: "u1",
    cliente_id: "c1",
    consumidor_final: false,
    cliente_nombre: "Ana López",
    fecha: "2026-11-05T15:00:00Z",
    subtotal: 100,
    descuento: 0,
    impuesto: 12,
    tasa_impuesto: 12,
    es_exenta: false,
    total: 112,
    estado: "completada",
    items: [{ id: "i1", producto_id: "p1", cantidad: 2, precio_unitario: 50, subtotal: 100 }],
    ...overrides,
  };
}

describe("ClientView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.fetchClients.mockResolvedValue([]);
    mocks.fetchClientPurchases.mockResolvedValue([]);
    mocks.getApiErrorMessage.mockReturnValue(
      "Error al cargar clientes",
    );
  });

  it("renderiza la vista de clientes como directorio", async () => {
    const wrapper = createWrapper();

    await waitForLoad();

    expect(wrapper.text()).toContain("Clientes");
    expect(wrapper.text()).toContain("Se registran desde Ventas");
  });

  it("muestra mensaje cuando no hay clientes", async () => {
    const wrapper = createWrapper();

    await waitForLoad();

    expect(wrapper.text()).toContain(
      "No hay clientes encontrados.",
    );
  });

  it("ya no permite crear clientes manualmente", async () => {
    const wrapper = createWrapper();

    await waitForLoad();

    expect(wrapper.find(".btn-add").exists()).toBe(false);
    expect(wrapper.text()).not.toContain("Nuevo Cliente");
  });

  it("muestra un error cuando falla la carga de clientes", async () => {
    mocks.fetchClients.mockRejectedValue(
      new Error("Backend no disponible"),
    );

    const wrapper = createWrapper();

    await waitForLoad();

    expect(mocks.getApiErrorMessage).toHaveBeenCalled();
    expect(wrapper.text()).toContain(
      "Error al cargar clientes",
    );
  });

  describe("historial de compras", () => {
    it("carga las compras del cliente seleccionado con su resumen", async () => {
      mocks.fetchClients.mockResolvedValue([makeClient()]);
      mocks.fetchClientPurchases.mockResolvedValue([
        makeSale({
          id: "s2",
          fecha: "2026-11-06T15:00:00Z",
          total: 56,
          items: [
            { id: "i2", producto_id: "p1", cantidad: 1, precio_unitario: 25, subtotal: 25 },
            { id: "i3", producto_id: "p2", cantidad: 1, precio_unitario: 25, subtotal: 25 },
          ],
        }),
        makeSale(),
      ]);

      const wrapper = createWrapper();
      await flushPromises();

      expect(mocks.fetchClientPurchases).toHaveBeenCalledWith("c1", 50);
      expect(wrapper.find(".purchases-note").exists()).toBe(false);
      const history = wrapper.find("[data-testid='client-purchases']");
      expect(history.findAll(".purchase-row")).toHaveLength(2);
      expect(history.find(".purchases-summary").text()).toContain("2");
      expect(history.find(".purchases-summary").text()).toContain("168.00");
      expect(history.text()).toContain("2 productos");
      expect(history.text()).toContain("1 producto");
    });

    it("las ventas anuladas se listan pero no suman al total comprado", async () => {
      mocks.fetchClients.mockResolvedValue([makeClient()]);
      mocks.fetchClientPurchases.mockResolvedValue([
        makeSale({ id: "s2", estado: "anulada", total: 500 }),
        makeSale(),
      ]);

      const wrapper = createWrapper();
      await flushPromises();

      const history = wrapper.find("[data-testid='client-purchases']");
      expect(history.find(".purchase-row--voided .purchase-badge").text()).toBe("Anulada");
      expect(history.find(".purchases-summary").text()).toContain("112.00");
      expect(history.find(".purchases-summary").text()).not.toContain("612.00");
    });

    it("avisa cuando el historial llega al límite y el resumen es parcial", async () => {
      mocks.fetchClients.mockResolvedValue([makeClient()]);
      mocks.fetchClientPurchases.mockResolvedValue(
        Array.from({ length: 50 }, (_, i) => makeSale({ id: `s${i}` })),
      );

      const wrapper = createWrapper();
      await flushPromises();

      expect(wrapper.find(".purchases-note").text()).toContain("últimas 50 ventas");
    });

    it("indica cómo asignar compras cuando el cliente aún no tiene", async () => {
      mocks.fetchClients.mockResolvedValue([makeClient()]);

      const wrapper = createWrapper();
      await flushPromises();

      expect(wrapper.text()).toContain("Este cliente aún no tiene compras.");
    });

    it("muestra el error y permite reintentar", async () => {
      mocks.fetchClients.mockResolvedValue([makeClient()]);
      mocks.fetchClientPurchases
        .mockRejectedValueOnce(new Error("Servidor no disponible"))
        .mockResolvedValueOnce([makeSale()]);
      mocks.getApiErrorMessage.mockReturnValue("No se pudo cargar el historial");

      const wrapper = createWrapper();
      await flushPromises();

      expect(wrapper.find(".purchases-error").text()).toContain("No se pudo cargar el historial");

      await wrapper.find(".btn-retry").trigger("click");
      await flushPromises();

      expect(mocks.fetchClientPurchases).toHaveBeenCalledTimes(2);
      expect(wrapper.findAll(".purchase-row")).toHaveLength(1);
    });

    it("al cambiar de cliente ignora la respuesta tardía del anterior", async () => {
      const a = makeClient({ id: "a", nombre: "Cliente A" });
      const b = makeClient({ id: "b", nombre: "Cliente B" });
      mocks.fetchClients.mockResolvedValue([a, b]);

      let resolveA: (value: Sale[]) => void = () => {};
      mocks.fetchClientPurchases.mockImplementation((id: string) =>
        id === "a"
          ? new Promise<Sale[]>((resolve) => { resolveA = resolve; })
          : Promise.resolve([makeSale({ id: "venta-b", cliente_id: "b", total: 30 })]),
      );

      const wrapper = createWrapper();
      await flushPromises();

      await wrapper.findAll(".client-item")[1].trigger("click");
      await flushPromises();

      resolveA([makeSale({ id: "venta-a", total: 999 })]);
      await flushPromises();

      expect(wrapper.find(".detail-name").text()).toBe("Cliente B");
      expect(wrapper.findAll(".purchase-row")).toHaveLength(1);
      expect(wrapper.text()).toContain("30.00");
      expect(wrapper.text()).not.toContain("999.00");
    });
  });
});
