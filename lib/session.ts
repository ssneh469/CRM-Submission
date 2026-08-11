import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

export type SessionUser = {
  id: string
  name: string
  email: string
  role: string
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return null
  const u = session.user as { id: string; name: string; email: string; role?: string }
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role ?? "Sales",
  }
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser()
  if (!user) redirect("/sign-in")
  return user
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  return getSessionUser()
}
