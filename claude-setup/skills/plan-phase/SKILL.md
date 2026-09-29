---
name: plan-phase
description: Plan the active Toasty phase — create the phase branch, have the planner write PLAN.md and the reviewer critique it once, then stop for the owner's approval. Run as /plan-phase.
disable-model-invocation: true
---

# /plan-phase

You are the lead. You coordinate; the `planner` and `reviewer` agents do the work.
Nothing here changes application code.

1. **Preconditions.** Read `docs/CURRENT_PHASE.md` to find the active phase and its
   directory under `docs/phases/`. Confirm the brief exists and its Status says it's
   ready for planning, and that the working tree is clean. If the brief isn't ready (e.g.
   Phase 1 before its "Decisions from Phase 0" section is filled), stop and tell the owner
   what's missing — briefs are written with the architect, not here.
2. **Branch.** From an up-to-date `main` (`git pull --ff-only` if a remote is reachable),
   create `phase/<nn>-<slug>` matching the phase directory, unless it exists; switch to
   it.
3. **Plan.** Delegate to `planner`: "Write PLAN.md for <phase> from its BRIEF.md." Wait
   for its report.
4. **Critique.** Delegate to a fresh `reviewer`: "Critique docs/phases/<phase>/PLAN.md
   against its BRIEF.md and the code; write the Plan review section."
5. **One revision.** If the verdict is `revise first`, send the blocking and important
   findings to `planner`, then have a fresh `reviewer` check the revision once. Don't
   loop further; remaining disagreements are for the owner. Set the Status line to
   `Reviewed`.
6. **Commit** the plan (`Plan <phase>: …`) and push the branch
   (`git push -u origin <branch>`; if pushing fails, say so and carry on).
7. **Hand over** in plain language: what the phase will do, the number of tasks, what
   the owner will have to do at the machine, the open questions, and what the reviewer
   still flags. Implementation starts when the owner changes the Status line to
   `Approved by owner — <date>` and runs `/run-phase`.
