---
name: run
description: Launch this project's ball-rolling graph game (Svelte 5 + Vite 7) for local viewing — dev server or a podman-built static preview. Use whenever asked to run, start, preview, or screenshot this app.
---

# Run

This is a static, client-side-only Svelte 5 + Vite 7 app (no backend, no database). Pick the launch method based on what's being verified:

## Fast iteration (dev server)

```bash
npm install   # first time / after dependency changes only
npm run dev
```

Vite prints a local URL (default `http://localhost:5173`). Hot-reloads on save — use this for normal development and for driving the game in a browser to confirm a change.

## Production-build preview via Vite

```bash
npm run build
npm run preview
```

Confirms the app works from the actual `dist/` bundle (catches build-only issues dev mode hides), served at whatever port Vite prints.

## Production-build preview via podman

Use this specifically to confirm the container image that ships to GitHub Pages' build step behaves the same as local dev — closest to how CI actually builds it.

```bash
podman build -t graphball-preview .
podman run --rm -p 8080:80 graphball-preview
```

Open `http://localhost:8080`. Stop with Ctrl-C (the `--rm` flag removes the container on exit).

## Verifying the game itself

After launching by any method above, drive the actual gameplay loop, not just "does it load":
1. Type a formula into a formula row (try both an explicit one like `y = -0.1*x^2 + 5` and an implicit one like `x^2 + y^2 = 25`) and confirm the curve draws.
2. Click the drop/start control and watch the ball fall, land on the curve without bouncing, and roll under inertia.
3. Confirm waypoints are marked visited as the ball passes them, and the clear banner appears once all of the current stage's waypoints are visited.
4. Click "next stage" and confirm the board resets (new drop point/waypoints, ball and formulas cleared).
