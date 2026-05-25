// Emits a snippet of browser JS (on stdout) that seeds a demo token + the real
// ui.sh docs into localStorage/IndexedDB, so the full app renders offline for
// visual QA. Pipe it into agent-browser:
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

process.stdout.write(`(async () => {
  localStorage.setItem("ui-sh-viewer:mcp-token", "demo-token");
  const docs = ${JSON.stringify(docs)};
  await new Promise((resolve, reject) => {
    const req = indexedDB.open("ui-sh-viewer-docs", 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("docs")) db.createObjectStore("docs", { keyPath: "id" });
    };
    req.onerror = () => reject(req.error);
    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction("docs", "readwrite");
      tx.objectStore("docs").put({ id: "latest", savedAt: new Date().toISOString(), docs });
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => reject(tx.error);
    };
  });
  return "seeded " + docs.length + " docs";
})();
`);
