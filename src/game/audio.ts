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

// ---------- Extra effects ----------
let noiseBuf: AudioBuffer | null = null

function noise(): AudioBuffer | null {
  const c = audio()
  if (!c) return null
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate)
    const d = noiseBuf.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  }
  return noiseBuf
}

/** A burst of filtered noise: the body of a bang, a footstep or a rustle. */
function burst(dur: number, gain: number, freq: number, q = 1, type: BiquadFilterType = 'lowpass', delay = 0, sweepTo?: number) {
  const c = audio()
  const buf = noise()
  if (!c || !master || !buf) return
  const t = c.currentTime + delay
  const src = c.createBufferSource()
  src.buffer = buf
  const f = c.createBiquadFilter()
  f.type = type
  f.Q.value = q
  f.frequency.setValueAtTime(freq, t)
  if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur)
  const g = c.createGain()
  g.gain.setValueAtTime(gain, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  src.connect(f).connect(g).connect(master)
  src.start(t, Math.random())
  src.stop(t + dur + 0.05)
}

/** A soft footfall on wooden boards. */
export function stepSound() {
  if (!prefs.sound) return
  burst(0.07, 0.07, 700 + Math.random() * 300, 2, 'bandpass')
  tone(120 + Math.random() * 20, 0.06, 'sine', 0.05, 80)
}

/** Flavor Bomb: a thump, a crackle and a falling whistle. */
export function boomSound() {
  if (prefs.sound) {
    tone(140, 0.4, 'sine', 0.3, 40)
    burst(0.5, 0.22, 3200, 0.7, 'lowpass', 0, 200)
    tone(900, 0.35, 'triangle', 0.06, 220, 0.02)
  }
  haptic(45)
}

/** Restaurant level-up: a bright rising fanfare. */
export function levelUpSound() {
  if (prefs.sound) {
    ;[0, 2, 4, 5, 7, 9, 9].forEach((n, i) => tone(SCALE[n], i === 6 ? 0.7 : 0.22, 'triangle', 0.13, undefined, i * 0.1))
    ;[2, 4, 7].forEach((n) => tone(SCALE[n] * 2, 0.9, 'sine', 0.05, undefined, 0.62))
  }
  haptic(60)
}

/** Claiming a reward: a little cascade of coin sparkles. */
export function claimSound() {
  if (prefs.sound) [0, 1, 2, 3, 4, 5].forEach((i) => tone(1100 + i * 170, 0.1, 'square', 0.04, undefined, i * 0.055))
  haptic(18)
}

/** Emote chirp. */
export function emoteSound() {
  if (prefs.sound) {
    tone(620, 0.09, 'sine', 0.1, 900)
    tone(900, 0.12, 'sine', 0.08, 1200, 0.08)
  }
}

// ---------- Restaurant ambience ----------
// A low murmur of diners with the odd clink and a distant kettle hiss. Follows the Sound toggle.
let ambience: { stop: () => void } | null = null

export function startAmbience() {
  if (ambience || !prefs.sound) return
  const c = audio()
  const buf = noise()
  if (!c || !master || !buf) return
  const src = c.createBufferSource()
  src.buffer = buf
  src.loop = true
  const f = c.createBiquadFilter()
  f.type = 'bandpass'
  f.frequency.value = 520
  f.Q.value = 0.8
  const g = c.createGain()
  g.gain.value = 0.022
  const lfo = c.createOscillator()
  const lfoGain = c.createGain()
  lfo.frequency.value = 0.18
  lfoGain.gain.value = 0.009
  lfo.connect(lfoGain).connect(g.gain)
  src.connect(f).connect(g).connect(master)
  src.start()
  lfo.start()
  const clinks = setInterval(() => {
    if (!prefs.sound) return
    const base = [1760, 2093, 2349, 2637][Math.floor(Math.random() * 4)]
    tone(base, 0.18, 'sine', 0.018)
    tone(base * 1.5, 0.12, 'sine', 0.01, undefined, 0.05)
  }, 4200 + Math.random() * 2000)
  ambience = {
    stop: () => {
      clearInterval(clinks)
      try {
        src.stop()
        lfo.stop()
      } catch {
        /* already stopped */
      }
      src.disconnect()
      ambience = null
    },
  }
}

export function stopAmbience() {
  ambience?.stop()
}
