import { ManagedRuntime } from "effect";
import { AppLayer } from "../effect/layers";

/**
 * A single long-lived runtime for the whole SPA. React code runs effects with
 * `runtime.runPromise(...)`; the layer (services + their dependencies) is built
 * once and reused for the lifetime of the page.
 */
export const runtime = ManagedRuntime.make(AppLayer);
