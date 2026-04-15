# $GOALS Protocol

> Self-regulating sports NFT platform with autonomous AI agents.

## What This Is

A sports-NFT protocol where dynamic player cards update in real-time and autonomous agents trade prediction markets on behalf of holders.

## Workspaces

- `/agents` — Self-regulating engine, arbitrage bots, debugging systems
- `/contracts` — Solidity smart contracts (Base L2)
- `/frontend` — React app with Clean Architecture
- `/data-pipeline` — Real-time stadium data ingestion
- `/infrastructure` — VM fleet, deployment scripts
- `/ai-orchestrator` — Multi-agent routing and skill system

## Routing

| Task | Go to | Read |
|------|-------|------|
| Fix or build agent logic | `/agents` | CONTEXT.md |
| Deploy or modify contracts | `/contracts` | CONTEXT.md |
| UI, pages, components | `/frontend` | CONTEXT.md |
| Add stadium data source | `/data-pipeline` | CONTEXT.md |
| Provision or deploy VMs | `/infrastructure` | CONTEXT.md |
| Route tasks across tools | `/ai-orchestrator` | CLAUDE.md |

## Naming Conventions

- Agent configs: `agents/configs/*.json`
- Decision records: `docs/decisions/YYYY-MM-DD-title.md`
- Contract scripts: `contracts/scripts/*.js`
- Frontend components: `PascalCase.tsx`
- Domain entities: `PascalCase.ts` in `frontend/src/domain/`

## Layer Rules (Clief Framework)

1. **Layer 1 (Book)** — Dynamic NFT metadata updates. Commoditized. Keep simple, don't over-invest.
2. **Layer 2 (Movie)** — Agent workflows, arbitrage flows, data pipelines. Business-specific. Protect and refine.
3. **Layer 3 (Game)** — Systems that learn from their own execution data. This is where value lives. Build feedback loops here.

## Global Rules

- Run `npm run typecheck` and `npm run arch:check` before finishing frontend work
- Agent hot paths must stay under 50ms per tick; no blocking I/O
- Every agent config lives in JSON, not hardcoded in Python
- Contract changes require ABI updates in `frontend/src/infrastructure/blockchain/`
- Update `AGENT_LEARNINGS.md` when you fix agent mistakes
