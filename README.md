# TIDAL Tauri Client

Desktop TIDAL client built with Tauri + TypeScript + React + Vite.

## Goal
Start lean:
1. Authenticate with TIDAL
2. Search catalog
3. Select album / artist / track
4. Preview playback with official TIDAL Player module
5. Basic transport controls
6. Grow carefully into a richer desktop client

## Recommended stack
- Shell / native layer: Tauri v2
- Frontend: React + TypeScript + Vite
- State / server cache: TanStack Query
- Routing: React Router
- UI: Tailwind CSS + shadcn/ui
- Forms: react-hook-form + zod
- Persistence: Tauri Store plugin or localStorage for non-sensitive UI state
- Secrets: Do not hardcode TIDAL client secret in the frontend

## Why this stack
TIDAL's official web-facing tooling is in the JavaScript / TypeScript ecosystem, and Tauri's native side is Rust. That makes TypeScript + Rust the lowest-friction path.

## Phases
See:
- docs/01-capability-map.md
- docs/02-architecture.md
- docs/03-roadmap.md
- docs/04-setup-popos.md
- docs/05-compliance-guardrails.md
- docs/06-ai-swarm-brief.md
- docs/07-backlog.md
- docs/08-prompts.md
