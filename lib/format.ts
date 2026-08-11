export function formatCurrency(value: number | string) {
  const n = typeof value === "string" ? Number(value) : value
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n)
}

export function formatDate(value: string | Date | null | undefined) {
  if (!value) return "—"
  const d = typeof value === "string" ? new Date(value) : value
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d)
}

export function formatDateTime(value: string | Date | null | undefined) {
  if (!value) return "—"
  const d = typeof value === "string" ? new Date(value) : value
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d)
}
