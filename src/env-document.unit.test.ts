/**
 * @fileoverview Node test suite for product-neutral `.env`-style document parsing, merge-aware
 * rendering, and rendered-body newline normalization.
 *
 * This file owns regression coverage for last-assignment wins, stable assignment key order,
 * append-only new keys, preserved comments and non-assignment lines through parse/render, and
 * `EnvMaterialize_normalizeRenderedContent` guarantees.
 * Flow: parse fixture text -> assert parsed map and key order -> render merged updates -> assert
 * serialized body -> assert trailing-newline normalization.
 *
 * @testing Node.js test: npm run env-materialize-core:test from repository root runs the package tsx --test harness that executes src/env-document.unit.test.ts with the other package unit tests.
 *
 * @see packages/env-materialize-core/src/env-document.ts - Parse and render implementation whose assignment ordering, preserved line kinds, and normalized output contracts are asserted here.
 * @see scripts/env-materialize/env-file.ts - Root env-materialize CLI wiring that re-exports these primitives so regressions in this suite map to operator-facing env file generation.
 * @see packages/env-materialize-kit/src/write-target-file.ts - Target writer that merges values through the same env-document helpers after reads from disk, making this suite a guardrail for persisted env shape.
 * @documentation reviewed=2026-05-22 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  EnvMaterialize_normalizeRenderedContent,
  EnvMaterialize_parseEnvDocument,
  EnvMaterialize_renderDocument,
} from "./env-document.js";

test("EnvMaterialize_parseEnvDocument preserves comments and last assignment values", () => {
  const document = EnvMaterialize_parseEnvDocument(
    "# comment\nexport FOO=one\nBAR='two'\nFOO=three\n",
  );

  assert.equal(document.valuesByKey.get("FOO"), "three");
  assert.equal(document.valuesByKey.get("BAR"), "two");
  assert.deepEqual([...document.assignmentKeys], ["FOO", "BAR"]);
});

test("EnvMaterialize_renderDocument updates last assignments and appends new keys", () => {
  const document = EnvMaterialize_parseEnvDocument("# keep\nFOO=one\nFOO=two\n");

  assert.equal(
    EnvMaterialize_renderDocument({
      document,
      valuesByKey: new Map([
        ["FOO", "updated"],
        ["BAR", "added"],
      ]),
    }),
    "# keep\nFOO=updated\n\nBAR=added\n",
  );
});

test("EnvMaterialize_normalizeRenderedContent guarantees trailing newline", () => {
  assert.equal(EnvMaterialize_normalizeRenderedContent("A=1"), "A=1\n");
  assert.equal(EnvMaterialize_normalizeRenderedContent("A=1\n"), "A=1\n");
});
