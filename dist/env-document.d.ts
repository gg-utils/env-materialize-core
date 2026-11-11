/**
 * @fileoverview Product-neutral `.env` document parser and merge-aware renderer primitives.
 *
 * Flow: env text -> parsed assignment map -> merged values -> normalized rendered document.
 *
 * @example
 * ```typescript
 * const document = EnvMaterialize_parseEnvDocument("A=1\nB=2\n");
 * const rendered = EnvMaterialize_renderDocument({
 *   document,
 *   valuesByKey: new Map([["B", "3"]]),
 * });
 * ```
 *
 * @testing Node test (tsx): npm run env-materialize-core:test from repository root runs the package suite that includes env-document.unit.test.ts.
 *
 * @see scripts/env-materialize/env-file.ts - Script-layer re-exports that wire these parse and render primitives into the root env-materialize CLI and file writers.
 * @see packages/env-materialize-kit/src/write-target-file.ts - Target writer that parses desired env text through this module before merge-aware rendering to disk paths.
 * @see packages/env-materialize-core/src/env-document.unit.test.ts - Node test regression coverage for last-assignment wins, preserved non-assignment lines, and trailing-newline rendering.
 * @documentation reviewed=2026-05-22 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
/**
 * One parsed line from an `.env`-style document.
 *
 * @remarks
 * `assignment` rows keep both `rawValue` and `normalizedValue` so renders can preserve caller
 * quoting, while `other` rows retain comments, blanks, and malformed lines verbatim.
 */
export type EnvMaterialize_ParsedEnvLine = {
    index: number;
    kind: "assignment";
    key: string;
    normalizedValue: string;
    rawLine: string;
    rawValue: string;
} | {
    index: number;
    kind: "other";
    rawLine: string;
};
/**
 * Parsed env document used for merge-aware rendering.
 *
 * @remarks
 * `lastIndexByKey` records the final line index per key so duplicate assignments collapse to the
 * last occurrence when applying managed updates.
 */
export type EnvMaterialize_ParsedEnvDocument = {
    assignmentKeys: Set<string>;
    lastIndexByKey: Map<string, number>;
    lines: EnvMaterialize_ParsedEnvLine[];
    valuesByKey: Map<string, string>;
};
/**
 * Parses raw env file content into a structured assignment map.
 *
 * @remarks
 * Strips a leading `export ` token, records the last occurrence index per key, and builds both
 * `valuesByKey` and `lastIndexByKey` for deduplicated renders. Non-assignment lines stay as
 * `kind: "other"`.
 *
 * @example
 * ```typescript
 * const doc = EnvMaterialize_parseEnvDocument("FOO=1\n# c\nFOO=2\n");
 * doc.valuesByKey.get("FOO"); // "2"
 * ```
 */
export declare function EnvMaterialize_parseEnvDocument(content: string): EnvMaterialize_ParsedEnvDocument;
/**
 * Reads and parses an env file from disk.
 *
 * @remarks
 * Synchronous `readFileSync`; propagates IO errors from Node.
 *
 * @throws {Error} When the file cannot be read.
 *
 * @example
 * ```typescript
 * const doc = EnvMaterialize_readEnvDocument("/workspace/.env");
 * ```
 */
export declare function EnvMaterialize_readEnvDocument(filePath: string): EnvMaterialize_ParsedEnvDocument;
/**
 * Renders a parsed env document with desired key-value overrides.
 *
 * @remarks
 * Preserves `other` lines verbatim, updates only the last assignment row per key, appends brand-new
 * keys in sorted order after a blank separator when needed, and guarantees a trailing newline.
 *
 * @example
 * ```typescript
 * const doc = EnvMaterialize_parseEnvDocument("A=1\n");
 * EnvMaterialize_renderDocument({ document: doc, valuesByKey: new Map([["A", "9"]]) });
 * ```
 */
export declare function EnvMaterialize_renderDocument(options: {
    document: EnvMaterialize_ParsedEnvDocument;
    valuesByKey: Map<string, string>;
}): string;
/**
 * Normalizes rendered env text to end with a single trailing newline.
 *
 * @remarks
 * Pure string helper shared by writers and drift checks so comparisons stay POSIX-stable.
 *
 * @example
 * ```typescript
 * EnvMaterialize_normalizeRenderedContent("A=1"); // "A=1\n"
 * ```
 */
export declare function EnvMaterialize_normalizeRenderedContent(content: string): string;
