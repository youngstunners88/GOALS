/**
 * Code Skill
 *
 * Handles reading, writing, and analyzing source code files.
 */

import { registerSkill } from '../core/registry.js';
import { type Task, type OrchestratorState, log } from '../core/state.js';

export const CODE_SKILL_ID = 'code-skill';

export function initCodeSkill() {
  registerSkill({
    id: CODE_SKILL_ID,
    name: 'Code Skill',
    description: 'Read, write, and analyze code files.',
    triggerPatterns: [
      /\.tsx?$/,
      /\.jsx?$/,
      /\.py$/,
      /\.rs$/,
      /\.go$/,
      /\b(fix|refactor|implement|create|add|test|bug)\b/,
    ],
    handler: (task: Task, _context: OrchestratorState) => {
      log(`Code Skill handling: ${task.prompt.slice(0, 80)}`);
      return `[Code Skill] Would read/modify files for: ${task.prompt}`;
    },
  });
}
