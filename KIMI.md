# $GOALS Protocol — Kimi Directive

> Keep it simple. Keep it moving.

## What This Is

A sports-NFT platform with **self-regulating AI agents**, **real-time data arbitrage**, and **dynamic on-chain player cards**.

- **Frontend**: React + Vite, Clean Architecture (ports/adapters, DDD, effect system)
- **Agents**: Python (self-regulate, self-debug, predict arbitrage)
- **Contracts**: Solidity (`GoalsProtocolNFT.sol`) on Base

## Quick Commands

```bash
cd goals-protocol/frontend
npm run typecheck   # TS check
npm run arch:check  # Enforce layer boundaries
npm run build

cd goals-protocol
source venv/bin/activate
python agents/self_regulating_engine.py
```

## Architecture Rules

1. **Never cross layer boundaries** in `frontend/src/`
   - `presentation/` → `application/` → `domain/` ← `infrastructure/`
   - Domain knows nothing about React, ethers, or localStorage
2. **Use the effect system** for async (cancellation, retries, structured concurrency)
3. **Use Zustand** for state, but only in `presentation/`
4. **Prefer interfaces/ports** over concrete imports

## When Modifying Code

- Run `npm run arch:check` before claiming done
- If you touch `domain/`, add or update tests
- If you change agents, update `AGENT_LEARNINGS.md` with the mistake/pattern
- If you touch contracts, document the function signature changes

## Common Gotchas

- `arch:check` will reject imports from `infrastructure/` into `domain/`
- Agent configs live in JSON files; don't hardcode thresholds in Python
- The arbitrage engine expects <500ms latency; don't add blocking I/O in the hot path
- Base Sepolia is the current testnet; mainnet is the only prod target

## Autonomy

- **Safe to run without asking**: `typecheck`, `build`, lint fixes, tests, doc updates
- **Ask first**: contract deployments, mainnet transactions, agent restarts in prod, env changes
