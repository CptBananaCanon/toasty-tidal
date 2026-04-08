# Project Rules

## Tech Stack
- Tauri v2
- React + TypeScript
- No backend unless explicitly added

## Architecture Rules
- Features live in /src/features/*
- No business logic in components
- Use adapters in /src/lib for external APIs

## TIDAL Rules
- NEVER expose client secret
- Use official Web SDK patterns only
- Do NOT invent endpoints
- Start with mock data if unsure

## Milestone 1 Scope
- Search UI
- Result list
- Track selection
- Player controls (mocked)
- No real playback yet if auth unclear

## Behavior Rules
- Small commits
- Explain changes after each step
- Prefer simple solutions over clever ones
- Stop after milestone is complete

## Forbidden
- No secrets in code
- No overengineering
- No backend unless requested
