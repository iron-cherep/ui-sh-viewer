// Emits a snippet of browser JS (on stdout) that seeds a demo token + the real
// ui.sh docs into localStorage/IndexedDB as a few stored versions, so the full
// app (including the version history screen) renders offline for visual QA.
// Pipe it into agent-browser:
//
//   node tests/seed.mjs | ./node_modules/.bin/agent-browser eval --stdin
//
// The docs come from tests/fixtures/ui-sh-docs.json (gitignored real content).
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const raw = JSON.parse(readFileSync(join(here, "fixtures/ui-sh-docs.json"), "utf8"));
const record = Array.isArray(raw) ? raw[0] : raw;
const docs = record.docs;

const DAY = 24 * 60 * 60 * 1000;
const now = Date.now();
// Three snapshots with varying ages and document counts.
const versions = [
  { savedAt: now, docs },
  { savedAt: now - 2 * DAY, docs: docs.slice(0, Math.max(1, docs.length - 3)) },
  { savedAt: now - 6 * DAY, docs: docs.slice(0, Math.max(1, Math.floor(docs.length / 2))) },
];

process.stdout.write(`(async () => {
  localStorage.setItem("ui-sh-viewer:mcp-token", "demo-token");
  const versions = ${JSON.stringify(versions)};
  await new Promise((resolve, reject) => {
    const req = indexedDB.open("ui-sh-viewer-docs", 2);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("versions")) db.createObjectStore("versions", { keyPath: "id" });
      if (!db.objectStoreNames.contains("docPages")) db.createObjectStore("docPages", { keyPath: "id" });
    };
    req.onerror = () => reject(req.error);
    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction(["versions", "docPages"], "readwrite");
      for (const v of versions) {
        const id = String(v.savedAt);
        tx.objectStore("versions").put({ id, savedAt: v.savedAt, docCount: v.docs.length });
        tx.objectStore("docPages").put({ id, docs: v.docs });
      }
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => reject(tx.error);
    };
  });
  return "seeded " + versions.length + " versions";
})();
`);
