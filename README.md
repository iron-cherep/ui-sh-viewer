# UI.SH MCP Viewer

**A read-only viewer for the [ui.sh](https://ui.sh) MCP documentation graph** —
a small, unofficial, open-source, dark-themed SPA you run from your browser.
Paste an access token, fetch the docs once, and browse them like a mini
documentation site. Not affiliated with ui.sh.

Everything stays on your device: the token is kept in `localStorage` and sent
only to the official ui.sh API. No other servers are contacted, and nothing is
uploaded, shared, or tracked. Fetched docs are cached in IndexedDB so the app
hydrates instantly on the next launch.

## Run

```bash
pnpm install
pnpm dev        # via portless → https://ui-sh-viewer.localhost/
# or
pnpm dev:app    # plain Vite on http://localhost:5173
```

```bash
pnpm typecheck  # tsgo --noEmit
pnpm build      # tsgo --noEmit && vite build
pnpm preview    # serve the production build
```

Open the app, paste your ui.sh bearer token on the welcome screen, and let it
fetch. You can re-fetch any time with **Refresh docs** in the sidebar, or switch
tokens with **Use a different token**.

## Desktop app (Tauri)

The same UI ships as a self-contained native desktop app via [Tauri](https://tauri.app)
(project in `tauri/`). It runs **fully locally with no server-side proxy** —
MCP requests go to `https://ui.sh` directly from Rust, where browser CORS
doesn't apply, so the `/mcp` proxy used by the web build isn't needed. HTTP is
locked to `https://ui.sh/*` in `tauri/capabilities/default.json`. The build
target is chosen at runtime (`src/lib/platform.ts`), so one codebase serves both
the browser and desktop.

Requires the [Rust toolchain](https://rustup.rs) (`cargo`/`rustc`):

```bash
pnpm tauri dev      # launch the desktop app against the Vite dev server
pnpm tauri build    # produce a .app/.dmg under tauri/target/release/bundle
```

## How it works

1. **Onboarding** (`/welcome`) — stores the token locally and starts a crawl.
2. **Fetching** — a breadth-first crawl of the documentation graph, showing the
   current document path live. An invalid token surfaces an inline error.
3. **Browsing** (`/`, `/ui/...`) — group pages list their children; leaf pages
   render their markdown with a list of linked pages. Document URLs mirror the
   MCP URIs, e.g. `/ui/design-guidelines/buttons`.
