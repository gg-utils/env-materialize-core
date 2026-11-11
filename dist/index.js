/**
 * @fileoverview Package-root barrel for product-neutral env document parse and merge-aware render
 * primitives exported from `@gg-utils/env-materialize-core`.
 *
 * This file owns the default `.` export surface that re-exports `env-document` so consumers can
 * import the core API from the package root or use the explicit `./env-document` subpath.
 * Flow: package import -> re-export -> `env-document` implementation.
 *
 * @example
 * ```typescript
 * import { EnvMaterialize_parseEnvDocument } from "@gg-utils/env-materialize-core";
 *
 * const document = EnvMaterialize_parseEnvDocument("FEATURE_FLAG=true\n");
 * ```
 *
 * @testing Node test (tsx): npm run env-materialize-core:test from the repository root runs tsx in Node test mode over packages/env-materialize-core/src env-document.unit.test.ts and sibling unit tests, exercising the primitives surfaced through this barrel.
 *
 * @see packages/env-materialize-core/src/env-document.ts - Implementation module that defines parse, render, and document types aggregated here for the package default entrypoint.
 * @see packages/env-materialize-core/src/env-document.unit.test.ts - Node regression tests for duplicate-key merge rules and rendering invariants on the contract re-exported from this file.
 * @see scripts/env-materialize/env-file.ts - Root env-materialize script layer that imports `@gg-utils/env-materialize-core/env-document` and shares the same operational contract as consumers of this barrel.
 * @documentation reviewed=2026-05-22 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
export * from "./env-document.js";
export * from "./key-names.js";
