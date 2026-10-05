import Exterior from './Exterior'
import { buildStorey, newRestaurant, placeItem, applyStorey, storeyView, expandStorey, type Restaurant } from './restaurant'

export function grown(): Restaurant {
  let r = newRestaurant(0)
  for (let i = 0; i < 3; i++) r = expandStorey(r, 'ground')
  r = buildStorey(buildStorey(r, 'upstairs'), 'rooftop')
  r = expandStorey(expandStorey(r, 'upstairs'), 'upstairs')
  r = expandStorey(expandStorey(r, 'rooftop'), 'rooftop')
  const roof = storeyView(r, 'rooftop')
  let v: Restaurant = { ...roof, floor: 'grass' }
  v = placeItem(placeItem(placeItem(placeItem(v, 'table', 1, 1), 'sakura', 5, 4), 'rugsakura', 2, 2), 'lamp', 0, 0)
  r = applyStorey(r, 'rooftop', v)
  const up = storeyView(r, 'upstairs')
  r = applyStorey(r, 'upstairs', placeItem(placeItem(up, 'booth', 0, 0), 'table', 3, 3))
  return r
}

/** Dev view at /?exterior. */
export default function ExteriorLab() {
  return (
    <main className="screen" style={{ maxWidth: 760 }}>
      <h2>Exterior lab</h2>
      <Exterior r={newRestaurant(0)} />
      <Exterior r={grown()} />
    </main>
  )
}
