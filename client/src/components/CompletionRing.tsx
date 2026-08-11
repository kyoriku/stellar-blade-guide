interface CompletionRingProps {
  /** 0..1 — callers guard the division; values are clamped */
  fraction: number
  /** Outer size in px; renders cleanly from 16 (dropdown) to 120+ (hero) */
  size: number
  strokeWidth: number
  /** Accessible name; omitted → decorative (aria-hidden) */
  label?: string
  className?: string
}

/**
 * SVG completion ring: cyan progress arc on a gray track. Pure presentation —
 * no data fetching, no percentage text (callers render their own).
 */
export default function CompletionRing({
  fraction,
  size,
  strokeWidth,
  label,
  className = '',
}: CompletionRingProps) {
  const f = Math.min(1, Math.max(0, fraction))
  const r = (size - strokeWidth) / 2
  const c = 2 * Math.PI * r
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={`-rotate-90 ${className}`}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth={strokeWidth}
        className="stroke-gray-700"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - f)}
        className="stroke-cyan-400 transition-[stroke-dashoffset] duration-500"
      />
    </svg>
  )
}
