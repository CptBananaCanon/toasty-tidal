# Phase <nn> plan — <name>

Status: **Draft**

<!--
Status values, in order: Draft → Reviewed → Approved by owner — <date> (the owner edits
this line) → Implementing → Implemented → Closed.
/run-phase refuses to start unless this line says "Approved by owner".
-->

## Outcome

The brief's outcome, in one paragraph.

## Current state

What the relevant code does today (files, behaviour, problems), and any conflict with
the brief. Written against the code, not the docs.

## Approach

Structure, boundaries and data flow; the material choices and the alternatives
rejected. No routine detail.

## Task checklist

The loop's source of truth. One line per task, in build order, each one
implement-and-check cycle small, each leaving the check green. Name the acceptance
criteria it serves and its tests (if any — see the testing policy in
`docs/WORKFLOW.md`). Tag tasks that need a per-task review with `· review` (playback,
queue, auth/credentials, provider protocols, data the owner could lose). Research tasks
say `· researcher`.

- [ ] T01 — <task> · AC1 · tests: tests/… · review
- [ ] T02 — <task> · AC2 · researcher

Markers: `[ ]` open, `[x]` done, `[~]` blocked — blocked by Qn.

## Open questions

Only questions the owner must answer, numbered. Agents never guess a behaviour decision.

- Q1 — <question> · blocks: T0n · answer: _pending_

## Manual smoke list (draft)

The ≤10 steps the owner will run before merging.

## Risks

What could go wrong and how the plan limits it.

## Deferred

Nearby work that is explicitly not in this phase.

## Progress log

Appended by the loop, newest last: task id, commit, review verdict, anything the next
task needs to know.

## Plan review

Written by the reviewer during `/plan-phase`: findings (blocking / important /
follow-up) and a verdict. The planner's responses follow each finding.
