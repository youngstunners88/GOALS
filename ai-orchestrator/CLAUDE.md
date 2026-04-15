# AI Orchestrator — Agent Directive

> A lightweight, autonomous orchestration layer for AI coding assistants.

## 1. Purpose

This system exists so that **you** (the AI assistant) can work on codebases with:
- **Clear routing**: every task goes to the right agent/skill.
- **Clean state**: a single source of truth for what is happening.
- **Safe autonomy**: you know when to ask and when to act.

## 2. Architecture

```
ai-orchestrator/
├── src/core/
│   ├── state.ts       # Global store (Zustand-like, zero deps)
│   ├── router.ts      # Prompt → Agent/Skill routing
│   ├── autonomy.ts    # Risk classification & approval rules
│   └── registry.ts    # Agent & skill catalog
├── src/agents/
│   ├── claw-agent.ts  # Code analysis, generation, debugging
│   ├── omni-agent.ts  # Multi-agent task decomposition
│   ├── spec-agent.ts  # Spec-driven development
│   └── prompt-agent.ts# Prompt/CLAUDE.md optimization
└── src/skills/
    ├── code-skill.ts
    ├── web-dev-skill.ts
    ├── debug-skill.ts
    └── deploy-skill.ts
```

## 3. How to Use This System

When you receive a task:

1. **Route it** — Call `routeTask(prompt)` to decide which agent should handle it.
2. **Plan actions** — Call `planActions(agentId, prompt)` to infer what files/commands will be touched.
3. **Check autonomy** — For each planned action, `canExecuteWithoutApproval(action)` tells you if you can proceed without asking.
4. **Execute or queue** — Run safe actions immediately. Queue risky ones for approval.
5. **Log everything** — Use `log(message)` so the state history is complete.

## 4. Autonomy Rules

| Risk Level | Examples | Autonomy (`guarded`) |
|------------|----------|----------------------|
| **safe** | Read README, docs, tests | ✅ Execute |
| **low** | Read source files | ✅ Execute |
| **medium** | Write source files, install deps | ✅ Execute |
| **high** | Write configs, network writes | ❌ Ask first |
| **critical** | Secrets, git mutations, destructive shell | ❌ Ask first |

**Never** run these without explicit user approval:
- `git push`, `git reset`, `git rebase`, `git clean`
- `rm -rf` outside of obvious build artifacts
- Writing to `.env`, `credentials`, `*.pem`, `*.key`
- Any network POST/PUT/DELETE that affects production

## 5. Agent Responsibilities

### Claw Agent
- Default handler for all code tasks.
- Capabilities: analysis, generation, refactoring, testing, debugging, web dev, deployment.

### Omni Agent
- Use when the task spans multiple domains (e.g. "Build a full-stack feature").
- Decomposes into sub-tasks and delegates.

### Spec Agent
- Use when requirements are vague or large.
- Produces a frozen spec before code is written to prevent context rot.

### Prompt Agent
- Use when the task involves system prompts, CLAUDE.md, or agent directives.

## 6. State Management

- **One store** (`orchestratorStore`) holds all runtime state.
- Subscribe to it for reactive UIs, or call `getState()` / `snapshot()` for reads.
- Keep the store under 500 log entries to prevent memory bloat.

## 7. Adding New Agents or Skills

```typescript
import { registerAgent, registerSkill } from './core/registry.js';

registerAgent({
  id: 'my-agent',
  name: 'My Agent',
  description: '...',
  capabilities: ['capability_1'],
  weight: 1.0,
});

registerSkill({
  id: 'my-skill',
  name: 'My Skill',
  description: '...',
  triggerPatterns: [/regex/],
  handler: (task, context) => 'result',
});
```

## 8. Integration Checklist

When wiring this into a new project:
- [ ] `initOrchestrator()` called at startup.
- [ ] `routeTask()` used before major work.
- [ ] `planActions()` used to surface file changes.
- [ ] `canExecuteWithoutApproval()` respected.
- [ ] `log()` called for every significant step.

## 9. Design Principles

1. **Minimal dependencies** — The core has zero npm deps.
2. **Explicit routing** — No hidden agent switching.
3. **Safety by default** — `guarded` autonomy is the default.
4. **Observable state** — Everything is in the store.
5. **Composable skills** — Agents and skills are registry-driven.
