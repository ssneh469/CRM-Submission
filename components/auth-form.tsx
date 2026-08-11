"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { ROLES, ROLE_DESCRIPTIONS, type Role } from "@/lib/rbac"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Boxes } from "lucide-react"

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<Role>("Sales")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const isSignUp = mode === "sign-up"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = isSignUp
      ? await authClient.signUp.email({ email, password, name, role } as never)
      : await authClient.signIn.email({ email, password })

    setLoading(false)

    if (error) {
      setError(error.message ?? "Something went wrong")
      return
    }

    router.push("/")
    router.refresh()
  }

  return (
    <main className="min-h-svh grid lg:grid-cols-2 bg-background">
      {/* Brand / info panel */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-sidebar p-10 border-r border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Boxes className="size-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Northwind ERP</span>
        </div>
        <div className="max-w-md">
          <h2 className="text-3xl font-semibold tracking-tight text-balance leading-tight">
            Run customers, inventory, and dispatch from one clean console.
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            A mini ERP + CRM portal. Track leads through the sales pipeline, manage
            stock levels with low-stock alerts, and generate delivery challans that
            update inventory automatically.
          </p>
          <ul className="mt-8 space-y-3 text-sm">
            {[
              "Role-based access for Admin, Sales & Inventory",
              "Live stock movements and low-stock alerts",
              "Auto-numbered challans that decrement stock",
            ].map((line) => (
              <li key={line} className="flex items-center gap-3 text-muted-foreground">
                <span className="size-1.5 rounded-full bg-primary" />
                {line}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-muted-foreground">Full Stack Developer Case Study</p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Boxes className="size-5" />
            </div>
            <span className="text-lg font-semibold tracking-tight">Northwind ERP</span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight">
            {isSignUp ? "Create your account" : "Welcome back"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            {isSignUp
              ? "Choose a role to explore the portal's permissions."
              : "Sign in to continue to the portal."}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
            {isSignUp && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                  placeholder="Jane Doe"
                />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@company.com"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete={isSignUp ? "new-password" : "current-password"}
                placeholder={isSignUp ? "At least 8 characters" : "••••••••"}
              />
            </div>

            {isSignUp && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                  <SelectTrigger id="role" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">{ROLE_DESCRIPTIONS[role]}</p>
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" disabled={loading} className="w-full mt-1">
              {loading ? "Please wait..." : isSignUp ? "Create account" : "Sign in"}
            </Button>
          </form>

          <p className="text-sm text-muted-foreground text-center mt-6">
            {isSignUp ? "Already have an account? " : "Don't have an account? "}
            <Link
              href={isSignUp ? "/sign-in" : "/sign-up"}
              className="text-foreground font-medium underline-offset-4 hover:underline"
            >
              {isSignUp ? "Sign in" : "Sign up"}
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
