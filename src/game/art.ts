/**
 * Hand-built vector illustrations. Style bible: 100x100 canvas, one warm outline weight,
 * 3-tone cel shading (base, shade crescent bottom-right, highlight top-left).
 */
export const OUTLINE = '#3b2417'
const OW = 3.4

let uid = 0

/** A shape with outline and a shade crescent (the base shape shifted up-left, clipped to the shape). */
function cel(d: string, base: string, shade: string, extra = '', sw = OW, shift = 5): string {
  const id = `c${uid++}`
  return (
    `<clipPath id="${id}"><path d="${d}"/></clipPath>` +
    `<path d="${d}" fill="${shade}"/>` +
    `<g clip-path="url(#${id})"><path d="${d}" fill="${base}" transform="translate(${-shift} ${-shift})"/>${extra}</g>` +
    `<path d="${d}" fill="none" stroke="${OUTLINE}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"/>`
  )
}

const circ = (cx: number, cy: number, r: number) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`
const ell = (cx: number, cy: number, rx: number, ry: number) =>
  `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0Z`
const rrect = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r} ${y}H${x + w - r}a${r} ${r} 0 0 1 ${r} ${r}V${y + h - r}a${r} ${r} 0 0 1 ${-r} ${r}H${x + r}a${r} ${r} 0 0 1 ${-r} ${-r}V${y + r}a${r} ${r} 0 0 1 ${r} ${-r}Z`

const shine = (cx: number, cy: number, rx: number, ry: number, rot = -35, o = 0.8) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#fff" opacity="${o}" transform="rotate(${rot} ${cx} ${cy})"/>`
const stroke = (d: string, color: string, w: number, extra = '') =>
  `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`
const dot = (cx: number, cy: number, r: number, fill: string, ol = false) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"${ol ? ` stroke="${OUTLINE}" stroke-width="2"` : ''}/>`

const RICE = '#fffdf7'
const RICE_SH = '#d8cdb8'
const NORI = '#2d3b33'
const NORI_SH = '#18211c'
const SALMON = '#ff8f66'
const SALMON_SH = '#e2603c'

/** Little cloud of rice grains used as texture. */
const grains = (pts: [number, number, number][]) =>
  pts
    .map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="3" ry="1.6" fill="#fff" stroke="#cfc3ab" stroke-width="0.9" transform="rotate(${r} ${x} ${y})"/>`)
    .join('')

const items: Record<string, () => string> = {
  // ---------- Rice ----------
  '0-0': () =>
    cel('M20 54C18 30 38 16 50 16C62 16 82 30 80 54Z', RICE, RICE_SH, grains([[40, 30, 20], [56, 26, -30], [64, 40, 50], [34, 44, -10], [50, 40, 70], [46, 22, 10]])) +
    cel('M12 50H88C88 76 72 90 50 90C28 90 12 76 12 50Z', '#4a5db0', '#2b3578',
      stroke('M26 66q8 -8 16 0t16 0t16 0', '#fff', 2.6, 'opacity="0.9"') + stroke('M26 76q8 -8 16 0t16 0t16 0', '#fff', 2.6, 'opacity="0.7"')) +
    cel('M10 46H90V55H10Z', '#6f82d6', '#4a5db0', '', OW - 0.6, 3) +
    shine(26, 62, 5, 2, -50),
  '0-1': () =>
    cel('M50 12C57 12 61 17 66 27L85 66C90 77 83 87 72 87H28C17 87 10 77 15 66L34 27C39 17 43 12 50 12Z', RICE, RICE_SH,
      grains([[42, 30, 20], [58, 36, -30], [36, 48, 40], [66, 52, 10]]) +
      `<path d="M26 60H74L84 92H16Z" fill="${NORI}"/><path d="M16 74 H84 V92H16Z" fill="${NORI_SH}" opacity="0.55"/>` +
      shine(36, 70, 6, 1.8, -20, 0.35)) +
    dot(50, 36, 4.2, '#e8647f', true) + shine(36, 32, 4, 9, 25, 0.8),
  '0-2': () =>
    cel(rrect(6, 24, 88, 60, 12), '#d4503b', '#8e2618') +
    cel(rrect(13, 31, 74, 46, 7), '#f0cf96', '#c9a063') +
    // compartments
    cel(rrect(16, 34, 34, 40, 5), RICE, RICE_SH, grains([[26, 46, 20], [38, 54, -20], [28, 62, 40], [40, 42, 0], [24, 70, 10]]) + dot(34, 52, 1.6, '#222') + dot(28, 60, 1.6, '#222'), 2.4, 4) +
    cel(rrect(54, 34, 30, 17, 5), SALMON, SALMON_SH, stroke('M60 40 L66 38M70 46 L76 42', '#ffe0cf', 2), 2.4, 3) +
    cel(rrect(54, 55, 30, 19, 5), '#ffd35c', '#e0a22a', stroke('M58 60H80M58 66H80', '#fff3bd', 1.6), 2.4, 3) +
    shine(24, 30, 7, 1.8, -10, 0.6),

  // ---------- Fish ----------
  '1-0': () =>
    cel('M44 33L52 18L66 36Z', '#5a95c8', '#33669a', '', 3) +
    cel('M10 52C22 30 58 26 76 46L93 34C91 44 91 58 93 68L76 56C58 76 22 74 10 52Z', '#86bfe8', '#4f86b8',
      `<path d="M8 58C30 68 62 68 82 54L82 84H8Z" fill="#e9f4fb"/>` + stroke('M32 40q6 12 0 24', '#4f86b8', 2.4) + stroke('M44 40q5 12 0 24', '#6fa6d3', 2) + stroke('M56 42q5 10 0 20', '#6fa6d3', 2)) +
    dot(25, 49, 5.2, '#fff', true) + dot(24, 49, 2.6, '#1d1d2e') + dot(23, 48, 0.9, '#fff') +
    shine(42, 38, 12, 2.2, -12, 0.55),
  '1-1': () =>
    cel('M16 56C16 47 24 43 33 43H67C76 43 84 47 84 56V64C84 72 76 77 67 77H33C24 77 16 72 16 64Z', RICE, RICE_SH, grains([[26, 70, 10], [44, 72, -10], [64, 70, 20], [76, 66, 0]])) +
    cel('M10 44C10 32 24 25 38 25H62C76 25 90 32 90 44C90 54 80 60 68 61H32C20 60 10 54 10 44Z', SALMON, SALMON_SH,
      stroke('M30 28Q36 44 28 62', '#ffe2d2', 3.2) + stroke('M46 26Q52 44 44 62', '#ffe2d2', 3.2) + stroke('M62 26Q68 44 60 62', '#ffe2d2', 3.2) + stroke('M78 30Q82 44 76 60', '#ffe2d2', 3)) +
    shine(30, 33, 9, 2, -8, 0.7),
  '1-2': () =>
    cel(circ(50, 54, 42), '#fbfbf6', '#d6d2c4') +
    cel(circ(50, 54, 33), '#fffef8', '#e4dfd0', '', 2.4, 3) +
    stroke(circ(50, 54, 38), '#5a8fd0', 2.4) +
    // sashimi fan
    [-38, 38, 0]
      .map((a, i) =>
        `<g transform="rotate(${a} 50 92)">` +
        cel(rrect(36, 40, 28, 22, 7), i === 2 ? '#ff7d73' : SALMON, i === 2 ? '#d9473f' : SALMON_SH, stroke('M42 52Q50 60 58 52M42 60Q50 68 58 60', '#ffe2d2', 1.8), 2.6, 3) +
        `</g>`,
      )
      .join('') +
    // daikon + wasabi + shiso
    cel(ell(30, 36, 10, 6), '#f4f9ee', '#c9d6bd', '', 2.4, 3) +
    cel(circ(72, 32, 8), '#8ccf4e', '#4f9a2c', stroke('M66 32q6 -6 12 0', '#cdeea8', 1.6), 2.4, 3) +
    cel('M62 74Q74 64 86 74Q74 84 62 74Z', '#4f9a45', '#2f6e2c', stroke('M64 74H84', '#a6d68a', 1.4), 2.4, 3),

  // ---------- Cucumber ----------
  '2-0': () =>
    `<g transform="rotate(-32 50 50)">` +
    cel(rrect(8, 36, 84, 28, 14), '#86c84b', '#4a932a',
      [20, 34, 48, 62, 76].map((x) => dot(x, 44 + ((x / 14) % 2) * 8, 1.7, '#d7f0b2')).join('') + `<rect x="8" y="36" width="84" height="6" fill="#a8dc70" opacity="0.5"/>`) +
    `</g>` +
    cel(circ(72, 74, 15), '#e6f4c4', '#a8cf72', dot(72, 74, 9, '#f6fbe2') + [0, 60, 120, 180, 240, 300].map((a) => dot(72 + 6 * Math.cos((a * Math.PI) / 180), 74 + 6 * Math.sin((a * Math.PI) / 180), 1.4, '#9bc45e')).join('')) +
    `<path d="M57 74a15 15 0 0 1 15 -15" fill="none" stroke="#4a932a" stroke-width="3.2"/>` +
    shine(30, 34, 11, 2.2, -32, 0.6),
  '2-1': () =>
    [[34, 54], [66, 46]]
      .map(([cx, cy]) =>
        cel(circ(cx, cy, 26), NORI, NORI_SH, shine(cx - 12, cy - 12, 8, 2, -40, 0.35)) +
        cel(circ(cx, cy, 20), RICE, RICE_SH, grains([[cx - 10, cy - 8, 20], [cx + 10, cy - 6, -20], [cx - 8, cy + 12, 40], [cx + 9, cy + 11, 0]]), 2.4, 3) +
        cel(circ(cx, cy, 9.5), '#86c84b', '#4a932a', dot(cx, cy, 5, '#e6f4c4') + dot(cx - 1, cy - 1, 1, '#9bc45e'), 2.4, 2.5),
      )
      .join(''),
  '2-2': () =>
    stroke('M34 26q-6 -8 0 -14t0 -10', '#fff', 4, 'opacity="0.75"') +
    stroke('M50 24q-6 -8 0 -14t0 -10', '#fff', 4, 'opacity="0.75"') +
    stroke('M66 26q-6 -8 0 -14t0 -10', '#fff', 4, 'opacity="0.75"') +
    cel(circ(14, 50, 6), '#5a5266', '#3a3446', '', 3) + cel(circ(86, 50, 6), '#5a5266', '#3a3446', '', 3) +
    cel('M12 46H88C88 74 74 88 50 88C26 88 12 74 12 46Z', '#6a6178', '#3f3850', shine(26, 66, 6, 2, -50, 0.35) + stroke('M20 62Q50 70 80 62', '#8d84a0', 2)) +
    cel(ell(50, 46, 38, 11), '#e8a65c', '#bf7a30', '', 3, 3) +
    cel(circ(34, 46, 6.5), '#9fd35a', '#5e9d2e', dot(34, 46, 3, '#e6f4c4'), 2.2, 2) +
    cel(rrect(46, 40, 13, 10, 3), '#fffdf4', '#d4cdb8', '', 2.2, 2) +
    cel(circ(68, 47, 6), '#ffb3b8', '#e07a85', stroke('M64 47q4 -4 8 0', '#fff', 1.4), 2.2, 2) +
    cel(rrect(26, 50, 12, 6, 3), '#ff9d6e', '#d96a38', '', 2, 2),

  // ---------- Egg ----------
  '3-0': () =>
    cel('M50 10C73 10 84 40 84 58C84 77 69 90 50 90C31 90 16 77 16 58C16 40 27 10 50 10Z', '#f7e3bf', '#d8b57d',
      [[40, 66], [60, 48], [50, 78], [66, 68], [38, 54]].map(([x, y]) => dot(x, y, 1.3, '#d0a76b')).join('')) +
    shine(37, 30, 6, 12, 22, 0.85) + shine(32, 50, 2, 3, 15, 0.7),
  '3-1': () =>
    cel('M16 56C16 47 24 43 33 43H67C76 43 84 47 84 56V64C84 72 76 77 67 77H33C24 77 16 72 16 64Z', RICE, RICE_SH, grains([[26, 70, 10], [44, 72, -10], [68, 70, 20]])) +
    cel('M10 44C10 32 22 27 36 27H64C78 27 90 32 90 44C90 54 82 60 70 61H30C18 60 10 54 10 44Z', '#ffd45e', '#e1a22a',
      stroke('M16 38H84', '#fff0a6', 1.8, 'opacity="0.8"') + stroke('M14 46H86', '#e1a22a', 1.6, 'opacity="0.7"') + stroke('M16 54H84', '#fff0a6', 1.8, 'opacity="0.8"')) +
    cel(rrect(42, 22, 16, 56, 3), NORI, NORI_SH, shine(46, 34, 2, 7, 0, 0.3), 3, 2.5) +
    shine(26, 34, 8, 2, -8, 0.65),
  '3-2': () =>
    cel('M10 44H90C90 72 74 90 50 90C26 90 10 72 10 44Z', '#d4503b', '#8e2618', stroke('M22 60Q50 70 78 60', '#ffd35c', 2.6) + shine(24, 66, 6, 2, -50, 0.4)) +
    cel(ell(50, 44, 40, 12), '#eac27c', '#c4954a', '', 3, 3) +
    stroke('M20 42q8 -6 14 0t14 0t14 0t14 0', '#ffe28a', 4.5) + stroke('M24 48q8 -6 14 0t14 0t14 0', '#f7cf63', 4.5) +
    cel(ell(34, 40, 8.5, 6.5), '#fffdf4', '#d4cdb8', dot(34, 40, 3.2, '#ffa83a'), 2.2, 2) +
    cel(circ(66, 41, 7.5), '#fffdf4', '#e0d6c0', stroke('M61 41q3 -5 6 0t6 0', '#ff7f94', 2), 2.2, 2) +
    cel(rrect(70, 30, 12, 14, 2), NORI, NORI_SH, '', 2.4, 2) +
    dot(48, 36, 1.8, '#6cc04a') + dot(52, 33, 1.8, '#6cc04a') + dot(44, 33, 1.8, '#6cc04a'),

  // ---------- Shrimp ----------
  '4-0': () =>
    stroke('M74 24C92 40 80 72 52 74C40 75 30 70 24 62', OUTLINE, 24) +
    stroke('M74 24C92 40 80 72 52 74C40 75 30 70 24 62', '#ff9a6a', 17) +
    stroke('M76 24C93 42 80 73 52 76', '#e2653a', 5, 'opacity="0.9"') +
    stroke('M74 24C92 40 80 72 52 74C40 75 30 70 24 62', '#e2653a', 17, 'stroke-dasharray="1.6 9" opacity="0.85"') +
    stroke('M70 20C84 30 84 48 78 54', '#ffd0b2', 3.2, 'opacity="0.8"') +
    cel('M24 62L8 54L10 70L22 80Z', '#ff7e52', '#cc4a25', stroke('M10 60L20 66M12 70L22 72', '#ffd0b2', 1.6), 2.8, 2) +
    stroke('M72 22C66 8 52 6 44 10', OUTLINE, 3) + stroke('M76 22C80 8 90 6 96 10', OUTLINE, 3) +
    dot(70, 26, 3.6, '#1d1d2e') + dot(69, 25, 1.1, '#fff'),
  '4-1': () =>
    cel('M20 70L6 82L14 88L28 80Z', '#ff7a4d', '#c9441f', '', 3, 2) +
    cel('M14 64C12 42 32 24 56 26C78 28 90 46 84 64C80 78 62 84 44 82C28 80 16 76 14 64Z', '#f2b552', '#c8832a',
      [[34, 44], [50, 36], [68, 42], [40, 62], [58, 58], [74, 60], [30, 56], [62, 72]].map(([x, y], i) => dot(x, y, 2 + (i % 3), '#ffdc8a')).join('') +
      `<path d="M10 66C30 74 60 78 90 66V90H10Z" fill="#c8832a" opacity="0.28"/>`) +
    shine(40, 38, 9, 3, -20, 0.55),
  '4-2': () =>
    cel(ell(50, 62, 44, 26), '#fffdf7', '#d9d4c4') +
    cel('M12 62C10 44 26 36 40 40C48 42 50 50 46 58C44 66 26 78 18 72C14 70 12 66 12 62Z', RICE, RICE_SH, grains([[22, 54, 10], [34, 50, -20], [28, 64, 30]]), 2.6, 3) +
    cel('M42 46C58 36 84 44 86 60C88 74 66 84 52 80C42 78 36 70 38 62C38 56 38 50 42 46Z', '#a9621f', '#6e3a10', dot(70, 56, 1.8, '#d68b3c') + dot(58, 68, 1.8, '#d68b3c'), 2.6, 3) +
    [0, 1, 2]
      .map((i) => `<g transform="rotate(${-24 + i * 4} ${52 + i * 8} ${44 + i * 6})">` + cel(rrect(36 + i * 9, 30 + i * 6, 26, 15, 5), '#f0b34a', '#c07a22', `<rect x="${40 + i * 9}" y="${34 + i * 6}" width="18" height="6" rx="2" fill="#fff0cc" opacity="0.8"/>`, 2.4, 3) + `</g>`)
      .join('') +
    dot(78, 74, 4.2, '#ff9a3a', true),

  // ---------- Corn ----------
  '5-0': () =>
    `<g transform="rotate(-32 50 46)">` +
    cel('M50 8C66 8 74 28 74 48C74 62 66 70 50 70C34 70 26 62 26 48C26 28 34 8 50 8Z', '#ffd53f', '#e0a31c',
      [14, 24, 34, 44, 54, 64].map((y) => [34, 42, 50, 58, 66].map((x) => `<ellipse cx="${x + (y % 20 ? 3 : 0)}" cy="${y}" rx="3.7" ry="4.3" fill="#ffe88a" stroke="#d99a14" stroke-width="1"/>`).join('')).join('')) +
    cel('M50 94C30 82 22 62 30 50C40 62 46 70 50 94Z', '#7ec44c', '#3f8a2a', stroke('M42 66Q44 78 48 88', '#c8eea0', 2), 3, 3) +
    cel('M50 94C70 82 78 62 70 50C60 62 54 70 50 94Z', '#6fb83f', '#337a22', '', 3, 3) +
    `</g>` + shine(38, 24, 3, 9, 20, 0.75),
  '5-1': () =>
    stroke('M10 90L90 10', OUTLINE, 9) + stroke('M10 90L90 10', '#e4c28a', 4) +
    [[34, 66], [52, 48], [70, 30]]
      .map(([x, y]) => cel(rrect(x - 15, y - 14, 30, 28, 11), '#ffd53f', '#d9981a', `<path d="M${x - 16} ${y - 3}H${x + 16}M${x - 16} ${y + 6}H${x + 16}" stroke="#ffe88a" stroke-width="2" opacity="0.7"/>` + stroke(`M${x - 8} ${y - 8}l5 5M${x + 3} ${y + 4}l5 5`, '#7a4a14', 2.6), 3, 3.5))
      .join('') +
    shine(24, 58, 3, 6, 20, 0.7),
  '5-2': () =>
    cel(circ(50, 52, 40), '#e2a355', '#a96a22',
      `<circle cx="50" cy="52" r="30" fill="#f0bb72" opacity="0.8"/>` + [[34, 36], [62, 34], [40, 66], [66, 62], [52, 52]].map(([x, y]) => dot(x, y, 1.6, '#c98638')).join('')) +
    cel(rrect(8, 42, 84, 18, 3), NORI, NORI_SH, shine(24, 46, 5, 1.5, 0, 0.3), 3, 2.5) +
    shine(30, 30, 11, 3, -40, 0.6),
}

/** A maki roll seen end-on: nori, rice, then whatever filling `inner` draws. */
function maki(cx: number, cy: number, r: number, inner: string): string {
  return (
    cel(circ(cx, cy, r), NORI, NORI_SH, shine(cx - r * 0.5, cy - r * 0.5, r * 0.28, 2, -40, 0.35)) +
    cel(circ(cx, cy, r * 0.78), RICE, RICE_SH, grains([[cx - r * 0.45, cy - r * 0.3, 20], [cx + r * 0.4, cy - r * 0.4, -20], [cx - r * 0.3, cy + r * 0.5, 40], [cx + r * 0.45, cy + r * 0.35, 0]]), 2.4, 3) +
    inner
  )
}

const wedge = (cx: number, cy: number, r: number, a0: number, a1: number, fill: string) => {
  const p = (a: number) => `${cx + r * Math.cos((a * Math.PI) / 180)} ${cy + r * Math.sin((a * Math.PI) / 180)}`
  return `<path d="M${cx} ${cy}L${p(a0)}A${r} ${r} 0 0 1 ${p(a1)}Z" fill="${fill}"/>`
}

// Mixed dishes (kinds 6+): finished dishes only.
Object.assign(items, {
  // Chirashi bowl: a mound of rice piled with toppings in a white bowl.
  '6-2': () =>
    cel('M16 54C16 26 36 14 50 14C64 14 84 26 84 54Z', RICE, RICE_SH,
      `<rect x="18" y="28" width="30" height="14" rx="5" fill="${SALMON}" stroke="${OUTLINE}" stroke-width="2.4" transform="rotate(-12 33 35)"/>` +
      `<path d="M24 31l8 -2M30 36l8 -2" stroke="#ffe2d2" stroke-width="1.6" stroke-linecap="round"/>` +
      `<rect x="50" y="20" width="18" height="16" rx="3" fill="#ffd45e" stroke="${OUTLINE}" stroke-width="2.4"/>` +
      `<path d="M53 26H65M53 31H65" stroke="#fff3bd" stroke-width="1.4"/>` +
      `<circle cx="72" cy="38" r="8" fill="#9fdc62" stroke="${OUTLINE}" stroke-width="2.4"/><circle cx="72" cy="38" r="4" fill="#e6f4c4"/>` +
      `<rect x="40" y="14" width="9" height="20" rx="2" fill="${NORI}" stroke="${OUTLINE}" stroke-width="2" transform="rotate(8 44 24)"/>` +
      [[34, 46], [41, 49], [48, 46], [56, 49], [63, 46]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.6" fill="#ff7a2e" stroke="${OUTLINE}" stroke-width="1.4"/><circle cx="${x - 1}" cy="${y - 1}" r="1" fill="#ffd0a0"/>`).join('')) +
    cel('M10 52H90C90 76 74 90 50 90C26 90 10 76 10 52Z', '#fffdf7', '#d0c6b0', stroke('M18 62Q50 74 82 62', '#d4503b', 4) + shine(24, 70, 5, 2, -50, 0.6)) +
    cel('M8 49H92V55H8Z', '#ffffff', '#d8d0bf', '', 3, 2),
  // Tempura roll: two maki, one with a crisp prawn tempura poking out.
  '7-2': () =>
    maki(64, 38, 24, cel(circ(64, 38, 9), '#86c84b', '#4a932a', dot(64, 38, 4, '#e6f4c4'), 2.4, 2.5)) +
    maki(40, 62, 30,
      cel(circ(40, 62, 14), '#f2b552', '#c8832a', [[34, 57], [44, 58], [38, 68], [46, 66]].map(([x, y]) => dot(x, y, 2, '#ffdc8a')).join(''), 2.6, 3) +
      cel('M50 52L62 44L64 54L54 60Z', '#ff7a4d', '#c9441f', '', 2.4, 2)) +
    [[26, 50], [52, 76], [24, 70]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="2.4" ry="1.3" fill="#fff" stroke="#bbb" stroke-width="0.6"/>`).join(''),
  // Yakitori feast: three skewers fanned over a plate.
  '8-2': () =>
    cel(ell(50, 70, 46, 22), '#fffdf7', '#d9d4c4') +
    [-24, 24, 0]
      .map((a) =>
        `<g transform="rotate(${a} 50 88)">` +
        `<path d="M50 90V10" stroke="${OUTLINE}" stroke-width="7" stroke-linecap="round"/><path d="M50 90V10" stroke="#e8c88c" stroke-width="3.2" stroke-linecap="round"/>` +
        cel(rrect(40, 14, 20, 20, 8), '#ffd53f', '#d9981a', stroke('M42 22H58M42 28H58', '#ffe88a', 1.6), 2.6, 3) +
        cel(rrect(40, 36, 20, 18, 5), '#ffd45e', '#e0a22a', stroke('M42 42H58M42 48H58', '#fff3bd', 1.4), 2.6, 3) +
        cel(circ(50, 66, 11), '#f2b552', '#c8832a', dot(46, 62, 1.8, '#ffdc8a') + dot(54, 68, 1.8, '#ffdc8a'), 2.6, 3) +
        `</g>`,
      )
      .join('') +
    cel(circ(84, 74, 5), '#ff9a3a', '#d96a1a', '', 2.4, 2),
  // Rainbow maki: rolls with a three-color heart.
  '9-2': () =>
    maki(62, 38, 26, wedge(62, 38, 11, -90, 30, '#ff8fb0') + wedge(62, 38, 11, 30, 150, '#8fe06a') + wedge(62, 38, 11, 150, 270, '#ffd45e') + `<circle cx="62" cy="38" r="11" fill="none" stroke="${OUTLINE}" stroke-width="2.4"/>`) +
    maki(36, 64, 30, wedge(36, 64, 14, -90, 30, '#7fe6ff') + wedge(36, 64, 14, 30, 150, '#ff8fb0') + wedge(36, 64, 14, 150, 270, '#c4a8ff') + `<circle cx="36" cy="64" r="14" fill="none" stroke="${OUTLINE}" stroke-width="2.6"/>`),
})

/** Every illustration that exists, as [kind, tier] pairs. */
export const ART_PAIRS: [number, number][] = Object.keys(items).map((k) => k.split('-').map(Number) as [number, number])
export const hasArt = (kind: number, tier: number) => `${kind}-${tier}` in items

/** Kawaii face: wide-set shiny eyes, blush, tiny smile. */
function face(cx: number, cy: number, s: number): string {
  const eye = (x: number) =>
    `<ellipse cx="${x}" cy="${cy}" rx="${2.7 * s}" ry="${3.5 * s}" fill="#2a1a14"/>` +
    `<circle cx="${x - 0.9 * s}" cy="${cy - 1.3 * s}" r="${1.05 * s}" fill="#fff"/>`
  const blush = (x: number) => `<ellipse cx="${x}" cy="${cy + 4.6 * s}" rx="${3.6 * s}" ry="${2.1 * s}" fill="#ff7d96" opacity="0.55"/>`
  return (
    blush(cx - 13 * s) + blush(cx + 13 * s) + eye(cx - 8 * s) + eye(cx + 8 * s) +
    `<path d="M${cx - 3 * s} ${cy + 4.2 * s}q${3 * s} ${3.4 * s} ${6 * s} 0" fill="none" stroke="#2a1a14" stroke-width="${1.7 * s}" stroke-linecap="round"/>`
  )
}

// [cx, cy, scale, rotation, pivotX, pivotY]: where each dish wears its face.
const FACES: Record<string, number[]> = {
  '0-0': [50, 36, 1],
  '0-1': [50, 53, 0.85],
  '0-2': [33, 52, 0.7],
  '1-1': [50, 43, 0.9],
  '2-0': [50, 50, 0.85, -32, 50, 50],
  '2-2': [50, 74, 0.85],
  '3-0': [50, 56, 1.15],
  '3-2': [50, 77, 0.85],
  '4-1': [52, 54, 1],
  '5-0': [50, 36, 0.8, -32, 50, 46],
  '5-1': [52, 48, 0.55],
  '5-2': [50, 30, 0.8],
}

const sparkle = (x: number, y: number, r: number) =>
  `<path d="M${x} ${y - r}Q${x + r * 0.18} ${y - r * 0.18} ${x + r} ${y}Q${x + r * 0.18} ${y + r * 0.18} ${x} ${y + r}Q${x - r * 0.18} ${y + r * 0.18} ${x - r} ${y}Q${x - r * 0.18} ${y - r * 0.18} ${x} ${y - r}Z" fill="#fff" stroke="#ffc233" stroke-width="1.2"/>`

export function svgFor(kind: number, tier: number): string {
  uid = 0
  const key = `${kind}-${tier}`
  const f = FACES[key]
  let body = items[key]()
  if (f) {
    const [cx, cy, s, rot, px, py] = f
    const g = face(cx, cy, s)
    body += rot !== undefined ? `<g transform="rotate(${rot} ${px} ${py})">${g}</g>` : g
  }
  // Fish keeps its own eye; give it a blush and a smile instead.
  if (key === '1-0') body += `<ellipse cx="29" cy="57" rx="4" ry="2.4" fill="#ff7d96" opacity="0.6"/><path d="M17 56q3 3 6 0" fill="none" stroke="#2a1a14" stroke-width="1.8" stroke-linecap="round"/>`
  if (key === '4-0') body += `<ellipse cx="80" cy="36" rx="3.4" ry="2" fill="#ff5a73" opacity="0.5"/>`
  // Finished dishes glitter.
  if (tier === 2) body += sparkle(86, 16, 9) + sparkle(14, 22, 6)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${body}</svg>`
}

export function svgUrl(kind: number, tier: number): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgFor(kind, tier))}`
}

const cache = new Map<string, Promise<HTMLImageElement>>()
const loaded = new Map<string, HTMLImageElement>()

/** Synchronous lookup, valid once loadAllArt() has resolved. */
export function artImage(kind: number, tier: number): HTMLImageElement {
  return loaded.get(`${kind}-${tier}`)!
}

export function loadArt(kind: number, tier: number): Promise<HTMLImageElement> {
  const key = `${kind}-${tier}`
  let p = cache.get(key)
  if (!p) {
    p = new Promise((resolve, reject) => {
      const img = new Image()
      img.width = 256
      img.height = 256
      img.onload = () => {
        loaded.set(key, img)
        resolve(img)
      }
      img.onerror = reject
      img.src = svgUrl(kind, tier)
    })
    cache.set(key, p)
  }
  return p
}

export async function loadAllArt(): Promise<void> {
  await Promise.all(ART_PAIRS.map(([k, t]) => loadArt(k, t)))
}
