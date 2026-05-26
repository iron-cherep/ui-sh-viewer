import { useDocs } from "../app/DocsProvider";
import { DocDirectory } from "../components/DocDirectory";
import { getTopLevelDocs } from "../lib/docs";

/** The `/` index: top-level pages and groups. */
export function DocsIndex() {
  const { docList } = useDocs();
  const items = getTopLevelDocs(docList);

  if (!items.length) {
    return <p className="text-sm/6 text-zinc-400">No documents loaded yet. Use &ldquo;Fetch latest&rdquo; to fetch them.</p>;
  }

  return (
    <DocDirectory
      eyebrow="/"
      title="Documentation"
      description="Top-level pages and document groups."
      items={items}
      allDocs={docList}
    />
  );
}
