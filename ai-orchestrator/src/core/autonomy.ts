/**
 * Autonomy engine: decides whether an action can run without
 * human approval, based on risk classification and user settings.
 *
 * Inspired by:
 * - superpowers (plugin boundaries)
 * - claude-md (production safety)
 * - oh-my-claudecode (agent delegation)
 */

import { type PlannedAction, orchestratorStore, log } from './state.js';

export type RiskLevel = 'safe' | 'low' | 'medium' | 'high' | 'critical';

const SAFE_PATTERNS = [
  /^\.git\/HEAD$/,
  /^\.git\/config$/,
  /README\.md$/,
  /package\.json$/,
  /tsconfig\.json$/,
  /\.env\.example$/,
  /AGENTS\.md$/,
  /CLAUDE\.md$/,
];

const CRITICAL_PATTERNS = [
  /\.git\//,
  /\.ssh\//,
  /\.gnupg\//,
  /id_rsa/,
  /id_ed25519/,
  /\.pem$/,
  /\.key$/,
  /\.env$/,
  /credentials/,
  /password/,
  /secret/,
];

const WRITE_CRITICAL_PATHS = [
  /package\.json$/,
  /docker-compose\.yml$/,
  /Dockerfile$/,
  /\.github\/workflows\//,
];

export function classifyRisk(action: PlannedAction): RiskLevel {
  // Critical: secrets / keys / auth
  if (action.type === 'read' && CRITICAL_PATTERNS.some((p) => p.test(action.target))) {
    return 'critical';
  }

  // Git mutations are always high/critical
  if (action.type === 'git') {
    if (/push|force|reset|rebase|clean/.test(action.description)) {
      return 'critical';
    }
    return 'high';
  }

  // Network calls
  if (action.type === 'network') {
    if (/POST|PUT|DELETE|PATCH/.test(action.description)) {
      return 'high';
    }
    return 'medium';
  }

  // Execution
  if (action.type === 'execute') {
    if (/rm -rf|mkfs|dd |curl .*\|.*sh|wget .*\|.*sh/.test(action.description)) {
      return 'critical';
    }
    if (/npm install|pip install|apt|brew|cargo build|tsc/.test(action.description)) {
      return 'medium';
    }
    return 'low';
  }

  // Write operations
  if (action.type === 'write') {
    if (CRITICAL_PATTERNS.some((p) => p.test(action.target))) {
      return 'critical';
    }
    if (WRITE_CRITICAL_PATHS.some((p) => p.test(action.target))) {
      return 'high';
    }
    // Test files and docs are safer
    if (/test|spec|README|docs|\.md$/.test(action.target)) {
      return 'safe';
    }
    return 'medium';
  }

  // Read operations on safe files
  if (action.type === 'read') {
    if (SAFE_PATTERNS.some((p) => p.test(action.target))) {
      return 'safe';
    }
    return 'low';
  }

  return 'medium';
}

export function canExecuteWithoutApproval(action: PlannedAction): boolean {
  const { autonomyLevel } = orchestratorStore.getState();
  const risk = classifyRisk(action);

  if (autonomyLevel === 'manual') {
    return false;
  }

  if (autonomyLevel === 'full') {
    // Even full autonomy stops at critical
    return risk !== 'critical';
  }

  // Guarded (default)
  switch (risk) {
    case 'safe':
    case 'low':
      return true;
    case 'medium':
      // Allow medium writes only outside of core config
      if (action.type === 'write' && !/src\//.test(action.target)) {
        return false;
      }
      return true;
    case 'high':
    case 'critical':
      return false;
    default:
      return false;
  }
}

export function approveAction(actionId: string): boolean {
  const state = orchestratorStore.getState();
  const action = state.pendingApprovals.find((a) => a.id === actionId);
  if (!action) {
    log(`Approval failed: action ${actionId} not found`);
    return false;
  }

  orchestratorStore.setState((prev) => ({
    ...prev,
    pendingApprovals: prev.pendingApprovals.filter((a) => a.id !== actionId),
  }));

  log(`Approved action ${actionId}: ${action.description}`);
  return true;
}

export function queueForApproval(action: PlannedAction) {
  orchestratorStore.setState((prev) => ({
    ...prev,
    pendingApprovals: [...prev.pendingApprovals, action],
  }));
  log(`Queued for approval: ${action.description}`);
}

export function setAutonomyLevel(level: 'full' | 'guarded' | 'manual') {
  orchestratorStore.setState((prev) => ({ ...prev, autonomyLevel: level }));
  log(`Autonomy level set to ${level}`);
}
