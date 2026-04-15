/**
 * Camofox Skill
 *
 * Wraps jo-inc/camofox-browser: a headless browser automation server
 * for visiting sites that are usually blocked to normal automation.
 */

import { registerSkill } from '../core/registry.js';
import { type Task, type OrchestratorState, log } from '../core/state.js';
import * as camofox from '../vendor/camofox/wrapper.js';

export const CAMOFOX_SKILL_ID = 'camofox-skill';

export function initCamofoxSkill() {
  registerSkill({
    id: CAMOFOX_SKILL_ID,
    name: 'Camofox Skill',
    description: 'Installs and invokes camofox-browser for stealth headless browsing on blocked or protected sites.',
    triggerPatterns: [
      /\b(camofox|stealth browser|blocked site|headless browser|scraping|cloudflare bypass|bot detection)\b/i,
    ],
    handler: async (task: Task, _context: OrchestratorState) => {
      log(`Camofox Skill triggered: ${task.prompt.slice(0, 80)}`);
      const ok = camofox.ensureInstalled();
      if (!ok) {
        return '[Camofox Skill] Failed to install camofox. Check network/git access.';
      }
      return `[Camofox Skill] camofox ready at ${camofox.getRepoPath()}. Use it to browse/scrape sites that block normal automation for task: "${task.prompt}"`;
    },
  });
}
