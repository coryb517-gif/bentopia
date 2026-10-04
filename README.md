# Bentopia: Sushi Merge

A cozy link-and-merge puzzle game. Craft Japanese dishes on an 8x8 bento box grid, fill customer orders, and (later phases) build a restaurant and visit the Night Market.

Design and engineering spec: [docs/spec.md](docs/spec.md).

## Status

Phase 1 (Board): 8x8 grid, 8-way linking, drag or tap-to-link, gravity and refill, single-chain recipes, orders, moves, stars, auto-shuffle, 10 levels with placeholder emoji art.

## Develop

```bash
npm install
npm run dev     # local dev server
npm test        # sim unit tests
npm run build   # typecheck + production build
```

Game rules live in `src/sim` (pure, deterministic, no DOM) so the same code can later run in server-side replay validation. Rendering is PixiJS in `src/game`.
