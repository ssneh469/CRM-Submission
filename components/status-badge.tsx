import { cn } from "@/lib/utils"

const STATUS_STYLES: Record<string, string> = {
  // Customer pipeline
  Lead: "bg-chart-3/15 text-chart-3 border-chart-3/30",
  Prospect: "bg-chart-1/15 text-chart-1 border-chart-1/30",
  Customer: "bg-chart-2/15 text-chart-2 border-chart-2/30",
  Inactive: "bg-muted text-muted-foreground border-border",
  // Challan status
  Draft: "bg-muted text-muted-foreground border-border",
  Confirmed: "bg-chart-1/15 text-chart-1 border-chart-1/30",
  Delivered: "bg-chart-2/15 text-chart-2 border-chart-2/30",
  Cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  // Stock movement
  IN: "bg-chart-2/15 text-chart-2 border-chart-2/30",
  OUT: "bg-chart-4/15 text-chart-4 border-chart-4/30",
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        STATUS_STYLES[status] ?? "bg-muted text-muted-foreground border-border",
      )}
    >
      {status}
    </span>
  )
}
