#!/usr/bin/env node
/**
 * Stop hook: keeps a /run-phase session working until its plan's checklist is finished
 * and `npm run check` has passed on the final, clean commit.
 *
 * Does nothing unless .claude/state/phase-loop.json exists with "active": true, and only
 * holds the session that armed the loop (bound on the first Stop after arming). Ending a
 * loop marks the file inactive rather than deleting it. Rules live in loop-core.mjs.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { decideStop } from "./loop-core.mjs";
import { fingerprint } from "./fingerprint.mjs";

const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const statePath = join(root, ".claude/state/phase-loop.json");
const checkPath = join(root, ".claude/state/last-check.json");

let raw = "";
for await (const chunk of process.stdin) raw += chunk;

const read = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

if (!existsSync(statePath)) process.exit(0);
const loop = read(readFileSync(statePath, "utf8"));
if (!loop || loop.active !== true) process.exit(0);

const sessionId = read(raw)?.session_id;
if (loop.sessionId && sessionId && loop.sessionId !== sessionId) process.exit(0);
if (!loop.sessionId && sessionId) loop.sessionId = sessionId;

const planFile = join(root, loop.plan);
const planMarkdown = existsSync(planFile) ? readFileSync(planFile, "utf8") : null;
const lastCheck = existsSync(checkPath) ? read(readFileSync(checkPath, "utf8")) : null;
const decision = decideStop({ loop, planMarkdown, lastCheck, now: fingerprint(root) });

if (decision.block) {
  loop.iterations += 1;
  if (decision.kind === "check") loop.finishAttempts = (loop.finishAttempts ?? 0) + 1;
  writeFileSync(statePath, JSON.stringify(loop, null, 2));
  process.stdout.write(JSON.stringify({ decision: "block", reason: decision.reason }));
  process.exit(0);
}

if (decision.endLoop) {
  loop.active = false;
  loop.endedAt = new Date().toISOString();
  loop.outcome = decision.note ?? "ended";
}
writeFileSync(statePath, JSON.stringify(loop, null, 2));
if (decision.note) process.stdout.write(JSON.stringify({ systemMessage: decision.note }));
process.exit(0);
