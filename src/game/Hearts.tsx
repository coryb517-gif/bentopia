import { formatCountdown, MAX_HEARTS, msToNextHeart } from './economy'

export default function Hearts({ wallet, now }: { wallet: { hearts: number; regenAt: number | null }; now: number }) {
  const wait = wallet.hearts < MAX_HEARTS && wallet.regenAt !== null ? formatCountdown(msToNextHeart(wallet as never, now)) : null
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
