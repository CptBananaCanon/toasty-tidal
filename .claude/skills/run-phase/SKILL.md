---
name: run-phase
description: The autonomous build loop for the approved Toasty phase plan — task by task (researcher or implementer, then reviewer for tasks tagged review), committing to the phase branch until every task is done or blocked and the full check passes. Run as /run-phase.
disable-model-invocation: true
---

# /run-phase

You lead an autonomous run. Keep your own context small: agents read and write; you
track the checklist, hand out tasks and record outcomes. A Stop hook
(`.claude/hooks/phase-loop-stop.mjs`) won't let this session end while tasks remain
open, so keep going.

## Start

1. Find the active phase and its `PLAN.md` via `docs/CURRENT_PHASE.md`.
2. Refuse to start, and tell the owner why, unless all hold: the Status line says
   `Approved by owner` (or `Implementing`, when resuming); you're on the phase branch,
   not `main`; the working tree is clean; `npm run check -- --quick` passes.
3. Arm the loop by (over)writing `.claude/state/phase-loop.json`:
   `{"active": true, "plan": "docs/phases/<phase>/PLAN.md", "iterations": 0, "maxIterations": 40, "startedAt": "<now>"}`
   — no `sessionId`; the hook binds the loop to this session when it first fires.
4. Set the Status line to `Implementing` and commit.

## Each task (the first `[ ]` in the checklist)

1. Note the current commit as the task base.
2. **Do it.** Tasks tagged `· researcher` go to `researcher`; everything else to
   `implementer`. Pass the task line, the relevant plan section and the base commit.
3. **Owner at the machine.** If the task needs the owner (logging in, listening, testing
   with their accounts), make sure the agent's work is committed, then stop and ask the
   owner in plain language exactly what to run and what to report back. Record their
   answer in the plan's Progress log when they reply, then continue. Credentials never
   go through you or an agent.
4. **Review** tasks tagged `· review`: a fresh `reviewer` on `<base>..HEAD`. On `CHANGES`,
   send the findings to the same kind of agent that did the task, then review again.
   After three rounds without `PASS`, record the findings under Open questions and mark
   the task `[~]`.
5. **Record.** Tick `[x]`, append one Progress log line (task id, commit, verdict, notes
   for the next task), commit, push the branch (report and continue if pushing fails).

If an agent hits a behaviour question the brief and plan don't answer: add it under
Open questions as the next `Qn`, mark the task `[~] … — blocked by Qn`, and move on.
Never guess an owner decision. A blocked task must not leave the branch broken: stash
its uncommitted work (`git stash push --include-untracked -m "<task> blocked by Qn"`)
and revert its commits since the task base (`git revert --no-edit <base>..HEAD`); note
which in the Progress log.

## Finish

When no `[ ]` tasks remain:

1. Set the Status line to `Implemented` (or leave `Implementing` if tasks are blocked)
   and commit — before the final check, which only counts for the commit it ran on.
2. Run the full `npm run check` on that clean, committed tree. Fix failures through the
   implementer, commit, re-run until it passes. Push.
3. Tell the owner: tasks done, tasks blocked and their questions, and that
   `/close-phase` is next.

## Never

Push to or merge into `main`, weaken a test, skip a review on a `· review` task, handle
the owner's credentials, or save provider audio to disk.
