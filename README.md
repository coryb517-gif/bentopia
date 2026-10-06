# Bentopia: Sushi Merge

A cozy link-and-merge puzzle game. Craft Japanese dishes on an 8x8 bento box grid, fill customer orders, and (later phases) build a restaurant and visit the Night Market.

Design and engineering spec: [docs/spec.md](docs/spec.md).

## Status

Phase 1 (Board) is done and Phase 2 is under way:

- 8x8 board, 8-way linking, drag or tap-to-link, gravity, refill with mercy spawns, auto-shuffle.
- Single-chain recipes (Chapter 1) and **mixed recipes** (Chapter 2): link one of each ingredient to make a dish.
- 48 levels in 4 chapters on a deliberately slow difficulty curve, with Flavor Bombs (a 5+ chain leaves a bomb that clears its row and column), six customers with reactions, a mascot, a hand-built vector art set (22 dishes), glass-orb tiles on a lacquer board.
- **Frozen tiles** (levels 25+): ice blocks a tile from linking until you clear a chain next to it; a Flavor Bomb shatters it outright.
- Tests include a greedy bot that must be able to clear every level.

- Coins (earned per clear, 40% on replays), hearts (5 max, one back every 30 minutes, lost on a failed level) and a "+5 moves for 50 coins" rescue. These live in localStorage for now and become a server ledger in Phase 3.
- Synthesised audio with separate Music, Sound and Haptics toggles.

- **Restaurant hub:** an isometric night-market restaurant with 47 items across 7 shop categories (furniture, kitchen, decor, garden, lights, wall decor, rugs), 4 floors and 4 paint colors, rotation, rugs under furniture, wall slots, five collectible style sets with bonuses, and rarity tiers. Diners come and go and leave tips, a chef works behind the counter, and the window follows the player's clock (dawn, day, dusk, night). A restaurant level (decor score) unlocks items and expansions.
- **Street view and town:** the Hub opens on your building seen from the street (it grows taller with every storey and wider with every expansion, with a name sign, noren, lit windows with diners, a queue at the door and your rooftop terrace on top). Pick your restaurant's name from word lists in Build. The Town button opens the Night Market: pagodas, towers and tea houses, boats on the river, bunting and fireworks at night. Jump between places with the chips or tap a shop, and **visit** a neighbour to look around inside (their rooms are generated placeholders until accounts exist).
- **Growing the building:** buy more floor space (up to 10x10), build an upstairs lounge and an open-air rooftop terrace, and buy upgrades (a cash register for a bigger tip jar, a menu board for higher tips). More seats mean more customers and more tips. Big rooms zoom and pan (pinch, drag, wheel).

- **Your avatar:** pick a name, skin, hair, coat and extra from lists (nothing to type). Tap the streets of the Night Market, or the floor of any restaurant, and your avatar walks there around buildings and furniture. A robot waiter and a cat also roam your restaurant.
- **Auto-arrange:** one tap in Decorate tidies a floor (clear walkway, kitchen on the wall, spaced seating, even wall decor) with a one-tap undo.

- **First-time tutorial:** a mascot intro, an animated finger on the real board, a guided first trip to Decorate, and a one-time callout on the first mixed recipe. Replay it with `/?tutorial`. The idle hint (a finger tracing a good chain after 9 seconds) is on for everyone.

- **Reasons to return:** a daily gift with a 7-day streak, goals that pay coins, and a collection book of every item you have owned. Emotes and an avatar badge in the hub, plus sound effects (footsteps, bomb, fanfares) and a soft restaurant ambience.
- **Installable:** add it to your home screen (web manifest, icons, safe-area aware).

Still to come: accounts and the server economy, crates and tokens, the Night Market (see the spec).

## Develop

```bash
npm install
npm run dev     # local dev server
npm test        # sim unit tests
npm run build   # typecheck + production build
```

Game rules live in `src/sim` (pure, deterministic, no DOM) so the same code can later run in server-side replay validation. Rendering is PixiJS in `src/game`.
