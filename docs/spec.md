# Bentopia: Design & Engineering Spec

Version 1.1 | CDB Logic | Web first, native later

**Store name:** Bentopia: Sushi Merge (formerly Bento Box Master)

---

## 1. Product Summary

A cozy link-and-merge puzzle game. Players craft Japanese dishes on a bento box grid to fill customer orders, earn coins, and build an isometric restaurant they can show off in a shared Night Market.

**Audience:** Ages 8 to 80. Touch first, playable with a mouse.
**Platforms:** Mobile web (primary), desktop web, then iOS and Android via Capacitor.
**Session length:** 2 to 4 minutes per level. 10 to 20 minutes per sitting.

### Design pillars
1. **Tactile.** Every link, merge, and tap has weight: sound, haptics, and motion confirm every action.
2. **Cozy, never stressful.** No timers on the board. Failure costs a heart and nothing else.
3. **Craft is visible.** What you cook shows up in your restaurant. Progress is something you can see and share.
4. **Fair economy.** Paid items speed things up and look great. Skill decides levels.

---

## 2. Core Loop

```
Play level -> Fill order -> Earn coins + stars + drops
     ^                                   |
     |                                   v
Night Market <- Decorate restaurant <- Spend coins / tokens
(tip, buff, reputation)
```

**Long-term goals:** finish the level map, learn every recipe, build out the restaurant, collect rare ingredients.

---

## 3. The Puzzle

### 3.1 Board
| Rule | Value |
|---|---|
| Grid | 8x8 on every device. Tablet and desktop scale tiles up. No other board sizes. |
| Tile size | About 43pt on a 375pt-wide screen (16pt side margins), at the 44pt touch guideline |
| Board shapes | Level variety comes from shapes carved into the 8x8 frame: blocked cells, missing corners, center islands |
| Ingredient types | 4 per level early, up to 6 later |
| Link directions | 8-way (diagonals allowed) |
| Min link | 3 tiles |
| Input | Drag to link. Release to commit. Drag back one tile to undo the last link. |

**Why 8x8:** the 8 to 80 audience needs tiles big enough to drag accurately and art big enough to read tiers at a glance. 9x9 drops tiles to about 38pt, where diagonal drags misfire and rarity rims get hard to spot. 7x7 clogs once crafted items pile up. 8x8 gives 64 cells, enough room to merge and still scannable in about a second.

### 3.2 Linking and merging
- **Single-ingredient chain:** link 3+ identical items to create 1 item of the next tier. The result lands on the last tile touched.
- **Mixed recipe:** link one of each required component, in any order, as a single adjacent chain. Example: Onigiri + Salmon + Avocado = Salmon Roll.
- **5+ link:** creates the merged item plus a **Flavor Bomb** on a random empty cell. Tapping a Flavor Bomb clears every *raw* ingredient in its row and column. Crafted items are never destroyed.
- **Valid-link preview:** as the finger moves, the projected result floats above the chain. Invalid links dim and do not commit.

### 3.3 Refill
- Gravity drops tiles down after each merge. New raw ingredients spawn at the top.
- Spawns use a weighted table per level. Crafted items never spawn.
- **Mercy spawn:** if the board cannot produce an order item within the remaining moves, the spawn table biases toward the missing components.
- **Deadlock:** if no valid link exists, the board shuffles automatically at no move cost.

### 3.4 Recipes (data driven)
```json
{
  "id": "salmon_roll",
  "tier": 3,
  "type": "mixed",
  "inputs": ["onigiri", "salmon", "avocado"],
  "unlockLevel": 12
}
```
- Chapter 1 (levels 1 to 10) uses single chains only.
- Mixed recipes unlock from chapter 2 onward. One new recipe per 3 to 5 levels.
- Recipe count at launch: 18 to 24.

### 3.5 Orders, moves, stars
| Element | Rule |
|---|---|
| Order | 1 to 4 items shown in the customer's thought bubble |
| Moves | Each committed link = 1 move. Shuffles and Flavor Bomb taps are free. |
| 1 star | Order complete |
| 2 stars | Complete with 20%+ moves left |
| 3 stars | Complete with 40%+ moves left |
| Fail | Out of moves. Lose 1 heart. Offer +5 moves for coins or tokens. |

### 3.6 Special Ingredients
- Players equip up to 3 before a level.
- Each equipped item has a 5% chance per spawn to appear on the board.
- Merging a Special Ingredient into a recipe **doubles that level's coin payout** and triggers a premium merge effect.

---

## 4. Progression

| System | Rule |
|---|---|
| Level map | Chapters of 10 levels. Each chapter unlocks a new restaurant area and 2 to 3 recipes. 30 levels at Phase 2, 100+ at launch. |
| Player level | XP from levels and decorating. Unlocks shop items and Night Market access (level 5). |
| Restaurant level | Rises with decor value and recipes learned. Unlocks larger floor plans. |
| Hearts | Max 5. 1 heart refills every 30 minutes. A heart is only lost on a failed level. |
| Rare drops | Chapter boss levels guarantee a Rare+ ingredient on first 3-star clear. |

---

## 5. Economy

### 5.1 Currencies
| Currency | Sources | Sinks |
|---|---|---|
| Coins | Levels, tips received, daily login | Decor, standard crates, extra moves, tipping |
| Bento Tokens | Leaderboard prizes, level-ups, purchase | Premium decor, premium crates, heart refills |

Bento Tokens are the **only** item sold for real money. Crates and decor are bought with tokens, so the store is identical on web, iOS, and Android.

### 5.2 Delivery Crates (gacha)
| Rarity | Drop rate | Examples |
|---|---|---|
| Common | 79% | Cucumber, Tuna |
| Rare | 18% | Spicy Mayo, Tempura Shrimp |
| Legendary | 3% | Rainbow Caviar, Golden Truffle |

- **Odds are published** in the crate screen and the store listing.
- **Pity:** a Legendary is guaranteed by pull 60. The counter is visible to the player.
- **Duplicates** convert to Pantry XP, which upgrades that ingredient's drop chance.
- Every 5th level clear grants a free standard crate.

### 5.3 Age and purchase rules
- Age gate at signup (date of birth, not a checkbox).
- **Under 13:** no purchases, earned crates only, no free text anywhere. Parental consent flow required before any account data beyond progress is stored (COPPA).
- **13 to 17:** monthly spend cap.
- All players: restaurant names come from a word-picker (adjective + food + noun). No free text in v1, which removes moderation work.

---

## 6. Night Market

| Rule | Value |
|---|---|
| Tip cost | 50 coins |
| Tipper reward | 1-hour Luck Buff: Special Ingredient spawn chance x1.1 (5% to 5.5%) |
| Owner reward | 50 coins + 5 Reputation |
| Limits | 1 tip per shop per day. 10 tips per player per day. |
| Anti-farming | Reputation only counts from tippers at player level 10+. Duplicate devices and IPs are flagged. |
| Discovery | Feed ranks shops by weekly reputation, decor score, and recency, with a random slice so new players get seen. |
| Weekly leaderboard | Top reputation earners win Bento Tokens. Resets Monday 00:00 UTC. |

### Bots (seeding the market)
- Bot shops are generated from real decor sets and labeled **Featured Shop**.
- Bots can receive tips and can tip real players to keep the loop active early.
- **Bots never appear on the leaderboard and never win prizes.**
- Bot share of the feed scales down as real shops grow.

---

## 7. UX & Interface

### 7.1 Navigation
```
Title -> Hub (restaurant)
         |- Play (level map -> pre-level -> board -> results)
         |- Decorate
         |- Pantry (ingredients + crates)
         |- Night Market
```
- Bottom bar with 4 destinations and a raised Play button in the center.
- Every screen is reachable in 2 taps from the Hub.
- Primary actions live in the bottom third of the screen (thumb zone).

### 7.2 Screen specs
| Screen | Must have |
|---|---|
| Title | Loads assets behind the animation. Interactive within 3 seconds on 4G. |
| Hub | Live restaurant with idle customers. Top bar: level, coins, tokens, hearts with refill timer. |
| Pre-level | Order preview, move count, equip 3 Special Ingredients. |
| Board | Customer and order at top, moves on the right, board centered, pause in the corner. Nothing else. |
| Results | "Order up!" moment, stars filling in sequence, coin count-up, drops revealed, Next button. |
| Night Market | One shop in focus, swipe for next, Tip Jar by the door, leaderboard in a pull-up sheet. |
| Crate | Truck arrives, crate drops, tap to open, cards flip one at a time. Skip button after the first reveal. |

### 7.3 Visual direction
The bento box is the hero. The board is a wooden box with lacquered dividers, and ingredients sit in each compartment like real food. Every other screen stays quiet so the board and the restaurant carry the look.

| Token | Hex | Use |
|---|---|---|
| Hinoki | #D9B07A | Board wood, panels |
| Rice | #FFFDF7 | Backgrounds, cards |
| Matcha | #7FA650 | Primary buttons, success |
| Ume | #F2A0A8 | Highlights, links in progress |
| Lantern | #FFB23E | Coins, rewards, Night Market glow |
| Indigo Ink | #2B2F5C | Text, Night Market sky |

**Type:** Mochiy Pop One for titles and reward moments. M PLUS Rounded 1c for all UI text. Sentence case everywhere.

**Motion:** one big moment per flow (merge, Order up, crate open). Everything else is quick and quiet: 120 to 200ms ease-out. Respect reduced-motion settings.

**Sound and haptics:** soft pop on link, wooden clack on merge, sizzle on recipe completion. Light haptic per linked tile, medium on merge, heavy only for Legendary. Separate toggles for music, sound, and haptics.

### 7.4 Accessibility
- Every ingredient is identifiable by shape and silhouette, not color alone.
- Colorblind-safe tier rims (shape badges on Rare and Legendary).
- Tap-to-link mode as an alternative to dragging.
- Text scales to 130% without breaking layouts.
- Contrast meets WCAG AA on all text.

### 7.5 UI copy rules
- Buttons say what happens: "Play level 12," "Open crate," "Leave a tip."
- The same action keeps the same name through the flow.
- Errors say what happened and what to do next.

---

## 8. Art Pipeline (AI generated, studio quality)

**Goal:** no asset should read as AI. Consistency is what sells it.

1. **Style bible first.** Fixed isometric camera (2:1), 3-tone cel shading, one outline weight, the palette above, light from top left.
2. **Style test.** Generate 10 hero assets (5 ingredients, 2 dishes, 1 table, 1 customer, 1 crate). Approve before any production art.
3. **One prompt template per asset class.** Only the subject changes.
4. **Hand cleanup on every asset.** Fix edges, unify outlines, correct the palette, remove artifacts. Export on transparent backgrounds.
5. **Tier readability.** Raw, crafted, and premium items differ in silhouette complexity and rim treatment, so tier is readable at 43pt.
6. **Sprite atlases** per screen. Ingredients at 2x and 3x.

---

## 9. Technical Architecture

### 9.1 Stack
| Layer | Choice |
|---|---|
| App shell and menus | React + Vite + TypeScript |
| Board and restaurant rendering | PixiJS v8 |
| Backend | Supabase: Postgres, Auth, Edge Functions, Storage |
| Hosting | Vercel |
| Payments | Stripe (web). Apple and Google billing (native). |
| Native wrap | Capacitor |
| Analytics | PostHog |

### 9.2 Server-authoritative rules
The client renders. The server decides anything of value.
- **Levels:** server issues a level seed. The client sends the move log on completion. An Edge Function replays the log with the shared simulation package and awards stars, coins, and drops only if the replay matches.
- **Crates, coins, tokens, tips:** server-side only, written to an append-only ledger.
- **Shared simulation:** one TypeScript package (`@bentopia/sim`) used by both the client and Edge Functions. Deterministic RNG from the seed. No floating-point drift.

### 9.3 Core data model
| Table | Purpose |
|---|---|
| `profiles` | Player level, XP, age band, settings |
| `ledger` | Append-only currency transactions |
| `wallets` | Cached balances derived from the ledger |
| `progress` | Level results, stars, best moves |
| `inventory` | Ingredients, rarity, Pantry XP |
| `crate_pulls` | Every pull with result and pity counter |
| `restaurants` | Layout as JSON, decor score |
| `tips` | Tipper, owner, timestamp |
| `reputation_weekly` | Weekly totals for the leaderboard |
| `bots` | Bot shop definitions and flags |

Row Level Security on every table. Players can read their own rows and public restaurant data only.

### 9.4 Content as data
Levels, recipes, spawn tables, shop items, and crate tables live in versioned JSON. Designers tune the game without a code release.

### 9.5 Performance budgets
| Metric | Target |
|---|---|
| Frame rate | 60fps on a mid-tier Android (3 years old) |
| Initial download | Under 5MB before the first level |
| Time to interactive | Under 3 seconds on 4G |
| Merge input latency | Under 50ms |

---

## 10. Metrics

| Metric | Target |
|---|---|
| Day 1 retention | 40% |
| Day 7 retention | 15% |
| Level 10 completion | 70% of new players |
| Tutorial drop-off | Under 10% |
| Night Market visits | 30% of daily players |

Track the level funnel per level to find difficulty spikes. Any level with a 3+ attempt average gets retuned.

---

## 11. Build Phases

| Phase | Scope | Exit criteria |
|---|---|---|
| 1. Board | 8x8 grid, linking, gravity, single chains, orders, moves, stars, shuffle. Placeholder art. | 5 testers play 10 levels unprompted and ask for more. |
| 2. Game | Approved art style, mixed recipes, board shapes, 30-level map, move-count tuning, coins, hearts, audio, haptics. | Level funnel shows no spike over 3 attempts. |
| 3. Restaurant | Isometric hub, decorating, accounts, server economy, replay validation. | Ledger balances reconcile. Replay rejects tampered logs. |
| 4. Monetization | Tokens, crates, odds, pity, Stripe, age gate, spend caps. | Purchase flow tested end to end. Under-13 path blocks all purchases. |
| 5. Night Market | Bot shops, tips, Luck Buff, reputation, leaderboard, anti-farming. | Bots excluded from prizes. Tip limits enforced server-side. |
| 6. Native | Capacitor builds, store billing, store listings with odds. | Approved on both stores. |

---

## 12. Open Decisions
1. Final recipe list and tier tree for chapters 1 to 3.
2. Coin payout curve and decor pricing (tune in Phase 2).
3. Token pack pricing and spend cap amount for 13 to 17.
4. Whether ads for extra moves are in scope at all.
