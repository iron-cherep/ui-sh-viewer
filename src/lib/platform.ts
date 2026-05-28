/**
 * Runtime environment detection. The app ships as both a static web build
 * (served behind the /mcp proxy) and a Tauri desktop app (talks to ui.sh
 * directly via the Rust-backed HTTP plugin — no proxy, no CORS). A handful of
 * wiring decisions branch on which shell we're running inside.
 *
 * Tauri v2 injects `__TAURI_INTERNALS__` onto `window` before our code runs.
 */
export const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
