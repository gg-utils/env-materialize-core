/** @fileoverview Synthetic scanner regressions; no filesystem env inputs. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { EnvMaterialize_parseKeyNames } from "./key-names.js";

void test("scans names while discarding multiline values and comments", () => {
  const marker = "synthetic-private-marker";
  const source = `# comment\r\n export Z =${marker}\nA="${marker}\nFALSE_KEY=hidden\n"\nB='multiline\nOTHER=hidden'\nC=\nA=duplicate\ninvalid row\n`;
  const result = EnvMaterialize_parseKeyNames(Buffer.from(source));
  assert.deepEqual(result, ["A", "B", "C", "Z"]);
  assert.equal(JSON.stringify(result).includes(marker), false);
});

void test("handles escaped quotes, backticks, empty input and unfinished quotes", () => {
  assert.deepEqual(EnvMaterialize_parseKeyNames([]), []);
  assert.deepEqual(EnvMaterialize_parseKeyNames(Buffer.from('A="x\\"x\nFAKE=x"\nB=`x\nFAKE=x`\nC=last')), ["A", "B", "C"]);
  assert.deepEqual(EnvMaterialize_parseKeyNames(Buffer.from("A='unfinished\nFAKE=x")), ["A"]);
});
