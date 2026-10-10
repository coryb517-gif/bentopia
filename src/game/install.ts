import { useEffect, useState } from 'react'

interface InstallEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: string }>
}

let deferred: InstallEvent | null = null
const listeners = new Set<() => void>()
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferred = e as InstallEvent
    listeners.forEach((l) => l())
  })
  window.addEventListener('appinstalled', () => {
    deferred = null
    listeners.forEach((l) => l())
  })
}

const standalone = () => typeof window !== 'undefined' && (window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true)
const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

export type InstallState = { kind: 'installed' } | { kind: 'prompt'; run: () => void } | { kind: 'ios' } | { kind: 'manual' }

/** What "add to home screen" can do on this device right now. */
export function useInstall(): InstallState {
  const [, bump] = useState(0)
  useEffect(() => {
    const l = () => bump((n) => n + 1)
    listeners.add(l)
    return () => { listeners.delete(l) }
  }, [])
  if (standalone()) return { kind: 'installed' }
  if (deferred) {
    const ev = deferred
    return { kind: 'prompt', run: () => { void ev.prompt(); deferred = null; listeners.forEach((l) => l()) } }
  }
  return isIos() ? { kind: 'ios' } : { kind: 'manual' }
}
