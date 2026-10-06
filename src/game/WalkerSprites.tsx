import { OL } from './iso'

/** Little full-body characters that walk around the restaurant. Origin is between the feet. */
export function Waiter({ left, walking, carrying }: { left: boolean; walking: boolean; carrying: boolean }) {
  return (
    <g transform={left ? 'scale(-1 1)' : undefined}>
      <ellipse cx="0" cy="1.5" rx="10" ry="3.6" fill="rgba(18, 4, 36, 0.35)" />
      <g className={walking ? 'wbob' : undefined}>
        <rect className={walking ? 'legA' : undefined} x="-5.4" y="-6" width="3.8" height="6" rx="1.4" fill="#5a6a8f" stroke={OL} strokeWidth="1.2" />
        <rect className={walking ? 'legB' : undefined} x="1.6" y="-6" width="3.8" height="6" rx="1.4" fill="#5a6a8f" stroke={OL} strokeWidth="1.2" />
        <rect x="-7.4" y="-18" width="14.8" height="13" rx="3.6" fill="#8aa0c8" stroke={OL} strokeWidth="1.5" />
        <circle cx="0" cy="-11.4" r="2.3" fill="#6df3ff" stroke={OL} strokeWidth="0.9" />
        <path d="M-5.6 -16.4h11.2" stroke="rgba(255,255,255,0.45)" strokeWidth="1.2" strokeLinecap="round" />
        <rect x="-8.4" y="-32" width="16.8" height="14" rx="4.6" fill="#c0cfee" stroke={OL} strokeWidth="1.5" />
        <rect x="-6.4" y="-29.4" width="12.8" height="7.6" rx="2.8" fill="#171c38" />
        <rect x="-4.6" y="-27.2" width="3.2" height="3.2" rx="0.8" fill="#6df3ff" />
        <rect x="1.4" y="-27.2" width="3.2" height="3.2" rx="0.8" fill="#6df3ff" />
        <path d="M0 -32v-4" stroke={OL} strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="0" cy="-37" r="2.2" fill="#ffd23a" stroke={OL} strokeWidth="1.1" />
        <path d="M6 -14l5 -3" stroke={OL} strokeWidth="3.4" strokeLinecap="round" />
        <path d="M6 -14l5 -3" stroke="#8aa0c8" strokeWidth="1.6" strokeLinecap="round" />
        <ellipse cx="13.4" cy="-18" rx="7.4" ry="2.4" fill="#e8c88c" stroke={OL} strokeWidth="1.2" />
        {carrying && (
          <g>
            <path d="M8.4 -20.6a5 3.2 0 0 0 10 0z" fill="#fffdf7" stroke={OL} strokeWidth="1.1" />
            <ellipse cx="13.4" cy="-20.6" rx="5" ry="1.7" fill="#e8b878" />
            <path className="steam" d="M12 -23q-2 -3 0 -5" fill="none" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" opacity="0.8" />
            <path className="steam" style={{ animationDelay: '0.9s' }} d="M15 -23q-2 -3 0 -5" fill="none" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" opacity="0.8" />
          </g>
        )}
      </g>
    </g>
  )
}

export function Cat({ left, walking }: { left: boolean; walking: boolean }) {
  return (
    <g transform={left ? 'scale(-1 1)' : undefined}>
      <ellipse cx="0" cy="1.4" rx="10" ry="3.2" fill="rgba(18, 4, 36, 0.32)" />
      <g className={walking ? 'wbob' : undefined}>
        <path className="tail" d="M-9 -7q-8 -2 -5 -11" fill="none" stroke={OL} strokeWidth="4.4" strokeLinecap="round" />
        <path className="tail" d="M-9 -7q-8 -2 -5 -11" fill="none" stroke="#ffb25e" strokeWidth="2.2" strokeLinecap="round" />
        {walking ? (
          <>
            <rect className="legA" x="-6" y="-5" width="3" height="5" rx="1.4" fill="#fffaf0" stroke={OL} strokeWidth="1" />
            <rect className="legB" x="-2" y="-5" width="3" height="5" rx="1.4" fill="#fffaf0" stroke={OL} strokeWidth="1" />
            <rect className="legB" x="2.4" y="-5" width="3" height="5" rx="1.4" fill="#fffaf0" stroke={OL} strokeWidth="1" />
            <rect className="legA" x="6" y="-5" width="3" height="5" rx="1.4" fill="#fffaf0" stroke={OL} strokeWidth="1" />
          </>
        ) : null}
        <ellipse cx="0" cy={walking ? -9.4 : -6.4} rx="10" ry={walking ? 5.6 : 6.6} fill="#fffaf0" stroke={OL} strokeWidth="1.5" />
        <path d={walking ? 'M-8 -12q5 -3 7 1q-3 4 -7 2z' : 'M-8 -9q5 -4 7 1q-3 5 -7 3z'} fill="#ffb25e" />
        <circle cx="7.6" cy={walking ? -13.4 : -9.4} r="5.4" fill="#fffaf0" stroke={OL} strokeWidth="1.5" />
        <path d={`M3.4 ${walking ? -17 : -13}l-1 -4.4l4 2.4zM11.8 ${walking ? -17 : -13}l1 -4.4l-4 2.4z`} fill="#fffaf0" stroke={OL} strokeWidth="1.3" strokeLinejoin="round" />
        {walking ? (
          <>
            <circle cx="6" cy="-14" r="0.9" fill={OL} />
            <circle cx="9.6" cy="-14" r="0.9" fill={OL} />
          </>
        ) : (
          <path d="M4.6 -9.6q1.4 1 2.8 0M8 -9.6q1.4 1 2.8 0" fill="none" stroke={OL} strokeWidth="1.1" strokeLinecap="round" />
        )}
        <circle cx="12.6" cy={walking ? -12.4 : -8.4} r="0.9" fill="#ff8fa8" />
      </g>
      {!walking && <text className="zzz" x="10" y="-18" fontSize="6" fontWeight="800" fill="#fff">z</text>}
    </g>
  )
}
