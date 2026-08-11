export type Role = "Admin" | "Sales" | "Inventory Manager"

export const ROLES: Role[] = ["Admin", "Sales", "Inventory Manager"]

export type ModuleKey = "dashboard" | "customers" | "products" | "challans" | "users"

// Which roles may access which module.
const ACCESS: Record<ModuleKey, Role[]> = {
  dashboard: ["Admin", "Sales", "Inventory Manager"],
  customers: ["Admin", "Sales"],
  products: ["Admin", "Inventory Manager"],
  challans: ["Admin", "Sales"],
  users: ["Admin"],
}

export function canAccess(role: string | undefined | null, module: ModuleKey): boolean {
  if (!role) return false
  return ACCESS[module]?.includes(role as Role) ?? false
}

// Write permissions: Sales can't edit inventory levels directly, etc.
export function canWrite(role: string | undefined | null, module: ModuleKey): boolean {
  return canAccess(role, module)
}

export function can(role: string | undefined | null, module: ModuleKey): boolean {
  return canAccess(role, module)
}

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  Admin: "Full access to every module",
  Sales: "Customers (CRM) and Sales Challans",
  "Inventory Manager": "Products and inventory management",
}
