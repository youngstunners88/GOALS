# $GOALS Skill System

> Every skill is a lever. Pull the right one.

## How to Use This

This file is the **skill registry** for the $GOALS protocol. When you need to delegate a task, route through the AI Orchestrator (`ai-orchestrator/`) or reference the skill directly here.

Each skill has:
- **Trigger**: What keywords activate it
- **Vendor**: External tool it wraps (auto-installs on first use)
- **Use it when**: Decision guidance
- **Autonomy**: Whether it can run without asking

---

## Core Skills (Built-In)

### `code-skill`
- **Trigger**: `.tsx`, `.ts`, `.py`, `fix`, `refactor`, `implement`
- **Use it when**: Reading, writing, or analyzing source code
- **Autonomy**: `guarded` — safe reads auto, writes need approval if high-risk

### `web-dev-skill`
- **Trigger**: `tailwind`, `css`, `ui`, `component`, `page`, `dashboard`
- **Use it when**: Frontend work, styling, layout, React components
- **Autonomy**: `guarded`

### `debug-skill`
- **Trigger**: `error`, `crash`, `not working`, `logs`, `diagnose`
- **Use it when**: Root-cause analysis, tracing failures
- **Autonomy**: `guarded`

### `deploy-skill`
- **Trigger**: `deploy`, `docker`, `ci/cd`, `pipeline`, `release`
- **Use it when**: Infrastructure, CI, deployment tasks
- **Autonomy**: `manual` — always ask before deploying

---

## Vendor Skills (External Tools)

### `multica-skill`
- **Vendor**: [multica-ai/multica](https://github.com/multica-ai/multica)
- **Trigger**: `multica`, `delegate`, `assign task`, `track progress`, `compound skills`
- **Use it when**: Breaking tasks into sub-tasks and delegating to agent teammates
- **Autonomy**: `guarded`

### `camofox-skill`
- **Vendor**: [jo-inc/camofox-browser](https://github.com/jo-inc/camofox-browser)
- **Trigger**: `camofox`, `stealth browser`, `scraping`, `cloudflare bypass`, `bot detection`
- **Use it when**: Visiting sites that block normal automation
- **Autonomy**: `guarded`

### `ecc-skill`
- **Vendor**: [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code)
- **Trigger**: `ecc`, `agent harness`, `performance optimization`, `security hardening`
- **Use it when**: Optimizing agent execution, memory, or security patterns
- **Autonomy**: `guarded`

### `socraticode-skill`
- **Vendor**: [giancarloerra/SocratiCode](https://github.com/giancarloerra/SocratiCode)
- **Trigger**: `socraticode`, `semantic search`, `dependency graph`, `find all references`
- **Use it when**: Searching large codebases, finding cross-project dependencies
- **Autonomy**: `guarded`

### `ccgs-skill`
- **Vendor**: [Donchitos/Claude-Code-Game-Studios](https://github.com/Donchitos/Claude-Code-Game-Studios)
- **Trigger**: `ccgs`, `game design`, `gdd`, `game concept`, `mechanic design`, `prototype game`
- **Use it when**: Designing game mechanics, writing GDDs, prototyping gameplay
- **Autonomy**: `guarded` — CCGS is collaborative by design, so it always asks before writing

---

## Skill Routing Cheat Sheet

| What you need | Skill | One-liner prompt |
|---------------|-------|------------------|
| Fix a React bug | `code-skill` | "Fix the mint button in MintPlayerForm.tsx" |
| Build a new UI page | `web-dev-skill` | "Create a World Cup leaderboard page" |
| Design a penalty shootout mechanic | `ccgs-skill` | "Design a penalty shootout mini-game with staking" |
| Scrape blocked stadium data | `camofox-skill` | "Scrape xG data from a Cloudflare-protected API" |
| Find where `PlayerStats` is used | `socraticode-skill` | "Find all references to PlayerStats across the repo" |
| Optimize agent memory usage | `ecc-skill` | "Optimize the arbitrage agent harness" |
| Delegate to multiple agents | `multica-skill` | "Break this into sub-tasks for 3 agents" |
| Deploy to Render | `deploy-skill` | "Deploy the frontend to production" |

---

## Adding New Skills

1. Create `ai-orchestrator/src/skills/my-skill.ts`
2. Register with `registerSkill({ id, name, triggerPatterns, handler })`
3. Wire into `ai-orchestrator/src/index.ts`
4. Add a row to the cheat sheet above
5. Run `cd ai-orchestrator && npx tsc && node dist/tests/smoke.test.js`
