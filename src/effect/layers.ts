import { FetchHttpClient } from "@effect/platform";
import { BrowserKeyValueStore } from "@effect/platform-browser";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { Layer } from "effect";
import { isTauri } from "../lib/platform";
import { DocCrawler } from "./services/DocCrawler";
import { DocStore } from "./services/DocStore";
import { McpClient } from "./services/McpClient";
import { TokenStore } from "./services/TokenStore";

// In the desktop app, route HTTP through the Tauri plugin's fetch — it runs in
// Rust, so the request to ui.sh isn't subject to browser CORS (no proxy needed).
// In the web build, use the browser's fetch as before. `tauriFetch` is imported
// statically but never invoked outside Tauri.
const HttpClientLive = isTauri
  ? Layer.provide(FetchHttpClient.layer, Layer.succeed(FetchHttpClient.Fetch, tauriFetch as typeof fetch))
  : FetchHttpClient.layer;

// Single shared instances: because each `*Live` layer is referenced by value,
// Effect's layer memoization builds one TokenStore and one McpClient for the
// whole graph — so the crawler and ad-hoc fetches share session + token.
const TokenStoreLive = Layer.provide(TokenStore.Default, BrowserKeyValueStore.layerLocalStorage);
const McpClientLive = Layer.provide(McpClient.Default, Layer.mergeAll(HttpClientLive, TokenStoreLive));
const DocCrawlerLive = Layer.provide(DocCrawler.Default, McpClientLive);

/** The full application context: every service the UI runs effects against. */
export const AppLayer = Layer.mergeAll(TokenStoreLive, McpClientLive, DocCrawlerLive, DocStore.Default);
