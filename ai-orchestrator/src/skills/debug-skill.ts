/**
 * Debug Skill
 *
 * Error diagnosis, log analysis, and root-cause identification.
 */

import { registerSkill } from '../core/registry.js';
import { type Task, type OrchestratorState, log } from '../core/state.js';

export const DEBUG_SKILL_ID = 'debug-skill';

export function initDebugSkill() {
  registerSkill({
    id: DEBUG_SKILL_ID,
    name: 'Debug Skill',
    description: 'Diagnose errors, analyze logs, and find root causes.',
    triggerPatterns: [
      /\b(error|fail|crash|broken|won't|doesn't|not working|logs|trace|diagnose|fix bug)\b/,
    ],
    handler: (task: Task, _context: OrchestratorState) => {
      log(`Debug Skill handling: ${task.prompt.slice(0, 80)}`);
      return `[Debug Skill] Would diagnose issue for: ${task.prompt}`;
    },
  });
}
