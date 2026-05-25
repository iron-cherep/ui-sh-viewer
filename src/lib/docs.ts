import { ROOT_DOC_URI, type DocLink, type DocPage } from "../effect/domain";

/** Trim trailing punctuation that markdown links sometimes leave on a URI. */
export function normalizeDocUri(uri: string): string {
  return uri.replace(/[.,;:!?]+$/g, "");
}

/** `uidotsh://ui/design-guidelines` -> `/ui/design-guidelines` */
export function uriToPath(uri: string): string {
  const normalized = normalizeDocUri(uri);
  const short = normalized.startsWith("uidotsh://") ? normalized.replace("uidotsh://", "") : normalized;
  return `/${encodeURI(short).replace(/^\/+/, "")}`;
}

/** `/ui/design-guidelines` -> `uidotsh://ui/design-guidelines` (null for the index). */
export function pathToUri(pathname: string): string | null {
  const raw = pathname.replace(/^\/+/, "");

  if (!raw || raw === "mcp") {
    return null;
  }

  try {
    const decoded = decodeURI(raw);
    return normalizeDocUri(`uidotsh://${decoded.replace(/^\/+/, "")}`);
  } catch {
    return null;
  }
}

export function getDocPath(uri: string): string {
  return uri.replace("uidotsh://", "");
}

export function getDocSegments(uri: string): string[] {
  return getDocPath(uri).split("/").filter(Boolean);
}

export function getParentUri(uri: string): string | null {
  const segments = getDocSegments(uri);
  if (segments.length <= 1) {
    return null;
  }
  return `uidotsh://${segments.slice(0, -1).join("/")}`;
}

export function prettifyTitle(uri: string): string {
  const segments = uri.split("/").filter(Boolean);
  const lastSegment = segments.length ? segments[segments.length - 1] : uri.replace("uidotsh://", "");
  return lastSegment
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function titleFromMarkdown(markdown: string, fallbackUri: string): string {
  const heading = markdown.split("\n").find((line) => line.startsWith("# "));
  return heading ? heading.replace(/^#\s+/, "").trim() : prettifyTitle(fallbackUri);
}

/** Collect every `uidotsh://` link referenced in a document's markdown. */
export function extractUidotshLinks(markdown: string): DocLink[] {
  const links = new Map<string, string>();

  const markdownLink = /\[([^\]]+)]\((uidotsh:\/\/[^)\s]+)\)/g;
  let match: RegExpExecArray | null;
  while ((match = markdownLink.exec(markdown))) {
    links.set(normalizeDocUri(match[2]), match[1]);
  }

  const bareLink = /(^|[\s(])((?:uidotsh:\/\/)[^\s)`]+)/g;
  while ((match = bareLink.exec(markdown))) {
    const uri = normalizeDocUri(match[2]);
    if (!links.has(uri)) {
      links.set(uri, prettifyTitle(uri));
    }
  }

  return Array.from(links, ([uri, label]) => ({ uri, label }));
}

export function summarizeDoc(text: string): string {
  const summary = text
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line && !line.startsWith("#") && !line.startsWith("|") && !/^[-*_]{3,}$/.test(line));

  if (!summary) {
    return "Open this page.";
  }

  // Strip list markers and inline markdown so card descriptions read as plain text.
  return summary
    .replace(/^[-*]\s+/, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[`*_]/g, "")
    .trim();
}

export function toDocPage(uri: string, text: string): DocPage {
  return {
    uri,
    title: titleFromMarkdown(text, uri),
    text,
    links: extractUidotshLinks(text),
  };
}

export function errorDocPage(uri: string, message: string): DocPage {
  return { uri, title: prettifyTitle(uri), text: "", links: [], error: message };
}

export function hasChildDocs(uri: string, docs: DocPage[]): boolean {
  return docs.some((doc) => getParentUri(doc.uri) === uri);
}

export function getChildDocs(uri: string, docs: DocPage[]): DocPage[] {
  return docs.filter((doc) => getParentUri(doc.uri) === uri);
}

export function getTopLevelDocs(docs: DocPage[]): DocPage[] {
  // Children of the root — not the root doc itself (the index *is* the root).
  return docs.filter((doc) => getParentUri(doc.uri) === ROOT_DOC_URI);
}

/** Sidebar listing: siblings of the active doc, or its children if it is a group. */
export function getNavigationDocs(activeUri: string | null, docs: DocPage[]): DocPage[] {
  if (!activeUri) {
    return getTopLevelDocs(docs);
  }
  if (hasChildDocs(activeUri, docs)) {
    return getChildDocs(activeUri, docs);
  }
  const parentUri = getParentUri(activeUri);
  if (!parentUri || parentUri === ROOT_DOC_URI) {
    return getTopLevelDocs(docs);
  }
  return getChildDocs(parentUri, docs);
}
