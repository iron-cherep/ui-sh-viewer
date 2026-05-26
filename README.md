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

## How it works

1. **Onboarding** (`/welcome`) — stores the token locally and starts a crawl.
2. **Fetching** — a breadth-first crawl of the documentation graph, showing the
   current document path live. An invalid token surfaces an inline error.
3. **Browsing** (`/`, `/ui/...`) — group pages list their children; leaf pages
   render their markdown with a list of linked pages. Document URLs mirror the
   MCP URIs, e.g. `/ui/design-guidelines/buttons`.
