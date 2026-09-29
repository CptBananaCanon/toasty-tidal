# Workflow

How Toasty gets built: bounded phases, a small team of Claude agents, the owner deciding
at the gates. A lighter version of the Mr Data workflow — a hobby project, so fewer
gates, fewer agents and minimal testing, but the same core idea:

> Give the implementer the whole map and one marching order.

## Roles

| Who | Where | Job | Never |
|---|---|---|---|
| Owner (Jonas) | — | Direction, approves plans, answers open questions, tests, merges | — |
| Architect | Claude in the Toasty project chat on claude.ai | Discusses direction with the owner; writes briefs, roadmap, vision and decisions | Edits application code |
| Planner | `.claude/agents/planner.md` | Writes the phase `PLAN.md` and its task checklist | Edits application code |
| Researcher | `.claude/agents/researcher.md` | Investigates docs, open-source code and APIs; writes `docs/research/`; runs time-boxed spikes | Changes the app outside `spikes/` |
| Implementer | `.claude/agents/implementer.md` | Does one task, runs the quick check, commits | Weakens a test, pushes `main` |
| Reviewer | `.claude/agents/reviewer.md` | Critiques plans; reviews sensitive tasks and the whole phase, cold | Edits code |

Every agent starts with a fresh context, so no agent grades its own work. A
design-checker joins in Phase 3, once `DESIGN.md` exists.

## Gates and commands

Run the commands in Claude Code at the repository root.

| Step | Command | What happens | Ends with |
|---|---|---|---|
| Brief | — (project chat) | Architect and owner agree the outcome and acceptance criteria in `docs/phases/<nn>-<slug>/BRIEF.md` | Brief committed |
| Plan | `/plan-phase` | Phase branch; planner writes `PLAN.md`; reviewer critiques it once; one revision | Owner approves by editing the plan's Status line |
| Build | `/run-phase` | Task by task: researcher or implementer does it, reviewer checks sensitive tasks, tick, commit, push | Every task done or blocked; full check green |
| Close | `/close-phase` | Whole-phase review, fixes, `CLOSE.md` with manual smoke steps, docs updated, next phase opened, PR opened | Owner tests and merges |

Between steps the owner answers anything under **Open questions** in the plan and
re-runs `/run-phase`; it picks up at the first open task.

## Conventions

- **The plan's task checklist is the state.** `[ ]` open, `[x]` done, `[~]` blocked on an
  owner question (named `Qn`). Any fresh session reads it to know where things stand.
- **Sensitive tasks get a review.** A task tagged `· review` in the checklist is reviewed
  by a fresh reviewer before it is ticked. The planner tags every task that touches
  playback, the queue, auth/credentials, a provider's protocol, or data the owner could
  lose. Other tasks are covered by the whole-phase review at close.
- **Done means `npm run check` passes** on a clean, committed tree. `npm run check --
  --quick` is the fast subset used inside a task. Phase 1 grows the check (lint, unit
  tests, clippy); until then it is typecheck + `cargo check`.
- **Phase branches only.** Work happens on `phase/<nn>-<slug>` and is pushed there.
  `main` changes only when the owner merges.
- **Spikes** (throwaway proofs, usually in Phase 0) live in `spikes/<name>/`. They never
  become app code by accident: a later plan either adopts one explicitly or `/close-phase`
  deletes it. Findings go in `docs/research/`, not in the spike.
- **No stale docs.** A document that no longer describes reality is updated or deleted
  in the phase that made it stale. `/close-phase` checks this.

## Testing policy

Tests are written where a bug would be silent, expensive, or keep coming back:

- the queue engine (ordering, repeat, shuffle, cross-source transitions);
- provider response mappers, run against real responses saved as fixtures
  (`tests/fixtures/<provider>/`, tokens and personal data scrubbed) — so an API change
  shows up as a failing test, not a broken search;
- token expiry and refresh logic;
- parsers (tags, playlists, file formats).

No UI component tests, no end-to-end tests, no coverage targets. Everything else is
covered by the manual smoke list in each phase's `CLOSE.md` (10 steps or fewer),
which the owner runs before merging.

## The loop

`/run-phase` arms `.claude/state/phase-loop.json`. While it is armed, the Stop hook
(`.claude/hooks/phase-loop-stop.mjs`) won't let that session end while a task is open,
or while the checklist is finished but `npm run check` hasn't passed on the exact
committed tree. It gives up after `maxIterations` continuations (40), so a stuck run halts
instead of burning usage. Without an armed loop the hook does nothing.

## Guardrails

`.claude/settings.json` denies reading or editing `.env.local`, pushing to `main`,
force-pushing and merging pull requests. That protects against honest mistakes; the
owner merging is the real gate.

## Decisions and research

- `docs/decisions/NNNN-title.md` — decisions that constrain several phases or are costly
  to reverse (see `decisions/README.md`). Proposed by agents, accepted by the owner.
- `docs/research/` — what was found, with sources and dates. Research goes stale fast
  for provider APIs: every claim carries the date it was checked.
