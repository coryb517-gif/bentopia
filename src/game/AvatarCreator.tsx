import { useState } from 'react'
import { ACCESSORIES, avatarName, HAIR_COLORS, HAIRS, NAME_MAX, NAMES, OUTFITS, randomAvatar, sanitizeName, SKINS, type Avatar } from './avatar'
import { AvatarPortrait } from './AvatarFigure'

interface Props {
  initial: Avatar
  first: boolean
  onDone: (a: Avatar) => void
  onCancel?: () => void
}

/** Pick a name, skin, hair, outfit and accessory. Every choice is a button: nothing to type. */
export default function AvatarCreator({ initial, first, onDone, onCancel }: Props) {
  const [a, setA] = useState(initial)
  const set = <K extends keyof Avatar>(k: K, v: Avatar[K]) => setA((x) => ({ ...x, [k]: v, ...(k === 'name' ? { custom: undefined } : {}) }))

  const swatches = (key: 'skin' | 'hairColor' | 'outfit', colours: string[], label: string) => (
    <div className="acrow" role="radiogroup" aria-label={label}>
      <span>{label}</span>
      <div>
        {colours.map((c, i) => (
          <button key={c} role="radio" aria-checked={a[key] === i} aria-label={`${label} ${i + 1}`} className={`swatch${a[key] === i ? ' on' : ''}`} style={{ background: c }} onClick={() => set(key, i)} />
        ))}
      </div>
    </div>
  )
  const pills = (key: 'hair' | 'accessory' | 'name', options: string[], label: string) => (
    <div className="acrow" role="radiogroup" aria-label={label}>
      <span>{label}</span>
      <div>
        {options.map((o, i) => (
          <button key={o} role="radio" aria-checked={a[key] === i} className={`apill${a[key] === i ? ' on' : ''}`} onClick={() => set(key, i)}>{o}</button>
        ))}
      </div>
    </div>
  )

  return (
    <main className="screen avatarmaker">
      <header className="bar">
        {onCancel ? <button className="btn ghost" onClick={onCancel}>Back</button> : <span className="spacer" />}
        <h2>{first ? 'Meet your host' : 'Your look'}</h2>
        <button className="btn ghost" onClick={() => setA(randomAvatar())}>Random</button>
      </header>
      <div className="acstage">
        <AvatarPortrait a={a} size={150} />
        <p className="acname">{avatarName(a)}</p>
      </div>
      <div className="acpanel">
        <div className="acrow">
          <span>Your name</span>
          <input
            className="acinput"
            type="text"
            inputMode="text"
            autoComplete="off"
            maxLength={NAME_MAX}
            placeholder="Type a name"
            value={a.custom ?? ''}
            onChange={(e) => setA((x) => ({ ...x, custom: sanitizeName(e.target.value + (e.target.value.endsWith(' ') ? ' ' : '')).slice(0, NAME_MAX) || undefined }))}
            aria-label="Your name"
          />
        </div>
        {pills('name', NAMES, 'Or pick one')}
        {swatches('skin', SKINS, 'Skin')}
        {pills('hair', HAIRS, 'Hair')}
        {swatches('hairColor', HAIR_COLORS, 'Hair colour')}
        {swatches('outfit', OUTFITS, 'Happi coat')}
        {pills('accessory', ACCESSORIES, 'Extra')}
      </div>
      <button className="btn primary acdone" onClick={() => onDone(a)}>{first ? `Hi, I'm ${avatarName(a)}!` : 'Save'}</button>
    </main>
  )
}
