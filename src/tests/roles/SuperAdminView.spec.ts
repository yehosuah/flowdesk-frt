import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { defineComponent, nextTick } from "vue";

import SuperAdminView from "@/features/roles/views/SuperAdminView.vue";
import { ApiError } from "@/services/apiClient";
import type { CompanyResponse } from "@/features/roles/api";

const mocks = vi.hoisted(() => ({
  fetchCompanies: vi.fn(),
  fetchEmployees: vi.fn(),
}));

vi.mock("@/features/roles/api", () => ({
  fetchCompanies: mocks.fetchCompanies,
}));

vi.mock("@/features/employees/api", () => ({
  fetchEmployees: mocks.fetchEmployees,
}));

vi.mock("@/services/apiClient", () => ({
  ApiError: class ApiError extends Error {
    status: number;

    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  },
  getApiErrorMessage: vi.fn((error: unknown) =>
    error instanceof Error ? error.message : "Error",
  ),
}));

const newCompany: CompanyResponse = {
  id: "c-99",
  name: "Empresa Nueva",
  schema_name: "tenant_nueva",
  is_active: true,
  created_at: "2026-10-27T10:00:00",
};

// Simulación del modal: emite la empresa que devolvería el backend.
vi.mock("@/features/roles/components/CreateCompanyModal.vue", () => ({
  default: defineComponent({
    name: "CreateCompanyModal",
    emits: ["created", "close"],
    template: `
      <div data-testid="create-company-modal">
        <button
          data-testid="confirm-create-company"
          @click="$emit('created', {
            id: 'c-99',
            name: 'Empresa Nueva',
            schema_name: 'tenant_nueva',
            is_active: true,
            created_at: '2026-10-27T10:00:00'
          }); $emit('close')"
        >
          Crear
        </button>
      </div>
    `,
  }),
}));

const companies: CompanyResponse[] = [
  {
    id: "c-1",
    name: "Ferretería Central",
    schema_name: "tenant_ferreteria",
    is_active: true,
    created_at: "2026-10-20T10:00:00",
  },
  {
    id: "c-2",
    name: "Librería Norte",
    schema_name: "tenant_libreria",
    is_active: false,
    created_at: "2026-10-10T10:00:00",
  },
];

async function createWrapper() {
  const wrapper = mount(SuperAdminView);
  await flushPromises();
  return wrapper;
}

describe("SuperAdminView", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();

    mocks.fetchCompanies.mockResolvedValue(
      companies.map((company) => ({ ...company })),
    );
    mocks.fetchEmployees.mockResolvedValue([]);
  });

  it("renderiza correctamente la vista", async () => {
    const wrapper = await createWrapper();

    expect(wrapper.text()).toContain("Manejo de cuentas");
    expect(wrapper.text()).toContain("Crear empresa");
    expect(wrapper.text()).toContain("Negocios");
    expect(wrapper.text()).toContain("Usuarios");
  });

  it("muestra mensaje cuando no existen empresas", async () => {
    mocks.fetchCompanies.mockResolvedValue([]);

    const wrapper = await createWrapper();

    expect(wrapper.text()).toContain("No hay empresas registradas.");
  });

  it("abre el modal para crear empresa", async () => {
    const wrapper = await createWrapper();

    await wrapper.find(".btn-add").trigger("click");

    expect(
      wrapper.find("[data-testid='create-company-modal']").exists()
    ).toBe(true);
  });

  it("permite cambiar a la pestaña usuarios", async () => {
    const wrapper = await createWrapper();

    const botones = wrapper.findAll(".btn");

    await botones[1].trigger("click");

    expect(botones[1].classes()).toContain("activo");
  });

  it("muestra mensaje cuando no hay usuarios", async () => {
    const wrapper = await createWrapper();

    const botones = wrapper.findAll(".btn");

    await botones[1].trigger("click");

    await flushPromises();
    await nextTick();

    expect(wrapper.text()).toContain("No hay usuarios para mostrar.");
  });
});

describe("SCRUM-725: empresas desde el backend", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();

    mocks.fetchCompanies.mockResolvedValue(
      companies.map((company) => ({ ...company })),
    );
    mocks.fetchEmployees.mockResolvedValue([]);
  });

  it("carga las empresas registradas al abrir la vista", async () => {
    const wrapper = await createWrapper();

    expect(mocks.fetchCompanies).toHaveBeenCalledTimes(1);
    expect(wrapper.findAll(".item")).toHaveLength(2);
    expect(wrapper.text()).toContain("Ferretería Central");
    expect(wrapper.text()).toContain("Librería Norte");
    expect(wrapper.text()).toContain("2 negocios registrados");
  });

  it("muestra el estado de cada empresa", async () => {
    const wrapper = await createWrapper();

    const estados = wrapper.findAll(".business-status");

    expect(estados[0].text()).toBe("Activa");
    expect(estados[1].text()).toBe("Inactiva");
  });

  it("muestra un indicador mientras carga las empresas", async () => {
    mocks.fetchCompanies.mockReturnValue(new Promise(() => {}));

    const wrapper = mount(SuperAdminView);
    await nextTick();

    expect(
      wrapper.find("[data-test='companies-loading']").exists(),
    ).toBe(true);
    expect(wrapper.text()).not.toContain("negocios registrados");
  });

  it("muestra el error y permite reintentar la carga", async () => {
    mocks.fetchCompanies.mockRejectedValueOnce(
      new ApiError(500, "Error del servidor"),
    );

    const wrapper = await createWrapper();

    expect(
      wrapper.find("[data-test='companies-error']").text(),
    ).toContain("Error del servidor");

    await wrapper.find("[data-test='companies-error'] .btn-retry").trigger("click");
    await flushPromises();

    expect(mocks.fetchCompanies).toHaveBeenCalledTimes(2);
    expect(wrapper.find("[data-test='companies-error']").exists()).toBe(false);
    expect(wrapper.findAll(".item")).toHaveLength(2);
  });

  it("agrega al inicio la empresa recién creada", async () => {
    const wrapper = await createWrapper();

    await wrapper.find(".btn-add").trigger("click");
    await wrapper.find("[data-testid='confirm-create-company']").trigger("click");

    const items = wrapper.findAll(".item");

    expect(items).toHaveLength(3);
    expect(items[0].text()).toContain(newCompany.name);
    expect(wrapper.text()).toContain("Empresa creada");
  });
});

describe("SCRUM-726: sin dependencia de sessionStorage", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();

    mocks.fetchCompanies.mockResolvedValue(
      companies.map((company) => ({ ...company })),
    );
    mocks.fetchEmployees.mockResolvedValue([]);
  });

  it("ignora empresas antiguas guardadas en sessionStorage", async () => {
    sessionStorage.setItem(
      "flowdesk.createdCompanies",
      JSON.stringify([{ ...newCompany, name: "Empresa de otra sesión" }]),
    );

    const wrapper = await createWrapper();

    expect(wrapper.text()).not.toContain("Empresa de otra sesión");
    expect(wrapper.findAll(".item")).toHaveLength(2);
  });

  it("no guarda las empresas creadas en sessionStorage", async () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");

    const wrapper = await createWrapper();

    await wrapper.find(".btn-add").trigger("click");
    await wrapper.find("[data-testid='confirm-create-company']").trigger("click");

    expect(setItem).not.toHaveBeenCalled();

    setItem.mockRestore();
  });

  it("vuelve a consultar el backend en cada visita", async () => {
    const first = await createWrapper();
    first.unmount();

    await createWrapper();

    expect(mocks.fetchCompanies).toHaveBeenCalledTimes(2);
  });
});

describe("SCRUM-728: permisos del superadministrador", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.fetchCompanies.mockResolvedValue([]);
    mocks.fetchEmployees.mockResolvedValue([]);
  });

  it("explica que solo el superadmin puede consultar empresas ante un 403", async () => {
    mocks.fetchCompanies.mockRejectedValueOnce(
      new ApiError(403, "Insufficient permissions"),
    );

    const wrapper = await createWrapper();

    expect(
      wrapper.find("[data-test='companies-error']").text(),
    ).toContain("Solo el superadministrador puede consultar las empresas.");
  });

  it("explica que solo el superadmin puede consultar usuarios ante un 403", async () => {
    mocks.fetchEmployees.mockRejectedValueOnce(
      new ApiError(403, "Insufficient permissions"),
    );

    const wrapper = await createWrapper();

    await wrapper.findAll(".btn")[1].trigger("click");
    await flushPromises();

    expect(
      wrapper.find("[data-test='users-error']").text(),
    ).toContain("Solo el superadministrador puede consultar los usuarios.");
  });

  it("permite reintentar la carga de usuarios tras un error", async () => {
    mocks.fetchEmployees.mockRejectedValueOnce(
      new ApiError(500, "Error del servidor"),
    );

    const wrapper = await createWrapper();

    await wrapper.findAll(".btn")[1].trigger("click");
    await flushPromises();

    await wrapper.find("[data-test='users-error'] .btn-retry").trigger("click");
    await flushPromises();

    expect(mocks.fetchEmployees).toHaveBeenCalledTimes(2);
    expect(wrapper.text()).toContain("No hay usuarios para mostrar.");
  });
});
