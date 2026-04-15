/**
 * Multica Skill
 *
 * Wraps multica-ai/multica: a managed agents platform for assigning tasks,
 * tracking progress, and compounding skills across agent teammates.
 */

import { registerSkill } from '../core/registry.js';
import { type Task, type OrchestratorState, log } from '../core/state.js';
import * as multica from '../vendor/multica/wrapper.js';

export const MULTICA_SKILL_ID = 'multica-skill';

export function initMulticaSkill() {
  registerSkill({
    id: MULTICA_SKILL_ID,
    name: 'Multica Skill',
    description: 'Installs and invokes multica for multi-agent task delegation and progress tracking.',
    triggerPatterns: [
      /\b(multica|delegate|assign task|agent teammate|track progress|compound skills|managed agents)\b/i,
    ],
    handler: async (task: Task, _context: OrchestratorState) => {
      log(`Multica Skill triggered: ${task.prompt.slice(0, 80)}`);
      const ok = multica.ensureInstalled();
      if (!ok) {
        return '[Multica Skill] Failed to install multica. Check network/git access.';
      }
      return `[Multica Skill] multica ready at ${multica.getRepoPath()}. Use it to break "${task.prompt}" into sub-tasks and delegate to agent teammates.`;
    },
  });
}
