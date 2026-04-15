// Simple smoke tests — runs after tsc compile
import {
  initOrchestrator,
  routeTask,
  planActions,
  canExecuteWithoutApproval,
  classifyRisk,
  listAgents,
  listSkills,
  setAutonomyLevel,
  type PlannedAction,
} from '../index.js';

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function main() {
  initOrchestrator();
  assert(listAgents().length === 4, `Expected 4 agents, got ${listAgents().length}`);
  assert(listSkills().length === 8, `Expected 8 skills, got ${listSkills().length}`);

  const d1 = routeTask('Fix the login bug in App.tsx');
  assert(d1.agentId === 'claw-agent', `Expected claw-agent, got ${d1.agentId}`);

  const dBrowser = routeTask('Scrape a Cloudflare-protected site');
  assert(dBrowser.skillId === 'camofox-skill', `Expected camofox-skill, got ${dBrowser.skillId}`);

  const dIntel = routeTask('Run semantic search to find all references to User');
  assert(dIntel.skillId === 'socraticode-skill', `Expected socraticode-skill, got ${dIntel.skillId}`);

  const d2 = routeTask('Orchestrate a multi-agent workflow');
  assert(d2.agentId === 'omni-agent', `Expected omni-agent, got ${d2.agentId}`);

  const readAction: PlannedAction = { id: 'r1', type: 'read', target: 'README.md', description: 'Read README', requiresApproval: false };
  assert(classifyRisk(readAction) === 'safe', 'Expected safe risk for README read');

  const writeAction: PlannedAction = { id: 'w1', type: 'write', target: '.env', description: 'Write env', requiresApproval: false };
  assert(classifyRisk(writeAction) === 'critical', 'Expected critical risk for .env write');

  const srcWrite: PlannedAction = { id: 'w2', type: 'write', target: 'src/App.tsx', description: 'Write App.tsx', requiresApproval: false };
  setAutonomyLevel('full');
  assert(canExecuteWithoutApproval(srcWrite), 'Full autonomy should allow src write');
  setAutonomyLevel('manual');
  assert(!canExecuteWithoutApproval(srcWrite), 'Manual autonomy should block src write');
  setAutonomyLevel('guarded');
  assert(canExecuteWithoutApproval(srcWrite), 'Guarded autonomy should allow src write');

  const actions = planActions('claw-agent', 'Fix App.tsx and run npm test');
  assert(actions.length >= 2, 'Expected at least 2 planned actions');
  assert(actions.some((a: PlannedAction) => a.type === 'execute'), 'Expected an execute action');

  console.log('All smoke tests passed ✅');
}

main();
