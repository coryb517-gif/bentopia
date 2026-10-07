import type { ReactNode } from 'react'

export type CustomerMood = 'idle' | 'happy' | 'sad'

export interface Customer {
  id: string
  name: string
  ask: string
  win: string
  lose: string
}

export const CUSTOMERS: Customer[] = [
  { id: 'obaa', name: 'Obaa-chan', ask: 'Make it with love, dear.', win: 'Oishii! Just like I remember.', lose: 'Oh dear... maybe next time.' },
  { id: 'hana', name: 'Hana', ask: 'Is it ready yet? Is it?', win: 'Yaaay! Can I have more?!', lose: 'Aww... I am sooo hungry.' },
  { id: 'tanaka', name: 'Mr. Tanaka', ask: 'Quick lunch before my 1pm.', win: 'Perfect. Back to work.', lose: 'I am going to be late...' },
  { id: 'rx9', name: 'RX-9', ask: 'Hunger level: 100 percent.', win: 'Flavor data: excellent.', lose: 'Error. Meal not found.' },
  { id: 'ronin', name: 'Ronin', ask: 'An honorable meal. Now.', win: 'Your skill is... acceptable.', lose: 'This is a dishonor.' },
  { id: 'mochi', name: 'Mochi', ask: 'Meow. Fish. Immediately.', win: 'Purrrrr. You may live.', lose: 'Hmph. I am leaving.' },
]

/** A rare guest who is not in the order rotation: she only turns up as a diner. */
export const ASHLYNDIA: Customer = {
  id: 'ashlyndia',
  name: 'Ashlyndia',
  ask: 'Something sparkly, please!',
  win: 'Magnificent! You have outdone yourself.',
  lose: 'Courage, chef. The stars are with you.',
}

export const customerFor = (levelId: number) => CUSTOMERS[(levelId - 1) % CUSTOMERS.length]

const OL = '#2a0f2e'
const SKIN = '#f7d3b0'
const SKIN_SH = '#e8b48c'

/** Shared expressions so every character reacts the same way. */
function eyes(mood: CustomerMood, cx: number, y: number, dx: number, r = 3.6, color = OL): ReactNode {
  return [-1, 1].map((s) => {
    const x = cx + s * dx
    if (mood === 'happy') return <path key={s} d={`M${x - r * 1.5} ${y + 1}q${r * 1.5} ${-r * 2.2} ${r * 3} 0`} fill="none" stroke={color} strokeWidth={2.6} strokeLinecap="round" />
    return (
      <g key={s}>
        <ellipse cx={x} cy={y} rx={r} ry={r * 1.25} fill={color} />
        <circle cx={x - r * 0.35} cy={y - r * 0.4} r={r * 0.4} fill="#fff" />
        {mood === 'sad' && <path d={`M${x - r * 1.8} ${y - r * 2 - s * 1.6}L${x + r * 1.8} ${y - r * 2 + s * 1.6}`} stroke={OL} strokeWidth={2.2} strokeLinecap="round" />}
      </g>
    )
  })
}

function mouth(mood: CustomerMood, cx: number, y: number): ReactNode {
  if (mood === 'happy') return <path d={`M${cx - 6} ${y}q6 9 12 0Z`} fill={OL} stroke={OL} strokeWidth={2} strokeLinejoin="round" />
  if (mood === 'sad') return <path d={`M${cx - 5} ${y + 3}q5 -6 10 0`} fill="none" stroke={OL} strokeWidth={2.6} strokeLinecap="round" />
  return <path d={`M${cx - 4} ${y}q4 4 8 0`} fill="none" stroke={OL} strokeWidth={2.6} strokeLinecap="round" />
}

const blush = (cx: number, y: number, dx: number, c = '#ff7d96') =>
  [-1, 1].map((s) => <ellipse key={s} cx={cx + s * dx} cy={y} rx={4.6} ry={2.8} fill={c} opacity={0.5} />)

const stroked = { stroke: OL, strokeWidth: 3, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const }

function Obaa({ mood }: { mood: CustomerMood }) {
  return (
    <>
      <path d="M10 100Q12 76 36 72H64Q88 76 90 100Z" fill="#f08aa6" {...stroked} />
      <path d="M40 72Q50 86 60 72Z" fill="#fff3e4" {...stroked} />
      <path d="M44 62h12v12H44Z" fill={SKIN_SH} />
      <circle cx="50" cy="15" r="11" fill="#f4f4fa" {...stroked} />
      <ellipse cx="50" cy="48" rx="22" ry="24" fill={SKIN} {...stroked} />
      <path d="M27 46Q24 20 50 20Q76 20 73 46Q66 30 50 30Q34 30 27 46Z" fill="#f4f4fa" {...stroked} />
      <g fill="none" stroke={OL} strokeWidth="2">
        <circle cx="40" cy="50" r="7" fill="rgba(255,255,255,0.35)" />
        <circle cx="60" cy="50" r="7" fill="rgba(255,255,255,0.35)" />
        <path d="M47 50h6" />
      </g>
      {eyes(mood, 50, 50, 10, 2.8)}
      {blush(50, 60, 15, '#ff8fa8')}
      {mouth(mood, 50, 64)}
    </>
  )
}

function Hana({ mood }: { mood: CustomerMood }) {
  return (
    <>
      <path d="M12 100Q14 78 36 73H64Q86 78 88 100Z" fill="#ffd23a" {...stroked} />
      <path d="M44 62h12v12H44Z" fill={SKIN_SH} />
      <circle cx="24" cy="34" r="11" fill="#3b2a24" {...stroked} />
      <circle cx="76" cy="34" r="11" fill="#3b2a24" {...stroked} />
      <path d="M20 40l-6 6M80 40l6 6" stroke="#ff5f8f" strokeWidth="4" strokeLinecap="round" />
      <ellipse cx="50" cy="50" rx="23" ry="24" fill="#fbd9ba" {...stroked} />
      <path d="M27 46Q28 22 50 22Q72 22 73 46Q64 32 50 36Q36 32 27 46Z" fill="#3b2a24" {...stroked} />
      {eyes(mood, 50, 53, 10, 4.6)}
      {blush(50, 63, 16)}
      {mouth(mood, 50, 66)}
    </>
  )
}

function Tanaka({ mood }: { mood: CustomerMood }) {
  return (
    <>
      <path d="M10 100Q12 76 36 72H64Q88 76 90 100Z" fill="#2f3a5c" {...stroked} />
      <path d="M40 72L50 92L60 72Z" fill="#fff" {...stroked} />
      <path d="M47 76h6l3 16-6 8-6-8Z" fill="#d9363e" {...stroked} />
      <path d="M44 62h12v12H44Z" fill={SKIN_SH} />
      <ellipse cx="50" cy="48" rx="22" ry="24" fill={SKIN} {...stroked} />
      <path d="M27 46Q24 20 50 20Q76 20 73 46Q66 30 52 32Q36 30 27 46Z" fill="#1c1a24" {...stroked} />
      <g fill="rgba(180,220,255,0.25)" stroke={OL} strokeWidth="2.2">
        <circle cx="40" cy="52" r="7.5" />
        <circle cx="60" cy="52" r="7.5" />
        <path d="M47.5 51h5" fill="none" />
      </g>
      {eyes(mood, 50, 52, 10, 2.8)}
      {mood === 'idle' && <path d="M34 61q6 3 12 0M54 61q6 3 12 0" stroke={OL} strokeWidth="1.4" fill="none" opacity="0.5" />}
      {mouth(mood, 50, 65)}
    </>
  )
}

function RX9({ mood }: { mood: CustomerMood }) {
  const led = '#6df3ff'
  return (
    <>
      <rect x="20" y="74" width="60" height="30" rx="10" fill="#8aa0c8" {...stroked} />
      <circle cx="50" cy="88" r="6" fill={led} {...stroked} />
      <path d="M50 24V10" stroke={OL} strokeWidth="3" strokeLinecap="round" />
      <circle cx="50" cy="8" r="5" fill={mood === 'sad' ? '#ff5a73' : '#ffd23a'} {...stroked} />
      <rect x="22" y="38" width="8" height="18" rx="3" fill="#6d82ad" {...stroked} />
      <rect x="70" y="38" width="8" height="18" rx="3" fill="#6d82ad" {...stroked} />
      <rect x="26" y="24" width="48" height="48" rx="14" fill="#c0cfee" {...stroked} />
      <rect x="32" y="36" width="36" height="22" rx="8" fill="#171c38" {...stroked} />
      {mood === 'happy' ? (
        <path d="M38 50q4 -9 8 0M54 50q4 -9 8 0" fill="none" stroke={led} strokeWidth="3" strokeLinecap="round" />
      ) : mood === 'sad' ? (
        <>
          <rect x="38" y="44" width="8" height="5" rx="2" fill={led} />
          <rect x="54" y="44" width="8" height="5" rx="2" fill={led} />
          <path d="M40 54q10 -4 20 0" stroke="#ff7a8a" strokeWidth="2" fill="none" />
        </>
      ) : (
        <>
          <rect x="38" y="42" width="8" height="10" rx="2" fill={led} />
          <rect x="54" y="42" width="8" height="10" rx="2" fill={led} />
        </>
      )}
      <path d="M42 65h16" stroke={OL} strokeWidth="2.6" strokeLinecap="round" strokeDasharray="3 3" />
    </>
  )
}

function Ronin({ mood }: { mood: CustomerMood }) {
  return (
    <>
      <path d="M10 100Q12 76 36 72H64Q88 76 90 100Z" fill="#2e5a4a" {...stroked} />
      <path d="M40 72L50 90L60 72Z" fill="#f4efe4" {...stroked} />
      <path d="M44 62h12v12H44Z" fill="#d8a47a" />
      <circle cx="50" cy="13" r="7" fill="#1c1a24" {...stroked} />
      <ellipse cx="50" cy="48" rx="22" ry="24" fill="#ecbd93" {...stroked} />
      <path d="M27 44Q26 22 50 22Q74 22 73 44Q64 34 50 36Q36 34 27 44Z" fill="#1c1a24" {...stroked} />
      <path d="M26 40H74" stroke="#fff" strokeWidth="6" />
      <path d="M26 40H74" stroke={OL} strokeWidth="1.5" opacity="0.6" />
      <circle cx="50" cy="40" r="3" fill="#d9363e" />
      {mood === 'idle' && <path d="M32 46l8 3M68 46l-8 3" stroke={OL} strokeWidth="3.2" strokeLinecap="round" />}
      {eyes(mood, 50, 52, 10, 3)}
      <path d="M62 54l5 9" stroke="#b8553f" strokeWidth="1.8" strokeLinecap="round" />
      {mouth(mood, 50, 66)}
    </>
  )
}

function Mochi({ mood }: { mood: CustomerMood }) {
  return (
    <>
      <path d="M16 100Q18 78 38 74H62Q82 78 84 100Z" fill="#fffaf0" {...stroked} />
      <path d="M36 72Q50 80 64 72" fill="none" stroke="#d9363e" strokeWidth="6" strokeLinecap="round" />
      <circle cx="50" cy="80" r="4.5" fill="#ffd23a" {...stroked} />
      <path d="M24 38L22 14L42 28Z" fill="#fffaf0" {...stroked} />
      <path d="M76 38L78 14L58 28Z" fill="#fffaf0" {...stroked} />
      <path d="M26 32L25 20L35 28Z" fill="#ffb3c4" />
      <path d="M74 32L75 20L65 28Z" fill="#ffb3c4" />
      <ellipse cx="50" cy="52" rx="28" ry="24" fill="#fffaf0" {...stroked} />
      <path d="M50 28Q66 28 76 44Q60 40 50 40Z" fill="#ffb25e" opacity="0.9" />
      {eyes(mood, 50, 52, 12, 3.8)}
      <path d="M46 60l4 3l4 -3Z" fill="#ff8fa8" {...stroked} strokeWidth="1.6" />
      {mood === 'happy' ? <path d="M42 66q8 8 16 0" fill="none" stroke={OL} strokeWidth="2.6" strokeLinecap="round" /> : mood === 'sad' ? <path d="M43 68q7 -6 14 0" fill="none" stroke={OL} strokeWidth="2.6" strokeLinecap="round" /> : <path d="M44 65q3 3 6 0q3 3 6 0" fill="none" stroke={OL} strokeWidth="2.4" strokeLinecap="round" />}
      <path d="M14 56l14 3M14 64l14 -1M86 56l-14 3M86 64l-14 -1" stroke={OL} strokeWidth="1.6" strokeLinecap="round" />
      <ellipse cx="22" cy="86" rx="8" ry="10" fill="#fffaf0" {...stroked} />
    </>
  )
}

function Ashlyndia({ mood }: { mood: CustomerMood }) {
  return (
    <>
      <path d="M19 52Q12 96 33 100H67Q88 96 81 52Q81 12 50 12Q19 12 19 52Z" fill="#8a5cff" {...stroked} />
      <path d="M10 100Q12 76 36 72H64Q88 76 90 100Z" fill="#ff8fc8" {...stroked} />
      <path d="M38 72L50 93L62 72Z" fill="#fff3e4" {...stroked} />
      <path d="M22 100Q38 86 50 93Q62 86 78 100" fill="none" stroke="#ffd23a" strokeWidth="3" strokeLinecap="round" />
      <path d="M44 62h12v12H44Z" fill={SKIN_SH} />
      <ellipse cx="50" cy="48" rx="22" ry="24" fill={SKIN} {...stroked} />
      <path d="M27 46Q24 22 50 22Q76 22 73 46Q66 33 50 33Q34 33 27 46Z" fill="#8a5cff" {...stroked} />
      <path d="M50 24Q44 38 36 40M50 24Q56 38 64 40" fill="none" stroke="#6a3fe0" strokeWidth="2" strokeLinecap="round" />
      <path d="M33 22L38 10L45 19L50 5L55 19L62 10L67 22Z" fill="#ffd23a" {...stroked} />
      <circle cx="50" cy="16" r="3.2" fill="#ff5b8a" stroke={OL} strokeWidth="1.6" />
      {eyes(mood, 50, 50, 10, 3.2, '#5a2fd0')}
      {blush(50, 60, 15, '#ff7fb0')}
      {mouth(mood, 50, 64)}
      <g fill="#fff" stroke={OL} strokeWidth="1.2" strokeLinejoin="round">
        <path d="M14 30l2.4 5.4 5.4 2.4-5.4 2.4L14 45.6l-2.4-5.4L6.2 37.8l5.4-2.4z" fill="#ffe27a" />
        <path d="M88 24l1.8 4 4 1.8-4 1.8L88 35.6l-1.8-4-4-1.8 4-1.8z" fill="#fff" />
      </g>
    </>
  )
}

const BODIES: Record<string, (p: { mood: CustomerMood }) => ReactNode> = {
  ashlyndia: Ashlyndia,
  obaa: Obaa,
  hana: Hana,
  tanaka: Tanaka,
  rx9: RX9,
  ronin: Ronin,
  mochi: Mochi,
}

export default function CustomerPortrait({ customer, mood, size = 72 }: { customer: Customer; mood: CustomerMood; size?: number }) {
  const Body = BODIES[customer.id]
  return (
    <svg className={`customer ${mood}`} viewBox="0 0 100 100" width={size} height={size} role="img" aria-label={`${customer.name}, ${mood === 'idle' ? 'waiting' : mood}`}>
      <Body mood={mood} />
    </svg>
  )
}
