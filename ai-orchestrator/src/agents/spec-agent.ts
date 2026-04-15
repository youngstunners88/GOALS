/**
 * Spec Agent
 *
 * Inspired by get-shit-done (GSD): a spec-driven development system.
 * This agent turns vague requirements into concrete, actionable specs
 * before any code is written. Solves "context rot" by freezing scope.
 */

import { registerAgent } from '../core/registry.js';
import { log } from '../core/state.js';

export const SPEC_AGENT_ID = 'spec-agent';

export interface Spec {
  title: string;
  goal: string;
  nonGoals: string[];
  acceptanceCriteria: string[];
  filesToModify: string[];
  filesToCreate: string[];
  estimatedComplexity: 'low' | 'medium' | 'high';
}

export function initSpecAgent() {
  registerAgent({
    id: SPEC_AGENT_ID,
    name: 'Spec Agent',
    description: 'Turns requirements into concrete specs. Prevents scope creep and context rot.',
    capabilities: [
      'spec_writing',
      'requirements_analysis',
      'scope_definition',
      'acceptance_criteria',
    ],
    weight: 1.0,
  });
  log('Spec Agent initialized');
}

export function specDraft(prompt: string): Spec {
  return {
    title: prompt.slice(0, 60),
    goal: prompt,
    nonGoals: ['Out-of-scope features not explicitly requested'],
    acceptanceCriteria: ['Feature works as described', 'No regressions introduced'],
    filesToModify: [],
    filesToCreate: [],
    estimatedComplexity: 'medium',
  };
}

export function specToMarkdown(spec: Spec): string {
  return `
# ${spec.title}

## Goal
${spec.goal}

## Non-Goals
${spec.nonGoals.map((g) => `- ${g}`).join('\n')}

## Acceptance Criteria
${spec.acceptanceCriteria.map((c) => `- [ ] ${c}`).join('\n')}

## Files
- Modify: ${spec.filesToModify.join(', ') || 'TBD'}
- Create: ${spec.filesToCreate.join(', ') || 'TBD'}

## Complexity
${spec.estimatedComplexity}
`.trim();
}
