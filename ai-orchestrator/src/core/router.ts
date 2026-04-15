/**
 * Task Router
 *
 * Analyzes a prompt and routes it to the best agent or skill.
 * Falls back to a general coordinator if no specific match is found.
 *
 * Inspired by:
 * - oh-my-claudecode (agent routing)
 * - claw-code (pattern matching)
 * - get-shit-done (spec-driven decomposition)
 */

import { type Task, type TaskResult, type PlannedAction, orchestratorStore, log } from './state.js';
import { findSkillsForPrompt, listAgents } from './registry.js';
import { canExecuteWithoutApproval, classifyRisk, queueForApproval } from './autonomy.js';

export interface RouteDecision {
  agentId: string;
  skillId?: string;
  confidence: number;
  reasoning: string;
}

const CODE_PATTERNS = /\b(fix|bug|refactor|build|implement|create|add|test|eslint|typescript|react|component|hook|api|route|model|migration)\b/;
const SPEC_PATTERNS = /\b(spec|plan|architecture|design|roadmap|milestone|decompose|break down|requirements)\b/;
const PROMPT_PATTERNS = /\b(prompt|system message|directive|override|behavior|persona|instruction)\b/;
const ORCHESTRATION_PATTERNS = /\b(orchestrate|coordinate|multi-agent|swarm|delegate|agent|workflow)\b/;
const WEB_PATTERNS = /\b(frontend|css|tailwind|html|ui|ux|page|layout|dashboard|landing)\b/;
const DEBUG_PATTERNS = /\b(error|fail|crash|broken|won't|doesn't|not working|logs|trace|diagnose)\b/;
const DEPLOY_PATTERNS = /\b(deploy|vercel|netlify|railway|docker|build|ci|cd|pipeline|release)\b/;
const BROWSER_PATTERNS = /\b(scrape|blocked|cloudflare|stealth|headless|bot detection|visit site|browser automation)\b/;
const CODE_INTEL_PATTERNS = /\b(semantic search|codebase intelligence|dependency graph|find all references|where is .* used|index codebase)\b/;
const AGENT_MGMT_PATTERNS = /\b(assign task|delegate to agent|agent teammate|track progress|compound skills|managed agents|multica)\b/;
const HARNESS_PATTERNS = /\b(performance optimization|agent harness|skills|instincts|security hardening|everything-claude-code|ecc)\b/;
const CCGS_PATTERNS = /\bccgs\b|\bgame design\b|\bgdd\b|\bgame concept\b|\bmechanic design\b|\bprototype game\b|\bpenalty shootout\b|\bcorner kick\b|\bfree kick\b|\bfifa world cup\b|\bworld cup 2026\b/;

function decideRoute(prompt: string): RouteDecision {
  const lower = prompt.toLowerCase();
  const skills = findSkillsForPrompt(lower);

  if (skills.length > 0) {
    return {
      agentId: 'claw-agent',
      skillId: skills[0].id,
      confidence: 0.85,
      reasoning: `Matched skill ${skills[0].name}`,
    };
  }

  if (ORCHESTRATION_PATTERNS.test(lower)) {
    return {
      agentId: 'omni-agent',
      confidence: 0.9,
      reasoning: 'Multi-agent orchestration requested',
    };
  }

  if (SPEC_PATTERNS.test(lower)) {
    return {
      agentId: 'spec-agent',
      confidence: 0.88,
      reasoning: 'Spec/planning task detected',
    };
  }

  if (PROMPT_PATTERNS.test(lower)) {
    return {
      agentId: 'prompt-agent',
      confidence: 0.85,
      reasoning: 'Prompt engineering task detected',
    };
  }

  if (AGENT_MGMT_PATTERNS.test(lower)) {
    return {
      agentId: 'omni-agent',
      skillId: 'multica-skill',
      confidence: 0.9,
      reasoning: 'Multi-agent task delegation requested',
    };
  }

  if (BROWSER_PATTERNS.test(lower)) {
    return {
      agentId: 'claw-agent',
      skillId: 'camofox-skill',
      confidence: 0.88,
      reasoning: 'Stealth browser automation requested',
    };
  }

  if (HARNESS_PATTERNS.test(lower)) {
    return {
      agentId: 'claw-agent',
      skillId: 'ecc-skill',
      confidence: 0.85,
      reasoning: 'Agent harness/optimization requested',
    };
  }

  if (CCGS_PATTERNS.test(lower)) {
    return {
      agentId: 'claw-agent',
      skillId: 'ccgs-skill',
      confidence: 0.88,
      reasoning: 'Game design / CCGS task detected',
    };
  }

  if (CODE_INTEL_PATTERNS.test(lower)) {
    return {
      agentId: 'claw-agent',
      skillId: 'socraticode-skill',
      confidence: 0.9,
      reasoning: 'Codebase intelligence/semantic search requested',
    };
  }

  if (DEPLOY_PATTERNS.test(lower)) {
    return {
      agentId: 'claw-agent',
      confidence: 0.8,
      reasoning: 'Deployment/infrastructure task detected',
    };
  }

  if (DEBUG_PATTERNS.test(lower)) {
    return {
      agentId: 'claw-agent',
      confidence: 0.82,
      reasoning: 'Debugging/diagnosis task detected',
    };
  }

  if (WEB_PATTERNS.test(lower)) {
    return {
      agentId: 'claw-agent',
      confidence: 0.8,
      reasoning: 'Web development task detected',
    };
  }

  if (CODE_PATTERNS.test(lower)) {
    return {
      agentId: 'claw-agent',
      confidence: 0.85,
      reasoning: 'Code modification task detected',
    };
  }

  // Default fallback
  return {
    agentId: 'claw-agent',
    confidence: 0.6,
    reasoning: 'General task — routing to default code agent',
  };
}

export function routeTask(prompt: string, context?: Record<string, unknown>): RouteDecision {
  const decision = decideRoute(prompt);
  log(`Routed task to ${decision.agentId} (confidence: ${decision.confidence}) — ${decision.reasoning}`);
  return decision;
}

export function planActions(agentId: string, prompt: string): PlannedAction[] {
  /**
   * A lightweight action planner that infers what the agent will likely do.
   * In a real implementation this could be LLM-driven.
   */
  const actions: PlannedAction[] = [];

  // Read actions: file paths mentioned in the prompt
  const filePaths = extractFilePaths(prompt);
  filePaths.forEach((target) => {
    actions.push({
      id: `read_${hash(target)}`,
      type: 'read',
      target,
      description: `Read ${target}`,
      requiresApproval: false,
    });
  });

  // Write actions: implied by keywords
  if (/\b(fix|update|change|modify|replace|rewrite|create|add|implement|build)\b/.test(prompt.toLowerCase())) {
    filePaths.forEach((target) => {
      actions.push({
        id: `write_${hash(target)}`,
        type: 'write',
        target,
        description: `Write ${target}`,
        requiresApproval: false,
      });
    });
  }

  // Execute actions: build/test commands
  if (/\b(build|compile|run test|npm test|pytest|cargo test)\b/.test(prompt.toLowerCase())) {
    actions.push({
      id: `exec_${hash(prompt)}`,
      type: 'execute',
      target: 'shell',
      description: `Run build/test command for task`,
      requiresApproval: false,
    });
  }

  // Git actions
  if (/\b(git commit|git push|git merge|git pull|git checkout)\b/.test(prompt.toLowerCase())) {
    const match = prompt.match(/\b(git \w+[^\n]*)/);
    actions.push({
      id: `git_${hash(prompt)}`,
      type: 'git',
      target: 'git',
      description: match ? match[0] : 'Git mutation',
      requiresApproval: true,
    });
  }

  // Evaluate autonomy for each action
  return actions.map((action) => ({
    ...action,
    requiresApproval: !canExecuteWithoutApproval(action),
  }));
}

function extractFilePaths(prompt: string): string[] {
  // Naive extraction of paths that look like files
  const matches = prompt.match(/[\w\-./]+\.(tsx?|jsx?|py|rs|go|java|md|json|yml|yaml|css|html|vue|svelte)/g);
  return Array.from(new Set(matches || []));
}

function hash(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString(36).slice(0, 6);
}

export async function executeRoute(
  prompt: string,
  context?: Record<string, unknown>
): Promise<TaskResult> {
  const task: Task = {
    id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    prompt,
    context,
    createdAt: Date.now(),
  };

  orchestratorStore.setState((prev) => ({ ...prev, currentTask: task }));

  const decision = routeTask(prompt, context);
  const actions = planActions(decision.agentId, prompt);
  const pending = actions.filter((a) => a.requiresApproval);

  if (pending.length > 0) {
    pending.forEach(queueForApproval);
  }

  const result: TaskResult = {
    taskId: task.id,
    agentId: decision.agentId,
    output: `${decision.reasoning}\nPlanned ${actions.length} actions (${pending.length} pending approval).`,
    actions,
    completedAt: Date.now(),
  };

  orchestratorStore.setState((prev) => ({
    ...prev,
    lastResult: result,
    history: [result, ...prev.history].slice(0, 100),
    currentTask: null,
  }));

  return result;
}
