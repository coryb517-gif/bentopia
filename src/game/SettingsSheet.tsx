import type { Pref } from './audio'

interface Props {
  prefs: Record<Pref, boolean>
  onPref: (k: Pref) => void
  onClose: () => void
}

const LABEL: Record<Pref, string> = { music: '🎵 Music', sound: '🔔 Effects', haptics: '📳 Haptics' }

/** Sound and touch settings, reachable from every screen that has the bottom bar. */
export default function SettingsSheet({ prefs, onPref, onClose }: Props) {
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="Settings" onClick={onClose}>
      <div className="card" onClick={(e) => e.stopPropagation()}>
        <h2>Settings</h2>
        <div className="chips">
          {(['music', 'sound', 'haptics'] as Pref[]).map((k) => (
            <button key={k} className={`chip${prefs[k] ? ' on' : ''}`} aria-pressed={prefs[k]} onClick={() => onPref(k)}>
              {LABEL[k]}
            </button>
          ))}
        </div>
        <div className="actions">
          <button className="btn primary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  )
}
