import { Data } from "effect";
import { isTauri } from "../lib/platform";

/**
 * The MCP endpoint. In the Tauri desktop app we hit ui.sh directly — the
 * request is made from Rust (see {@link McpClient}'s HTTP layer), so there's no
 * CORS and no proxy. In the web build this is a same-origin path that Vite (dev)
 * or the Cloudflare Pages function (prod) proxies to https://ui.sh/mcp.
 */
export const MCP_ENDPOINT = isTauri ? "https://ui.sh/mcp?agent=codex" : "/mcp?agent=codex";
export const PROTOCOL_VERSION = "2025-03-26";
export const ROOT_DOC_URI = "uidotsh://ui";
export const MAX_CRAWLED_DOCS = 140;

export type JsonRecord = Record<string, unknown>;

export type JsonRpcSuccess = {
  jsonrpc: "2.0";
  id: number;
  result: unknown;
};

export type JsonRpcError = {
  jsonrpc: "2.0";
  id: number | null;
  error: { code: number; message: string; data?: unknown };
};

export type JsonRpcMessage = JsonRpcSuccess | JsonRpcError;

export type DocLink = {
  label: string;
  uri: string;
};

export type DocPage = {
  uri: string;
  title: string;
  text: string;
  links: DocLink[];
  error?: string;
};

/** A stored version is identified by the epoch-millis it was downloaded at. */
export type VersionId = string;

/** Lightweight metadata about a stored version — cheap to list without its docs. */
export type VersionMeta = {
  readonly id: VersionId;
  /** Epoch millis the crawl was stored (also the numeric source of {@link id}). */
  readonly savedAt: number;
  readonly docCount: number;
};

/** A stored version together with its full document graph. */
export type DocVersion = VersionMeta & {
  readonly docs: DocPage[];
};

/** The bearer token was rejected (401/403). */
export class TokenInvalidError extends Data.TaggedError("TokenInvalidError")<{}> {}

/** Any other MCP transport or protocol failure. */
export class McpRequestError extends Data.TaggedError("McpRequestError")<{
  readonly message: string;
}> {}

/** IndexedDB cache read/write failure (non-fatal — the app degrades gracefully). */
export class DocCacheError extends Data.TaggedError("DocCacheError")<{
  readonly message: string;
}> {}
