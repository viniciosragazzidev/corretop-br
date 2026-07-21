import { ArrowDownRight, ArrowUpRight } from "@/components/huge-icons"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { MiniDonut } from "./mini-donut"

export type MetricCardProps = {
  label: string
  value: string
  change: string
  description: string
  trend: "up" | "down"
  chart?: { segments: Array<{ name: string; value: number; color: string }>; total: number; label?: string }
}

export function MetricCard({ label, value, change, description, trend, chart }: MetricCardProps) {
  const TrendIcon = trend === "up" ? ArrowUpRight : ArrowDownRight

  return (
    <Card data-interactive="true" className="rounded-xl border-border/70 bg-card shadow-none transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_8px_24px_color-mix(in_oklch,var(--primary)_8%,transparent)] motion-reduce:hover:translate-y-0 motion-reduce:hover:shadow-none">
      <CardHeader className="pb-1">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">{label}</span>
          <Badge className="rounded-md" variant={trend === "up" ? "success" : "destructive"}>
            <TrendIcon /> {change}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex items-end justify-between gap-3">
        <div><p className="text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
        <p className="mt-2 text-xs text-muted-foreground">{description}</p>
        </div>{chart ? <MiniDonut {...chart} /> : null}
      </CardContent>
    </Card>
  )
}
