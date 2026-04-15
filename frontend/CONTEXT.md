# Frontend Workspace

## What Happens Here

React + Vite app using Clean Architecture. Users mint NFTs, view player cards, and manage their portfolio.

## Architecture

```
src/
├── presentation/  → React components, pages, hooks
├── application/   → Use cases, DTOs, services
domain/            → Entities, value objects, events
infrastructure/    → Web3, HTTP, storage adapters
core/              → Effects, routing, state primitives
```

## Rules

- **Forbidden imports:**
  - `domain/` → `infrastructure/`
  - `application/` → `presentation/`
  - `infrastructure/` → `presentation/`
- Use the **effect system** for async operations
- Use **Zustand** only in `presentation/`
- Prefer **ports/interfaces** over concrete implementations

## Commands

```bash
npm run typecheck   # TypeScript validation
npm run arch:check  # Enforce layer boundaries
npm run build
```

## Current Priorities

1. Make the UI feel like a game (interactive, responsive, user-specific)
2. Add real-time stat updates via WebSocket
3. Keep bundle size small for mobile users
