---
name: deploy
description: Build and publish this project's static site to GitHub Pages, or produce a standalone dist/ artifact via podman. Use when asked to deploy, publish, ship, or release this app.
---

# Deploy

This app is 100% static output (`dist/`) with no server component. It ships to GitHub Pages via GitHub Actions — deploys are not manual.

## Normal path: push to main

`.github/workflows/deploy.yml` builds and deploys automatically on every push to `main`. It sets `GH_PAGES_BASE=/<repo-name>/` during the build so `vite.config.ts` emits asset URLs matching the GitHub Pages project-page path (`https://<user>.github.io/<repo-name>/`). Nothing else to run — just push (or merge) to `main` and check the Actions tab.

One-time repo setup this workflow depends on (verify if deploys start failing with a Pages-related error): the repository's Settings → Pages → Source must be set to "GitHub Actions", not "Deploy from a branch".

## Extracting a static build artifact manually (no server)

Useful for handing off `dist/` without pushing to `main`, e.g. to test the exact CI build output locally:

```bash
podman build --target build -t graphball-build .
podman create --name gb-extract graphball-build
podman cp gb-extract:/app/dist ./dist
podman rm gb-extract
```

This dist/ is built with `GH_PAGES_BASE` unset, so asset paths are root-relative (`/`) — fine for serving from a bare static host, but NOT what should be pushed as the Pages artifact (that only happens through the Actions workflow, which sets the base path correctly).

## Do not

- Do not manually commit a `dist/` or `gh-pages` branch — the Actions workflow is the single source of truth for what gets published.
- Do not change `vite.config.ts`'s `base` to a hardcoded path — it must stay driven by `GH_PAGES_BASE` so local/podman preview keeps working at root path while CI still gets the repo-scoped path.
