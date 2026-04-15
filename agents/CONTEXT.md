# Agents Workspace

## What Happens Here

Python-based autonomous agents that monitor health, debug themselves, and execute latency arbitrage on sports prediction markets.

## Key Files

- `self_regulating_engine.py` — Health monitoring + auto-remediation
- `self_debugging_engine.py` — Error catching, categorization, retry logic
- `prediction_arbitrage.py` — 0xWast3-style latency arbitrage
- `autonomous_trading_agent.py` — Main trading agent orchestrator
- `configs/*.json` — Agent configuration files

## Rules

- Keep the self-regulating loop under **50ms per tick**
- Use `asyncio` for all network calls; never blocking HTTP libraries in hot paths
- Log health metrics as structured JSON
- All thresholds and strategies must be config-driven (JSON), not hardcoded
- When fixing an agent bug, add the pattern to `../AGENT_LEARNINGS.md`

## Current Priorities

1. Build feedback loops so agents improve from their own execution data (Layer 3)
2. Harden the arbitrage engine against API outages and rate limits
3. Add evaluation metrics for every trade decision
