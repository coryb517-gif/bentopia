let ctx: AudioContext | null = null
let enabled = true
try {
  enabled = localStorage.getItem('bentopia.sound') !== 'off'
} catch {
  /* storage unavailable */
}

export function isSoundOn() {
  return enabled
}

export function setSound(on: boolean) {
  enabled = on
  try {
    localStorage.setItem('bentopia.sound', on ? 'on' : 'off')
  } catch {
    /* storage unavailable */
  }
}

function tone(freq: number, dur: number, type: OscillatorType, gain: number, slideTo?: number) {
  if (!enabled) return
  const AC = window.AudioContext
  if (!AC) return
  ctx ??= new AC()
  if (ctx.state === 'suspended') void ctx.resume()
  const t = ctx.currentTime
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur)
  g.gain.setValueAtTime(gain, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.connect(g).connect(ctx.destination)
  osc.start(t)
  osc.stop(t + dur)
}

export function haptic(ms: number) {
  if (enabled) navigator.vibrate?.(ms)
}

/** Soft pop, rising with chain length. */
export function popSound(len: number) {
  tone(380 + len * 55, 0.09, 'sine', 0.12)
  haptic(8)
}

/** Wooden clack on merge. */
export function clackSound() {
  tone(190, 0.12, 'triangle', 0.22, 90)
  haptic(18)
}

export function winSound() {
  ;[523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.18, 'sine', 0.14), i * 110))
}

export function loseSound() {
  tone(240, 0.35, 'triangle', 0.14, 120)
}
