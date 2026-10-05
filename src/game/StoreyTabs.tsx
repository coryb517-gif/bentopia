import { BUILD, hasStorey, levelOf, STOREY_IDS, STOREY_NAMES, type Restaurant, type StoreyId } from './restaurant'

const SHORT: Record<StoreyId, string> = { ground: 'Ground', upstairs: 'Upstairs', rooftop: 'Rooftop' }

/** Switch between the floors of the building. Floors you have not built yet open the Build menu. */
export default function StoreyTabs({ r, active, onPick, onLocked }: { r: Restaurant; active: StoreyId; onPick: (id: StoreyId) => void; onLocked: (id: StoreyId) => void }) {
  const level = levelOf(r)
  return (
    <div className="storeys" role="tablist" aria-label="Floors">
      {STOREY_IDS.map((id) => {
        const built = hasStorey(r, id)
        const need = id === 'ground' ? 1 : BUILD[id].level
        return (
          <button
            key={id}
            role="tab"
            aria-selected={active === id}
            title={STOREY_NAMES[id]}
            className={`storey${active === id ? ' on' : ''}${built ? '' : ' off'}`}
            onClick={() => (built ? onPick(id) : onLocked(id))}
          >
            {SHORT[id]}
            {!built && <small>{level >= need ? 'Build' : `Lv ${need}`}</small>}
          </button>
        )
      })}
    </div>
  )
}
