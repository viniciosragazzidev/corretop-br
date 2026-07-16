"use client";

import { cn } from "@/lib/utils";

type MiniDonutProps = {
  segments: Array<{ name: string; value: number; color: string }>;
  total: string | number;
  label?: string;
};

export function MiniDonut({ segments, total, label = "total" }: MiniDonutProps) {
  // Filter out zero-value segments
  const activeSegments = segments.filter((s) => s.value > 0);
  
  // If no active segments, show a single fallback empty segment
  const sum = activeSegments.reduce((acc, s) => acc + s.value, 0);
  const data = activeSegments.length > 0 
    ? activeSegments 
    : [{ name: "empty", value: 1, color: "var(--muted)" }];

  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  
  let accumulatedPercent = 0;

  return (
    <div 
      className="relative flex size-16 shrink-0 items-center justify-center" 
      aria-label={`${total} ${label}`}
    >
      <svg className="size-16 -rotate-90" viewBox="0 0 64 64">
        {data.map((segment, index) => {
          const totalValue = activeSegments.length > 0 ? sum : 1;
          const percentage = (segment.value / totalValue) * 100;
          const strokeDashoffset = circumference - (percentage / 100) * circumference;
          const strokeDasharray = `${circumference} ${circumference}`;
          
          // Compute cumulative rotation offset
          const rotation = (accumulatedPercent / 100) * 360;
          accumulatedPercent += percentage;
          
          return (
            <circle
              key={segment.name || index}
              cx="32"
              cy="32"
              r={radius}
              fill="transparent"
              stroke={segment.color}
              strokeWidth="5"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              transform={`rotate(${rotation} 32 32)`}
              className="transition-all duration-300"
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-1 pointer-events-none">
        <span className="text-xs font-semibold tabular-nums text-foreground leading-none">
          {total}
        </span>
        {label && (
          <span className="mt-0.5 max-w-[48px] truncate text-[8px] text-muted-foreground leading-tight select-none">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
