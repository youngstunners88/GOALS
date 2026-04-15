/**
 * ECC Skill (Everything Claude Code)
 *
 * Wraps affaan-m/everything-claude-code: an agent harness performance
 * optimization system covering skills, instincts, memory, and security.
 */

import { registerSkill } from '../core/registry.js';
import { type Task, type OrchestratorState, log } from '../core/state.js';
import * as ecc from '../vendor/everything-claude-code/wrapper.js';

export const ECC_SKILL_ID = 'ecc-skill';

export function initEccSkill() {
  registerSkill({
    id: ECC_SKILL_ID,
    name: 'ECC Skill',
    description: 'Installs and invokes everything-claude-code for agent harness optimization, skills, memory, and security hardening.',
    triggerPatterns: [
      /\b(everything-claude-code|ecc|agent harness|performance optimization|skills|instincts|memory|security hardening|research-first)\b/i,
    ],
    handler: async (task: Task, _context: OrchestratorState) => {
      log(`ECC Skill triggered: ${task.prompt.slice(0, 80)}`);
      const ok = ecc.ensureInstalled();
      if (!ok) {
        return '[ECC Skill] Failed to install everything-claude-code. Check network/git access.';
      }
      return `[ECC Skill] everything-claude-code ready at ${ecc.getRepoPath()}. Apply its harness patterns to optimize execution for: "${task.prompt}"`;
    },
  });
}
