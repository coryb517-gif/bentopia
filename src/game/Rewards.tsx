import { useState } from 'react'
import CustomerPortrait, { ASHLYNDIA } from './Customers'
import { floorArt } from './Room'
import { ITEMS, SETS, type ItemDef } from './restaurant'
import { bonusClaimable, DAILY_REWARDS, dailyStatus, GOALS, goalClaimable, goalDone, goalValue, rollWeek, WEEKLY_BONUS, weeklyClaimable, weeklyTasks, type GoalContext, type Goal, type WeeklyKey } from './progress'

interface Props {
  ctx: GoalContext
  now: number
  onClaimDaily: () => void
  onClaimGoal: (g: Goal) => void
  onClaimWeekly: (id: WeeklyKey | 'bonus') => void
  onClose: () => void
}

type Tab = 'daily' | 'weekly' | 'goals' | 'book'

const Coin = () => <i className="coinicon" />

function Thumb({ def, found }: { def: ItemDef; found: boolean }) {
  const art = def.layer === 'wall' ? null : floorArt(def.type)
  return (
    <div className={`bookitem${found ? ' found' : ''}`} title={found ? def.name : '???'}>
      <svg viewBox="-44 -78 150 118" aria-hidden>{art ? art.art() : <text x="30" y="-20" textAnchor="middle" fontSize="40">🖼️</text>}</svg>
      <small>{found ? def.name : '???'}</small>
    </div>
  )
}

/** Daily reward, goals that pay coins, and the collection book. */
export default function Rewards({ ctx, now, onClaimDaily, onClaimGoal, onClaimWeekly, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('daily')
  const daily = dailyStatus(ctx.progress, now)
  const tasks = weeklyTasks(now)
  const week = rollWeek(ctx.progress, now).weekly
  const weeklyWaiting = tasks.some((x) => weeklyClaimable(ctx.progress, x, now)) || bonusClaimable(ctx.progress, now)
  const waitingGoals = GOALS.filter((g) => goalClaimable(g, ctx)).length
  const seen = new Set(ctx.progress.seen)

  // Ready goals first, then the closest to done, finished ones last.
  const ordered = [...GOALS].sort((a, b) => {
    const rank = (g: Goal) => (goalClaimable(g, ctx) ? 0 : goalDone(g, ctx) ? 3 : 1)
    return rank(a) - rank(b) || goalValue(b, ctx) / b.target - goalValue(a, ctx) / a.target
  })

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="Rewards" onClick={onClose}>
      <div className="card rewards" onClick={(e) => e.stopPropagation()}>
        <div className="tabs" role="tablist">
          <button role="tab" aria-selected={tab === 'daily'} className={tab === 'daily' ? 'on' : ''} onClick={() => setTab('daily')}>Daily{daily.canClaim && <i className="dot" />}</button>
          <button role="tab" aria-selected={tab === 'weekly'} className={tab === 'weekly' ? 'on' : ''} onClick={() => setTab('weekly')}>Weekly{weeklyWaiting && <i className="dot" />}</button>
          <button role="tab" aria-selected={tab === 'goals'} className={tab === 'goals' ? 'on' : ''} onClick={() => setTab('goals')}>Goals{waitingGoals > 0 && <i className="dot" />}</button>
          <button role="tab" aria-selected={tab === 'book'} className={tab === 'book' ? 'on' : ''} onClick={() => setTab('book')}>Book</button>
        </div>

        {tab === 'daily' && (
          <>
            <h2>Daily gift</h2>
            <p>{daily.canClaim ? 'Come back every day to grow your streak.' : 'Claimed today. See you tomorrow!'}</p>
            <div className="daydays">
              {DAILY_REWARDS.map((r, i) => (
                <div key={i} className={`dayslot${i === daily.day ? ' today' : ''}${!daily.canClaim && i <= daily.day ? ' got' : daily.canClaim && i < daily.day ? ' got' : ''}`}>
                  <small>Day {i + 1}</small>
                  <b><Coin />{r}</b>
                </div>
              ))}
            </div>
            <div className="actions">
              <button className="btn primary" disabled={!daily.canClaim} onClick={onClaimDaily}>{daily.canClaim ? <>Claim <Coin />{daily.reward}</> : 'Claimed'}</button>
            </div>
          </>
        )}

        {tab === 'weekly' && (
          <>
            <h2>This week</h2>
            <p>Three tasks that refresh every Monday. Finish all three for a bonus.</p>
            <ul className="goals">
              {tasks.map((x) => {
                const v = Math.min(x.target, week[x.id])
                const ready = weeklyClaimable(ctx.progress, x, now)
                const done = week.claimed.includes(x.id)
                return (
                  <li key={x.id} className={ready ? 'ready' : done ? 'done' : ''}>
                    <div>
                      <b>{x.name}</b>
                      <span className="bar"><i style={{ width: `${(v / x.target) * 100}%` }} /></span>
                    </div>
                    {ready ? <button className="btn primary" onClick={() => onClaimWeekly(x.id)}><Coin />{x.reward}</button> : done ? <span className="tick">✓</span> : <span className="amt">{v}/{x.target}</span>}
                  </li>
                )
              })}
              <li className={bonusClaimable(ctx.progress, now) ? 'ready' : week.claimed.includes('bonus') ? 'done' : ''}>
                <div>
                  <b>Weekly bonus 🎁</b>
                  <small>Finish all three tasks</small>
                </div>
                {bonusClaimable(ctx.progress, now) ? <button className="btn primary" onClick={() => onClaimWeekly('bonus')}><Coin />{WEEKLY_BONUS}</button> : week.claimed.includes('bonus') ? <span className="tick">✓</span> : <span className="amt">{week.claimed.filter((c) => c !== 'bonus').length}/3</span>}
              </li>
            </ul>
          </>
        )}

        {tab === 'goals' && (
          <>
            <h2>Goals</h2>
            <ul className="goals">
              {ordered.map((g) => {
                const v = goalValue(g, ctx)
                const done = goalDone(g, ctx)
                const ready = goalClaimable(g, ctx)
                return (
                  <li key={g.id} className={ready ? 'ready' : done ? 'done' : ''}>
                    <div>
                      <b>{g.name}</b>
                      <small>{g.blurb}</small>
                      <span className="bar"><i style={{ width: `${(v / g.target) * 100}%` }} /></span>
                    </div>
                    {ready ? <button className="btn primary" onClick={() => onClaimGoal(g)}><Coin />{g.reward}</button> : done ? <span className="tick">✓</span> : <span className="amt">{v}/{g.target}</span>}
                  </li>
                )
              })}
            </ul>
          </>
        )}

        {tab === 'book' && (
          <>
            <h2>Collection book</h2>
            <p>{seen.size} of {ITEMS.length} items found. Own it once and it is yours to see forever.</p>
            <section className="bookset">
              <h3>Special guests <small>{ctx.progress.stats.ashlyndia > 0 ? 1 : 0}/1</small></h3>
              <div className="guestcard">
                <div className={`guestpic${ctx.progress.stats.ashlyndia > 0 ? ' found' : ''}`}><CustomerPortrait customer={ASHLYNDIA} mood="happy" size={64} /></div>
                <div>
                  <b>{ctx.progress.stats.ashlyndia > 0 ? 'Ashlyndia' : '???'}</b>
                  <small>{ctx.progress.stats.ashlyndia > 0 ? `Dropped by ${ctx.progress.stats.ashlyndia} time${ctx.progress.stats.ashlyndia > 1 ? 's' : ''}. Tap her when she visits.` : 'Someone special may drop by for a bite. Keep your restaurant open and watch the seats.'}</small>
                </div>
              </div>
            </section>
            {SETS.map((s) => {
              const items = ITEMS.filter((i) => i.set === s.id)
              const got = items.filter((i) => seen.has(i.type)).length
              return (
                <section key={s.id} className="bookset">
                  <h3>{s.name} <small>{got}/{items.length}</small></h3>
                  <div className="bookgrid">{items.map((i) => <Thumb key={i.type} def={i} found={seen.has(i.type)} />)}</div>
                </section>
              )
            })}
          </>
        )}

        <div className="actions"><button className="btn ghost" onClick={onClose}>Close</button></div>
      </div>
    </div>
  )
}
