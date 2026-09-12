#!/usr/bin/env node
/**
 * Migration hygiene gate — @xeedlyai/kit. Part of `npm run verify` and CI.
 *
 * Supabase orders migrations by their numeric prefix. Two files sharing a
 * prefix have no defined order between them, and a skipped number usually
 * means two branches each took "the next one". Every duplicate or gap fails.
 *
 *   node src/kit/check-migrations.mjs --dir supabase/migrations --width 3
 *   node src/kit/check-migrations.mjs --width 14
 *   node src/kit/check-migrations.mjs --grandfathered 064,070,071
 *
 * --width         digits in the zero-padded prefix (default 3)
 * --grandfathered comma-separated prefixes already duplicated in production
 *                 under their current names; renaming them would desync
 *                 schema_migrations. Never add to this list.
 *
 * Rule for new work: the next number is max(existing) + 1, claimed when the
 * file is created, on the branch.
 */
import { readdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const dir = resolve(process.cwd(), opt("dir", "supabase/migrations"));
const width = Number(opt("width", "3"));
const grandfathered = new Set(
  opt("grandfathered", "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
);

if (!existsSync(dir)) {
  console.error(`check-migrations: ${dir} does not exist`);
  process.exit(1);
}

const pattern = new RegExp(`^(\\d{${width}})_[a-z0-9_]+\\.sql$`);
const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
const byPrefix = new Map();
const malformed = [];
for (const f of files) {
  const m = pattern.exec(f);
  if (!m) {
    malformed.push(f);
    continue;
  }
  const list = byPrefix.get(m[1]) ?? [];
  list.push(f);
  byPrefix.set(m[1], list);
}

const numbers = [...byPrefix.keys()].map(Number).sort((a, b) => a - b);
const pad = (n) => String(n).padStart(width, "0");
const next = pad(Math.max(...numbers, 0) + 1);

const errors = [];
if (malformed.length) errors.push(`Not in ${"N".repeat(width)}_snake_case.sql form:\n  ${malformed.join("\n  ")}`);
for (const [prefix, list] of byPrefix) {
  if (list.length > 1 && !grandfathered.has(prefix)) {
    errors.push(`Duplicate migration number ${prefix}:\n  ${list.join("\n  ")}\nRenumber the newer one to ${next}.`);
  }
  if (list.length === 1 && grandfathered.has(prefix)) {
    errors.push(`Prefix ${prefix} is no longer duplicated — remove it from --grandfathered.`);
  }
}
for (let i = 1; i < numbers.length; i++) {
  if (numbers[i] !== numbers[i - 1] + 1) errors.push(`Gap in migration numbering: ${pad(numbers[i - 1])} is followed by ${pad(numbers[i])}.`);
}

if (errors.length) {
  console.error(`check-migrations: ${errors.length} problem${errors.length === 1 ? "" : "s"} in ${dir}\n`);
  for (const e of errors) console.error(`${e}\n`);
  process.exit(1);
}
console.log(`check-migrations: ${files.length} migrations, numbering is sequential (next: ${next}).`);
