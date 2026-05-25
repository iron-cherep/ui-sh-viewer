import clsx from "clsx";
import type { ReactNode } from "react";

/**
 * The ui.sh app shell: a fixed, hairline-bordered box inset an equal distance
 * from every viewport edge (tighter on mobile, square corners — plain lines on
 * each side). Content lives and scrolls *inside* it; the page background shows
 * in the surrounding margin.
 */
export function FrameBox({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx("fixed inset-4 isolate overflow-hidden border border-white/10 sm:inset-8", className)}>
      {children}
    </div>
  );
}
