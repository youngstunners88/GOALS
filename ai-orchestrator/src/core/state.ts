/**
 * Lightweight, Zustand-like state manager for the AI orchestrator.
 * No dependencies. Works in Node.js and browsers.
 */

export type Listener<T> = (state: T, prevState: T) => void;
export type Unsubscribe = () => void;
export type StateUpdater<T> = (prev: T) => T;

export interface Store<T> {
  getState: () => T;
  setState: (updater: T | StateUpdater<T>) => T;
  subscribe: (listener: Listener<T>) => Unsubscribe;
  snapshot: () => T;
}

export function createStore<T>(initialState: T): Store<T> {
  let state = initialState;
  const listeners = new Set<Listener<T>>();

  const getState = () => state;

  const setState = (updater: T | StateUpdater<T>): T => {
    const prevState = state;
    const nextState = typeof updater === 'function' ? (updater as StateUpdater<T>)(prevState) : updater;
    state = nextState;
    listeners.forEach((listener) => listener(state, prevState));
    return state;
  };

  const subscribe = (listener: Listener<T>): Unsubscribe => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  const snapshot = () => structuredClone(state);

  return { getState, setState, subscribe, snapshot };
}

/* -------------------------------------------------------------------------- */
/* Orchestrator-specific state shape                                          */
/* -------------------------------------------------------------------------- */

export interface Task {
  id: string;
  prompt: string;
  context?: Record<string, unknown>;
  createdAt: number;
}

export interface TaskResult {
  taskId: string;
  agentId: string;
  output: string;
  actions: PlannedAction[];
  completedAt: number;
}

export interface PlannedAction {
  id: string;
  type: 'read' | 'write' | 'execute' | 'network' | 'git';
  target: string;
  description: string;
  requiresApproval: boolean;
}

export interface AgentRecord {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  weight: number;
}

export interface SkillRecord {
  id: string;
  name: string;
  description: string;
  triggerPatterns: RegExp[];
  handler: (task: Task, context: OrchestratorState) => string | Promise<string>;
}

export interface OrchestratorState {
  currentTask: Task | null;
  lastResult: TaskResult | null;
  history: TaskResult[];
  agents: AgentRecord[];
  skills: SkillRecord[];
  autonomyLevel: 'full' | 'guarded' | 'manual';
  pendingApprovals: PlannedAction[];
  logs: string[];
}

export const DEFAULT_STATE: OrchestratorState = {
  currentTask: null,
  lastResult: null,
  history: [],
  agents: [],
  skills: [],
  autonomyLevel: 'guarded',
  pendingApprovals: [],
  logs: [],
};

export const orchestratorStore = createStore<OrchestratorState>(DEFAULT_STATE);

export function log(message: string) {
  orchestratorStore.setState((prev) => ({
    ...prev,
    logs: [`[${new Date().toISOString()}] ${message}`, ...prev.logs].slice(0, 500),
  }));
}

export function getStore() {
  return orchestratorStore;
}
