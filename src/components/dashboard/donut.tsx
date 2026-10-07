/**
 * Donut SVG puro (sem lib externa) — usado em `StatusDonut` e `PixConversion`.
 *
 * Recebe dois valores `a` e `b` e desenha dois arcos proporcionais.
 * Cor única (roxo) — diferenciação por opacidade.
 */
export function Donut({
  a,
  b,
  size = 140,
  thickness = 14,
  label,
  caption,
  empty = false,
}: {
  a: number
  b: number
  size?: number
  thickness?: number
  label?: React.ReactNode
  caption?: React.ReactNode
  empty?: boolean
}) {
  const total = a + b
  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius

  const aRatio = total === 0 ? 0 : a / total
  const bRatio = total === 0 ? 0 : b / total

  // Quando vazio: traço único bem fino em opacidade baixa (cinza-azul).
  const dashArray = empty
    ? `${circumference * 0.75} ${circumference * 0.25}`
    : `${circumference * aRatio} ${circumference * (1 - aRatio)}`

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        {/* Trilho */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={empty ? 'rgba(255,255,255,0.06)' : 'rgba(139,92,246,0.18)'}
          strokeWidth={thickness}
        />
        {/* Valor "a" — roxo claro */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={empty ? 'rgba(255,255,255,0.15)' : '#a78bfa'}
          strokeWidth={thickness}
          strokeDasharray={dashArray}
          strokeLinecap="round"
        />
      </svg>
      {/* Centro absoluto */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        {label && <div className="text-lg font-semibold tabular-nums text-white">{label}</div>}
        {caption && <div className="text-[10px] uppercase tracking-wider text-white/40">{caption}</div>}
      </div>
    </div>
  )
}