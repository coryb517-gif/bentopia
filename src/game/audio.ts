/** Synthesised audio: nothing to download. Music, sound and haptics are separate toggles. */
export type Pref = 'sound' | 'music' | 'haptics'

const prefs: Record<Pref, boolean> = { sound: true, music: true, haptics: true }
try {
  for (const k of Object.keys(prefs) as Pref[]) prefs[k] = localStorage.getItem(`bentopia.${k}`) !== 'off'
} catch {
  /* storage unavailable */
}

export const getPref = (k: Pref) => prefs[k]

export function setPref(k: Pref, on: boolean) {
  prefs[k] = on
  try {
    localStorage.setItem(`bentopia.${k}`, on ? 'on' : 'off')
  } catch {
    /* storage unavailable */
  }
  if (k === 'music') (on ? startMusic : stopMusic)()
}

let ctx: AudioContext | null = null
let master: GainNode | null = null

function audio(): AudioContext | null {
  const AC = window.AudioContext
  if (!AC) return null
  if (!ctx) {
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = 0.9
    master.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function tone(freq: number, dur: number, type: OscillatorType, gain: number, slideTo?: number, delay = 0, bus?: AudioNode) {
  const c = audio()
  if (!c || !master) return
  const t = c.currentTime + delay
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(gain, t + 0.012)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.connect(g).connect(bus ?? master)
  osc.start(t)
  osc.stop(t + dur + 0.05)
}

// C major pentatonic, two octaves: every note sounds right with every other.
const SCALE = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 880.0]

export function haptic(ms: number) {
  if (prefs.haptics) navigator.vibrate?.(ms)
}

/** Each tile in the chain climbs the scale, so a long chain sounds like a run. */
export function popSound(len: number) {
  if (prefs.sound) tone(SCALE[Math.min(len, SCALE.length - 1)], 0.14, 'sine', 0.16)
  haptic(8)
}

/** Wooden clack, then a little chime that grows with the tier made. */
export function clackSound(tier = 1) {
  if (prefs.sound) {
    tone(190, 0.12, 'triangle', 0.24, 90)
    const notes = tier >= 2 ? [5, 7, 8, 9] : [5, 7]
    notes.forEach((n, i) => tone(SCALE[n], 0.28, 'sine', 0.1, undefined, 0.05 + i * 0.07))
  }
  haptic(tier >= 2 ? 30 : 16)
}

export function coinSound(i = 0) {
  if (prefs.sound) tone(1320 + (i % 5) * 110, 0.09, 'square', 0.035)
}

export function winSound() {
  if (prefs.sound) [0, 2, 4, 5, 7, 9].forEach((n, i) => tone(SCALE[n], 0.32, 'triangle', 0.14, undefined, i * 0.09))
  haptic(40)
}

export function loseSound() {
  if (prefs.sound) {
    tone(330, 0.3, 'triangle', 0.14, 220)
    tone(262, 0.45, 'triangle', 0.12, 165, 0.22)
  }
}

// ---------- Background music ----------
// A slow lo-fi loop: soft pad chords under a wandering pentatonic melody.
const CHORDS = [
  [130.81, 196.0, 261.63, 329.63], // C
  [110.0, 164.81, 220.0, 261.63], // Am
  [87.31, 130.81, 174.61, 261.63], // F
  [98.0, 146.83, 196.0, 293.66], // G
]
const BEAT = 0.46

let musicTimer: ReturnType<typeof setInterval> | null = null
let nextBeat = 0
let beatNo = 0
let melody = 4
let musicBus: GainNode | null = null

function scheduleMusic() {
  const c = ctx
  if (!c || !musicBus) return
  while (nextBeat < c.currentTime + 0.8) {
    const bar = Math.floor(beatNo / 8) % CHORDS.length
    const inBar = beatNo % 8
    if (inBar === 0) CHORDS[bar].forEach((f) => tone(f, BEAT * 8.2, 'sine', 0.05, undefined, nextBeat - c.currentTime, musicBus!))
    // wandering melody on most beats, with the odd rest
    if (inBar % 2 === 0 || Math.sin(beatNo * 12.9898) > 0.2) {
      melody = Math.max(0, Math.min(SCALE.length - 1, melody + Math.round(Math.sin(beatNo * 4.1) * 2)))
      tone(SCALE[melody], BEAT * 1.6, 'triangle', 0.035, undefined, nextBeat - c.currentTime, musicBus)
    }
    nextBeat += BEAT
    beatNo++
  }
}

export function startMusic() {
  if (!prefs.music || musicTimer) return
  const c = audio()
  if (!c) return
  musicBus = c.createGain()
  musicBus.gain.value = 0.55
  const lp = c.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 1500
  musicBus.connect(lp).connect(master!)
  nextBeat = c.currentTime + 0.1
  musicTimer = setInterval(scheduleMusic, 200)
  scheduleMusic()
}

export function stopMusic() {
  if (musicTimer) clearInterval(musicTimer)
  musicTimer = null
  musicBus?.disconnect()
  musicBus = null
}
