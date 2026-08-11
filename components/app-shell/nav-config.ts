import {
  LayoutDashboard,
  Users,
  Package,
  Truck,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react"
import type { ModuleKey } from "@/lib/rbac"

export type NavItem = {
  label: string
  href: string
  icon: LucideIcon
  module: ModuleKey
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard, module: "dashboard" },
  { label: "Customers", href: "/customers", icon: Users, module: "customers" },
  { label: "Products", href: "/products", icon: Package, module: "products" },
  { label: "Challans", href: "/challans", icon: Truck, module: "challans" },
  { label: "Team", href: "/users", icon: ShieldCheck, module: "users" },
]
