import { describe, it, expect, vi, beforeEach } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";

import VoidSaleModal from "@/features/inventorymovement/components/VoidSaleModal.vue";
import { getSale, voidSale } from "@/features/sales/api";
import { ApiError } from "@/services/apiClient";
import type { Sale } from "@/features/sales/types";

vi.mock("@/features/sales/api", () => ({
  getSale: vi.fn(),
  voidSale: vi.fn(),
}));

const SALE_ID = "a1b2c3d4-0000-0000-0000-000000000001";

const products = [
  { id: "p1", nombre: "Café 1lb", cantidad: 8, descripcion: "", precio: 50, stockMinimo: 2, proveedor: null, is_active: true },
  { id: "p2", nombre: "Taza", cantidad: 0, descripcion: "", precio: 25, stockMinimo: 1, proveedor: null, is_active: false },
];

function buildSale(overrides: Partial<Sale> = {}): Sale {
  return {
    id: SALE_ID,
    usuario_id: "u1",
    cliente_id: null,
    consumidor_final: true,
    cliente_nombre: null,
    fecha: "2026-10-20T15:00:00Z",
    subtotal: 125,
    descuento: 0,
    impuesto: 15,
    tasa_impuesto: 12,
    es_exenta: false,
    total: 140,
    estado: "completada",
    items: [
      { id: "i1", producto_id: "p1", cantidad: 2, precio_unitario: 50, subtotal: 100 },
      { id: "i2", producto_id: "p2", cantidad: 1, precio_unitario: 25, subtotal: 25 },
    ],
    ...overrides,
  };
}

async function createWrapper() {
  const wrapper = mount(VoidSaleModal, {
    props: { saleId: SALE_ID, products },
    global: { stubs: { teleport: true } },
  });
  await flushPromises();
  return wrapper;
}

describe("VoidSaleModal (SCRUM-744)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("carga la venta y muestra el resumen con los productos que regresan al inventario", async () => {
    vi.mocked(getSale).mockResolvedValue(buildSale());

    const wrapper = await createWrapper();

    expect(getSale).toHaveBeenCalledWith(SALE_ID);
    expect(wrapper.text()).toContain("Anular Venta");
    expect(wrapper.text()).toContain("A1B2C3D4");
    expect(wrapper.text()).toContain("Consumidor final");
    expect(wrapper.text()).toContain("Q 140.00");
    expect(wrapper.text()).toContain("Café 1lb");
    expect(wrapper.text()).toContain("+2");
    // Los productos inactivos también recuperan su stock al anular.
    expect(wrapper.text()).toContain("Taza");
    expect(wrapper.text()).toContain("+1");
  });

  it("exige un motivo antes de anular", async () => {
    vi.mocked(getSale).mockResolvedValue(buildSale());
    const wrapper = await createWrapper();

    await wrapper.find("textarea").setValue("   ");
    await wrapper.find("form").trigger("submit.prevent");

    expect(wrapper.text()).toContain("El motivo de la anulación es obligatorio.");
    expect(voidSale).not.toHaveBeenCalled();
  });

  it("limita el motivo a 200 caracteres como el backend", async () => {
    vi.mocked(getSale).mockResolvedValue(buildSale());
    const wrapper = await createWrapper();

    expect(wrapper.find("textarea").attributes("maxlength")).toBe("200");
    expect(wrapper.text()).toContain("0/200");
  });

  it("envía el motivo sin espacios y emite la venta anulada", async () => {
    vi.mocked(getSale).mockResolvedValue(buildSale());
    const voided = buildSale({ estado: "anulada", motivo_anulacion: "Cobro duplicado" });
    vi.mocked(voidSale).mockResolvedValue(voided);
    const wrapper = await createWrapper();

    await wrapper.find("textarea").setValue("  Cobro duplicado  ");
    await wrapper.find("form").trigger("submit.prevent");
    await flushPromises();

    expect(voidSale).toHaveBeenCalledWith(SALE_ID, { motivo: "Cobro duplicado" });
    expect(wrapper.emitted("voided")?.[0]).toEqual([voided]);
  });

  it("deshabilita los botones mientras se procesa la anulación", async () => {
    vi.mocked(getSale).mockResolvedValue(buildSale());
    vi.mocked(voidSale).mockReturnValue(new Promise(() => {}));
    const wrapper = await createWrapper();

    await wrapper.find("textarea").setValue("Error de captura");
    await wrapper.find("form").trigger("submit.prevent");

    expect(wrapper.find(".btn-danger").text()).toBe("Anulando…");
    expect(wrapper.find(".btn-danger").attributes("disabled")).toBeDefined();
    expect(wrapper.find(".btn-secondary").attributes("disabled")).toBeDefined();
  });

  it("muestra la información de anulación si la venta ya estaba anulada", async () => {
    vi.mocked(getSale).mockResolvedValue(
      buildSale({ estado: "anulada", motivo_anulacion: "Devolución total", anulada_en: "2026-10-21T10:00:00Z" }),
    );
    const wrapper = await createWrapper();

    expect(wrapper.find("[data-testid='already-voided']").text()).toContain("Devolución total");
    expect(wrapper.find("form").exists()).toBe(false);
  });

  it("no permite anular ventas que no estén completadas", async () => {
    vi.mocked(getSale).mockResolvedValue(buildSale({ estado: "borrador" }));
    const wrapper = await createWrapper();

    expect(wrapper.text()).toContain("Solo se pueden anular ventas completadas.");
    expect(wrapper.find("form").exists()).toBe(false);
  });

  it("traduce el error cuando otro usuario anuló la venta primero", async () => {
    vi.mocked(getSale).mockResolvedValue(buildSale());
    vi.mocked(voidSale).mockRejectedValue(new ApiError(400, "Sale is already voided"));
    const wrapper = await createWrapper();

    await wrapper.find("textarea").setValue("Error de captura");
    await wrapper.find("form").trigger("submit.prevent");
    await flushPromises();

    expect(wrapper.text()).toContain("Esta venta ya fue anulada.");
    expect(wrapper.emitted("voided")).toBeFalsy();
  });

  it("informa cuando el usuario no tiene permisos", async () => {
    vi.mocked(getSale).mockResolvedValue(buildSale());
    vi.mocked(voidSale).mockRejectedValue(new ApiError(403, "Insufficient permissions"));
    const wrapper = await createWrapper();

    await wrapper.find("textarea").setValue("Error de captura");
    await wrapper.find("form").trigger("submit.prevent");
    await flushPromises();

    expect(wrapper.text()).toContain("No tienes permisos para anular ventas.");
  });

  it("muestra un error si la venta no existe", async () => {
    vi.mocked(getSale).mockRejectedValue(new ApiError(404, "Sale not found"));
    const wrapper = await createWrapper();

    expect(wrapper.text()).toContain("La venta no existe o ya no está disponible.");
  });

  it("emite close al cancelar", async () => {
    vi.mocked(getSale).mockResolvedValue(buildSale());
    const wrapper = await createWrapper();

    await wrapper.find(".btn-secondary").trigger("click");

    expect(wrapper.emitted("close")).toBeTruthy();
  });
});
