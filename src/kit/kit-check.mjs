#!/usr/bin/env node
/**
 * Verifies that the vendored @xeedlyai/kit under src/kit/ is exactly what
 * bin/sync.mjs wrote — no hand edits, no partial copies. Part of
 * `npm run verify` and CI.
 *
 *   node src/kit/kit-check.mjs
 *
 * Fails with the list of files that differ from kit.lock.json. Fix by running
 * `npm run kit:sync` (to take the current kit) or by reverting the edit.
 * Change the kit in ../standards/packages/kit, never here.
 */
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const lockPath = join(here, "kit.lock.json");
if (!existsSync(lockPath)) {
  console.error("kit-check: src/kit/kit.lock.json is missing — run `npm run kit:sync`.");
  process.exit(1);
}
const lock = JSON.parse(readFileSync(lockPath, "utf8"));

/** sha1 of the file with CRLF normalised to LF, so Windows checkouts (autocrlf) hash the same as Linux. */
const hashFile = (p) => createHash("sha1").update(readFileSync(p, "utf8").replace(/\r\n/g, "\n")).digest("hex");
const present = readdirSync(here).filter((f) => f !== "kit.lock.json").sort();

const problems = [];
for (const [file, expected] of Object.entries(lock.files)) {
  if (!present.includes(file)) problems.push(`missing: ${file}`);
  else if (hashFile(join(here, file)) !== expected) problems.push(`modified: ${file}`);
}
for (const file of present) {
  if (!(file in lock.files)) problems.push(`unexpected: ${file}`);
}

if (problems.length) {
  console.error(`kit-check: src/kit/ does not match kit.lock.json (@xeedlyai/kit ${lock.version}):\n  ${problems.join("\n  ")}\nRun \`npm run kit:sync\` or revert the edit. Change the kit in the standards repo, not here.`);
  process.exit(1);
}
console.log(`kit-check: src/kit/ matches @xeedlyai/kit ${lock.version} (${present.length} files).`);
