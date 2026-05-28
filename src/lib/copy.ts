import { isTauri } from "./platform";

/**
 * Platform-aware copy. The desktop build is an app, not a website — so it drops
 * the "MCP" jargon from the brand and the "browser"/"mini site" framing. The web
 * build keeps its site-flavored wording and its browser-accurate privacy note.
 */
export const APP_NAME = isTauri ? "UI.SH Viewer" : "UI.SH MCP Viewer";

/** Subtitle under the brand — describes the underlying graph, same everywhere. */
export const APP_TAGLINE = "Browse the ui.sh MCP documentation graph.";

export const WELCOME_INTRO = isTauri
  ? "A read-only viewer for the ui.sh documentation graph, not affiliated with ui.sh. Paste your access token to fetch the docs and browse them right here in the app."
  : "A read-only browser for the ui.sh documentation graph, not affiliated with ui.sh. Paste your access token to fetch the docs and browse them like a mini site.";

export const PRIVACY_NOTE = isTauri
  ? "Everything stays on this device. Your token is saved locally and sent only to the official ui.sh API to fetch documentation. No other servers are contacted, and nothing is uploaded, shared, or tracked."
  : "Everything stays on this device. Your token is saved in your browser’s local storage and sent only to the official ui.sh API to fetch documentation. No other servers are contacted, and nothing is uploaded, shared, or tracked.";
