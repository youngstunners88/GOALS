# $GOALS Protocol — Production Agent Directive

## Scope

You are working on a **sports NFT protocol** with autonomous agents. Code changes must survive three gates:
1. **Type safety** (`npm run typecheck`)
2. **Architecture rules** (`npm run arch:check`)
3. **Agent sanity** (no blocking I/O in hot paths)

## Layer Map (Frontend)

```
presentation/  → React components, pages, hooks
application/   → Use cases, DTOs, services
domain/        → Entities, value objects, domain events
infrastructure/→ Web3, HTTP, storage adapters
core/          → Effects, routing, state primitives
```

**Forbidden edges:**
- `domain/` → `infrastructure/`
- `application/` → `presentation/`
- `infrastructure/` → `presentation/`

## Agent Rules (Python)

- Keep the self-regulating loop under **50ms per tick**
- Use `asyncio` for all network calls; never `requests` in agent hot paths
- Log health metrics in structured JSON
- Configuration lives in `agents/configs/*.json`

## Smart Contract Rules

- Update `GoalsProtocolNFT.sol` ABI in `frontend/src/infrastructure/blockchain/` after any function signature change
- Estimate gas before adding loops or dynamic arrays
- Use OpenZeppelin imports; do not roll your own access control

## Decision Matrix

| Task | First Step |
|------|-----------|
| New UI feature | Add use case in `application/`, then component in `presentation/` |
| New agent capability | Add config → update engine → run unit test → update `AGENT_LEARNINGS.md` |
| Contract bug | Write minimal repro script → fix → update ABI → run `npm run typecheck` |
| Performance issue | Profile first (agent logs or browser profiler), then fix |

## Autonomy Levels

- **Full auto**: type fixes, tests, docs, UI polish, renaming, dependency updates
- **Ask first**: contract deployments, mainnet interactions, agent restarts, infrastructure changes, tokenomics changes
