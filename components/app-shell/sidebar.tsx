"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { Boxes, LogOut, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { authClient } from "@/lib/auth-client"
import { NAV_ITEMS } from "./nav-config"
import { canAccess } from "@/lib/rbac"
import { Button } from "@/components/ui/button"
import type { SessionUser } from "@/lib/session"

export function Sidebar({ user }: { user: SessionUser }) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const items = NAV_ITEMS.filter((item) => canAccess(user.role, item.module))

  const handleSignOut = async () => {
    await authClient.signOut()
    router.push("/sign-in")
    router.refresh()
  }

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href)

  const nav = (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const Icon = item.icon
        const active = isActive(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )

  const inner = (
    <>
      <div className="flex items-center gap-2.5 px-2 py-1">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Boxes className="size-4" />
        </div>
        <span className="font-semibold tracking-tight">Northwind ERP</span>
      </div>

      <div className="mt-6 flex-1">{nav}</div>

      <div className="border-t border-sidebar-border pt-3">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-secondary text-xs font-semibold uppercase">
            {user.name.slice(0, 2)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.role}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="mt-1 w-full justify-start text-muted-foreground hover:text-foreground"
        >
          <LogOut className="size-4" />
          Sign out
        </Button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-border bg-sidebar px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Boxes className="size-4" />
          </div>
          <span className="font-semibold tracking-tight">Northwind ERP</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setOpen((v) => !v)}>
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
          <span className="sr-only">Toggle menu</span>
        </Button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar p-4">
            {inner}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex h-svh w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-4 sticky top-0">
        {inner}
      </aside>
    </>
  )
}
