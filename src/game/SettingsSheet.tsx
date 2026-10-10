import { useState } from 'react'
import type { Pref } from './audio'
import { useInstall } from './install'

interface Props {
  prefs: Record<Pref, boolean>
  onPref: (k: Pref) => void
  onClose: () => void
}

const LABEL: Record<Pref, string> = { music: '🎵 Music', sound: '🔔 Effects', haptics: '📳 Haptics' }

/** Sound and touch settings, reachable from every screen that has the bottom bar. */
export default function SettingsSheet({ prefs, onPref, onClose }: Props) {
  const install = useInstall()
  const [help, setHelp] = useState(false)
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
        {install.kind !== 'installed' && (
          <>
            <button className="btn" onClick={() => (install.kind === 'prompt' ? install.run() : setHelp((h) => !h))}>📲 Add to home screen</button>
            {help && (
              <p className="installhelp">
                {install.kind === 'ios'
                  ? 'In Safari, tap the Share button, then "Add to Home Screen".'
                  : 'In your browser menu (⋮), choose "Add to Home screen" or "Install app".'}
              </p>
            )}
          </>
        )}
        <div className="actions">
          <button className="btn primary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  )
}
