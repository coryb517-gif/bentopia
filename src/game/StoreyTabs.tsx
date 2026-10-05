import { BUILD, hasStorey, levelOf, STOREY_IDS, STOREY_NAMES, type Restaurant, type StoreyId } from './restaurant'

export type ViewId = StoreyId | 'outside'

const SHORT: Record<ViewId, string> = { outside: 'Outside', ground: 'Ground', upstairs: 'Upstairs', rooftop: 'Rooftop' }

/** Switch between the street view and the floors of the building. Floors not built yet open the Build menu. */
export default function StoreyTabs({
  r, active, onPick, onLocked, outside = false,
}: {
  r: Restaurant
  active: ViewId
  onPick: (id: ViewId) => void
  onLocked: (id: StoreyId) => void
  /** Offer the street view as the first tab. */
  outside?: boolean
}) {
  const level = levelOf(r)
  const ids: ViewId[] = outside ? ['outside', ...STOREY_IDS] : STOREY_IDS
  return (
    <div className="storeys" role="tablist" aria-label="Views">
      {ids.map((id) => {
        const floor = id === 'outside' ? null : id
        const built = floor === null || hasStorey(r, floor)
        const need = floor === null || floor === 'ground' ? 1 : BUILD[floor].level
        return (
          <button
            key={id}
            role="tab"
            aria-selected={active === id}
            title={floor ? STOREY_NAMES[floor] : 'The building from the street'}
            className={`storey${active === id ? ' on' : ''}${built ? '' : ' off'}`}
            onClick={() => (built ? onPick(id) : onLocked(floor as StoreyId))}
          >
            {SHORT[id]}
            {!built && <small>{level >= need ? 'Build' : `Lv ${need}`}</small>}
          </button>
        )
      })}
    </div>
  )
}
