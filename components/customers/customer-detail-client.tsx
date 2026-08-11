"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { MessageSquarePlus } from "lucide-react"
import { addCustomerNote, updateCustomerStatus } from "@/app/actions/customers"
import { CUSTOMER_STATUSES, type CustomerNoteRow } from "@/lib/types"
import { formatDateTime } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function StatusChanger({
  customerId,
  status,
}: {
  customerId: number
  status: string
}) {
  const router = useRouter()
  const [value, setValue] = useState(status)
  const [saving, setSaving] = useState(false)

  const change = async (next: string) => {
    setValue(next)
    setSaving(true)
    try {
      await updateCustomerStatus(customerId, next)
      toast.success(`Moved to ${next}`)
      router.refresh()
    } catch {
      toast.error("Could not update status")
      setValue(status)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Select value={value} onValueChange={change} disabled={saving}>
      <SelectTrigger className="w-[150px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {CUSTOMER_STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            {s}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function NotesTimeline({
  customerId,
  notes,
}: {
  customerId: number
  notes: CustomerNoteRow[]
}) {
  const router = useRouter()
  const [note, setNote] = useState("")
  const [followUp, setFollowUp] = useState("")
  const [saving, setSaving] = useState(false)

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!note.trim()) {
      toast.error("Write a note first")
      return
    }
    setSaving(true)
    try {
      await addCustomerNote(customerId, note.trim(), followUp || null)
      toast.success("Interaction logged")
      setNote("")
      setFollowUp("")
      router.refresh()
    } catch {
      toast.error("Could not add note")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <form onSubmit={add} className="space-y-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="note">Log an interaction</Label>
            <Textarea
              id="note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Called about bulk pricing, sending quote next week..."
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-2">
              <Label htmlFor="fu">Set next follow-up</Label>
              <Input
                id="fu"
                type="date"
                value={followUp}
                onChange={(e) => setFollowUp(e.target.value)}
                className="w-[180px]"
              />
            </div>
            <Button type="submit" disabled={saving}>
              <MessageSquarePlus className="size-4" />
              {saving ? "Saving..." : "Add note"}
            </Button>
          </div>
        </form>
      </Card>

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">
          Timeline ({notes.length})
        </h3>
        {notes.length === 0 && (
          <p className="text-sm text-muted-foreground">No interactions logged yet.</p>
        )}
        <ol className="relative space-y-4 border-l border-border pl-6">
          {notes.map((n) => (
            <li key={n.id} className="relative">
              <span className="absolute -left-[27px] top-1.5 size-2.5 rounded-full border-2 border-background bg-primary" />
              <Card className="p-4">
                <p className="text-sm leading-relaxed">{n.note}</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span>{n.createdByName || "Someone"}</span>
                  <span>·</span>
                  <span>{formatDateTime(n.createdAt)}</span>
                  {n.followUpDate && (
                    <>
                      <span>·</span>
                      <span className="text-primary">Follow-up set</span>
                    </>
                  )}
                </div>
              </Card>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
