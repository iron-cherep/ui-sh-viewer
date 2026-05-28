import clsx from "clsx";
import type { ReactNode } from "react";
import { isTauri } from "../lib/platform";

/**
 * The app shell container. On the web it's a fixed, hairline-bordered box inset
 * an equal distance from every viewport edge (tighter on mobile, square corners)
 * — the page background shows in the surrounding margin, giving it a framed
 * "site" look. In the native desktop app it goes edge-to-edge (no inset, no
 * border) so it reads as an app window, with the OS title bar as the only
 * chrome. Either way, content lives and scrolls *inside* it.
 */
export function FrameBox({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={clsx(
        "fixed isolate overflow-hidden",
        isTauri ? "inset-0" : "inset-4 border border-white/10 sm:inset-8",
        className,
      )}
    >
      {children}
    </div>
  );
}
