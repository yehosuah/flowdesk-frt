import { describe, it, expect, vi } from "vitest";
import { mount, flushPromises, type VueWrapper } from "@vue/test-utils";

import CreateCompanyModal from "@/features/roles/components/CreateCompanyModal.vue";
import { ApiError } from "@/services/apiClient";

const mocks = vi.hoisted(() => ({
  createCompany: vi.fn(),
}));

vi.mock("@/features/roles/api", () => ({
  createCompany: mocks.createCompany,
}));

vi.mock("@/services/apiClient", () => ({
  ApiError: class ApiError extends Error {
    status: number;

    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  },
  getApiErrorMessage: vi.fn(() => "Error"),
}));

async function fillAndSubmit(wrapper: VueWrapper) {
  const inputs = wrapper.findAll("input");

  await inputs[0].setValue("  Mi Empresa  ");
  await inputs[1].setValue("Admin@Empresa.com");
  await inputs[2].setValue("adminempresa");

  await wrapper.find("form").trigger("submit.prevent");
  await flushPromises();
}

function createWrapper() {
  return mount(CreateCompanyModal, {
    global: {
      stubs: {
        teleport: true,
      },
    },
  });
}

describe("CreateCompanyModal", () => {
  it("renderiza correctamente el modal", () => {
    const wrapper = createWrapper();

    expect(wrapper.exists()).toBe(true);
    expect(wrapper.text()).toContain("Crear empresa");
    expect(wrapper.text()).toContain("Cancelar");
    expect(wrapper.text()).toContain("Crear empresa");
  });

  it("muestra error cuando el nombre de empresa está vacío", async () => {
    const wrapper = createWrapper();

    await wrapper.find("form").trigger("submit.prevent");

    expect(wrapper.text()).toContain(
      "El nombre de empresa es obligatorio."
    );
  });

  it("muestra error cuando el correo del administrador está vacío", async () => {
    const wrapper = createWrapper();

    const inputs = wrapper.findAll("input");

    await inputs[0].setValue("Mi Empresa");

    await wrapper.find("form").trigger("submit.prevent");

    expect(wrapper.text()).toContain(
      "El correo del admin es obligatorio."
    );
  });

  it("muestra error cuando el correo tiene un formato inválido", async () => {
    const wrapper = createWrapper();

    const inputs = wrapper.findAll("input");

    await inputs[0].setValue("Mi Empresa");
    await inputs[1].setValue("correoinvalido");

    await wrapper.find("form").trigger("submit.prevent");

    expect(wrapper.text()).toContain(
      "Ingresa un correo valido."
    );
  });

  it("muestra error cuando el usuario administrador está vacío", async () => {
    const wrapper = createWrapper();

    const inputs = wrapper.findAll("input");

    await inputs[0].setValue("Mi Empresa");
    await inputs[1].setValue("admin@empresa.com");

    await wrapper.find("form").trigger("submit.prevent");

    expect(wrapper.text()).toContain(
      "El usuario admin es obligatorio."
    );
  });

  it("emite el evento close al presionar cancelar", async () => {
    const wrapper = createWrapper();

    await wrapper.find(".btn-secondary").trigger("click");

    expect(wrapper.emitted("close")).toBeTruthy();
  });

  it("renderiza correctamente el botón crear empresa", () => {
    const wrapper = createWrapper();

    expect(wrapper.find(".btn-primary").exists()).toBe(true);
  });

  it("crea la empresa con los datos normalizados y la emite", async () => {
    const company = {
      id: "c-1",
      name: "Mi Empresa",
      schema_name: "tenant_mi_empresa",
      is_active: true,
      created_at: "2026-10-27T10:00:00",
    };

    mocks.createCompany.mockResolvedValueOnce(company);

    const wrapper = createWrapper();

    await fillAndSubmit(wrapper);

    expect(mocks.createCompany).toHaveBeenCalledWith({
      name: "Mi Empresa",
      admin_email: "admin@empresa.com",
      admin_username: "adminempresa",
    });
    expect(wrapper.emitted("created")?.[0]).toEqual([company]);
    expect(wrapper.emitted("close")).toBeTruthy();
  });

  it("SCRUM-728: explica que solo el superadmin puede crear empresas ante un 403", async () => {
    mocks.createCompany.mockRejectedValueOnce(
      new ApiError(403, "Insufficient permissions"),
    );

    const wrapper = createWrapper();

    await fillAndSubmit(wrapper);

    expect(wrapper.text()).toContain(
      "Solo el superadministrador puede crear empresas.",
    );
    expect(wrapper.emitted("created")).toBeUndefined();
  });
});