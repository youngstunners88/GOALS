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
| Design game mechanics | `/design/gdd/` | SKILLS.md → `ccgs-skill` |

## Skill System

All external capabilities are registered in `SKILLS.md`. Key skills for this project:

- `code-skill` — Read/write code (guarded)
- `ccgs-skill` — Game design via Claude Code Game Studios (guarded)
- `deploy-skill` — CI/CD and releases (manual approval)
- `multica-skill` — Multi-agent delegation (guarded)
- `socraticode-skill` — Codebase intelligence (guarded)

When a task matches a skill trigger, use the skill. Do not reinvent it.

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

## FIFA World Cup 2026 — Layer 3 Mechanics

The Layer 3 launch window is the 2026 World Cup (June–July, USA/Canada/Mexico). We are building three game mechanics that double as DeFi primitives:

| Mechanic | DeFi Primitives | Design Doc |
|----------|-----------------|------------|
| **Penalty Shootout** | Staking, liquidation, leverage, buy-and-burn | `design/gdd/PENALTY-SHOOTOUT.md` |
| **Corner Kicks** | Liquidity pools, AMM clustering, burning, progressive jackpot | `design/gdd/CORNER-KICKS.md` |
| **Free Kicks** | Lending/borrowing, oracle arbitrage, collateral liquidation | `design/gdd/FREE-KICKS.md` |

When designing or implementing any of these, read the GDD first, then use `ccgs-skill` for mechanic iteration.

## Autonomy Guardrails

### Safe (Auto-Execute)
- Reading files, analyzing code, drafting docs
- Running tests in dev / local
- Updating non-production configs
- Querying prediction markets (read-only)

### Guarded (Summarize + Ask for Approval)
- Writing code that changes core logic
- Modifying smart contracts
- Updating agent hot paths
- Spending real testnet/mainnet funds

### Manual (Always Ask)
- Deploying to production
- Pushing to `main` on GOALS repo
- Executing real trades or arbitrage
- Liquidating user positions

### CCGS Override
CCGS is collaborative by default (asks before writing). For $GOALS, override this behavior:
- CCGS can **auto-draft** GDDs, mechanics, and concepts
- CCGS must **ask** before modifying existing code or contracts
- CCGS should **summarize** proposed changes in 1-2 sentences before waiting for approval

## Global Rules

- Run `npm run typecheck` and `npm run arch:check` before finishing frontend work
- Agent hot paths must stay under 50ms per tick; no blocking I/O
- Every agent config lives in JSON, not hardcoded in Python
- Contract changes require ABI updates in `frontend/src/infrastructure/blockchain/`
- Update `AGENT_LEARNINGS.md` when you fix agent mistakes
- Update `SKILLS.md` when you add or change a skill
