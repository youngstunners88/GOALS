# Data Pipeline Workspace

## What Happens Here

Real-time ingestion of stadium data: player GPS, biometrics, goals, shots, xG.

## Key Files

- `realtime_engine.py` — Multi-source ingestion engine

## Rules

- Target latency: <500ms end-to-end
- Use async streaming for all data sources
- Normalize data format before sending to agents or contracts
- Handle source outages gracefully with fallback sources

## Current Priorities

1. Add redundancy (primary + 2 fallback sources per data type)
2. Build a unified event schema so agents consume one format
3. Add latency telemetry per source
