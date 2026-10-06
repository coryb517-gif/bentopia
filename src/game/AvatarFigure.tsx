import { HAIR_COLORS, OUTFITS, SKINS, type Avatar } from './avatar'

const OL = '#2a0f2e'

/** The player, drawn around their feet at (0, 0) and about 40 units tall. */
export function AvatarFigure({ a, left = false, walking = false }: { a: Avatar; left?: boolean; walking?: boolean }) {
  const skin = SKINS[a.skin]
  const hair = HAIR_COLORS[a.hairColor]
  const coat = OUTFITS[a.outfit]
  return (
    <g transform={left ? 'scale(-1 1)' : undefined}>
      <ellipse cx="0" cy="1.6" rx="10" ry="3.4" fill="rgba(18, 4, 36, 0.38)" />
      <g className={walking ? 'wbob' : undefined}>
        {/* hair behind the head */}
        {a.hair === 3 && <path d="M-9 -27q-2 14 2 18h14q4 -4 2 -18z" fill={hair} stroke={OL} strokeWidth="1.4" strokeLinejoin="round" />}
        {/* legs */}
        <rect className={walking ? 'legA' : undefined} x="-5.4" y="-9" width="4.2" height="9" rx="1.6" fill="#3d3558" stroke={OL} strokeWidth="1.2" />
        <rect className={walking ? 'legB' : undefined} x="1.2" y="-9" width="4.2" height="9" rx="1.6" fill="#3d3558" stroke={OL} strokeWidth="1.2" />
        {/* happi coat */}
        <path d="M-8 -9v-13q0 -3 3 -3h10q3 0 3 3v13z" fill={coat} stroke={OL} strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M-8 -12h16" stroke="rgba(42,15,46,0.5)" strokeWidth="1.8" />
        <path d="M0 -25v13" stroke="rgba(255,255,255,0.5)" strokeWidth="1.4" />
        {/* arms */}
        <rect className={walking ? 'legB' : undefined} x="-11" y="-24" width="3.6" height="10" rx="1.8" fill={coat} stroke={OL} strokeWidth="1.2" />
        <rect className={walking ? 'legA' : undefined} x="7.4" y="-24" width="3.6" height="10" rx="1.8" fill={coat} stroke={OL} strokeWidth="1.2" />
        {/* head */}
        <circle cx="0" cy="-33" r="8.4" fill={skin} stroke={OL} strokeWidth="1.5" />
        <circle cx="-3" cy="-33" r="1.1" fill={OL} />
        <circle cx="3" cy="-33" r="1.1" fill={OL} />
        <path d="M-1.6 -29.4q1.6 1.4 3.2 0" fill="none" stroke={OL} strokeWidth="1" strokeLinecap="round" />
        <circle cx="-5.2" cy="-30.6" r="1.4" fill="#ff8fa8" opacity="0.5" />
        <circle cx="5.2" cy="-30.6" r="1.4" fill="#ff8fa8" opacity="0.5" />
        {/* hair on top */}
        {a.hair === 0 && <path d="M-9 -33q-1 -10 9 -10t9 10q-3 -5 -9 -5t-9 5z" fill={hair} stroke={OL} strokeWidth="1.4" strokeLinejoin="round" />}
        {a.hair === 1 && <path d="M-9 -33l-1 -9l5 3l2 -7l3 6l4 -6l1 7l5 -2l-1 8q-4 -5 -9 -5t-9 5z" fill={hair} stroke={OL} strokeWidth="1.4" strokeLinejoin="round" />}
        {a.hair === 2 && (
          <>
            <circle cx="0" cy="-44" r="4.4" fill={hair} stroke={OL} strokeWidth="1.4" />
            <path d="M-9 -33q-1 -9 9 -9t9 9q-3 -5 -9 -5t-9 5z" fill={hair} stroke={OL} strokeWidth="1.4" strokeLinejoin="round" />
          </>
        )}
        {a.hair === 3 && <path d="M-9 -33q-1 -10 9 -10t9 10q-3 -5 -9 -5t-9 5z" fill={hair} stroke={OL} strokeWidth="1.4" strokeLinejoin="round" />}
        {a.hair === 4 && <path d="M-8.6 -35q1 -7 8.6 -7t8.6 7q-4 -3 -8.6 -3t-8.6 3z" fill={hair} stroke={OL} strokeWidth="1.3" strokeLinejoin="round" />}
        {/* accessories */}
        {a.accessory === 1 && (
          <g fill="rgba(180,230,255,0.35)" stroke={OL} strokeWidth="1.2">
            <circle cx="-3.4" cy="-33" r="3" />
            <circle cx="3.4" cy="-33" r="3" />
            <path d="M-0.4 -33h0.8" />
          </g>
        )}
        {a.accessory === 2 && <path d="M-8.6 -37h17.2v3.6h-17.2z" fill="#ff5b6e" stroke={OL} strokeWidth="1.3" strokeLinejoin="round" />}
        {a.accessory === 3 && (
          <g fill="#fffdf7" stroke={OL} strokeWidth="1.4" strokeLinejoin="round">
            <path d="M-7.6 -39h15.2v4h-15.2z" />
            <path d="M-8 -39q-2 -9 4 -9q1 -4 4 -4t4 4q6 0 4 9z" />
          </g>
        )}
        {a.accessory === 4 && (
          <g fill={hair} stroke={OL} strokeWidth="1.3" strokeLinejoin="round">
            <path d="M-8 -38l-1 -9l7 5z" />
            <path d="M8 -38l1 -9l-7 5z" />
          </g>
        )}
      </g>
    </g>
  )
}

/** A standalone portrait for the creator. */
export function AvatarPortrait({ a, size = 150 }: { a: Avatar; size?: number }) {
  return (
    <svg width={size} height={size * 1.2} viewBox="-26 -58 52 64" role="img" aria-label="Your avatar">
      <AvatarFigure a={a} />
    </svg>
  )
}
