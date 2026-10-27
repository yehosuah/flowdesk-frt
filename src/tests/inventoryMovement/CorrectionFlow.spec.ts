import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { enableAutoUnmount, flushPromises, mount } from "@vue/test-utils";

import InventoryMovementView from "@/features/inventorymovement/views/InventoryMovementView.vue";
import { createMovement, fetchMovements, type InventoryMovement } from "@/features/inventorymovement/api";
import { fetchInventoryProducts } from "@/features/inventory/api";
import { getSale, voidSale } from "@/features/sales/api";
import type { Sale } from "@/features/sales/types";

// SCRUM-746: flujos completos de corrección (anulación de venta y ajuste físico)
// sobre la vista real con sus modales reales. Solo se simula la capa HTTP.

vi.mock("@/features/inventorymovement/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/inventorymovement/api")>()),
  fetchMovements: vi.fn(),
  createMovement: vi.fn(),
}));

vi.mock("@/features/inventory/api", () => ({
  fetchInventoryProducts: vi.fn(),
}));

vi.mock("@/features/sales/api", () => ({
  getSale: vi.fn(),
  voidSale: vi.fn(),
}));

enableAutoUnmount(afterEach);

const auth = vi.hoisted(() => ({ role: "manager" }));

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

const SALE_ID = "5a1e0000-0000-0000-0000-000000000001";

const products = [
  { id: "p1", nombre: "Café 1lb", cantidad: 8, descripcion: "", precio: 50, stockMinimo: 2, proveedor: null, is_active: true },
  { id: "p2", nombre: "Taza", cantidad: 4, descripcion: "", precio: 25, stockMinimo: 1, proveedor: null, is_active: false },
];

function movement(overrides: Partial<InventoryMovement>): InventoryMovement {
  return {
    id: crypto.randomUUID(),
    producto_id: "p1",
    usuario_id: "u1",
    tipo_movimiento: "entrada_compra",
    fecha: "2026-10-20T15:00:00Z",
    cantidad: 1,
    stock_anterior: 0,
    stock_resultante: 1,
    motivo: null,
    referencia_tipo: null,
    referencia_id: null,
    ...overrides,
  };
}

const saleMovement = movement({
  tipo_movimiento: "salida_venta",
  cantidad: 2,
  stock_anterior: 10,
  stock_resultante: 8,
  referencia_tipo: "venta",
  referencia_id: SALE_ID,
});

const voidMovement = movement({
  tipo_movimiento: "devolucion_cliente",
  fecha: "2026-10-21T15:00:00Z",
  cantidad: 2,
  stock_anterior: 8,
  stock_resultante: 10,
  motivo: "Cobro duplicado",
  referencia_tipo: "anulacion_venta",
  referencia_id: SALE_ID,
});

const sale: Sale = {
  id: SALE_ID,
  usuario_id: "u1",
  cliente_id: null,
  consumidor_final: true,
  cliente_nombre: null,
  fecha: "2026-10-20T15:00:00Z",
  subtotal: 100,
  descuento: 0,
  impuesto: 12,
  tasa_impuesto: 12,
  es_exenta: false,
  total: 112,
  estado: "completada",
  items: [{ id: "i1", producto_id: "p1", cantidad: 2, precio_unitario: 50, subtotal: 100 }],
};

async function mountView() {
  const wrapper = mount(InventoryMovementView, {
    global: { stubs: { teleport: true } },
    attachTo: document.body,
  });
  await flushPromises();
  return wrapper;
}

// El stub de Teleport recrea el nodo del modal al re-renderizar, así que se
// vuelve a consultar en cada paso en lugar de guardar una referencia.
function voidModal(wrapper: Awaited<ReturnType<typeof mountView>>) {
  return () => wrapper.find("[data-testid='void-sale-modal']");
}

function adjustmentModal(wrapper: Awaited<ReturnType<typeof mountView>>) {
  return () => wrapper.find("[data-testid='stock-adjustment-modal']");
}

async function openDropdownItem(wrapper: Awaited<ReturnType<typeof mountView>>, label: string) {
  await wrapper.find(".btn-add").trigger("click");
  const item = wrapper.findAll(".dropdown-item").find(button => button.text() === label);
  expect(item, `opción "${label}" en el menú`).toBeDefined();
  await item!.trigger("click");
}

describe("Flujo de corrección de ventas y existencias (SCRUM-746)", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    auth.role = "manager";
    vi.mocked(fetchInventoryProducts).mockResolvedValue(products);
  });

  describe("anulación de venta", () => {
    it("anula una venta con motivo, recarga el historial y conserva ambos movimientos", async () => {
      vi.mocked(fetchMovements)
        .mockResolvedValueOnce([saleMovement])
        .mockResolvedValueOnce([voidMovement, saleMovement]);
      vi.mocked(getSale).mockResolvedValue(sale);
      vi.mocked(voidSale).mockResolvedValue({ ...sale, estado: "anulada", motivo_anulacion: "Cobro duplicado" });

      const wrapper = await mountView();

      // 1. La salida de la venta ofrece la acción de anular.
      const voidButton = wrapper.find(".btn-void");
      expect(voidButton.exists()).toBe(true);
      await voidButton.trigger("click");
      await flushPromises();

      // 2. El modal carga la venta referenciada por el movimiento.
      expect(getSale).toHaveBeenCalledWith(SALE_ID);
      const modal = voidModal(wrapper);
      expect(modal().exists()).toBe(true);
      expect(modal().text()).toContain("Q 112.00");

      // 3. Sin motivo no se envía nada.
      await modal().find("form").trigger("submit.prevent");
      expect(modal().text()).toContain("El motivo de la anulación es obligatorio.");
      expect(voidSale).not.toHaveBeenCalled();

      // 4. Con motivo se anula, se cierra el modal y se recarga el historial.
      await modal().find("textarea").setValue("Cobro duplicado");
      await modal().find("form").trigger("submit.prevent");
      await flushPromises();

      expect(voidSale).toHaveBeenCalledWith(SALE_ID, { motivo: "Cobro duplicado" });
      expect(wrapper.find("[data-testid='void-sale-modal']").exists()).toBe(false);
      expect(fetchMovements).toHaveBeenCalledTimes(2);
      expect(wrapper.text()).toContain("Venta anulada. El stock fue devuelto al inventario.");

      // 5. El historial conserva la salida original (marcada) y la entrada de reversión.
      const rows = wrapper.findAll("tr.movement-row");
      expect(rows).toHaveLength(2);
      expect(wrapper.text()).toContain("Anulación");
      expect(wrapper.text()).toContain("Venta anulada");
      expect(wrapper.text()).toContain("Cobro duplicado");
      expect(wrapper.find(".btn-void").exists()).toBe(false);
    });

    it("no ofrece anular una venta que ya tiene su reversión en el historial", async () => {
      vi.mocked(fetchMovements).mockResolvedValue([voidMovement, saleMovement]);

      const wrapper = await mountView();

      expect(wrapper.find(".btn-void").exists()).toBe(false);
      expect(wrapper.text()).toContain("Venta anulada");
    });

    it("solo ofrece anular salidas que provienen de una venta", async () => {
      vi.mocked(fetchMovements).mockResolvedValue([
        movement({ tipo_movimiento: "salida_manual", motivo: "Merma" }),
        movement({ tipo_movimiento: "ajuste_negativo", motivo: "Conteo" }),
      ]);

      const wrapper = await mountView();

      expect(wrapper.find(".btn-void").exists()).toBe(false);
    });

    it("cerrar el modal sin confirmar no anula ni recarga", async () => {
      vi.mocked(fetchMovements).mockResolvedValue([saleMovement]);
      vi.mocked(getSale).mockResolvedValue(sale);

      const wrapper = await mountView();
      await wrapper.find(".btn-void").trigger("click");
      await flushPromises();
      await wrapper.find("[data-testid='void-sale-modal'] .btn-secondary").trigger("click");

      expect(wrapper.find("[data-testid='void-sale-modal']").exists()).toBe(false);
      expect(voidSale).not.toHaveBeenCalled();
      expect(fetchMovements).toHaveBeenCalledTimes(1);
    });
  });

  describe("ajuste por conteo físico", () => {
    it("registra un ajuste negativo desde el conteo y recarga el historial", async () => {
      const adjustment = movement({
        tipo_movimiento: "ajuste_negativo",
        cantidad: 3,
        stock_anterior: 8,
        stock_resultante: 5,
        motivo: "Conteo mensual",
      });
      vi.mocked(fetchMovements)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([adjustment]);
      vi.mocked(createMovement).mockResolvedValue(adjustment);

      const wrapper = await mountView();
      await openDropdownItem(wrapper, "Ajuste por Conteo Físico");

      const modal = adjustmentModal(wrapper);
      expect(modal().exists()).toBe(true);

      await modal().find("select").setValue("p1");
      await modal().find("input[type='number']").setValue("5");
      await modal().find("textarea").setValue("Conteo mensual");
      expect(modal().find("[data-testid='system-stock']").text()).toBe("8");
      expect(modal().find("[data-testid='adjustment-preview']").text()).toContain("Ajuste negativo de 3 unidades");

      await modal().find("form").trigger("submit.prevent");
      await flushPromises();

      expect(createMovement).toHaveBeenCalledWith({
        producto_id: "p1",
        tipo_movimiento: "ajuste_negativo",
        cantidad: 3,
        motivo: "Conteo mensual",
      });
      expect(wrapper.find("[data-testid='stock-adjustment-modal']").exists()).toBe(false);
      expect(fetchMovements).toHaveBeenCalledTimes(2);
      expect(wrapper.text()).toContain("Ajuste registrado correctamente.");
      expect(wrapper.text()).toContain("Conteo mensual");
    });

    it("permite corregir el stock de un producto inactivo", async () => {
      vi.mocked(fetchMovements).mockResolvedValue([]);
      vi.mocked(createMovement).mockResolvedValue(movement({}));

      const wrapper = await mountView();
      await openDropdownItem(wrapper, "Ajuste por Conteo Físico");

      const modal = adjustmentModal(wrapper);
      await modal().find("select").setValue("p2");
      await modal().find("input[type='number']").setValue("6");
      await modal().find("textarea").setValue("Sobrante encontrado");
      await modal().find("form").trigger("submit.prevent");
      await flushPromises();

      expect(createMovement).toHaveBeenCalledWith({
        producto_id: "p2",
        tipo_movimiento: "ajuste_positivo",
        cantidad: 2,
        motivo: "Sobrante encontrado",
      });
    });
  });

  describe("operaciones autorizadas", () => {
    it.each(["admin", "manager"])("%s puede anular ventas y registrar ajustes", async (role) => {
      auth.role = role;
      vi.mocked(fetchMovements).mockResolvedValue([saleMovement]);

      const wrapper = await mountView();
      await wrapper.find(".btn-add").trigger("click");

      expect(wrapper.find("th:last-child").text()).toBe("Acciones");
      expect(wrapper.find(".btn-void").exists()).toBe(true);
      expect(wrapper.findAll(".dropdown-item").map(item => item.text())).toContain("Ajuste por Conteo Físico");
    });

    it("employee no ve la anulación ni el ajuste físico", async () => {
      auth.role = "employee";
      vi.mocked(fetchMovements).mockResolvedValue([saleMovement]);

      const wrapper = await mountView();
      await wrapper.find(".btn-add").trigger("click");

      expect(wrapper.text()).not.toContain("Acciones");
      expect(wrapper.find(".btn-void").exists()).toBe(false);
      expect(wrapper.findAll(".dropdown-item").map(item => item.text())).not.toContain("Ajuste por Conteo Físico");
    });
  });
});
