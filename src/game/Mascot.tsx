export type Mood = 'idle' | 'cheer' | 'wow' | 'oops'

/** Bento-kun: a lacquer bento box with opinions. */
export default function Mascot({ mood, size = 120 }: { mood: Mood; size?: number }) {
  const eye = (x: number) => (
    <g key={x}>
      <ellipse className="eye" cx={x} cy={84} rx={mood === 'wow' ? 6.6 : 5.2} ry={mood === 'wow' ? 8.6 : 7} fill="#26122e" />
      <circle cx={x - 1.8} cy={80.6} r={mood === 'wow' ? 2.4 : 1.9} fill="#fff" />
      <circle cx={x + 2} cy={87} r={1} fill="#fff" opacity={0.8} />
    </g>
  )
  const happyEye = (x: number) => <path key={x} d={`M${x - 6.5} 85q6.5 -10 13 0`} fill="none" stroke="#26122e" strokeWidth={3.6} strokeLinecap="round" />
  const sadEye = (x: number, s: number) => (
    <g key={x}>
      <ellipse cx={x} cy={85} rx={5} ry={6.2} fill="#26122e" />
      <circle cx={x - 1.6} cy={82} r={1.8} fill="#fff" />
      <path d={`M${x - 7} ${75 + s * 2}L${x + 7} ${75 - s * 2}`} stroke="#26122e" strokeWidth={2.6} strokeLinecap="round" />
    </g>
  )
  return (
    <svg className={`mascot ${mood}`} viewBox="0 0 140 130" width={size} height={size * (130 / 140)} role="img" aria-label="Bento-kun, your cooking buddy">
      <defs>
        <linearGradient id="mbody" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff6a6e" />
          <stop offset="1" stopColor="#a02548" />
        </linearGradient>
        <linearGradient id="mlid" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff8f86" />
          <stop offset="1" stopColor="#c23a58" />
        </linearGradient>
      </defs>
      <ellipse cx="70" cy="121" rx="42" ry="6" fill="rgba(0,0,0,0.35)" />
      <g className="sticks">
        <path d="M60 32L46 6M72 32L82 4" stroke="#2a0f2e" strokeWidth="7" strokeLinecap="round" />
        <path d="M60 32L46 6M72 32L82 4" stroke="#ffe3a6" strokeWidth="3.4" strokeLinecap="round" />
        <circle cx="46" cy="6" r="3" fill="#ff7fb0" stroke="#2a0f2e" strokeWidth="2" />
        <circle cx="82" cy="4" r="3" fill="#7fe6ff" stroke="#2a0f2e" strokeWidth="2" />
      </g>
      <g className="arm l">
        <ellipse cx="22" cy="88" rx="9" ry="12" fill="#ffe3c8" stroke="#2a0f2e" strokeWidth="3.4" />
      </g>
      <g className="arm r">
        <ellipse cx="118" cy="88" rx="9" ry="12" fill="#ffe3c8" stroke="#2a0f2e" strokeWidth="3.4" />
      </g>
      <rect x="26" y="52" width="88" height="62" rx="18" fill="url(#mbody)" stroke="#2a0f2e" strokeWidth="3.6" />
      <path d="M28 64H112" stroke="#ffd45e" strokeWidth="4" opacity="0.9" />
      <rect x="18" y="30" width="104" height="28" rx="14" fill="url(#mlid)" stroke="#2a0f2e" strokeWidth="3.6" />
      <path d="M32 40Q60 33 86 38" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" opacity="0.7" fill="none" />
      <path d="M26 52H114" stroke="#ffd45e" strokeWidth="3" opacity="0.8" />
      <ellipse cx="42" cy="95" rx="7" ry="4" fill="#ff5f8f" opacity="0.55" />
      <ellipse cx="98" cy="95" rx="7" ry="4" fill="#ff5f8f" opacity="0.55" />
      {mood === 'cheer' ? [happyEye(54), happyEye(86)] : mood === 'oops' ? [sadEye(54, 1), sadEye(86, -1)] : [eye(54), eye(86)]}
      {mood === 'idle' && <path d="M62 94q8 8 16 0" fill="none" stroke="#26122e" strokeWidth="3.4" strokeLinecap="round" />}
      {mood === 'cheer' && <path d="M60 92q10 14 20 0Z" fill="#26122e" stroke="#26122e" strokeWidth="3" strokeLinejoin="round" />}
      {mood === 'wow' && <ellipse cx="70" cy="98" rx="5" ry="6.5" fill="#26122e" />}
      {mood === 'oops' && <path d="M62 101q8 -8 16 0" fill="none" stroke="#26122e" strokeWidth="3.4" strokeLinecap="round" />}
      {mood === 'oops' && <path d="M96 90q4 8 0 12q-4 -4 0 -12Z" fill="#7fe6ff" stroke="#26122e" strokeWidth="1.5" />}
      <path d="M32 72Q30 90 34 104" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.35" fill="none" />
    </svg>
  )
}
