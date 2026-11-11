/**
 * @fileoverview Value-discarding dotenv key scanner. No value strings are constructed.
 * Feed bytes in order; only assignment prefixes and the current byte are inspected.
 */
/**
 * Extract sorted unique dotenv names without collecting value text.
 * Supports export, comments, CRLF, quoted multiline values and escaped double quotes.
 * Invalid rows are ignored; an unterminated quote consumes the remaining input.
 * @param bytes - Byte iterable owned by the caller; ASCII syntax is recognized directly.
 * @returns Sorted unique names, never assignment values.
 */
export declare function EnvMaterialize_parseKeyNames(bytes: Iterable<number>): string[];
