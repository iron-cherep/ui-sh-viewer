import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { DocsProvider } from "./app/DocsProvider";
import { router } from "./app/router";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <DocsProvider>
      <RouterProvider router={router} />
    </DocsProvider>
  </React.StrictMode>,
);
