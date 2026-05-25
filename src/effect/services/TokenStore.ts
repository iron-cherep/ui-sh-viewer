import { KeyValueStore } from "@effect/platform";
import { Effect, Option } from "effect";

const TOKEN_KEY = "ui-sh-viewer:mcp-token";

/**
 * Persists the MCP bearer token in the browser's localStorage. The token never
 * leaves the device except as an Authorization header to the ui.sh API.
 */
export class TokenStore extends Effect.Service<TokenStore>()("app/TokenStore", {
  effect: Effect.gen(function* () {
    const kv = yield* KeyValueStore.KeyValueStore;

    return {
      /** The stored token, or "" when none is set. Reads fresh on every run. */
      get: kv.get(TOKEN_KEY).pipe(
        Effect.map(Option.getOrElse(() => "")),
        Effect.orElseSucceed(() => ""),
      ),
      set: (token: string) => kv.set(TOKEN_KEY, token).pipe(Effect.ignore),
      clear: kv.remove(TOKEN_KEY).pipe(Effect.ignore),
    } as const;
  }),
}) {}
