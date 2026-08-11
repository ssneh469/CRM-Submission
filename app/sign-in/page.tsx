import { redirect } from "next/navigation"
import { getSessionUser } from "@/lib/session"
import { AuthFormClient } from "@/components/auth-form-client"

export default async function SignInPage() {
  const user = await getSessionUser()
  if (user) redirect("/")
  return <AuthFormClient mode="sign-in" />
}
