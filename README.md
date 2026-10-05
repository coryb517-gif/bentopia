# Bentopia: Sushi Merge

A cozy link-and-merge puzzle game. Craft Japanese dishes on an 8x8 bento box grid, fill customer orders, and (later phases) build a restaurant and visit the Night Market.

Design and engineering spec: [docs/spec.md](docs/spec.md).

## Status

Phase 1 (Board) is done and Phase 2 is under way:

- 8x8 board, 8-way linking, drag or tap-to-link, gravity, refill with mercy spawns, auto-shuffle.
- Single-chain recipes (Chapter 1) and **mixed recipes** (Chapter 2): link one of each ingredient to make a dish.
- 20 levels, six customers with reactions, a mascot, a hand-built vector art set (22 dishes), glass-orb tiles on a lacquer board.
- Tests include a greedy bot that must be able to clear every level.

- Coins (earned per clear, 40% on replays), hearts (5 max, one back every 30 minutes, lost on a failed level) and a "+5 moves for 50 coins" rescue. These live in localStorage for now and become a server ledger in Phase 3.
- Synthesised audio with separate Music, Sound and Haptics toggles.

- **Restaurant hub:** an isometric night-market restaurant with 14 placeable items, 4 floors and 4 wall themes, seated customers, tips that accrue while you are away, and a restaurant level (decor score) that grows the room and unlocks items.

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
