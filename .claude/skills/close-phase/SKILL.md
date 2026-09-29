---
name: close-phase
description: Close a Toasty phase — whole-phase review by a fresh reviewer, fixes for blocking and important findings, CLOSE.md with the manual smoke list, docs brought up to date, next phase opened, pull request opened. The owner tests and merges. Run as /close-phase.
disable-model-invocation: true
---

# /close-phase

You prepare the phase for the owner to test and merge. You never merge.

1. **Preconditions.** On the phase branch, clean tree, every task `[x]` (or `[~]` with
   the owner's agreement to close without it), full `npm run check` passing on HEAD. If
   not, stop and say what's missing.
2. **Whole-phase review.** A fresh `reviewer` on `$(git merge-base main HEAD)..HEAD`
   with the brief and plan. For research phases, the review checks that every
   acceptance criterion is met with cited evidence and that recommendations follow from
   the findings.
3. **Fix** blocking and important findings through the `implementer` (or `researcher`
   for research docs), one finding or related group at a time, each re-checked by a
   fresh `reviewer`. Follow-ups are listed, not fixed.
4. **Write `docs/phases/<phase>/CLOSE.md`** from `docs/templates/PHASE_CLOSE.md`: outcome,
   acceptance-criteria table with evidence, review findings and what happened to each,
   checks run, the manual smoke list (≤10 steps, one per provider touched), deviations,
   deferred work.
5. **Bring the docs up to date** — what must be true once this merges:
   - `CLAUDE.md`: commands, code map and conventions match the code now;
   - `docs/ROADMAP.md`: this phase `done` (on merge), the next phase's status;
   - decision records the phase proposed: mark them `Proposed — accept on merge`;
   - hand-offs into later briefs the phase was asked to write (e.g. Phase 0 fills
     Phase 1's "Decisions from Phase 0");
   - **stale docs:** any doc, research note or spike the phase made obsolete is updated
     or deleted. Delete `spikes/` directories unless the next brief adopts them.
   - Open the next phase: point `docs/CURRENT_PHASE.md` at the next phase in roadmap
     order with a brief ready for planning, as "Active — ready for planning". If none is
     ready, say "Waiting for the next brief" and name which one.
6. **Commit, push, pull request.** Run the full check, commit (`Close <phase>: …`), push,
   and open a pull request into `main` if `gh` is available (`gh pr create --base main
   --fill`, body = the outcome and smoke list). Otherwise tell the owner the branch is
   ready.
7. **Hand over:** what the phase delivered, the smoke list to run, open follow-ups, what
   the owner must decide (decision records to accept), and that merging is theirs.
