# Phase 3 brief — UI rebuild from Claude Design

Status: **Briefed. Design track: can start now. Build phase: after Phase 1.**

## Outcome

Toasty looks and feels like itself: a coherent retrowave / 1980s-inspired player
designed by the owner in Claude Design, captured as a design system the code follows,
applied to every screen.

## Design track (owner, in Claude Design — parallel to Phases 0–2)

The redesign happens in claude.ai with Claude Design, not in the repo. Nothing in the
code has to wait for it, and the foundation rebuild doesn't depend on the look.

1. **Direction — now.** In the Toasty project chat, start a Design artifact. Bring
   screenshots of the current app and references (Winamp skins, retrowave, 80s hardware
   and packaging, whatever speaks to you). Explore 2–3 directions — retrowave vs 80s is
   decided here — on one or two key screens (now playing + library).
2. **Screen map — when Phase 1's plan is approved.** The architect writes the design
   brief: the screen inventory (library, album, artist, playlist, search, queue, now
   playing / visualizer, sources & settings, mini player, first run), the states of each
   (empty, loading, error, signed out, offline), and the player-specific needs (always-
   visible transport, source badges, keyboard control, window sizes from mini player to
   fullscreen).
3. **Design the screens** in the Design artifact from that brief.
4. **Capture the system.** Turn the result into a Design System artifact: tokens (colour,
   type, spacing, radius, motion), components with states, iconography, and guidelines.
   This is what code consumes.

The build phase can start once step 4 covers the core screens; later phases design their
new screens against the same system.

## Build phase — required scope

- Import the design system into the repo: `DESIGN.md` (authoritative for everything
  visual) and a tokens file the styles use. Fonts and assets included.
- Choose the styling approach for the rebuilt UI (the plan proposes it; the prototype
  mixes hand-written CSS and Tailwind) and apply it consistently.
- Rebuild every existing screen and component to the design system.
- Add a `design-checker` agent that holds changed screens to `DESIGN.md`, and wire it
  into `/run-phase` for visible tasks.
- Remove every prototype style and asset that isn't used.

## Acceptance criteria

To be finalised with the design brief. At minimum:

- **AC1** `DESIGN.md` and the tokens exist and are the only source of visual values.
- **AC2** Every screen and state in the design brief that exists in the app matches the
  design (design-checker pass + owner review).
- **AC3** No prototype CSS, colours or fonts remain.

## Out of scope

New features. A screen the app doesn't have yet is designed but built in its own phase.
