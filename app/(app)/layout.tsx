import { requireUser } from "@/lib/session"
import { Sidebar } from "@/components/app-shell/sidebar"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireUser()

  return (
    <div className="flex min-h-svh flex-col lg:flex-row bg-background">
      <Sidebar user={user} />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  )
}
