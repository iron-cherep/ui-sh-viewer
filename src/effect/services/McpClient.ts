import { FetchHttpClient, HttpClient, HttpClientRequest } from "@effect/platform";
import { Effect, Ref } from "effect";
import { extractText, parseMcpResponse } from "../../lib/mcp";
import {
  McpRequestError,
  PROTOCOL_VERSION,
  TokenInvalidError,
  MCP_ENDPOINT,
  type JsonRecord,
} from "../domain";
import { TokenStore } from "./TokenStore";

const TRANSPORT_HINT =
  "The request failed before the MCP server responded. In local dev use /mcp?agent=codex so Vite can proxy ui.sh; a static deployment must proxy /mcp or allow CORS for the Authorization and MCP headers.";

/**
 * Speaks the MCP JSON-RPC handshake over HTTP using the browser's fetch. Holds
 * the negotiated session id and a request counter; the bearer token is read
 * from {@link TokenStore} on every call so it stays in sync after onboarding.
 */
export class McpClient extends Effect.Service<McpClient>()("app/McpClient", {
  effect: Effect.gen(function* () {
    const http = yield* HttpClient.HttpClient;
    const tokens = yield* TokenStore;
    const sessionId = yield* Ref.make<string | null>(null);
    const counter = yield* Ref.make(1);

    const post = (body: JsonRecord) =>
      Effect.gen(function* () {
        const token = yield* tokens.get;
        const sid = yield* Ref.get(sessionId);

        const headers: Record<string, string> = {
          Accept: "application/json, text/event-stream",
          "MCP-Protocol-Version": PROTOCOL_VERSION,
        };
        if (token) headers.Authorization = `Bearer ${token}`;
        if (sid) headers["Mcp-Session-Id"] = sid;

        const request = HttpClientRequest.post(MCP_ENDPOINT).pipe(
          HttpClientRequest.setHeaders(headers),
          HttpClientRequest.bodyUnsafeJson(body),
        );

        const response = yield* http.execute(request);

        const nextSession = response.headers["mcp-session-id"];
        if (nextSession) yield* Ref.set(sessionId, nextSession);

        if (response.status === 401 || response.status === 403) {
          return yield* Effect.fail(new TokenInvalidError());
        }

        const text = yield* response.text;
        if (response.status >= 400) {
          return yield* Effect.fail(new McpRequestError({ message: text || `HTTP ${response.status}` }));
        }

        return parseMcpResponse(text, response.headers["content-type"] ?? null);
      }).pipe(
        Effect.scoped,
        Effect.catchTags({
          RequestError: () => Effect.fail(new McpRequestError({ message: TRANSPORT_HINT })),
          ResponseError: (error) => Effect.fail(new McpRequestError({ message: error.message })),
        }),
      );

    const request = (method: string, params?: JsonRecord) =>
      Effect.gen(function* () {
        const id = yield* Ref.getAndUpdate(counter, (n) => n + 1);
        const message = yield* post({ jsonrpc: "2.0", id, method, params });
        if ("error" in message) {
          return yield* Effect.fail(
            new McpRequestError({ message: `${message.error.message} (${message.error.code})` }),
          );
        }
        return message.result;
      });

    const notify = (method: string, params?: JsonRecord) =>
      post({ jsonrpc: "2.0", method, params }).pipe(Effect.asVoid);

    const initialize = Effect.gen(function* () {
      yield* request("initialize", {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { roots: { listChanged: false }, sampling: {} },
        clientInfo: { name: "ui-sh-viewer", version: "0.0.0" },
      });
      yield* notify("notifications/initialized");
    });

    const fetchDoc = (uri: string) =>
      (uri.startsWith("uidotsh://")
        ? request("tools/call", { name: "uidotsh_fetch", arguments: { uri } })
        : request("resources/read", { uri })
      ).pipe(Effect.map(extractText));

    return { initialize, request, fetchDoc } as const;
  }),
}) {}
