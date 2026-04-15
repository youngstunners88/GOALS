/**
 * Prompt Agent
 *
 * Inspired by claude-code-system-prompts research and claude-md.
 * Optimizes system prompts, agent directives, and CLAUDE.md files.
 */

import { registerAgent } from '../core/registry.js';
import { log } from '../core/state.js';

export const PROMPT_AGENT_ID = 'prompt-agent';

export function initPromptAgent() {
  registerAgent({
    id: PROMPT_AGENT_ID,
    name: 'Prompt Agent',
    description: 'Optimizes system prompts, agent directives, and CLAUDE.md production files.',
    capabilities: [
      'prompt_engineering',
      'directive_optimization',
      'claude_md_generation',
      'system_prompt_analysis',
    ],
    weight: 1.0,
  });
  log('Prompt Agent initialized');
}

export function promptOptimize(draft: string): string {
  return draft
    .replace(/\bI think\b/gi, '')
    .replace(/\bmaybe\b/gi, 'if applicable')
    .replace(/\btry to\b/gi, 'do')
    .replace(/\bshould\b/gi, 'must');
}

export function generateClaudeMd(projectName: string, conventions: string[]): string {
  return `# ${projectName} — Agent Directive

## Core Rules
${conventions.map((c) => `- ${c}`).join('\n')}

## Workflow
1. Read AGENTS.md before acting.
2. Prefer minimal changes.
3. Update docs when architecture changes.
4. Never run git mutations without explicit approval.

## Safety
- Classify file risk before writes.
- Ask for approval on destructive commands.
- Keep CLAUDE.md in sync with reality.
`;
}
