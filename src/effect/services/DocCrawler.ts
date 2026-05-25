import { Effect } from "effect";
import { errorDocPage, toDocPage } from "../../lib/docs";
import { MAX_CRAWLED_DOCS, ROOT_DOC_URI, type DocPage } from "../domain";
import { McpClient } from "./McpClient";

export type CrawlProgress = {
  /** The document URI currently being read. */
  readonly uri: string;
  /** How many documents have been stored so far. */
  readonly done: number;
  /** How many documents are known/queued (an upper bound that grows). */
  readonly total: number;
};

/**
 * Breadth-first crawl of the ui.sh documentation graph starting at the root.
 * Reports each page as it is read via `onProgress`. A single failed page is
 * recorded as an error page and the crawl continues; an invalid token aborts
 * the whole crawl with {@link TokenInvalidError}.
 */
export class DocCrawler extends Effect.Service<DocCrawler>()("app/DocCrawler", {
  effect: Effect.gen(function* () {
    const mcp = yield* McpClient;

    const crawl = (onProgress: (progress: CrawlProgress) => void) =>
      Effect.gen(function* () {
        yield* mcp.initialize;

        const docs = new Map<string, DocPage>();
        const queued = new Set<string>([ROOT_DOC_URI]);
        const queue: string[] = [ROOT_DOC_URI];

        while (queue.length > 0 && docs.size < MAX_CRAWLED_DOCS) {
          const uri = queue.shift()!;
          yield* Effect.sync(() => onProgress({ uri, done: docs.size, total: queued.size }));

          const doc = yield* mcp.fetchDoc(uri).pipe(
            Effect.map((text) => toDocPage(uri, text)),
            Effect.catchTag("McpRequestError", (error) => Effect.succeed(errorDocPage(uri, error.message))),
          );

          docs.set(uri, doc);

          for (const link of doc.links) {
            if (!queued.has(link.uri) && docs.size + queue.length < MAX_CRAWLED_DOCS) {
              queued.add(link.uri);
              queue.push(link.uri);
            }
          }
        }

        return Array.from(docs.values());
      });

    return { crawl } as const;
  }),
}) {}
