/**
 * Omni Agent
 *
 * Inspired by oh-my-claudecode (OMC): a multi-agent orchestration layer.
 * This agent doesn't do the work itself — it breaks complex tasks into
 * sub-tasks and delegates them to other agents.
 */

import { registerAgent } from '../core/registry.js';
import { log } from '../core/state.js';

export const OMNI_AGENT_ID = 'omni-agent';

export function initOmniAgent() {
  registerAgent({
    id: OMNI_AGENT_ID,
    name: 'Omni Agent',
    description: 'Multi-agent orchestrator. Decomposes complex tasks and delegates to specialized agents.',
    capabilities: [
      'orchestration',
      'delegation',
      'planning',
      'task_decomposition',
      'agent_swarm',
    ],
    weight: 1.0,
  });
  log('Omni Agent initialized');
}

export interface SubTask {
  id: string;
  agentId: string;
  prompt: string;
  dependencies: string[];
}

export function omniDecompose(prompt: string): SubTask[] {
  // In a real implementation this would use an LLM to decompose
  return [
    {
      id: 'sub_1',
      agentId: 'spec-agent',
      prompt: `Create a spec for: ${prompt}`,
      dependencies: [],
    },
    {
      id: 'sub_2',
      agentId: 'claw-agent',
      prompt: `Implement based on the spec for: ${prompt}`,
      dependencies: ['sub_1'],
    },
    {
      id: 'sub_3',
      agentId: 'claw-agent',
      prompt: `Write tests for: ${prompt}`,
      dependencies: ['sub_2'],
    },
  ];
}
