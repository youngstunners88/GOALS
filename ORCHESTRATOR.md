# AI Orchestrator Integration

## What It Does

The workspace root contains `ai-orchestrator/` — a lightweight, zero-dependency routing and state system that decides which agent/skill should handle a task, and whether it can run autonomously.

## Relevant Skills for $GOALS

| Skill | Use It When |
|-------|-------------|
| **camofox-skill** | Scraping stadium data from sites that block bots |
| **socraticode-skill** | Searching the 2,000+ file codebase for dependencies or references |
| **ecc-skill** | Optimizing agent harnesses, memory, or security patterns |
| **multica-skill** | Delegating across multiple agents (trading + monitoring + UI) |
| **deploy-skill** | Releasing contracts or frontend to Render/Base |
| **debug-skill** | Diagnosing agent crashes or contract revert reasons |

## How to Invoke

```typescript
import { initOrchestrator, routeTask, executeRoute } from '../../ai-orchestrator/src/index.js';

initOrchestrator();

const result = await executeRoute(
  'Scrape xG data from a Cloudflare-protected stadium API',
  { project: 'goals-protocol' }
);
```

## Adding Vendor Tools

Each skill has an install script in `ai-orchestrator/src/vendor/<tool>/install.sh`. The first time a skill is triggered, it clones the repo automatically. No manual setup required.

## Extending

To add a new skill:
1. Create `ai-orchestrator/src/skills/my-skill.ts`
2. Register it with `registerSkill({ id, triggerPatterns, handler })`
3. Import and call `initMySkill()` in `ai-orchestrator/src/index.ts`
