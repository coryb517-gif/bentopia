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
    { id: 4, type: 'vending', gx: 7, gy: 0 },
    { id: 5, type: 'sign', gx: 6, gy: 0 },
    { id: 6, type: 'counter', gx: 0, gy: 6 },
    { id: 7, type: 'table', gx: 3, gy: 3 },
    { id: 8, type: 'kotatsu', gx: 5, gy: 3 },
    { id: 9, type: 'booth', gx: 3, gy: 6 },
    { id: 10, type: 'pond', gx: 5, gy: 6 },
    { id: 11, type: 'neko', gx: 7, gy: 2 },
    { id: 12, type: 'maple', gx: 7, gy: 4 },
    { id: 13, type: 'tank', gx: 1, gy: 1 },
    { id: 14, type: 'taiko', gx: 2, gy: 1 },
    { id: 15, type: 'statue', gx: 7, gy: 7 },
    { id: 16, type: 'rugred', gx: 2, gy: 2 },
    { id: 17, type: 'runner', gx: 3, gy: 1 },
    { id: 18, type: 'stonelantern', gx: 0, gy: 4 },
    { id: 19, type: 'bamboo', gx: 1, gy: 7 },
    { id: 20, type: 'scroll', gx: 1, gy: 0, wall: 'R' },
    { id: 21, type: 'mask', gx: 5, gy: 0, wall: 'R' },
    { id: 22, type: 'shelf', gx: 7, gy: 0, wall: 'R' },
    { id: 23, type: 'neonramen', gx: 1, gy: 0, wall: 'L' },
    { id: 24, type: 'furin', gx: 6, gy: 0, wall: 'L' },
  ],
  nextId: 25,
}

/** A second room that shows the rest of the catalogue. */
const more: Restaurant = {
  ...newRestaurant(0),
  floor: 'stone',
  wall: 'indigo',
  items: [
    { id: 1, type: 'rugwave', gx: 2, gy: 2 },
    { id: 2, type: 'stove', gx: 0, gy: 0 },
    { id: 3, type: 'ricecooker', gx: 1, gy: 0 },
    { id: 4, type: 'sushicase', gx: 2, gy: 0 },
    { id: 5, type: 'conveyor', gx: 4, gy: 0 },
    { id: 6, type: 'ramencart', gx: 6, gy: 0 },
    { id: 7, type: 'sake', gx: 0, gy: 3 },
    { id: 8, type: 'jukebox', gx: 0, gy: 5 },
    { id: 9, type: 'arcade', gx: 1, gy: 6 },
    { id: 10, type: 'clock', gx: 7, gy: 5 },
    { id: 11, type: 'bench', gx: 3, gy: 3 },
    { id: 12, type: 'fox', gx: 7, gy: 2 },
    { id: 13, type: 'daruma', gx: 6, gy: 7 },
    { id: 14, type: 'screen', gx: 3, gy: 7 },
    { id: 15, type: 'andon', gx: 5, gy: 5 },
    { id: 16, type: 'fountain', gx: 7, gy: 7 },
    { id: 17, type: 'rockgarden', gx: 4, gy: 5 },
    { id: 18, type: 'wallclock', gx: 1, gy: 0, wall: 'R' },
    { id: 19, type: 'kokeshi', gx: 3, gy: 0, wall: 'L' },
    { id: 20, type: 'poster', gx: 6, gy: 0, wall: 'L' },
  ],
  nextId: 21,
}
/** Dev view at /?room. */
export default function RoomLab() {
  return (
    <main className="screen" style={{ maxWidth: 760 }}>
      <h2>Room lab</h2>
      <Room r={full} grid={8} />
      <Room r={more} grid={8} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, background: '#2b1a4a', padding: 12, borderRadius: 16 }}>
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
