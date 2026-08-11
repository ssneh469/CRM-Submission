"use client"

import { useEffect, useState } from "react"
import { AuthForm } from "@/components/auth-form"

export function AuthFormClient({ mode }: { mode: "sign-in" | "sign-up" }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return <AuthForm mode={mode} />
}