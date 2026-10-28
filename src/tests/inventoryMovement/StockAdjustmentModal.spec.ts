import { describe, it, expect, vi, beforeEach } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";

import StockAdjustmentModal from "@/features/inventorymovement/components/StockAdjustmentModal.vue";
import { createMovement } from "@/features/inventorymovement/api";
import { ApiError } from "@/services/apiClient";

vi.mock("@/features/inventorymovement/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/inventorymovement/api")>()),
  createMovement: vi.fn(),
}));

const products = [
  { id: "p1", nombre: "Café 1lb", cantidad: 10, descripcion: "", precio: 50, stockMinimo: 2, proveedor: null, is_active: true },
  { id: "p2", nombre: "Taza", cantidad: 4, descripcion: "", precio: 25, stockMinimo: 1, proveedor: null, is_active: false },
];

function createWrapper() {
  return mount(StockAdjustmentModal, {
    props: { products },
    global: { stubs: { teleport: true } },
  });
}

async function fill(wrapper: ReturnType<typeof createWrapper>, productId: string, count: string, reason = "") {
  await wrapper.find("select").setValue(productId);
  await wrapper.find("input[type='number']").setValue(count);
  await wrapper.find("textarea").setValue(reason);
}

describe("StockAdjustmentModal (SCRUM-745)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lista también los productos inactivos para corregir su stock", () => {
    const wrapper = createWrapper();

    const options = wrapper.findAll("option").map(option => option.text());
    expect(options).toContain("Café 1lb");
    expect(options).toContain("Taza (inactivo)");
  });

  it("muestra el stock del sistema del producto seleccionado", async () => {
    const wrapper = createWrapper();

    expect(wrapper.find("[data-testid='system-stock']").text()).toBe("—");
    await wrapper.find("select").setValue("p1");

    expect(wrapper.find("[data-testid='system-stock']").text()).toBe("10");
  });

  it("valida producto, conteo y motivo obligatorios", async () => {
    const wrapper = createWrapper();

    await wrapper.find("form").trigger("submit.prevent");

    expect(wrapper.text()).toContain("Selecciona un producto.");
    expect(wrapper.text()).toContain("Ingresa la cantidad contada.");
    expect(wrapper.text()).toContain("El motivo del ajuste es obligatorio.");
    expect(createMovement).not.toHaveBeenCalled();
  });

  it("rechaza un conteo negativo", async () => {
    const wrapper = createWrapper();

    await fill(wrapper, "p1", "-1", "Conteo");
    await wrapper.find("form").trigger("submit.prevent");

    expect(wrapper.text()).toContain("El conteo no puede ser negativo.");
    expect(createMovement).not.toHaveBeenCalled();
  });

  it("no registra nada cuando el conteo coincide con el sistema", async () => {
    const wrapper = createWrapper();

    await fill(wrapper, "p1", "10", "Conteo mensual");
    expect(wrapper.find("[data-testid='adjustment-preview']").text()).toContain("No hay diferencia");

    await wrapper.find("form").trigger("submit.prevent");

    expect(wrapper.text()).toContain("El conteo coincide con el stock del sistema.");
    expect(createMovement).not.toHaveBeenCalled();
  });

  it("registra un ajuste positivo por la diferencia cuando sobra stock", async () => {
    vi.mocked(createMovement).mockResolvedValue({} as never);
    const wrapper = createWrapper();

    await fill(wrapper, "p1", "13", "  Conteo mensual  ");
    expect(wrapper.find("[data-testid='adjustment-preview']").text()).toContain("Ajuste positivo de 3 unidades");

    await wrapper.find("form").trigger("submit.prevent");
    await flushPromises();

    expect(createMovement).toHaveBeenCalledWith({
      producto_id: "p1",
      tipo_movimiento: "ajuste_positivo",
      cantidad: 3,
      motivo: "Conteo mensual",
    });
    expect(wrapper.emitted("created")).toBeTruthy();
    expect(wrapper.emitted("close")).toBeTruthy();
  });

  it("registra un ajuste negativo por la diferencia cuando falta stock", async () => {
    vi.mocked(createMovement).mockResolvedValue({} as never);
    const wrapper = createWrapper();

    await fill(wrapper, "p1", "7.5", "Producto dañado");
    expect(wrapper.find("[data-testid='adjustment-preview']").text()).toContain("Ajuste negativo de 2.5 unidades");

    await wrapper.find("form").trigger("submit.prevent");
    await flushPromises();

    expect(createMovement).toHaveBeenCalledWith({
      producto_id: "p1",
      tipo_movimiento: "ajuste_negativo",
      cantidad: 2.5,
      motivo: "Producto dañado",
    });
  });

  it("permite ajustar a cero un producto inactivo", async () => {
    vi.mocked(createMovement).mockResolvedValue({} as never);
    const wrapper = createWrapper();

    await fill(wrapper, "p2", "0", "Baja de existencias");
    expect(wrapper.text()).toContain("El producto está inactivo");

    await wrapper.find("form").trigger("submit.prevent");
    await flushPromises();

    expect(createMovement).toHaveBeenCalledWith({
      producto_id: "p2",
      tipo_movimiento: "ajuste_negativo",
      cantidad: 4,
      motivo: "Baja de existencias",
    });
  });

  it("muestra un mensaje claro si el stock cambió antes de guardar", async () => {
    vi.mocked(createMovement).mockRejectedValue(new ApiError(400, "Insufficient stock for this movement"));
    const wrapper = createWrapper();

    await fill(wrapper, "p1", "1", "Conteo");
    await wrapper.find("form").trigger("submit.prevent");
    await flushPromises();

    expect(wrapper.text()).toContain("El stock cambió desde que se cargó la página.");
    expect(wrapper.emitted("created")).toBeFalsy();
  });

  it("emite close al cancelar", async () => {
    const wrapper = createWrapper();

    await wrapper.find(".btn-secondary").trigger("click");

    expect(wrapper.emitted("close")).toBeTruthy();
  });
});
