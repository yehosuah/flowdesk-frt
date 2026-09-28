import {
  beforeEach,
  describe,
  it,
  expect,
  vi,
} from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";

import EmployeeView from "@/features/employees/views/EmployeeView.vue";

const mocks = vi.hoisted(() => ({
  fetchEmployees: vi.fn(),
  getApiErrorMessage: vi.fn(),
}));

vi.mock("@/features/employees/api", () => ({
  fetchEmployees: mocks.fetchEmployees,
}));

vi.mock("@/services/apiClient", () => ({
  getApiErrorMessage: mocks.getApiErrorMessage,
}));

vi.mock("@/features/employees/components/AddEmployeeModal.vue", () => ({
  default: {
    template: "<div>Mock AddEmployeeModal</div>",
  },
}));

function createWrapper() {
  return mount(EmployeeView);
}

async function waitForLoad() {
  await nextTick();
  await Promise.resolve();
  await nextTick();
}

describe("EmployeeView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.fetchEmployees.mockResolvedValue([]);
    mocks.getApiErrorMessage.mockReturnValue(
      "Error al cargar empleados",
    );
  });

  it("renderiza correctamente la vista de empleados", async () => {
    const wrapper = createWrapper();

    await waitForLoad();

    expect(wrapper.exists()).toBe(true);
    expect(wrapper.text()).toContain("Empleados");
    expect(wrapper.text()).toContain("Agregar empleado");
  });

  it("muestra mensaje cuando no hay empleados", async () => {
    const wrapper = createWrapper();

    await waitForLoad();

    expect(wrapper.text()).toContain(
      "No hay empleados registrados aún.",
    );
  });

  it("abre el modal al presionar agregar empleado", async () => {
    const wrapper = createWrapper();

    await waitForLoad();

    await wrapper.find(".btn-add").trigger("click");

    expect(wrapper.text()).toContain("Mock AddEmployeeModal");
  });

  it("muestra un error cuando falla la carga de empleados", async () => {
    mocks.fetchEmployees.mockRejectedValue(
      new Error("Backend no disponible"),
    );

    const wrapper = createWrapper();

    await waitForLoad();

    expect(mocks.getApiErrorMessage).toHaveBeenCalled();
    expect(wrapper.text()).toContain(
      "Error al cargar empleados",
    );
  });
});