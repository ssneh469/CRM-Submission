import { redirect } from "next/navigation"
import { requireUser } from "@/lib/session"
import { canAccess } from "@/lib/rbac"
import { getChallans } from "@/app/actions/challans"
import { ChallansClient } from "@/components/challans/challans-client"
import type { ChallanRow } from "@/lib/types"

export default async function ChallansPage() {
  const user = await requireUser()
  if (!canAccess(user.role, "challans")) redirect("/")

  const challans = (await getChallans()) as unknown as ChallanRow[]

  return <ChallansClient challans={challans} canManage={canAccess(user.role, "challans")} />
}
