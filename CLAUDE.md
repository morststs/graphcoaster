# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

GraphCoaster is a static, client-side-only browser game: draw a math formula (explicit `y=f(x)` or implicit `F(x,y)=0`), then drop a ball that falls under gravity and rolls along whichever curve it lands on. The ball never bounces but keeps its momentum (inertia); a stage is cleared once the ball has visited every waypoint defined for that stage. The full spec is in `tmp/input01.md` (Japanese) and the original implementation plan is in `.claude/plans/` if present.

Required stack (do not substitute): Svelte 5 using runes (not the Svelte 4 store-only style), Vite 7, Tailwind CSS 4 (CSS-first config, no `tailwind.config.js`), Flowbite Svelte for UI components, MIT license, podman for containerized builds, deployed to GitHub Pages via GitHub Actions.

## Commands

- `npm run dev` — start the Vite dev server.
- `npm run build` — type-checks are not run automatically by `vite build`; run `npm run check` first if you need type safety confirmed.
- `npm run check` — runs `svelte-check` against `tsconfig.app.json` plus `tsc -p tsconfig.node.json`.
- `npm run preview` — serve the production build locally via Vite.

### Podman

- Local preview server: `podman build -t graphcoaster-preview . && podman run --rm -p 8080:80 graphcoaster-preview` then open `http://localhost:8080`.
- Extract the static build without running a server: `podman build --target build -t graphcoaster-build . && podman create --name gb-extract graphcoaster-build && podman cp gb-extract:/app/dist ./dist && podman rm gb-extract`.

### Deployment

GitHub Pages is served from the `dist/` output of `npm run build`, deployed automatically by `.github/workflows/deploy.yml` on push to `main`. The Vite `base` path is controlled by the `GH_PAGES_BASE` env var (empty/`/` for local and podman preview, `/<repo-name>/` when set by CI) — keep this indirection when touching `vite.config.ts` so local previews don't break.

## Architecture

Version-compatibility notes that matter when touching dependencies:
- `flowbite-svelte@^1.33.1` (not the `2.0.0-next.x` line) is the version whose peerDependencies target Svelte 5 (`^5.40.0`) and Tailwind CSS 4 (`^4.1.4`).
- Vite 7 requires `@sveltejs/vite-plugin-svelte@^6.2.4`, not `^7` (that major targets Vite 8).
- The Containerfile pins `node:22-alpine` because Vite 7's `engines` field requires `node ^20.19.0 || >=22.12.0`.

Formula evaluation goes through `mathjs` (`math.parse().compile()`), never `eval`/`new Function`. Parsed ASTs are validated against an allowlist of functions/symbols before being compiled or differentiated — this is a deliberate sandboxing boundary since formula text is user input; don't bypass it for convenience.

The core game loop is a `requestAnimationFrame` accumulator running physics at a fixed timestep, independent of the render's frame rate. Physics state transitions between `falling` and `rolling` per curve; "no bounce, but inertia" is implemented by discarding the ball's velocity component normal to a curve on impact (not reflecting it) while fully preserving the tangential component. Leaving a curve back into free-fall is driven by comparing the required centripetal force against gravity's normal component, not just a fixed "top of curve" heuristic. While rolling on one curve, other curves are intentionally not checked for hand-off — the ball only becomes eligible to land on a (possibly different) curve again once it's back in free-fall.

Implicit curves (`F(x,y)=0`, e.g. circles/ellipses) have no closed form for `y`, so they're rendered and collided against via marching squares over a fixed grid (recomputed only when the formula text changes, never per animation frame) rather than sampled like explicit `y=f(x)` curves.

Shared game state (stage index, formula list, ball state, waypoint visited-flags, cleared flag) lives in one Svelte 5 runes module using module-scope `$state`, mutated directly by the physics step rather than routed through component props — the canvas render function reads this state by direct function call inside the rAF loop rather than through a Svelte `$effect`, since re-triggering reactive effects 60+ times/second is unnecessary overhead for a canvas that redraws unconditionally every frame anyway.
