/** Night-market scene behind every screen: dusk sky, skyline, swaying lanterns, drifting petals. */
const LANTERNS = [6, 19, 33, 50, 66, 81, 94]
const PETALS = Array.from({ length: 18 }, (_, i) => ({
  left: (i * 37 + 11) % 100,
  delay: -((i * 1.9) % 14),
  dur: 11 + ((i * 3) % 7),
  size: 7 + ((i * 5) % 7),
}))

function Pagoda({ cx, base, s = 1 }: { cx: number; base: number; s?: number }) {
  const tiers = [0, 1, 2, 3].map((i) => ({ w: (38 - i * 6) * s, y: base - i * 22 * s }))
  return (
    <g>
      {tiers.map((t, i) => (
        <g key={i}>
          <rect x={cx - t.w * 0.62} y={t.y - 20 * s} width={t.w * 1.24} height={20 * s} fill="#1b0f3d" />
          <rect x={cx - 2.5 * s} y={t.y - 14 * s} width={5 * s} height={7 * s} fill="#ffcf6b" className="win" style={{ animationDelay: `${-i * 1.3}s` }} />
          <path
            d={`M${cx - t.w - 6 * s} ${t.y - 18 * s}Q${cx - t.w * 0.5} ${t.y - 22 * s} ${cx} ${t.y - 34 * s}Q${cx + t.w * 0.5} ${t.y - 22 * s} ${cx + t.w + 6 * s} ${t.y - 18 * s}Q${cx + t.w * 0.5} ${t.y - 20 * s} ${cx} ${t.y - 26 * s}Q${cx - t.w * 0.5} ${t.y - 20 * s} ${cx - t.w - 6 * s} ${t.y - 18 * s}Z`}
            fill="#150a30"
          />
        </g>
      ))}
      <rect x={cx - 1.2 * s} y={base - 4 * 22 * s - 14 * s} width={2.4 * s} height={24 * s} fill="#150a30" />
    </g>
  )
}

export default function Backdrop() {
  return (
    <div className="backdrop" aria-hidden>
      <div className="moon" />
      <svg className="skyline far" viewBox="0 0 800 240" preserveAspectRatio="xMidYMax slice">
        <path
          fill="#2b1b5e"
          d="M0 240V160h40l12-22 14 22h60v-30l16-18 16 18v30h60l14-26 14 26h70v-22l26-26 26 26v22h70l14-30 14 30h80v-26l24-22 24 22v26h70l14-24 14 24h60V240Z"
        />
      </svg>
      <svg className="skyline near" viewBox="0 0 800 240" preserveAspectRatio="xMidYMax slice">
        <path fill="#1a0e3b" d="M0 240V196h70l10-16 10 16h90v-24l22-16 22 16v24h110v-20h40v20h120l12-18 12 18h100v-26l20-18 20 18v26h90V240Z" />
        <Pagoda cx={110} base={188} s={0.9} />
        <Pagoda cx={640} base={196} s={1.1} />
        {[60, 150, 250, 330, 470, 520, 560, 700, 740].map((x, i) => (
          <rect key={x} x={x} y={206 + (i % 3) * 6} width={6} height={8} fill="#ffcf6b" className="win" style={{ animationDelay: `${-i * 0.9}s` }} />
        ))}
      </svg>
      <div className="lanterns">
        {LANTERNS.map((left, i) => (
          <span key={left} className="lantern" style={{ left: `${left}%`, animationDelay: `${-i * 0.7}s`, ['--len' as string]: `${18 + (i % 3) * 22}px` }} />
        ))}
      </div>
      {PETALS.map((p, i) => (
        <i key={i} className="petal" style={{ left: `${p.left}%`, width: p.size, height: p.size * 0.7, animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s` }} />
      ))}
    </div>
  )
}
