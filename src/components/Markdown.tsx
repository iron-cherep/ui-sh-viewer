import { ComarkClient } from "@comark/react";
import type { MouseEvent } from "react";
import { useVersionedNav } from "../app/version-nav";
import { uriToPath } from "../lib/docs";

/**
 * Renders ui.sh markdown into the dark `.prose` surface via comark. Link
 * behavior is handled by click delegation on the rendered DOM (robust to
 * comark's internals): `uidotsh://` links navigate in-app, external links open
 * in a new tab.
 */
export function Markdown({ markdown }: { markdown: string }) {
  const { go } = useVersionedNav();

  function handleClick(event: MouseEvent<HTMLDivElement>) {
    const anchor = (event.target as HTMLElement).closest("a");
    if (!anchor) return;

    const href = anchor.getAttribute("href") ?? "";
    if (href.startsWith("uidotsh://")) {
      event.preventDefault();
      go(uriToPath(href));
    } else if (/^https?:\/\//i.test(href)) {
      event.preventDefault();
      window.open(href, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <div onClick={handleClick}>
      <ComarkClient markdown={markdown} className="prose mt-6" />
    </div>
  );
}
