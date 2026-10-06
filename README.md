# Bentopia: Sushi Merge

A cozy link-and-merge puzzle game. Craft Japanese dishes on an 8x8 bento box grid, fill customer orders, and (later phases) build a restaurant and visit the Night Market.

Design and engineering spec: [docs/spec.md](docs/spec.md).

## Status

Phase 1 (Board) is done and Phase 2 is under way:

- 8x8 board, 8-way linking, drag or tap-to-link, gravity, refill with mercy spawns, auto-shuffle.
- Single-chain recipes (Chapter 1) and **mixed recipes** (Chapter 2): link one of each ingredient to make a dish.
- 48 levels in 4 chapters on a deliberately slow difficulty curve, with Flavor Bombs (a 5+ chain leaves a bomb that clears its row and column), six customers with reactions, a mascot, a hand-built vector art set (22 dishes), glass-orb tiles on a lacquer board.
- Tests include a greedy bot that must be able to clear every level.

- Coins (earned per clear, 40% on replays), hearts (5 max, one back every 30 minutes, lost on a failed level) and a "+5 moves for 50 coins" rescue. These live in localStorage for now and become a server ledger in Phase 3.
- Synthesised audio with separate Music, Sound and Haptics toggles.

- **Restaurant hub:** an isometric night-market restaurant with 47 items across 7 shop categories (furniture, kitchen, decor, garden, lights, wall decor, rugs), 4 floors and 4 paint colors, rotation, rugs under furniture, wall slots, five collectible style sets with bonuses, and rarity tiers. Diners come and go and leave tips, a chef works behind the counter, and the window follows the player's clock (dawn, day, dusk, night). A restaurant level (decor score) unlocks items and expansions.
- **Street view and town:** the Hub opens on your building seen from the street (it grows taller with every storey and wider with every expansion, with a name sign, noren, lit windows with diners, a queue at the door and your rooftop terrace on top). Pick your restaurant's name from word lists in Build. The Town button opens a map of the Night Market district with neighbouring shops (placeholder neighbours until accounts exist).
- **Growing the building:** buy more floor space (up to 10x10), build an upstairs lounge and an open-air rooftop terrace, and buy upgrades (a cash register for a bigger tip jar, a menu board for higher tips). More seats mean more customers and more tips. Big rooms zoom and pan (pinch, drag, wheel).

- **First-time tutorial:** a mascot intro, an animated finger on the real board, a guided first trip to Decorate, and a one-time callout on the first mixed recipe. Replay it with `/?tutorial`. The idle hint (a finger tracing a good chain after 9 seconds) is on for everyone.

Still to come: accounts and the server economy, crates and tokens, the Night Market (see the spec).

## Develop

```bash
npm install
npm run dev     # local dev server
npm test        # sim unit tests
npm run build   # typecheck + production build
```

Game rules live in `src/sim` (pure, deterministic, no DOM) so the same code can later run in server-side replay validation. Rendering is PixiJS in `src/game`.
