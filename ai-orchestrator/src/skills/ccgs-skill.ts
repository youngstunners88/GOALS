/**
 * CCGS Skill
 *
 * Wraps Claude Code Game Studios (CCGS) for game design tasks.
 * CCGS is collaborative by default; for $GOALS we allow auto-drafting
 * of GDDs and mechanics, but require approval for code/contract changes.
 *
 * Vendor: https://github.com/Donchitos/Claude-Code-Game-Studios
 */

import { registerSkill } from '../core/registry.js';
import { type Task, type OrchestratorState, log } from '../core/state.js';

export const CCGS_SKILL_ID = 'ccgs-skill';

export function initCcgsSkill() {
  registerSkill({
    id: CCGS_SKILL_ID,
    name: 'CCGS Skill',
    description: 'Game design and mechanic prototyping via Claude Code Game Studios.',
    triggerPatterns: [
      /\bccgs\b/,
      /\bgame design\b/,
      /\bgdd\b/,
      /\bgame concept\b/,
      /\bmechanic design\b/,
      /\bprototype game\b/,
      /\bpenalty shootout\b/,
      /\bcorner kick\b/,
      /\bfree kick\b/,
      /\bfifa world cup\b/,
      /\bworld cup 2026\b/,
    ],
    handler: (task: Task, _context: OrchestratorState) => {
      log(`CCGS Skill handling: ${task.prompt.slice(0, 80)}`);
      return `[CCGS Skill] Drafting game mechanic or GDD for: ${task.prompt}`;
    },
  });
}
