import { describe, it, expect } from "vitest";

import { can, canAccessRoute } from "@/utils/permissions";

describe("permissions", () => {
  describe("acceso a páginas (canAccessRoute)", () => {
    const cases: Array<[string, string[], string[]]> = [
    
      ["inventory", ["admin", "manager", "employee"], ["superadmin"]],
      ["inventorymovement", ["admin", "manager", "employee"], ["superadmin"]],
      ["tasks", ["admin", "manager", "employee"], ["superadmin"]],
      ["tasks-calendar", ["admin", "manager", "employee"], ["superadmin"]],
      ["analytics", ["admin", "manager"], ["employee", "superadmin"]],
      ["employees", ["admin"], ["manager", "employee", "superadmin"]],
      ["suppliers", ["admin", "manager"], ["employee", "superadmin"]],
      ["clients", ["admin", "manager"], ["employee", "superadmin"]],
      ["reports", ["admin"], ["manager", "employee", "superadmin"]],
      ["superAdmin", ["superadmin"], ["admin", "manager", "employee"]],
    ];

    it.each(cases)("%s", (route, allowed, denied) => {
      for (const role of allowed) {
        expect(canAccessRoute(role, route), `${role} debería entrar a ${route}`).toBe(true);
      }
      for (const role of denied) {
        expect(canAccessRoute(role, route), `${role} NO debería entrar a ${route}`).toBe(false);
      }
    });

    it("profile es accesible para cualquier sesión", () => {
      for (const role of ["superadmin", "admin", "manager", "employee"]) {
        expect(canAccessRoute(role, "profile")).toBe(true);
      }
    });

    it("sin rol no accede a nada protegido", () => {
      expect(canAccessRoute(null, "inventory")).toBe(false);
      expect(canAccessRoute(null, "reports")).toBe(false);
    });
  });

  describe("acciones de Movimiento de Inventario", () => {
    it("employee solo puede registrar venta", () => {
      expect(can("employee", "sales.create")).toBe(true);
      expect(can("employee", "movement.create")).toBe(false);
      expect(can("employee", "products.create")).toBe(false);
      expect(can("employee", "inventory.import")).toBe(false);
    });

    it("manager y admin pueden las 4 acciones", () => {
      for (const role of ["admin", "manager"]) {
        expect(can(role, "sales.create")).toBe(true);
        expect(can(role, "movement.create")).toBe(true);
        expect(can(role, "products.create")).toBe(true);
        expect(can(role, "inventory.import")).toBe(true);
      }
    });
  });

  describe("estado de proveedor / cliente (según backend)", () => {
    it("solo admin cambia el estado de un proveedor", () => {
      expect(can("admin", "suppliers.setStatus")).toBe(true);
      expect(can("manager", "suppliers.setStatus")).toBe(false);
    });

    it("manager sí puede editar proveedores", () => {
      expect(can("manager", "suppliers.edit")).toBe(true);
    });

    it("manager sí puede cambiar el estado de un cliente", () => {
      expect(can("manager", "clients.setStatus")).toBe(true);
      expect(can("employee", "clients.setStatus")).toBe(false);
    });
  });
});
