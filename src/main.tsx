import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { DocsProvider } from "./app/DocsProvider";
import { router } from "./app/router";
import { isTauri } from "./lib/platform";
import "./styles.css";

if (isTauri) {
  // Flag the native shell so the app-only CSS in styles.css applies.
  document.documentElement.classList.add("is-tauri");
  // Suppress the webview's default context menu — "Reload"/"Inspect" reads as a
  // web page. Keep it where a native menu is genuinely useful: editable fields
  // and selectable document text.
  document.addEventListener("contextmenu", (event) => {
    const target = event.target as HTMLElement | null;
    if (target?.closest("input, textarea, .prose, [data-allow-context]")) return;
    event.preventDefault();
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <DocsProvider>
      <RouterProvider router={router} />
    </DocsProvider>
  </React.StrictMode>,
);
