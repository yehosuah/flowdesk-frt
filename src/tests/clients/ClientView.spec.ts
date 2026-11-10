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
  fetchInventoryProducts: vi.fn(),
  getApiErrorMessage: vi.fn(),
}));

vi.mock("@/features/clients/api", () => ({
  fetchClients: mocks.fetchClients,
  fetchClientPurchases: mocks.fetchClientPurchases,
}));

vi.mock("@/features/inventory/api", () => ({
  fetchInventoryProducts: mocks.fetchInventoryProducts,
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
    fecha: "2026-11-05T15:00:00",
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

const inventory = [
  { id: "p1", nombre: "Mouse pad ergonómico", cantidad: 10, descripcion: "", precio: 50, stockMinimo: 1, is_active: true },
  { id: "p2", nombre: "Adaptador USB-C a HDMI", cantidad: 5, descripcion: "", precio: 110, stockMinimo: 1, is_active: true },
];

function historyRows(wrapper: ReturnType<typeof createWrapper>) {
  return wrapper
    .findAll("[data-testid='client-purchases'] tbody tr")
    .map((row) => row.findAll("td").map((cell) => cell.text()));
}

describe("ClientView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.fetchClients.mockResolvedValue([]);
    mocks.fetchClientPurchases.mockResolvedValue([]);
    mocks.fetchInventoryProducts.mockResolvedValue(inventory);
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

  describe("historial de compras (tabla)", () => {
    it("muestra una fila por producto con fecha, producto, cantidad y precio", async () => {
      mocks.fetchClients.mockResolvedValue([makeClient()]);
      mocks.fetchClientPurchases.mockResolvedValue([
        makeSale({
          id: "s2",
          fecha: "2026-11-06T15:00:00",
          items: [
            { id: "i2", producto_id: "p2", cantidad: 1, precio_unitario: 110, subtotal: 110 },
            { id: "i3", producto_id: "p1", cantidad: 3, precio_unitario: 35, subtotal: 105 },
          ],
        }),
        makeSale(),
      ]);

      const wrapper = createWrapper();
      await flushPromises();

      expect(mocks.fetchClientPurchases).toHaveBeenCalledWith("c1", 50);
      const headers = wrapper.findAll("[data-testid='client-purchases'] th").map((th) => th.text());
      expect(headers).toEqual(["Fecha", "Producto", "Cantidad", "Precio"]);
      expect(historyRows(wrapper)).toEqual([
        ["06/11/2026", "Adaptador USB-C a HDMI", "1", "Q 110.00"],
        ["06/11/2026", "Mouse pad ergonómico", "3", "Q 35.00"],
        ["05/11/2026", "Mouse pad ergonómico", "2", "Q 50.00"],
      ]);
      expect(wrapper.find(".purchases-note").exists()).toBe(false);
    });

    it("no lista los productos de ventas anuladas", async () => {
      mocks.fetchClients.mockResolvedValue([makeClient()]);
      mocks.fetchClientPurchases.mockResolvedValue([
        makeSale({
          id: "s2",
          estado: "anulada",
          items: [{ id: "i9", producto_id: "p2", cantidad: 5, precio_unitario: 110, subtotal: 550 }],
        }),
        makeSale(),
      ]);

      const wrapper = createWrapper();
      await flushPromises();

      expect(historyRows(wrapper)).toEqual([
        ["05/11/2026", "Mouse pad ergonómico", "2", "Q 50.00"],
      ]);
    });

    it("muestra el mensaje dentro de la tabla cuando el cliente aún no tiene compras", async () => {
      mocks.fetchClients.mockResolvedValue([makeClient()]);

      const wrapper = createWrapper();
      await flushPromises();

      expect(historyRows(wrapper)).toEqual([
        ["Este cliente aún no tiene compras. Asígnalo a una venta desde el módulo de Ventas."],
      ]);
    });

    it("carga los nombres del inventario una sola vez aunque cambie de cliente", async () => {
      const a = makeClient({ id: "a", nombre: "Cliente A" });
      const b = makeClient({ id: "b", nombre: "Cliente B" });
      mocks.fetchClients.mockResolvedValue([a, b]);

      const wrapper = createWrapper();
      await flushPromises();
      await wrapper.findAll(".client-item")[1].trigger("click");
      await flushPromises();

      expect(mocks.fetchClientPurchases).toHaveBeenCalledTimes(2);
      expect(mocks.fetchInventoryProducts).toHaveBeenCalledTimes(1);
    });

    it("si no se puede cargar el inventario, muestra el id corto del producto", async () => {
      mocks.fetchClients.mockResolvedValue([makeClient()]);
      mocks.fetchClientPurchases.mockResolvedValue([
        makeSale({ items: [{ id: "i1", producto_id: "abcdef12-0000", cantidad: 1, precio_unitario: 10, subtotal: 10 }] }),
      ]);
      mocks.fetchInventoryProducts.mockRejectedValue(new Error("Sin conexión"));

      const wrapper = createWrapper();
      await flushPromises();

      expect(historyRows(wrapper)[0][1]).toBe("Producto abcdef12…");
    });

    it("avisa cuando el historial llega al límite de ventas", async () => {
      mocks.fetchClients.mockResolvedValue([makeClient()]);
      mocks.fetchClientPurchases.mockResolvedValue(
        Array.from({ length: 50 }, (_, i) => makeSale({ id: `s${i}`, items: [] })),
      );

      const wrapper = createWrapper();
      await flushPromises();

      expect(wrapper.find(".purchases-note").text()).toContain("últimas 50 ventas");
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
      expect(wrapper.find("[data-testid='client-purchases'] table").exists()).toBe(false);

      await wrapper.find(".btn-retry").trigger("click");
      await flushPromises();

      expect(mocks.fetchClientPurchases).toHaveBeenCalledTimes(2);
      expect(historyRows(wrapper)).toHaveLength(1);
    });

    it("al cambiar de cliente ignora la respuesta tardía del anterior", async () => {
      const a = makeClient({ id: "a", nombre: "Cliente A" });
      const b = makeClient({ id: "b", nombre: "Cliente B" });
      mocks.fetchClients.mockResolvedValue([a, b]);

      let resolveA: (value: Sale[]) => void = () => {};
      mocks.fetchClientPurchases.mockImplementation((id: string) =>
        id === "a"
          ? new Promise<Sale[]>((resolve) => { resolveA = resolve; })
          : Promise.resolve([
            makeSale({ id: "venta-b", cliente_id: "b", items: [{ id: "ib", producto_id: "p2", cantidad: 4, precio_unitario: 110, subtotal: 440 }] }),
          ]),
      );

      const wrapper = createWrapper();
      await flushPromises();

      await wrapper.findAll(".client-item")[1].trigger("click");
      await flushPromises();

      resolveA([makeSale({ id: "venta-a", items: [{ id: "ia", producto_id: "p1", cantidad: 99, precio_unitario: 50, subtotal: 4950 }] })]);
      await flushPromises();

      expect(wrapper.find(".detail-name").text()).toBe("Cliente B");
      expect(historyRows(wrapper)).toEqual([
        ["05/11/2026", "Adaptador USB-C a HDMI", "4", "Q 110.00"],
      ]);
    });
  });
});
