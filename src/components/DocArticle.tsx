import { Link as LinkIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useVersionedNav } from "../app/version-nav";
import { type DocPage } from "../effect/domain";
import { getDocPath, uriToPath } from "../lib/docs";
import { Markdown } from "./Markdown";

/** A single document: markdown body plus a sidebar of pages it links to. */
export function DocArticle({ doc, docs }: { doc: DocPage; docs: Map<string, DocPage> }) {
  const { to } = useVersionedNav();
  const available = doc.links.filter((link) => docs.has(link.uri));
  const missing = doc.links.filter((link) => !docs.has(link.uri));
  const links = [...available, ...missing];

  // The title is shown in the header below, so drop a leading `# Heading` to
  // avoid rendering it twice.
  const body = doc.text.replace(/^\s*#\s+.+\r?\n+/, "");

  return (
    <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_18rem]">
      <article className="min-w-0">
        <div className="border-b border-white/10 pb-5">
          <p className="font-mono text-sm/6 break-all text-accent">{doc.uri}</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-balance text-white sm:text-3xl">
            {doc.title}
          </h1>
        </div>

        {doc.error ? (
          <div className="mt-6 rounded-lg bg-rose-500/10 p-4 text-sm/6 text-rose-300 ring-1 ring-rose-500/20">
            {doc.error}
          </div>
        ) : (
          <Markdown markdown={body} />
        )}
      </article>

      <aside className="min-w-0 border-t border-white/10 pt-6 xl:border-t-0 xl:border-l xl:border-white/10 xl:pt-0 xl:pl-6">
        <h2 className="text-sm/6 font-semibold text-white">Linked pages</h2>
        <div className="mt-3 space-y-1">
          {links.length ? (
            links.map((link) => (
              <Link
                key={link.uri}
                to={to(uriToPath(link.uri))}
                className="group flex items-start gap-2 rounded-lg px-2 py-2 text-zinc-300 transition hover:bg-white/5 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <LinkIcon className="mt-1 size-4 shrink-0 stroke-accent" />
                <span className="min-w-0">
                  <span className="block truncate text-sm/6 font-medium">{link.label}</span>
                  <span className="block truncate font-mono text-xs/5 text-zinc-500">{getDocPath(link.uri)}</span>
                </span>
              </Link>
            ))
          ) : (
            <p className="text-sm/6 text-zinc-500">No linked pages.</p>
          )}
        </div>
      </aside>
    </div>
  );
}
