import clsx from "clsx";
import type { ButtonHTMLAttributes } from "react";

/**
 * The primary call-to-action button, in the brand accent. The accent is light,
 * so it pairs with dark text (Catalyst's `color` system can't take a custom
 * theme color cleanly, hence a dedicated button). Sized to match Catalyst.
 */
export function AccentButton({ className, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-3.5 py-2.5 text-base/6 font-semibold text-accent-contrast transition hover:bg-accent-bright focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-50 sm:px-3 sm:py-1.5 sm:text-sm/6 [&>svg]:size-4 [&>svg]:shrink-0",
        className,
      )}
    >
      {children}
    </button>
  );
}
