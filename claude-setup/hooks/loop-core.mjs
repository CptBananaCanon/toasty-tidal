/**
 * The phase loop's bookkeeping — pure, used by the Stop hook (phase-loop-stop.mjs).
 * Adapted from the Mr Data workflow.
 *
 * Plan checklist convention (docs/templates/PHASE_PLAN.md, "Task checklist"):
 *
 *   - [ ] T03 — Queue engine handles repeat-one      open
 *   - [x] T02 — Provider boundary types              done
 *   - [~] T04 — Spotify login — blocked by Q1        blocked on the owner
 */

const TASK = /^\s*[-*]\s+\[( |x|X|~)\]\s+(T\d+)\b\s*[—–-]?\s*(.*)$/;

export function parseChecklist(markdown) {
  const tasks = [];
  for (const line of markdown.split("\n")) {
    const m = line.match(TASK);
    if (!m) continue;
    const mark = m[1].toLowerCase();
    tasks.push({
      id: m[2],
      title: m[3].trim(),
      state: mark === "x" ? "done" : mark === "~" ? "blocked" : "open",
    });
  }
  return tasks;
}

/** How many times the loop may be sent back to make a finished checklist pass the check. */
export const MAX_FINISH_ATTEMPTS = 5;

/**
 * Decide whether the agent may stop.
 *
 * @param {object} input
 * @param {{ plan: string, iterations: number, maxIterations: number, finishAttempts?: number } | null} input.loop
 * @param {string | null} input.planMarkdown
 * @param {{ head: string, ok: boolean } | null} input.lastCheck  the last full `npm run check` stamp
 * @param {{ head: string, clean: boolean }} input.now  current HEAD and whether the tree is clean
 * @returns {{ block: boolean, reason?: string, kind?: "tasks" | "check", endLoop?: boolean, note?: string }}
 */
export function decideStop({ loop, planMarkdown, lastCheck, now }) {
  if (!loop) return { block: false };

  if (loop.iterations >= loop.maxIterations) {
    return {
      block: false,
      endLoop: true,
      note:
        `Phase loop halted after ${loop.iterations} continuations (the cap). ` +
        "Record where things stand in the plan's progress log for the owner.",
    };
  }

  if (planMarkdown === null) {
    return { block: false, endLoop: true, note: `Phase loop ended: ${loop.plan} not found.` };
  }

  const tasks = parseChecklist(planMarkdown);
  if (tasks.length === 0) {
    return {
      block: false,
      endLoop: true,
      note: `Phase loop ended: ${loop.plan} has no T-numbered task checklist.`,
    };
  }

  const open = tasks.filter((t) => t.state === "open");
  if (open.length > 0) {
    const next = open[0];
    return {
      block: true,
      kind: "tasks",
      reason:
        `${open.length} task(s) in ${loop.plan} are still open. ` +
        `Continue the /run-phase cycle with ${next.id} — ${next.title}. ` +
        "If it needs the owner at the machine, ask them and wait for their reply. " +
        "If it needs an owner decision, add the question under Open questions, " +
        "mark the task [~] with 'blocked by Qn', discard that task's unfinished work, and move on.",
    };
  }

  const verified = !!lastCheck && lastCheck.ok && lastCheck.head === now.head && now.clean;
  if (!verified) {
    if ((loop.finishAttempts ?? 0) >= MAX_FINISH_ATTEMPTS) {
      return {
        block: false,
        endLoop: true,
        note:
          `Phase loop stopped: the checklist is finished but \`npm run check\` has not passed after ` +
          `${MAX_FINISH_ATTEMPTS} attempts. The owner needs to look at the failure.`,
      };
    }
    return {
      block: true,
      kind: "check",
      reason:
        "Every task is ticked or blocked, but `npm run check` has not passed on the current commit " +
        "with a clean working tree. Commit your work (or discard unfinished work from blocked tasks), " +
        "run `npm run check`, and fix anything it reports.",
    };
  }

  const blocked = tasks.filter((t) => t.state === "blocked");
  return {
    block: false,
    endLoop: true,
    note:
      blocked.length > 0
        ? `Phase loop finished: ${blocked.length} task(s) wait on owner answers (${blocked.map((t) => t.id).join(", ")}).`
        : "Phase loop finished: every task is done and the full check passes. Next: /close-phase.",
  };
}
