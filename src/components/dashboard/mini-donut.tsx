"use client"

import { Pie, PieChart, Cell } from "recharts"

type MiniDonutProps = { segments: Array<{ name: string; value: number; color: string }>; total: number; label?: string }

export function MiniDonut({ segments, total, label = "total" }: MiniDonutProps) {
  const data = segments.filter((segment) => segment.value > 0)
  const fallback = data.length ? data : [{ name: "empty", value: 1, color: "var(--muted)" }]
  return <div className="relative size-16 shrink-0" aria-label={`${total} ${label}`}><PieChart height={64} width={64}><Pie data={fallback} dataKey="value" innerRadius={22} outerRadius={30} paddingAngle={data.length > 1 ? 3 : 0} strokeWidth={0}>{fallback.map((segment) => <Cell fill={segment.color} key={segment.name} />)}</Pie></PieChart><div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="text-sm font-semibold tabular-nums">{total}</span><span className="text-[9px] text-muted-foreground">{label}</span></div></div>
}
