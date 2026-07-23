"use client";

import { cn } from "@/lib/utils";

type MiniDonutProps = {
  segments: Array<{ name: string; value: number; color: string }>;
  total: string | number;
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function MiniDonut({
  segments,
  total,
  label = "",
  size = "md",
  className,
}: MiniDonutProps) {
  // Filter out zero-value segments
  const activeSegments = segments.filter((s) => s.value > 0);

  // If no active segments, show a single fallback empty segment
  const sum = activeSegments.reduce((acc, s) => acc + s.value, 0);
  const data =
    activeSegments.length > 0
      ? activeSegments
      : [{ name: "empty", value: 1, color: "var(--muted)" }];

  const dimensionMap = {
    sm: { box: "size-14", px: 56, textTotal: "text-xs", textLabel: "text-[9px]" },
    md: { box: "size-18", px: 72, textTotal: "text-sm font-bold", textLabel: "text-[10px]" },
    lg: { box: "size-24", px: 96, textTotal: "text-base font-bold", textLabel: "text-xs" },
  };

  const currentSize = dimensionMap[size];
  const radius = 28;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <div
      className={cn("relative flex shrink-0 items-center justify-center", currentSize.box, className)}
      aria-label={`${total} ${label}`}
    >
      <svg className={`${currentSize.box} -rotate-90`} viewBox="0 0 72 72">
        {/* Background track circle */}
        <circle
          cx="36"
          cy="36"
          r={radius}
          fill="transparent"
          stroke="var(--muted)"
          strokeWidth="6"
          className="opacity-40"
        />

        {/* Data segments */}
        {data.map((segment, index) => {
          const totalValue = activeSegments.length > 0 ? sum : 1;
          const percentage = (segment.value / totalValue) * 100;
          const strokeDashoffset = circumference - (percentage / 100) * circumference;
          const strokeDasharray = `${circumference} ${circumference}`;

          const rotation = (accumulatedPercent / 100) * 360;
          accumulatedPercent += percentage;

          return (
            <circle
              key={segment.name || index}
              cx="36"
              cy="36"
              r={radius}
              fill="transparent"
              stroke={segment.color}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              transform={`rotate(${rotation} 36 36)`}
              className="transition-all duration-300 ease-out"
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-1 pointer-events-none">
        <span className={cn("font-mono tracking-tight text-foreground leading-none", currentSize.textTotal)}>
          {total}
        </span>
        {label && (
          <span className={cn("mt-0.5 max-w-[56px] truncate text-muted-foreground leading-tight font-medium select-none", currentSize.textLabel)}>
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
