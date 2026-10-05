import Room, { DecorPreview } from './Room'
import { ITEMS, newRestaurant, type Restaurant } from './restaurant'

export const full: Restaurant = {
  ...newRestaurant(0),
  floor: 'tatami',
  wall: 'cream',
  items: [
    { id: 1, type: 'torii', gx: 2, gy: 0 },
    { id: 2, type: 'lamp', gx: 0, gy: 0 },
    { id: 3, type: 'sakura', gx: 0, gy: 2 },
    { id: 4, type: 'vending', gx: 6, gy: 0 },
    { id: 5, type: 'sign', gx: 5, gy: 0 },
    { id: 6, type: 'counter', gx: 0, gy: 5 },
    { id: 7, type: 'table', gx: 2, gy: 3 },
    { id: 8, type: 'table', gx: 4, gy: 3 },
    { id: 9, type: 'stool', gx: 3, gy: 5 },
    { id: 10, type: 'pond', gx: 4, gy: 5 },
    { id: 11, type: 'neko', gx: 6, gy: 2 },
    { id: 12, type: 'bonsai', gx: 6, gy: 3 },
    { id: 13, type: 'tank', gx: 1, gy: 1 },
    { id: 14, type: 'taiko', gx: 2, gy: 1 },
    { id: 15, type: 'statue', gx: 6, gy: 6 },
  ],
  nextId: 16,
}

/** Dev view at /?room. */
export default function RoomLab() {
  return (
    <main className="screen" style={{ maxWidth: 760 }}>
      <h2>Room lab</h2>
      <Room r={full} grid={7} />
      <Room r={{ ...newRestaurant(0), wall: 'indigo', floor: 'wood' }} grid={5} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, background: '#2b1a4a', padding: 12, borderRadius: 16 }}>
        {ITEMS.map((i) => (
          <figure key={i.type} style={{ margin: 0, textAlign: 'center', fontSize: 12 }}>
            <DecorPreview type={i.type} size={110} />
            <figcaption>{i.name}</figcaption>
          </figure>
        ))}
      </div>
    </main>
  )
}
