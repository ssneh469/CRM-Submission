"use client"

import { useState } from "react"
import { toast } from "sonner"
import { createCustomer, updateCustomer, type CustomerInput } from "@/app/actions/customers"
import { CUSTOMER_STATUSES, CUSTOMER_TYPES, type CustomerRow } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function CustomerDialog({
  open,
  onOpenChange,
  customer,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  customer?: CustomerRow | null
}) {
  const editing = Boolean(customer)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState<CustomerInput>(() => ({
    name: customer?.name ?? "",
    mobile: customer?.mobile ?? "",
    email: customer?.email ?? "",
    businessName: customer?.businessName ?? "",
    gstNumber: customer?.gstNumber ?? "",
    customerType: customer?.customerType ?? "Retail",
    address: customer?.address ?? "",
    status: customer?.status ?? "Lead",
    followUpDate: customer?.followUpDate ?? "",
    notes: customer?.notes ?? "",
  }))

  const set = (k: keyof CustomerInput, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.mobile.trim()) {
      toast.error("Name and mobile are required")
      return
    }
    setSaving(true)
    try {
      if (editing && customer) {
        await updateCustomer(customer.id, form)
        toast.success("Customer updated")
      } else {
        await createCustomer(form)
        toast.success("Customer added")
      }
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit customer" : "Add customer"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Update the customer's contact and pipeline details."
              : "Capture a new lead or customer for your CRM."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2 sm:col-span-1">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} required />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-1">
            <Label htmlFor="mobile">Mobile *</Label>
            <Input id="mobile" value={form.mobile} onChange={(e) => set("mobile", e.target.value)} required />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-1">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-1">
            <Label htmlFor="business">Business name</Label>
            <Input id="business" value={form.businessName} onChange={(e) => set("businessName", e.target.value)} />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-1">
            <Label htmlFor="gst">GST number</Label>
            <Input id="gst" value={form.gstNumber} onChange={(e) => set("gstNumber", e.target.value)} />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-1">
            <Label htmlFor="type">Customer type</Label>
            <Select value={form.customerType} onValueChange={(v) => set("customerType", v)}>
              <SelectTrigger id="type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CUSTOMER_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2 sm:col-span-1">
            <Label htmlFor="status">Pipeline status</Label>
            <Select value={form.status} onValueChange={(v) => set("status", v)}>
              <SelectTrigger id="status" className="w-full">
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
          </div>
          <div className="flex flex-col gap-2 sm:col-span-1">
            <Label htmlFor="followup">Next follow-up</Label>
            <Input
              id="followup"
              type="date"
              value={form.followUpDate ?? ""}
              onChange={(e) => set("followUpDate", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              rows={2}
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              rows={2}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>

          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : editing ? "Save changes" : "Add customer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
