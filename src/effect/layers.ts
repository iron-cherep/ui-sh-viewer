import { FetchHttpClient } from "@effect/platform";
import { BrowserKeyValueStore } from "@effect/platform-browser";
import { Layer } from "effect";
import { DocCache } from "./services/DocCache";
import { DocCrawler } from "./services/DocCrawler";
import { McpClient } from "./services/McpClient";
import { TokenStore } from "./services/TokenStore";

// Single shared instances: because each `*Live` layer is referenced by value,
// Effect's layer memoization builds one TokenStore and one McpClient for the
// whole graph — so the crawler and ad-hoc fetches share session + token.
const TokenStoreLive = Layer.provide(TokenStore.Default, BrowserKeyValueStore.layerLocalStorage);
const McpClientLive = Layer.provide(McpClient.Default, Layer.mergeAll(FetchHttpClient.layer, TokenStoreLive));
const DocCrawlerLive = Layer.provide(DocCrawler.Default, McpClientLive);

/** The full application context: every service the UI runs effects against. */
export const AppLayer = Layer.mergeAll(TokenStoreLive, McpClientLive, DocCrawlerLive, DocCache.Default);
