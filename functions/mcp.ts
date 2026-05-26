/**
 * Cloudflare Pages Function — same-origin proxy for the ui.sh MCP endpoint.
 *
 * This is the production counterpart to the Vite dev proxy in `vite.config.ts`.
 * The browser hits `/mcp` on our own origin (see `MCP_ENDPOINT` in
 * `src/effect/domain.ts`), so there is no CORS in play — this just forwards the
 * request to ui.sh and streams the response back.
 *
 * It is a dumb pass-through: the bearer token travels in the browser's
 * `Authorization` header and is forwarded untouched. The worker holds no
 * secret, caches nothing, and logs nothing. Only the headers MCP needs are
 * forwarded, and the upstream host is hard-coded, so it can't be repurposed as
 * a general open relay.
 */

const UPSTREAM = "https://ui.sh";

/** Only forward the headers the MCP handshake needs — drop cookies, CF/IP, etc. */
const FORWARD_HEADERS = [
  "authorization",
  "content-type",
  "accept",
  "mcp-protocol-version",
  "mcp-session-id",
] as const;

export async function onRequest(context: { request: Request }): Promise<Response> {
  const { request } = context;
  const url = new URL(request.url);
  const target = `${UPSTREAM}${url.pathname}${url.search}`;

  const headers = new Headers();
  for (const name of FORWARD_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  // JSON-RPC bodies are tiny — buffer them so we avoid streaming/`duplex`
  // caveats. The response body below is still streamed (matters for SSE).
  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const upstream = await fetch(target, {
    method: request.method,
    headers,
    body: hasBody ? await request.arrayBuffer() : undefined,
    redirect: "manual",
  });

  // Pass the response through verbatim (incl. Mcp-Session-Id), but never cache.
  const responseHeaders = new Headers(upstream.headers);
  responseHeaders.set("Cache-Control", "no-store");

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}
