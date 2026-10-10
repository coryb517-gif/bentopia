import { formatCountdown, MAX_HEARTS, msToNextHeart } from './economy'

/** Five hearts, or with `compact` one heart and a count (for tight headers). */
export default function Hearts({ wallet, now, compact = false }: { wallet: { hearts: number; regenAt: number | null }; now: number; compact?: boolean }) {
  const wait = wallet.hearts < MAX_HEARTS && wallet.regenAt !== null ? formatCountdown(msToNextHeart(wallet as never, now)) : null
  if (compact) {
    return (
      <span className="hearts compact" aria-label={`${wallet.hearts} of ${MAX_HEARTS} hearts`}>
        <svg viewBox="0 0 24 22" width="22" height="20" className={wallet.hearts > 0 ? 'heart on' : 'heart'}>
          <path d="M12 21C4 14.5 1.5 11 1.5 7.2 1.5 4 4 2 6.8 2 9 2 11 3.2 12 5.2 13 3.2 15 2 17.2 2 20 2 22.5 4 22.5 7.2 22.5 11 20 14.5 12 21Z" />
        </svg>
        <b>{wallet.hearts}</b>
        {wait && <small className="regen">{wait}</small>}
      </span>
    )
  }
  return (
    <span className="hearts" aria-label={`${wallet.hearts} of ${MAX_HEARTS} hearts`}>
      {Array.from({ length: MAX_HEARTS }, (_, i) => (
        <svg key={i} viewBox="0 0 24 22" width="18" height="17" className={i < wallet.hearts ? 'heart on' : 'heart'}>
          <path d="M12 21C4 14.5 1.5 11 1.5 7.2 1.5 4 4 2 6.8 2 9 2 11 3.2 12 5.2 13 3.2 15 2 17.2 2 20 2 22.5 4 22.5 7.2 22.5 11 20 14.5 12 21Z" />
        </svg>
      ))}
      {wait && <small className="regen">{wait}</small>}
    </span>
  )
}
