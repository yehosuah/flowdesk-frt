import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { enableAutoUnmount, flushPromises, mount } from "@vue/test-utils";

import InventoryMovementView from "@/features/inventorymovement/views/InventoryMovementView.vue";
import { fetchMovements, type InventoryMovement } from "@/features/inventorymovement/api";
import { fetchInventoryProducts } from "@/features/inventory/api";
import { createSale, fetchTaxConfiguration } from "@/features/sales/api";
import type { Sale } from "@/features/sales/types";
import { ApiError } from "@/services/apiClient";

// SCRUM-792: flujo completo de registro de venta desde el módulo de Ventas,
// sobre la vista real con su modal real. Solo se simula la capa HTTP.

vi.mock("@/features/inventorymovement/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/inventorymovement/api")>()),
  fetchMovements: vi.fn(),
  createMovement: vi.fn(),
}));

vi.mock("@/features/inventory/api", () => ({
  fetchInventoryProducts: vi.fn(),
}));

vi.mock("@/features/sales/api", () => ({
  fetchTaxConfiguration: vi.fn(),
  createSale: vi.fn(),
  getSale: vi.fn(),
  voidSale: vi.fn(),
}));

enableAutoUnmount(afterEach);

const auth = vi.hoisted(() => ({ role: "employee" }));
const routeState = vi.hoisted(() => ({ name: "sales" }));

vi.mock("vue-router", () => ({
  useRoute: () => routeState,
}));

vi.mock("@/composables/useAuth", async () => {
  const { can } = await import("@/utils/permissions");
  return {
    useAuth: () => ({
      role: { value: auth.role },
      is: (target: string) => auth.role === target,
      can: (permission: Parameters<typeof can>[1]) => can(auth.role, permission),
      canAccessRoute: () => true,
    }),
  };
});

const SALE_ID = "5a1e0000-0000-0000-0000-000000000792";

const products = [
  { id: "p1", nombre: "Café 1lb", cantidad: 8, descripcion: "", precio: 50, stockMinimo: 2, proveedor: null, is_active: true },
];

function movement(overrides: Partial<InventoryMovement>): InventoryMovement {
  return {
    id: crypto.randomUUID(),
    producto_id: "p1",
    usuario_id: "u1",
    tipo_movimiento: "entrada_compra",
    fecha: "2026-10-20T15:00:00Z",
    cantidad: 10,
    stock_anterior: 0,
    stock_resultante: 10,
    motivo: null,
    referencia_tipo: null,
    referencia_id: null,
    ...overrides,
  };
}

const purchaseMovement = movement({});

const saleMovement = movement({
  tipo_movimiento: "salida_venta",
  fecha: "2026-10-27T15:00:00Z",
  cantidad: 2,
  stock_anterior: 10,
  stock_resultante: 8,
  referencia_tipo: "venta",
  referencia_id: SALE_ID,
});

const sale: Sale = {
  id: SALE_ID,
  usuario_id: "u1",
  cliente_id: null,
  consumidor_final: true,
  cliente_nombre: null,
  fecha: "2026-10-27T15:00:00Z",
  subtotal: 100,
  descuento: 0,
  impuesto: 12,
  tasa_impuesto: 12,
  es_exenta: false,
  total: 112,
  estado: "completada",
  items: [{ id: "i1", producto_id: "p1", cantidad: 2, precio_unitario: 50, subtotal: 100 }],
};

async function mountView(routeName = "sales") {
  routeState.name = routeName;
  const wrapper = mount(InventoryMovementView, {
    global: { stubs: { teleport: true } },
    attachTo: document.body,
  });
  await flushPromises();
  return wrapper;
}

type View = Awaited<ReturnType<typeof mountView>>;

// El stub de Teleport recrea el nodo del modal al re-renderizar, así que se
// vuelve a consultar en cada paso en lugar de guardar una referencia.
function saleModal(wrapper: View) {
  return () => wrapper.find("[aria-labelledby='sale-modal-title']");
}

async function fillAndSubmitSale(wrapper: View, quantity = 2) {
  const modal = saleModal(wrapper);
  await modal().find("select").setValue("p1");
  await modal().find("input[type='number']").setValue(quantity);
  await modal().find("form").trigger("submit");
  await flushPromises();
}

describe("Flujo de registro de venta (SCRUM-792)", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    auth.role = "employee";
    vi.mocked(fetchInventoryProducts).mockResolvedValue(products);
    vi.mocked(fetchTaxConfiguration).mockResolvedValue({ tasa_impuesto: 12 });
    vi.mocked(fetchMovements)
      .mockResolvedValueOnce([purchaseMovement])
      .mockResolvedValue([purchaseMovement, saleMovement]);
  });

  it("el módulo de ventas ofrece registrar una venta con un solo clic", async () => {
    const wrapper = await mountView();

    expect(wrapper.find(".page-title").text()).toBe("Ventas");
    expect(wrapper.find(".btn-add").text()).toContain("Registrar venta");

    await wrapper.find(".btn-add").trigger("click");

    expect(wrapper.find(".dropdown-menu").exists()).toBe(false);
    expect(saleModal(wrapper)().exists()).toBe(true);
  });

  it("registra la venta, cierra el modal y la muestra en el historial", async () => {
    vi.mocked(createSale).mockResolvedValueOnce(sale);

    const wrapper = await mountView();

    expect(wrapper.findAll(".movement-row")).toHaveLength(0);

    await wrapper.find(".btn-add").trigger("click");
    await fillAndSubmitSale(wrapper);

    expect(createSale).toHaveBeenCalledWith({
      items: [{ producto_id: "p1", cantidad: 2 }],
      es_exenta: false,
    });
    expect(saleModal(wrapper)().exists()).toBe(false);
    expect(fetchMovements).toHaveBeenCalledTimes(2);
    expect(wrapper.text()).toContain("Venta registrada correctamente.");

    // El módulo de ventas solo lista ventas: la compra previa no aparece.
    const rows = wrapper.findAll(".movement-row");
    expect(rows).toHaveLength(1);
    expect(rows[0].text()).toContain("Café 1lb");
  });

  it("si el backend rechaza la venta, mantiene el modal con el error y no recarga", async () => {
    vi.mocked(createSale).mockRejectedValueOnce(
      new ApiError(400, "Stock insuficiente para Café 1lb"),
    );

    const wrapper = await mountView();

    await wrapper.find(".btn-add").trigger("click");
    await fillAndSubmitSale(wrapper);

    expect(saleModal(wrapper)().exists()).toBe(true);
    expect(saleModal(wrapper)().find(".error-alert").text()).toContain("Stock insuficiente");
    expect(fetchMovements).toHaveBeenCalledTimes(1);
    expect(wrapper.text()).not.toContain("Venta registrada correctamente.");
  });

  it("cancelar el modal no registra la venta", async () => {
    const wrapper = await mountView();

    await wrapper.find(".btn-add").trigger("click");
    await saleModal(wrapper)().find(".btn-cancel").trigger("click");

    expect(saleModal(wrapper)().exists()).toBe(false);
    expect(createSale).not.toHaveBeenCalled();
    expect(fetchMovements).toHaveBeenCalledTimes(1);
  });

  it("las ventas se registran solo desde su módulo, no desde Movimientos de inventario", async () => {
    auth.role = "admin";

    const wrapper = await mountView("inventorymovement");

    await wrapper.find(".btn-add").trigger("click");
    const options = wrapper.findAll(".dropdown-item").map(item => item.text());

    expect(options).toContain("Ingresar Stock");
    expect(options.some(option => /venta/i.test(option))).toBe(false);
  });

  describe("según el rol", () => {
    it("el cajero (employee) registra ventas pero no puede anularlas", async () => {
      vi.mocked(fetchMovements).mockReset().mockResolvedValue([saleMovement]);

      const wrapper = await mountView();

      expect(wrapper.find(".btn-add").exists()).toBe(true);
      expect(wrapper.find(".btn-void").exists()).toBe(false);
    });

    it.each(["manager", "admin"])("%s registra ventas y puede anularlas", async (role) => {
      auth.role = role;
      vi.mocked(fetchMovements).mockReset().mockResolvedValue([saleMovement]);

      const wrapper = await mountView();

      expect(wrapper.find(".btn-add").exists()).toBe(true);
      expect(wrapper.find(".btn-void").exists()).toBe(true);
    });
  });
});
