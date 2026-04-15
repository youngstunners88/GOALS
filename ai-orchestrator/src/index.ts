/**
 * AI Orchestrator
 *
 * A lightweight, autonomous orchestration layer for AI coding assistants.
 *
 * Combines ideas from:
 * - claw-code          (reverse-engineered Claude Code patterns)
 * - oh-my-claudecode   (multi-agent orchestration)
 * - superpowers        (plugin/skill system)
 * - get-shit-done      (spec-driven development)
 * - claude-code-system-prompts (prompt architecture research)
 * - claude-md          (production-grade agent directives)
 */

export * from './core/state.js';
export * from './core/registry.js';
export * from './core/router.js';
export * from './core/autonomy.js';

export * from './agents/claw-agent.js';
export * from './agents/omni-agent.js';
export * from './agents/spec-agent.js';
export * from './agents/prompt-agent.js';

export * from './skills/code-skill.js';
export * from './skills/web-dev-skill.js';
export * from './skills/debug-skill.js';
export * from './skills/deploy-skill.js';
export * from './skills/multica-skill.js';
export * from './skills/camofox-skill.js';
export * from './skills/ecc-skill.js';
export * from './skills/socraticode-skill.js';

import { initClawAgent } from './agents/claw-agent.js';
import { initOmniAgent } from './agents/omni-agent.js';
import { initSpecAgent } from './agents/spec-agent.js';
import { initPromptAgent } from './agents/prompt-agent.js';
import { initCodeSkill } from './skills/code-skill.js';
import { initWebDevSkill } from './skills/web-dev-skill.js';
import { initDebugSkill } from './skills/debug-skill.js';
import { initDeploySkill } from './skills/deploy-skill.js';
import { initMulticaSkill } from './skills/multica-skill.js';
import { initCamofoxSkill } from './skills/camofox-skill.js';
import { initEccSkill } from './skills/ecc-skill.js';
import { initSocratiCodeSkill } from './skills/socraticode-skill.js';
import { log } from './core/state.js';

export function initOrchestrator() {
  initClawAgent();
  initOmniAgent();
  initSpecAgent();
  initPromptAgent();
  initCodeSkill();
  initWebDevSkill();
  initDebugSkill();
  initDeploySkill();
  initMulticaSkill();
  initCamofoxSkill();
  initEccSkill();
  initSocratiCodeSkill();
  log('Orchestrator initialized with vendor skills');
}
