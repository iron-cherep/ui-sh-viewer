import type { JsonRecord, JsonRpcMessage } from "../effect/domain";

/**
 * MCP responds with either a JSON body or an SSE (text/event-stream) body that
 * wraps the same JSON-RPC message in `data:` lines. This normalizes both into a
 * single JsonRpcMessage. It never throws — malformed input becomes a JSON-RPC
 * error so the Effect layer can treat it as an ordinary failure.
 */
export function parseMcpResponse(text: string, contentType: string | null): JsonRpcMessage {
  const trimmed = text.trim();

  if (!trimmed) {
    return { jsonrpc: "2.0", id: null, error: { code: -32000, message: "Empty response" } };
  }

  const looksLikeStream =
    contentType?.includes("text/event-stream") || trimmed.startsWith("event:") || trimmed.startsWith("data:");

  if (looksLikeStream) {
    const payloads = trimmed
      .split(/\n\n+/)
      .flatMap((event) =>
        event
          .split("\n")
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.slice(5).trim()),
      )
      .filter((line) => line && line !== "[DONE]");

    let jsonPayload: string | undefined;
    for (let index = payloads.length - 1; index >= 0; index -= 1) {
      if (payloads[index].startsWith("{")) {
        jsonPayload = payloads[index];
        break;
      }
    }

    if (!jsonPayload) {
      return { jsonrpc: "2.0", id: null, error: { code: -32000, message: "No JSON payload in event stream" } };
    }

    return safeParse(jsonPayload);
  }

  return safeParse(trimmed);
}

function safeParse(input: string): JsonRpcMessage {
  try {
    return JSON.parse(input) as JsonRpcMessage;
  } catch {
    return { jsonrpc: "2.0", id: null, error: { code: -32700, message: "Invalid JSON in MCP response" } };
  }
}

/** Pull the concatenated text out of an MCP tool/resource result. */
export function extractText(result: unknown): string {
  if (!result || typeof result !== "object") {
    return "";
  }

  const record = result as JsonRecord;
  const content = Array.isArray(record.content)
    ? record.content
    : Array.isArray(record.contents)
      ? record.contents
      : [];

  return content
    .map((item) => {
      if (!item || typeof item !== "object") {
        return "";
      }
      const text = (item as JsonRecord).text;
      return typeof text === "string" ? text : "";
    })
    .filter(Boolean)
    .join("\n\n");
}
