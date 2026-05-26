import { createBrowserRouter } from "react-router-dom";
import { DocsIndex } from "../routes/DocsIndex";
import { DocsLayout } from "../routes/DocsLayout";
import { DocView } from "../routes/DocView";
import { VersionHistory } from "../routes/VersionHistory";
import { Welcome } from "../routes/Welcome";

export const router = createBrowserRouter([
  { path: "/welcome", element: <Welcome /> },
  {
    path: "/",
    element: <DocsLayout />,
    children: [
      { index: true, element: <DocsIndex /> },
      { path: "versions", element: <VersionHistory /> },
      { path: "*", element: <DocView /> },
    ],
  },
]);
