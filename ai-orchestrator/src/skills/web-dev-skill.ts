/**
 * Web Dev Skill
 *
 * Frontend-focused skill for HTML, CSS, Tailwind, React components, etc.
 */

import { registerSkill } from '../core/registry.js';
import { type Task, type OrchestratorState, log } from '../core/state.js';

export const WEB_DEV_SKILL_ID = 'web-dev-skill';

export function initWebDevSkill() {
  registerSkill({
    id: WEB_DEV_SKILL_ID,
    name: 'Web Dev Skill',
    description: 'Build and style frontend components, pages, and layouts.',
    triggerPatterns: [
      /\b(tailwind|css|html|ui|ux|component|page|layout|dashboard|landing|frontend)\b/,
      /\b(responsive|hover|animation|gradient|shadow|color palette)\b/,
    ],
    handler: (task: Task, _context: OrchestratorState) => {
      log(`Web Dev Skill handling: ${task.prompt.slice(0, 80)}`);
      return `[Web Dev Skill] Would build/update UI for: ${task.prompt}`;
    },
  });
}
