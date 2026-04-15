# AI Orchestrator Workspace

## What Happens Here

Zero-dependency routing and state system that decides which agent/skill handles a task, and whether it can run autonomously.

## Key Files

- `src/core/router.ts` — Prompt → agent/skill routing
- `src/core/autonomy.ts` — Risk classification + approval rules
- `src/core/state.ts` — Global store
- `src/skills/*.ts` — Specialized skills (code, debug, deploy, multica, camofox, ecc, socraticode)
- `src/vendor/*/install.sh` — Auto-install scripts for external tools

## Rules

- Keep core dependencies at zero
- Skills self-register via `registerSkill()`
- Vendor tools auto-install on first trigger; no manual setup
- Autonomy default is `guarded`: safe/low/medium run auto, high/critical ask first

## Current Priorities

1. Add evaluation hooks so routed tasks feed back into routing confidence
2. Integrate SocratiCode for large-scale codebase search across the monorepo
3. Build a CLI wrapper for direct terminal usage
