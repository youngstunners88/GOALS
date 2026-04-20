/**
 * ═══════════════════════════════════════════════════════════════
 * DOMAIN - PENALTY SHOOTOUT ENTITY
 * ═══════════════════════════════════════════════════════════════
 */

export type AimZone = 'tl' | 'tc' | 'tr' | 'ml' | 'mc' | 'mr' | 'bl' | 'bc' | 'br';
export type DiveZone = AimZone;
export type CommitTiming = 'early' | 'balanced' | 'late';
export type ShotPower = number; // 0-100
export type ShotOutcome = 'goal' | 'save' | 'miss';

export interface PenaltyShootoutState {
  readonly round: number;
  readonly shooterScore: number;
  readonly keeperScore: number;
  readonly isSuddenDeath: boolean;
  readonly history: ReadonlyArray<PenaltyRound>;
}

export interface PenaltyRound {
  readonly roundNumber: number;
  readonly shooterAim: AimZone;
  readonly shooterPower: ShotPower;
  readonly keeperDive: DiveZone;
  readonly keeperTiming: CommitTiming;
  readonly outcome: ShotOutcome;
  readonly shooterPoolWon: boolean;
}

export interface PenaltyConfig {
  readonly roundsUntilSuddenDeath: number;
  readonly liquidationThreshold: number; // consecutive sudden-death losses
  readonly platformFeePercent: number;
  readonly shooterWinShare: number; // 0.85
  readonly keeperWinShare: number; // 0.90
}

export const DEFAULT_PENALTY_CONFIG: PenaltyConfig = {
  roundsUntilSuddenDeath: 5,
  liquidationThreshold: 3,
  platformFeePercent: 2.5,
  shooterWinShare: 0.85,
  keeperWinShare: 0.90,
};

export const resolveShot = (
  shooterAim: AimZone,
  shooterPower: ShotPower,
  keeperDive: DiveZone,
  keeperTiming: CommitTiming,
  shooterXg: number, // 0-1
  keeperSaveRate: number, // 0-1
  pressureIndex: number // 1.0+ knockout multiplier
): ShotOutcome => {
  // Base probabilities weighted by real-world data
  const baseGoalProb = shooterXg * 0.7 + (shooterPower / 100) * 0.3;
  const baseSaveProb = keeperSaveRate * 0.6;

  // Aim vs dive: if same zone, high save chance
  const aimMatch = shooterAim === keeperDive ? 0.4 : 0.0;

  // Timing modifier
  const timingModifier = keeperTiming === 'early' ? -0.05 : keeperTiming === 'late' ? 0.05 : 0.0;

  // Pressure reduces conversion slightly
  const pressureModifier = (pressureIndex - 1.0) * -0.05;

  const goalProb = Math.max(0.05, Math.min(0.95, baseGoalProb - aimMatch + timingModifier + pressureModifier));
  const saveProb = Math.max(0.05, Math.min(0.95, baseSaveProb + aimMatch + timingModifier));

  const roll = Math.random();

  if (roll < goalProb) return 'goal';
  if (roll < goalProb + saveProb) return 'save';
  return 'miss';
};

export const createInitialPenaltyState = (): PenaltyShootoutState => ({
  round: 1,
  shooterScore: 0,
  keeperScore: 0,
  isSuddenDeath: false,
  history: [],
});

export const addRound = (
  state: PenaltyShootoutState,
  round: PenaltyRound
): PenaltyShootoutState => {
  const newHistory = [...state.history, round];
  const isGoal = round.outcome === 'goal';
  const newRound = state.round + 1;
  const isSuddenDeath = newRound > DEFAULT_PENALTY_CONFIG.roundsUntilSuddenDeath;

  return {
    round: newRound,
    shooterScore: isGoal ? state.shooterScore + 1 : state.shooterScore,
    keeperScore: !isGoal ? state.keeperScore + 1 : state.keeperScore,
    isSuddenDeath,
    history: newHistory,
  };
};
