# Bentopia: Sushi Merge

A cozy link-and-merge puzzle game. Craft Japanese dishes on an 8x8 bento box grid, fill customer orders, and (later phases) build a restaurant and visit the Night Market.

Design and engineering spec: [docs/spec.md](docs/spec.md).

## Status

Phase 1 (Board) is done and Phase 2 is under way:

- 8x8 board, 8-way linking, drag or tap-to-link, gravity, refill with mercy spawns, auto-shuffle.
- Single-chain recipes (Chapter 1) and **mixed recipes** (Chapter 2): link one of each ingredient to make a dish.
- 20 levels, six customers with reactions, a mascot, a hand-built vector art set (22 dishes), glass-orb tiles on a lacquer board.
- Tests include a greedy bot that must be able to clear every level.

Still to come: coins, hearts, audio and haptics polish, the restaurant hub, accounts and the server economy (see the spec).

## Develop

```bash
npm install
npm run dev     # local dev server
npm test        # sim unit tests
npm run build   # typecheck + production build
```

Game rules live in `src/sim` (pure, deterministic, no DOM) so the same code can later run in server-side replay validation. Rendering is PixiJS in `src/game`.
