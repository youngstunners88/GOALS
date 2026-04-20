/**
 * ═══════════════════════════════════════════════════════════════
 * DOMAIN - FREE KICK ENTITY
 * ═══════════════════════════════════════════════════════════════
 */

export type RiskTier = 'safe' | 'standard' | 'bold' | 'hail_mary';
export type ShotType = 'power_shot' | 'curve_ball' | 'chip';
export type FreeKickOutcome = 'goal' | 'save' | 'miss_block';

export interface FreeKickState {
  readonly kickId: string;
  readonly takerName: string;
  readonly distance: number; // yards
  readonly angle: number; // degrees from center
  readonly wallHeight: number; // players in wall
  readonly pressureIndex: number; // 1.0 = group stage, 1.5 = final
  readonly riskTier: RiskTier;
  readonly status: 'open' | 'taken' | 'resolved';
  readonly stakes: ReadonlyArray<FreeKickStake>;
  readonly result: FreeKickResult | null;
}

export interface FreeKickStake {
  readonly walletAddress: string;
  readonly collateral: number;
  readonly borrowed: number;
  readonly shotType: ShotType;
  readonly timestamp: Date;
}

export interface FreeKickResult {
  readonly outcome: FreeKickOutcome;
  readonly payoutMultiplier: number;
  readonly collateralBurned: number;
  readonly collateralRedistributed: number;
  readonly borrowedRepaid: boolean;
}

export const RISK_TIER_CONFIG: Record<RiskTier, { distance: string; angle: string; basePayout: number }> = {
  safe: { distance: '<20 yards', angle: '<15°', basePayout: 2.0 },
  standard: { distance: '20-25 yards', angle: '15-30°', basePayout: 3.5 },
  bold: { distance: '25-30 yards', angle: '30-45°', basePayout: 6.0 },
  hail_mary: { distance: '>30 yards', angle: '>45°', basePayout: 12.0 },
};

export const SHOT_TYPE_MODIFIER: Record<ShotType, { variance: number; saveChance: number; payoutBonus: number }> = {
  power_shot: { variance: 0.25, saveChance: 0.35, payoutBonus: 1.0 },
  curve_ball: { variance: 0.15, saveChance: 0.45, payoutBonus: 1.1 },
  chip: { variance: 0.40, saveChance: 0.25, payoutBonus: 1.5 },
};

export const calculateRiskTier = (distance: number, angle: number): RiskTier => {
  if (distance < 20 && angle < 15) return 'safe';
  if (distance <= 25 && angle <= 30) return 'standard';
  if (distance <= 30 && angle <= 45) return 'bold';
  return 'hail_mary';
};

export const resolveFreeKick = (
  state: FreeKickState,
  takerConversionRate: number, // 0-1
  keeperSaveRate: number // 0-1
): FreeKickResult => {
  const tierConfig = RISK_TIER_CONFIG[state.riskTier];
  const avgShotType = state.stakes.length > 0
    ? state.stakes.reduce((sum, s) => sum + SHOT_TYPE_MODIFIER[s.shotType].variance, 0) / state.stakes.length
    : 0.2;

  // Goal probability based on distance, angle, wall, pressure, and taker skill
  const distanceFactor = Math.max(0.1, 1 - state.distance / 40);
  const angleFactor = Math.max(0.1, 1 - state.angle / 60);
  const wallFactor = Math.max(0.1, 1 - state.wallHeight / 8);
  const pressureFactor = Math.max(0.5, 1 - (state.pressureIndex - 1) * 0.2);

  const goalProb = Math.min(0.9, takerConversionRate * distanceFactor * angleFactor * wallFactor * pressureFactor);
  const saveProb = keeperSaveRate * 0.5 * (1 - avgShotType);
  const roll = Math.random();

  if (roll < goalProb) {
    const payoutMultiplier = tierConfig.basePayout * (state.stakes.length > 0
      ? state.stakes.reduce((sum, s) => sum + SHOT_TYPE_MODIFIER[s.shotType].payoutBonus, 0) / state.stakes.length
      : 1.0);
    return {
      outcome: 'goal',
      payoutMultiplier,
      collateralBurned: 0,
      collateralRedistributed: 0,
      borrowedRepaid: false,
    };
  }

  if (roll < goalProb + saveProb) {
    return {
      outcome: 'save',
      payoutMultiplier: 0,
      collateralBurned: 0,
      collateralRedistributed: 0,
      borrowedRepaid: true,
    };
  }

  // Miss / Block
  const totalCollateral = state.stakes.reduce((sum, s) => sum + s.collateral, 0);
  return {
    outcome: 'miss_block',
    payoutMultiplier: 0,
    collateralBurned: totalCollateral * 0.1,
    collateralRedistributed: totalCollateral * 0.4,
    borrowedRepaid: false,
  };
};

export const createFreeKickState = (
  kickId: string,
  takerName: string,
  distance: number,
  angle: number,
  wallHeight: number,
  pressureIndex: number
): FreeKickState => ({
  kickId,
  takerName,
  distance,
  angle,
  wallHeight,
  pressureIndex,
  riskTier: calculateRiskTier(distance, angle),
  status: 'open',
  stakes: [],
  result: null,
});
