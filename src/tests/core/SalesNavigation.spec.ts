import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { enableAutoUnmount, flushPromises, mount } from "@vue/test-utils";
import { defineComponent } from "vue";
import { createMemoryHistory, createRouter } from "vue-router";
import { Receipt, ShoppingCart } from "lucide-vue-next";

import MainLayout from "@/app/layouts/MainLayout.vue";
import { i18n } from "@/i18n";

// SCRUM-790 y SCRUM-791: acceso a Ventas desde el menú lateral según el rol
// de la sesión y en pantallas móviles. Usa el layout real, el router real y
// los textos reales; solo se simulan el tutorial, las alertas y el chat.

const auth = vi.hoisted(() => ({ role: "employee" }));

vi.mock("@/composables/useAuth", async () => {
  const { canAccessRoute } = await import("@/utils/permissions");
  return {
    useAuth: () => ({
      canAccessRoute: (routeName: string) => canAccessRoute(auth.role, routeName),
    }),
  };
});

vi.mock("@/features/onboarding/composables/useOnboarding", async () => {
  const { ref } = await import("vue");
  return {
    useOnboarding: () => ({
      isWelcomeVisible: ref(false),
      skipTour: () => {},
      startTour: () => {},
      resetOnboarding: () => {},
    }),
  };
});

vi.mock("@/features/notifications/useInventoryAlerts", async () => {
  const { ref } = await import("vue");
  return { useInventoryAlerts: () => ({ count: ref(0) }) };
});

enableAutoUnmount(afterEach);

const ROUTE_NAMES = [
  "inventory", "sales", "inventorymovement", "tasks", "tasks-calendar",
  "superAdmin", "analytics", "employees", "suppliers", "clients",
  "reports", "tax-dashboard", "profile", "login",
];

const Blank = defineComponent({ template: "<div />" });

async function mountLayout(path = "/inventory") {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: ROUTE_NAMES.map((name) => ({ path: `/${name}`, name, component: Blank })),
  });

  router.push(path);
  await router.isReady();

  const wrapper = mount(MainLayout, {
    global: {
      plugins: [router, i18n],
      stubs: {
        ChatWidget: true,
        ChatPanel: true,
        WelcomeModal: true,
        NotificationBell: true,
      },
    },
  });

  await flushPromises();

  return { wrapper, router };
}

function navItems(wrapper: Awaited<ReturnType<typeof mountLayout>>["wrapper"]) {
  return wrapper.findAll(".sidebar__link").map((link) => link.attributes("data-nav-item"));
}

function setViewportWidth(width: number) {
  Object.defineProperty(window, "innerWidth", { configurable: true, writable: true, value: width });
}

beforeEach(() => {
  auth.role = "employee";
  i18n.global.locale.value = "es";
  document.body.style.overflow = "";
  setViewportWidth(1280);
});

describe("SCRUM-790: visibilidad de Ventas según el rol", () => {
  it.each([
    ["employee", "cajero"],
    ["manager", "supervisor"],
    ["admin", "administrador"],
  ])("%s (%s) ve Ventas justo después de Inventario", async (role) => {
    auth.role = role;

    const { wrapper } = await mountLayout();
    const sales = wrapper.find("[data-nav-item='sales']");

    expect(sales.exists()).toBe(true);
    expect(sales.text()).toBe("Ventas");
    expect(sales.attributes("href")).toBe("/sales");
    expect(navItems(wrapper).slice(0, 2)).toEqual(["inventory", "sales"]);
  });

  it("el superadministrador no ve Ventas en el menú", async () => {
    auth.role = "superadmin";

    const { wrapper } = await mountLayout("/superAdmin");

    expect(wrapper.find("[data-nav-item='sales']").exists()).toBe(false);
    expect(navItems(wrapper)).toContain("superAdmin");
  });

  it("Ventas tiene un icono propio, distinto al de Tributación", async () => {
    auth.role = "admin";

    const { wrapper } = await mountLayout();
    const sales = wrapper.find("[data-nav-item='sales']");
    const taxation = wrapper.find("[data-nav-item='tax-dashboard']");

    expect(sales.findComponent(ShoppingCart).exists()).toBe(true);
    expect(sales.findComponent(Receipt).exists()).toBe(false);
    expect(taxation.findComponent(Receipt).exists()).toBe(true);
  });

  it("marca Ventas como página actual solo en su ruta", async () => {
    const { wrapper } = await mountLayout("/sales");

    const sales = wrapper.find("[data-nav-item='sales']");
    const movements = wrapper.find("[data-nav-item='inventorymovement']");

    expect(sales.classes()).toContain("sidebar__link--active");
    expect(sales.attributes("aria-current")).toBe("page");
    expect(movements.classes()).not.toContain("sidebar__link--active");
  });
});

describe("SCRUM-791: navegación a Ventas en pantallas móviles", () => {
  it("el botón de menú abre el menú lateral y bloquea el scroll de la página", async () => {
    setViewportWidth(375);

    const { wrapper } = await mountLayout();

    expect(wrapper.find(".sidebar").classes()).not.toContain("sidebar--open");

    await wrapper.find(".mobile-menu-button").trigger("click");
    await flushPromises();

    expect(wrapper.find(".sidebar").classes()).toContain("sidebar--open");
    expect(wrapper.find(".sidebar-overlay").exists()).toBe(true);
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("tocar Ventas navega al módulo y cierra el menú", async () => {
    setViewportWidth(375);

    const { wrapper, router } = await mountLayout();

    await wrapper.find(".mobile-menu-button").trigger("click");
    await flushPromises();

    await wrapper.find("[data-nav-item='sales']").trigger("click");
    await flushPromises();

    expect(router.currentRoute.value.name).toBe("sales");
    expect(wrapper.find(".sidebar").classes()).not.toContain("sidebar--open");
    expect(document.body.style.overflow).toBe("");
  });

  it("tocar fuera del menú lo cierra sin cambiar de página", async () => {
    setViewportWidth(375);

    const { wrapper, router } = await mountLayout();

    await wrapper.find(".mobile-menu-button").trigger("click");
    await flushPromises();

    await wrapper.find(".sidebar-overlay").trigger("click");
    await flushPromises();

    expect(wrapper.find(".sidebar").classes()).not.toContain("sidebar--open");
    expect(router.currentRoute.value.name).toBe("inventory");
  });

  it("en escritorio abrir el menú no bloquea el scroll de la página", async () => {
    setViewportWidth(1280);

    const { wrapper } = await mountLayout();

    await wrapper.find(".mobile-menu-button").trigger("click");
    await flushPromises();

    expect(document.body.style.overflow).toBe("");
  });

  it("el botón de menú tiene un nombre accesible", async () => {
    const { wrapper } = await mountLayout();

    expect(wrapper.find(".mobile-menu-button").attributes("aria-label")).toBe("Abrir menú");
  });
});
