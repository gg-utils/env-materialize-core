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

import fs from "node:fs";

/**
 * One parsed line from an `.env`-style document.
 *
 * @remarks
 * `assignment` rows keep both `rawValue` and `normalizedValue` so renders can preserve caller
 * quoting, while `other` rows retain comments, blanks, and malformed lines verbatim.
 */
export type EnvMaterialize_ParsedEnvLine =
  | {
      index: number;
      kind: "assignment";
      key: string;
      normalizedValue: string;
      rawLine: string;
      rawValue: string;
    }
  | {
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
 * Strips matching outer quotes (double or single) from a raw env value if present.
 *
 * @remarks
 * Does not handle escaped quotes. Used internally during env document parsing to
 * produce normalized assignment values.
 *
 * @param rawValue - The raw right-hand side of an env assignment.
 * @returns The value with outer quotes removed, or the trimmed value if no matching pair.
 */
function EnvMaterialize_normalizeValue(rawValue: string): string {
  const trimmed = rawValue.trim();
  if (trimmed.startsWith("\"") && trimmed.endsWith("\"") && trimmed.length >= 2) {
    return trimmed.slice(1, -1);
  }
  if (trimmed.startsWith("'") && trimmed.endsWith("'") && trimmed.length >= 2) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

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
export function EnvMaterialize_parseEnvDocument(
  content: string,
): EnvMaterialize_ParsedEnvDocument {
  const lines: EnvMaterialize_ParsedEnvLine[] = [];
  const valuesByKey = new Map<string, string>();
  const lastIndexByKey = new Map<string, number>();
  const assignmentKeys = new Set<string>();

  for (const [index, rawLine] of content.split(/\r?\n/u).entries()) {
    const trimmed = rawLine.trim();
    const normalizedLine = trimmed.startsWith("export ")
      ? trimmed.slice("export ".length)
      : trimmed;
    const equalsIndex = normalizedLine.indexOf("=");
    const key =
      equalsIndex > 0 ? normalizedLine.slice(0, equalsIndex).trim() : "";
    const isAssignment =
      key.length > 0 && /^[A-Za-z_][A-Za-z0-9_]*$/u.test(key);

    if (!isAssignment) {
      lines.push({
        index,
        kind: "other",
        rawLine,
      });
      continue;
    }

    const rawValue = normalizedLine.slice(equalsIndex + 1);
    const normalizedValue = EnvMaterialize_normalizeValue(rawValue);

    lines.push({
      index,
      key,
      kind: "assignment",
      normalizedValue,
      rawLine,
      rawValue,
    });
    assignmentKeys.add(key);
    valuesByKey.set(key, normalizedValue);
    lastIndexByKey.set(key, index);
  }

  return {
    assignmentKeys,
    lastIndexByKey,
    lines,
    valuesByKey,
  };
}

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
export function EnvMaterialize_readEnvDocument(
  filePath: string,
): EnvMaterialize_ParsedEnvDocument {
  return EnvMaterialize_parseEnvDocument(fs.readFileSync(filePath, "utf8"));
}

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
export function EnvMaterialize_renderDocument(options: {
  document: EnvMaterialize_ParsedEnvDocument;
  valuesByKey: Map<string, string>;
}): string {
  const renderedLines: string[] = [];
  const renderedKeys = new Set<string>();

  for (const line of options.document.lines) {
    if (line.kind === "other") {
      renderedLines.push(line.rawLine);
      continue;
    }

    if (options.document.lastIndexByKey.get(line.key) !== line.index) {
      continue;
    }

    const nextValue = options.valuesByKey.get(line.key);
    if (typeof nextValue === "string") {
      renderedLines.push(`${line.key}=${nextValue}`);
    } else {
      renderedLines.push(`${line.key}=${line.rawValue}`);
    }
    renderedKeys.add(line.key);
  }

  const extraKeys = Array.from(options.valuesByKey.keys())
    .filter((key) => !renderedKeys.has(key))
    .sort();

  if (extraKeys.length > 0) {
    if (
      renderedLines.length > 0 &&
      (renderedLines.at(-1)?.trim().length ?? 0) > 0
    ) {
      renderedLines.push("");
    }

    for (const key of extraKeys) {
      renderedLines.push(`${key}=${options.valuesByKey.get(key) ?? ""}`);
    }
  }

  const rendered = renderedLines.join("\n");
  return rendered.endsWith("\n") ? rendered : `${rendered}\n`;
}

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
export function EnvMaterialize_normalizeRenderedContent(content: string): string {
  return content.endsWith("\n") ? content : `${content}\n`;
}
