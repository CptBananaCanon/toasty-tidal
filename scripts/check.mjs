#!/usr/bin/env node
/**
 * npm run check             full check; "done" means this passes. Stamps
 *                           .claude/state/last-check.json for the phase loop.
 * npm run check -- --quick  fast subset used inside a task.
 *
 * Phase 1 adds ESLint, Vitest and clippy/cargo test here.
 */
import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

function fingerprint(cwd) {
  const git = (...args) =>
    execSync(`git ${args.join(" ")}`, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  try {
    return { head: git("rev-parse", "HEAD"), clean: git("status", "--porcelain") === "" };
  } catch {
    return { head: "unknown", clean: false };
  }
}

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const quick = process.argv.includes("--quick");

const steps = [["typecheck", "node_modules/.bin/tsc --noEmit"]];
if (!quick) steps.push(["rust", "cargo check --quiet --manifest-path src-tauri/Cargo.toml"]);

let ok = true;
for (const [name, cmd] of steps) {
  process.stdout.write(`▸ ${name}: ${cmd}\n`);
  try {
    execSync(cmd, { cwd: root, stdio: "inherit" });
  } catch {
    ok = false;
    process.stdout.write(`✗ ${name} failed\n`);
    break;
  }
}

if (!quick) {
  const { head, clean } = fingerprint(root);
  const stampPath = join(root, ".claude/state/last-check.json");
  mkdirSync(dirname(stampPath), { recursive: true });
  writeFileSync(stampPath, JSON.stringify({ head, clean, ok, at: new Date().toISOString() }, null, 2));
}

process.stdout.write(ok ? "✓ check passed\n" : "✗ check failed\n");
process.exit(ok ? 0 : 1);
