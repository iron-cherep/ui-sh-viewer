import { Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useDocs } from "../app/DocsProvider";
import { DocArticle } from "../components/DocArticle";
import { DocDirectory } from "../components/DocDirectory";
import { getChildDocs, getDocPath, getTopLevelDocs, pathToUri } from "../lib/docs";

/** A document by URL: a group shows its children, a leaf shows its article. */
export function DocView() {
  const { docs, docList, ensureDoc, status } = useDocs();
  const location = useLocation();
  const uri = pathToUri(location.pathname);
  const attempted = useRef<Set<string>>(new Set());

  // Fetch a doc that wasn't reached by the crawl (e.g. a deep link), once.
  useEffect(() => {
    if (uri && !docs.has(uri) && !attempted.current.has(uri)) {
      attempted.current.add(uri);
      void ensureDoc(uri);
    }
  }, [uri, docs, ensureDoc]);

  if (!uri) {
    return (
      <DocDirectory
        eyebrow="/"
        title="Documentation"
        description="Top-level pages and document groups."
        items={getTopLevelDocs(docList)}
        allDocs={docList}
      />
    );
  }

  const children = getChildDocs(uri, docList);
  if (children.length) {
    return (
      <DocDirectory
        eyebrow={getDocPath(uri)}
        title={docs.get(uri)?.title ?? "Documentation"}
        description="Documents in this group."
        items={children}
        allDocs={docList}
      />
    );
  }

  const doc = docs.get(uri);
  if (doc) {
    return <DocArticle doc={doc} docs={docs} />;
  }

  return (
    <div className="grid min-h-[50vh] place-items-center">
      <div className="text-center">
        {status === "error" ? (
          <p className="text-sm/6 text-zinc-400">This page could not be loaded.</p>
        ) : (
          <>
            <Loader2 className="mx-auto size-6 animate-spin stroke-accent" />
            <p className="mt-3 font-mono text-xs/5 text-zinc-500">{getDocPath(uri)}</p>
          </>
        )}
      </div>
    </div>
  );
}
