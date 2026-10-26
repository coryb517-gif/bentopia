import { CUSTOMERS } from './Customers'

/** Friendship with each customer. Serving someone builds it, and every new level of friendship pays a gift and a postcard. */
export interface Regulars {
  pts: Record<string, number>
  /** How many friendship levels have been claimed for each customer. */
  claimed: Record<string, number>
  /** Customers whose story level has been cleared. */
  story: string[]
}

export const TIERS = [
  { at: 3, coins: 40, name: 'Friendly face' },
  { at: 8, coins: 80, name: 'Regular' },
  { at: 15, coins: 150, name: 'Good friend' },
  { at: 25, coins: 300, name: 'Family' },
  { at: 40, coins: 400, name: 'Best friend' },
  { at: 60, coins: 600, name: 'Lifelong friend' },
]

/** One postcard per friendship level, in the customer's own voice. */
export const POSTCARDS: Record<string, string[]> = {
  obaa: [
    'You remembered I like my rice a little firm. Nobody remembers that.',
    'I brought you my mother’s pickle recipe. Do not tell the neighbours.',
    'My knees ache, but I would climb a mountain for your onigiri.',
    'Sit, dear. This is your kitchen, but it is my home too.',
    'I knitted you a scarf. It has a little onigiri on it. Do not laugh.',
    'I am an old woman, and I have eaten in a thousand kitchens. Yours is the one I dream about.',
  ],
  hana: [
    'I drew you a picture! That is you, and that is a giant tamago.',
    'I told everyone at school about your restaurant. Everyone!',
    'When I grow up I am going to be a chef. Or a dragon. Maybe both.',
    'You are my favourite person who is not my mum. Do not tell her.',
    'I made my OWN sushi at school. It was kind of squashed, but I gave it to you in my heart.',
    'When I am old and wrinkly I will still come here. And I will still ask if it is ready yet.',
  ],
  tanaka: [
    'Your lunch is the only calm part of my day.',
    'I moved my 1pm to 1:30. For sushi. Do not tell my boss.',
    'I have started leaving work early on Fridays. Because of you.',
    'Promoted at last! The first person I wanted to tell was you.',
    'I keep the receipts, you know. Every lunch. They are in a drawer at home, very neatly.',
    'A good lunch is a tiny holiday. You have given me a thousand of them. Thank you.',
  ],
  rx9: [
    'Analysis complete. Your tempura is statistically unbeatable.',
    'I have added you to my list of favourite organic units.',
    'I attempted to feel joy. The experiment was a success.',
    'Designation updated: friend. Warmth level: 100 percent.',
    'I have run the numbers. Joy per visit: infinite. Cost: acceptable. Recommendation: continue.',
    'My data core has a folder named Favourite Places. It has one entry, and it is spelled with a heart.',
  ],
  ronin: [
    'Your food is... honourable. That is high praise from me.',
    'I have not smiled in ten years. This is a smile. Do not look.',
    'A warrior needs a place to rest his sword. I choose here.',
    'My blade is yours, chef. And so is my appetite.',
    'I taught the neighbourhood children to hold chopsticks like swords. Please do not tell their parents.',
    'A wanderer’s greatest treasure is a door that stays open. Yours has never closed on me.',
  ],
  mochi: [
    'Meow. (Translation: acceptable.)',
    'Mochi has left a gift on the doorstep. It is a very proud gift.',
    'Mochi sits on your counter now. This is a great honour.',
    'Purrrr. (Translation: you are my human. Obey the nap.)',
    'Meow. (Translation: I brought the other cats. They said it was acceptable. High praise.)',
    'Purrrr. (Translation: you are the best human. Do not let it go to your head. Fish, please.)',
  ],
}

const KEY = 'bentopia.regulars'
export const newRegulars = (): Regulars => ({ pts: {}, claimed: {}, story: [] })

/** Coins for the first clear of a story level, and the friendship it adds. */
export const STORY_COINS = [150, 250, 400]
export const STORY_POINTS = 5
/** Friendship level needed for each chapter: Regular, Good friend, Family. */
export const STORY_TIERS = [2, 3, 4]

export const storyCoins = (chapter: number) => STORY_COINS[chapter - 1] ?? STORY_COINS[0]
/** Whether a customer's friendship is high enough for a story chapter. */
export const storyUnlocked = (r: Regulars, id: string, chapter = 1) => tierReached(r.pts[id] ?? 0) >= (STORY_TIERS[chapter - 1] ?? 99)
/** Whether the story saved under this key (see storyKey) has been cleared. */
export const storyCleared = (r: Regulars, key: string) => r.story.includes(key)

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0)

export function loadRegulars(): Regulars {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    const r = newRegulars()
    for (const c of CUSTOMERS) {
      r.pts[c.id] = num(raw?.pts?.[c.id])
      r.claimed[c.id] = Math.min(TIERS.length, num(raw?.claimed?.[c.id]))
    }
    r.story = Array.isArray(raw?.story) ? raw.story.filter((x: unknown) => typeof x === 'string' && CUSTOMERS.some((c) => c.id === x.split(':')[0])) : []
    return r
  } catch {
    return newRegulars()
  }
}

export function saveRegulars(r: Regulars) {
  try {
    localStorage.setItem(KEY, JSON.stringify(r))
  } catch {
    /* storage unavailable */
  }
}

/** How many friendship levels the points have reached (0 to 4). */
export const tierReached = (pts: number) => TIERS.filter((t) => pts >= t.at).length

export const addPoints = (r: Regulars, id: string, n: number): Regulars => ({ ...r, pts: { ...r.pts, [id]: (r.pts[id] ?? 0) + n } })

export const claimable = (r: Regulars, id: string) => tierReached(r.pts[id] ?? 0) > (r.claimed[id] ?? 0)

export const anyClaimable = (r: Regulars) => CUSTOMERS.some((c) => claimable(r, c.id))

/** Claim the next friendship level. Returns null when nothing is waiting. */
export function claimTier(r: Regulars, id: string): { next: Regulars; coins: number } | null {
  if (!claimable(r, id)) return null
  const i = r.claimed[id] ?? 0
  return { next: { ...r, claimed: { ...r.claimed, [id]: i + 1 } }, coins: TIERS[i].coins }
}
