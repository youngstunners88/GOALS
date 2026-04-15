/**
 * Agent & Skill Registry
 *
 * Agents and skills self-register here. The router queries this registry
 * to decide who handles a task.
 */

import { type AgentRecord, type SkillRecord, orchestratorStore, log } from './state.js';

export function registerAgent(agent: AgentRecord) {
  orchestratorStore.setState((prev) => {
    const exists = prev.agents.find((a) => a.id === agent.id);
    if (exists) {
      log(`Agent ${agent.id} updated`);
      return {
        ...prev,
        agents: prev.agents.map((a) => (a.id === agent.id ? agent : a)),
      };
    }
    log(`Agent ${agent.id} registered`);
    return { ...prev, agents: [...prev.agents, agent] };
  });
}

export function registerSkill(skill: SkillRecord) {
  orchestratorStore.setState((prev) => {
    const exists = prev.skills.find((s) => s.id === skill.id);
    if (exists) {
      log(`Skill ${skill.id} updated`);
      return {
        ...prev,
        skills: prev.skills.map((s) => (s.id === skill.id ? skill : s)),
      };
    }
    log(`Skill ${skill.id} registered`);
    return { ...prev, skills: [...prev.skills, skill] };
  });
}

export function unregisterAgent(id: string) {
  orchestratorStore.setState((prev) => ({
    ...prev,
    agents: prev.agents.filter((a) => a.id !== id),
  }));
}

export function unregisterSkill(id: string) {
  orchestratorStore.setState((prev) => ({
    ...prev,
    skills: prev.skills.filter((s) => s.id !== id),
  }));
}

export function listAgents(): AgentRecord[] {
  return orchestratorStore.getState().agents;
}

export function listSkills(): SkillRecord[] {
  return orchestratorStore.getState().skills;
}

export function findAgentByCapability(capability: string): AgentRecord | undefined {
  return orchestratorStore
    .getState()
    .agents.find((a) => a.capabilities.includes(capability));
}

export function findSkillsForPrompt(prompt: string): SkillRecord[] {
  const lower = prompt.toLowerCase();
  return orchestratorStore
    .getState()
    .skills.filter((s) => s.triggerPatterns.some((p) => p.test(lower)));
}
