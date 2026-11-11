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
export function EnvMaterialize_parseKeyNames(bytes) {
    const names = new Set();
    let prefix = "";
    let state = "prefix";
    let quote = 0;
    let escaped = false;
    for (const byte of bytes) {
        if (state === "quoted") {
            if (escaped)
                escaped = false;
            else if (byte === 92 && quote === 34)
                escaped = true;
            else if (byte === quote)
                state = "skip";
            continue;
        }
        if (byte === 10 || byte === 13) {
            state = "prefix";
            prefix = "";
            continue;
        }
        if (state === "skip" || state === "value")
            continue;
        if (state === "start") {
            if (byte === 32 || byte === 9)
                continue;
            if (byte === 34 || byte === 39 || byte === 96) {
                quote = byte;
                state = "quoted";
            }
            else
                state = "value";
            continue;
        }
        if (byte === 61) {
            const match = /^(?:export[ \t]+)?([A-Za-z_][A-Za-z0-9_.-]*)[ \t]*$/.exec(prefix.trimStart());
            if (match?.[1])
                names.add(match[1]);
            prefix = "";
            state = match ? "start" : "skip";
        }
        else if (byte === 32 || byte === 9 || byte === 45 || byte === 46 || byte === 95 ||
            (byte >= 48 && byte <= 57) || (byte >= 65 && byte <= 90) || (byte >= 97 && byte <= 122)) {
            prefix += String.fromCharCode(byte);
        }
        else {
            prefix = "";
            state = "skip";
        }
    }
    return [...names].sort();
}
