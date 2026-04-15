/**
 * SocratiCode Skill
 *
 * Wraps giancarloerra/SocratiCode: enterprise-grade codebase intelligence
 * with managed indexing, hybrid semantic search, and polyglot dependency graphs.
 */

import { registerSkill } from '../core/registry.js';
import { type Task, type OrchestratorState, log } from '../core/state.js';
import * as socraticode from '../vendor/socraticode/wrapper.js';

export const SOCRATICODE_SKILL_ID = 'socraticode-skill';

export function initSocratiCodeSkill() {
  registerSkill({
    id: SOCRATICODE_SKILL_ID,
    name: 'SocratiCode Skill',
    description: 'Installs and invokes SocratiCode for semantic codebase search, dependency graph analysis, and cross-project intelligence.',
    triggerPatterns: [
      /\b(socraticode|semantic search|codebase intelligence|dependency graph|polyglot|indexing|cross-project|find all references|where is .* used|index codebase)\b/i,
    ],
    handler: async (task: Task, _context: OrchestratorState) => {
      log(`SocratiCode Skill triggered: ${task.prompt.slice(0, 80)}`);
      const ok = socraticode.ensureInstalled();
      if (!ok) {
        return '[SocratiCode Skill] Failed to install SocratiCode. Check network/git access.';
      }
      return `[SocratiCode Skill] SocratiCode ready at ${socraticode.getRepoPath()}. Use it to index and perform semantic search across the codebase for: "${task.prompt}"`;
    },
  });
}
