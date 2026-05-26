// Installs a fresh in-memory IndexedDB onto globalThis so DocStore can be
// exercised under Vitest's Node environment. Each test resets the factory in a
// `beforeEach` to keep databases isolated.
import "fake-indexeddb/auto";
