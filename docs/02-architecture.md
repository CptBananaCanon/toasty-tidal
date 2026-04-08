# Architecture

## Principle
Keep the app mostly web-tech on the inside, with Tauri only handling desktop packaging, secure local capabilities, and optional native helpers.

## Layers
### 1. UI layer
React + TypeScript
- routes
- views
- components
- keyboard shortcuts
- desktop window UX

### 2. App state layer
- TanStack Query for remote data
- lightweight UI store for player shell state
- local persisted preferences

### 3. TIDAL integration layer
- auth client
- api client
- player adapter
- scope-aware feature flags

### 4. Native / Tauri layer
Rust side only for:
- secure config loading
- optional deep link handling for OAuth callback
- optional file logging
- packaging / updater later

## Suggested folder structure
```text
src/
  app/
  components/
  features/
    auth/
    search/
    player/
    library/
  lib/
    tidal/
      auth.ts
      api.ts
      player.ts
      scopes.ts
    env.ts
    queryClient.ts
  routes/
  styles/
  types/

src-tauri/
  src/
    main.rs
    commands/
```

## Boundaries
- Do not put business logic into UI components
- Wrap TIDAL SDK usage behind adapters
- Keep a narrow seam between frontend and Rust
- Assume TIDAL auth and playback contracts may evolve

## Security notes
- Never expose client secret in browser code
- Prefer PKCE flow
- Store refresh tokens carefully
- Log minimally
- Treat all TIDAL policy-sensitive features as feature-flagged
