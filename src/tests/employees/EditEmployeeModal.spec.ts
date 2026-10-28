import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises, type VueWrapper } from "@vue/test-utils";

import EditEmployeeModal from "@/features/employees/components/EditEmployeeModal.vue";
import { ApiError } from "@/services/apiClient";
import type { UserResponse } from "@/features/employees/api";

const mocks = vi.hoisted(() => ({
  fetchRoles: vi.fn(),
  updateEmployee: vi.fn(),
  updateEmployeeStatus: vi.fn(),
}));

vi.mock("@/features/employees/api", () => ({
  fetchRoles: mocks.fetchRoles,
  updateEmployee: mocks.updateEmployee,
  updateEmployeeStatus: mocks.updateEmployeeStatus,
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

const employee: UserResponse = {
  id: "u-1",
  username: "jperez",
  email: "jperez@empresa.com",
  role_id: 3,
  role_name: "employee",
  company_id: "c-1",
  is_active: true,
  created_at: "2026-10-01T10:00:00",
};

async function createWrapper() {
  const wrapper = mount(EditEmployeeModal, {
    props: { employee },
    global: {
      stubs: {
        teleport: true,
      },
    },
  });

  await flushPromises();

  return wrapper;
}

async function selectRole(wrapper: VueWrapper, name: string) {
  const option = wrapper
    .findAll(".custom-select__option")
    .find((button) => button.text() === name);

  await option!.trigger("click");
}

async function submit(wrapper: VueWrapper) {
  await wrapper.find("form").trigger("submit");
  await flushPromises();
}

describe("SCRUM-727: actualización de empleados en una sola operación", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.fetchRoles.mockResolvedValue([
      { id: 1, name: "admin", description: null },
      { id: 2, name: "manager", description: null },
      { id: 3, name: "employee", description: null },
      { id: 4, name: "superadmin", description: null },
    ]);

    mocks.updateEmployee.mockResolvedValue({ ...employee });
  });

  it("envía rol y estado juntos en una sola llamada", async () => {
    const wrapper = await createWrapper();

    await selectRole(wrapper, "manager");
    await wrapper.find("input[type='checkbox']").setValue(false);
    await submit(wrapper);

    expect(mocks.updateEmployee).toHaveBeenCalledTimes(1);
    expect(mocks.updateEmployee).toHaveBeenCalledWith("u-1", {
      role_id: 2,
      is_active: false,
    });
    expect(mocks.updateEmployeeStatus).not.toHaveBeenCalled();
  });

  it("envía solo los campos que cambiaron", async () => {
    const wrapper = await createWrapper();

    await wrapper.find("input[type='checkbox']").setValue(false);
    await submit(wrapper);

    expect(mocks.updateEmployee).toHaveBeenCalledWith("u-1", {
      is_active: false,
    });
  });

  it("guarda el nombre de usuario sin espacios al inicio ni al final", async () => {
    const wrapper = await createWrapper();

    await wrapper.find("input[type='text']").setValue("  jperez2  ");
    await submit(wrapper);

    expect(mocks.updateEmployee).toHaveBeenCalledWith("u-1", {
      username: "jperez2",
    });
  });

  it("notifica la actualización y cierra el modal al guardar", async () => {
    const wrapper = await createWrapper();

    await selectRole(wrapper, "admin");
    await submit(wrapper);

    expect(wrapper.emitted("updated")).toHaveLength(1);
    expect(wrapper.emitted("close")).toHaveLength(1);
  });

  it("indica que no se guardó ningún cambio cuando el backend rechaza", async () => {
    mocks.updateEmployee.mockRejectedValueOnce(
      new ApiError(400, "Cannot change your own status"),
    );

    const wrapper = await createWrapper();

    await selectRole(wrapper, "manager");
    await wrapper.find("input[type='checkbox']").setValue(false);
    await submit(wrapper);

    expect(wrapper.find(".alert-error").text()).toContain(
      "No se guardó ningún cambio. No puedes cambiar tu propio estado.",
    );
    expect(wrapper.emitted("updated")).toBeUndefined();
    expect(wrapper.emitted("close")).toBeUndefined();
  });

  it("traduce el error de nombre de usuario duplicado", async () => {
    mocks.updateEmployee.mockRejectedValueOnce(
      new ApiError(400, "Username already registered"),
    );

    const wrapper = await createWrapper();

    await wrapper.find("input[type='text']").setValue("ocupado");
    await submit(wrapper);

    expect(wrapper.find(".alert-error").text()).toContain(
      "Ese nombre de usuario ya está registrado.",
    );
  });

  it("no afirma que nada se guardó si no hubo respuesta del servidor", async () => {
    mocks.updateEmployee.mockRejectedValueOnce(
      new ApiError(408, "La solicitud tardo demasiado tiempo. Intenta de nuevo."),
    );

    const wrapper = await createWrapper();

    await selectRole(wrapper, "manager");
    await submit(wrapper);

    const message = wrapper.find(".alert-error").text();

    expect(message).not.toContain("No se guardó ningún cambio");
    expect(message).toContain("Recarga la lista para confirmar");
  });

  it("explica la falta de permisos ante un 403", async () => {
    mocks.updateEmployee.mockRejectedValueOnce(
      new ApiError(403, "Insufficient permissions"),
    );

    const wrapper = await createWrapper();

    await selectRole(wrapper, "manager");
    await submit(wrapper);

    expect(wrapper.find(".alert-error").text()).toContain(
      "No tienes permisos para modificar este empleado.",
    );
  });

  it("valida el largo máximo del nombre de usuario antes de enviar", async () => {
    const wrapper = await createWrapper();

    await wrapper.find("input[type='text']").setValue("a".repeat(51));
    await submit(wrapper);

    expect(mocks.updateEmployee).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain(
      "El nombre de usuario no puede superar 50 caracteres.",
    );
  });

  it("no ofrece el rol de superadministrador", async () => {
    const wrapper = await createWrapper();

    const options = wrapper
      .findAll(".custom-select__option")
      .map((button) => button.text());

    expect(options).toContain("manager");
    expect(options).not.toContain("superadmin");
  });

  it("cierra sin llamar al backend si no hubo cambios", async () => {
    const wrapper = await createWrapper();

    await submit(wrapper);

    expect(mocks.updateEmployee).not.toHaveBeenCalled();
    expect(wrapper.emitted("close")).toHaveLength(1);
  });
});
