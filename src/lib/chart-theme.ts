/**
 * Recharts can use CSS variables so series follow light/dark tokens in index.css.
 * Hex fallbacks are for contexts where CSS vars are unavailable (e.g. some exports).
 */
export const chartCss = {
  c1: "var(--chart-1)",
  c2: "var(--chart-2)",
  c3: "var(--chart-3)",
  c4: "var(--chart-4)",
  c5: "var(--chart-5)",
} as const;

/** Fallback hex aligned with the lime / charcoal theme */
export const CHART = {
  lime: "#bef264",
  limeBright: "#a3e635",
  teal: "#2dd4bf",
  amber: "#fbbf24",
  rose: "#fb7185",
  muted: "#71717a",
} as const;

export const chartTooltipProps = {
  contentStyle: {
    borderRadius: "10px",
    border: "1px solid var(--border)",
    background: "var(--popover)",
    color: "var(--popover-foreground)",
    fontSize: "12px",
    boxShadow: "0 8px 24px oklch(0 0 0 / 0.25)",
  },
  labelStyle: { color: "var(--muted-foreground)" },
} as const;

export const chartGridProps = {
  strokeDasharray: "3 3",
  stroke: "var(--border)",
  opacity: 0.6,
} as const;
