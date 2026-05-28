# UI.SH MCP Viewer — Agent Instructions

An open-source, static React SPA for browsing the ui.sh MCP documentation graph from the browser. It also ships as a self-contained Tauri desktop app.

## Targets

The app runs in two shells from one codebase, selected at runtime via `src/lib/platform.ts` (`isTauri`):

- **Web** (Cloudflare Pages / Vite dev): MCP calls go to the same-origin `/mcp` path, proxied to `https://ui.sh` by `functions/mcp.ts` (prod) or the Vite proxy (dev) to dodge CORS.
- **Desktop** (Tauri, in `tauri/`): MCP calls go to `https://ui.sh` directly. The HTTP runs in Rust via `tauri-plugin-http` (injected into Effect's `FetchHttpClient` in `src/effect/layers.ts`), so there's no CORS and no proxy. HTTP is scoped to `https://ui.sh/*` in `tauri/capabilities/default.json`. Note the project folder is `tauri/`, not the conventional `src-tauri/` — the CLI finds it by locating `tauri.conf.json`. Building/running needs the Rust toolchain (`pnpm tauri dev` / `pnpm tauri build`).

## Vendored Repositories

This project vendors external repositories under @repos/

- Use vendored repositories as read-only reference material when working with related libraries
- Prefer examples and patterns from the vendored source code over generated guesses or web search results
- Do not edit files under @repos/ unless explicitly asked
- Do not import from @repos/ - application code should continue importing from normal package dependencies

When writing Effect code, inspect @repos/effect/ for examples of idiomatic usage, tests, module structure, and API design. Treat it as the source of truth for Effect patterns.

A subset of the Catalyst UI kit is vendored under `src/catalyst/` — only the components this app actually imports. These are third-party files under the commercial Tailwind Plus license (NOT MIT); import and compose them, but do not modify them, and never redistribute them on their own (see `src/catalyst/NOTICE.md`). The complete kit is kept locally at `src/catalyst-ui-kit/` (git-ignored) as read-only reference only.
