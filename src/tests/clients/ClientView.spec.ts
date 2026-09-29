import {
  beforeEach,
  describe,
  it,
  expect,
  vi,
} from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";

import ClientView from "@/features/clients/views/ClientView.vue";

const mocks = vi.hoisted(() => ({
  fetchClients: vi.fn(),
  getApiErrorMessage: vi.fn(),
}));

vi.mock("@/features/clients/api", () => ({
  fetchClients: mocks.fetchClients,
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

describe("ClientView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.fetchClients.mockResolvedValue([]);
    mocks.getApiErrorMessage.mockReturnValue(
      "Error al cargar clientes",
    );
  });

  it("renderiza la vista de clientes", async () => {
    const wrapper = createWrapper();

    await waitForLoad();

    expect(wrapper.text()).toContain("Clientes");
    expect(wrapper.text()).toContain("Nuevo Cliente");
  });

  it("muestra mensaje cuando no hay clientes", async () => {
    const wrapper = createWrapper();

    await waitForLoad();

    expect(wrapper.text()).toContain(
      "No hay clientes encontrados.",
    );
  });

  it("abre el modal para crear cliente", async () => {
    const wrapper = createWrapper();

    await waitForLoad();

    await wrapper.find(".btn-add").trigger("click");

    expect(wrapper.text()).toContain("Modal Cliente");
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
});