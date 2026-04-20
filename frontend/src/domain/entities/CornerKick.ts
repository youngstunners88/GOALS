/**
 * ═══════════════════════════════════════════════════════════════
 * DOMAIN - CORNER KICK ENTITY
 * ═══════════════════════════════════════════════════════════════
 */

export type BoxZone = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
export type GoalType = 'direct_header' | 'volley' | 'rebound_scramble' | 'own_goal';

export interface CornerKickState {
  readonly cornerId: string;
  readonly takerName: string;
  readonly matchMinute: number;
  readonly zones: Record<BoxZone, ZoneLiquidity>;
  readonly jackpotPool: number;
  readonly status: 'open' | 'crossed' | 'goal' | 'cleared' | 'expired';
  readonly goalWindowExpiry: Date | null;
  readonly result: CornerResult | null;
}

export interface ZoneLiquidity {
  readonly zone: BoxZone;
  readonly totalLiquidity: number;
  readonly participants: ReadonlyArray<ZoneParticipant>;
  readonly baseMultiplier: number;
  readonly boostMultiplier: number;
  readonly boostExpiry: Date | null;
}

export interface ZoneParticipant {
  readonly walletAddress: string;
  readonly amount: number;
  readonly timestamp: Date;
}

export interface CornerResult {
  readonly goalScored: boolean;
  readonly goalZone: BoxZone | null;
  readonly goalType: GoalType | null;
  readonly payoutMultiplier: number;
}

export const ZONE_CONFIG: Record<BoxZone, { description: string; baseMultiplier: number }> = {
  A: { description: 'Near post (low, crowded)', baseMultiplier: 1.2 },
  B: { description: 'Front center (headers, chaos)', baseMultiplier: 1.5 },
  C: { description: 'Far post (back-post tap-ins)', baseMultiplier: 1.8 },
  D: { description: 'Top of box edge (volleys, clearances)', baseMultiplier: 2.2 },
  E: { description: 'Penalty spot (classic header zone)', baseMultiplier: 1.6 },
  F: { description: 'Deep far corner (scrambles, rebounds)', baseMultiplier: 2.5 },
};

export const GOAL_RARITY_BONUS: Record<GoalType, number> = {
  direct_header: 1.5,
  volley: 2.0,
  rebound_scramble: 2.5,
  own_goal: 0.5,
};

export const createEmptyCornerState = (cornerId: string, takerName: string, matchMinute: number): CornerKickState => ({
  cornerId,
  takerName,
  matchMinute,
  zones: {
    A: { zone: 'A', totalLiquidity: 0, participants: [], baseMultiplier: ZONE_CONFIG.A.baseMultiplier, boostMultiplier: 1.0, boostExpiry: null },
    B: { zone: 'B', totalLiquidity: 0, participants: [], baseMultiplier: ZONE_CONFIG.B.baseMultiplier, boostMultiplier: 1.0, boostExpiry: null },
    C: { zone: 'C', totalLiquidity: 0, participants: [], baseMultiplier: ZONE_CONFIG.C.baseMultiplier, boostMultiplier: 1.0, boostExpiry: null },
    D: { zone: 'D', totalLiquidity: 0, participants: [], baseMultiplier: ZONE_CONFIG.D.baseMultiplier, boostMultiplier: 1.0, boostExpiry: null },
    E: { zone: 'E', totalLiquidity: 0, participants: [], baseMultiplier: ZONE_CONFIG.E.baseMultiplier, boostMultiplier: 1.0, boostExpiry: null },
    F: { zone: 'F', totalLiquidity: 0, participants: [], baseMultiplier: ZONE_CONFIG.F.baseMultiplier, boostMultiplier: 1.0, boostExpiry: null },
  },
  jackpotPool: 0,
  status: 'open',
  goalWindowExpiry: null,
  result: null,
});

export const supplyToZone = (
  state: CornerKickState,
  zone: BoxZone,
  participant: ZoneParticipant
): CornerKickState => {
  const currentZone = state.zones[zone];
  const updatedZone: ZoneLiquidity = {
    ...currentZone,
    totalLiquidity: currentZone.totalLiquidity + participant.amount,
    participants: [...currentZone.participants, participant],
  };
  return {
    ...state,
    zones: { ...state.zones, [zone]: updatedZone },
  };
};

export const boostZone = (
  state: CornerKickState,
  zone: BoxZone,
  boostAmount: number,
  durationSeconds: number
): CornerKickState => {
  const currentZone = state.zones[zone];
  const updatedZone: ZoneLiquidity = {
    ...currentZone,
    boostMultiplier: currentZone.boostMultiplier + boostAmount,
    boostExpiry: new Date(Date.now() + durationSeconds * 1000),
  };
  return {
    ...state,
    zones: { ...state.zones, [zone]: updatedZone },
  };
};

export const resolveCorner = (
  state: CornerKickState,
  goalScored: boolean,
  goalZone: BoxZone | null,
  goalType: GoalType | null
): CornerKickState => {
  if (!goalScored || !goalZone || !goalType) {
    // No goal: 80% return, 20% to jackpot
    const totalStaked = Object.values(state.zones).reduce((sum, z) => sum + z.totalLiquidity, 0);
    return {
      ...state,
      status: 'cleared',
      jackpotPool: state.jackpotPool + totalStaked * 0.2,
      result: { goalScored: false, goalZone: null, goalType: null, payoutMultiplier: 0 },
    };
  }

  const rarityBonus = GOAL_RARITY_BONUS[goalType];
  const zone = state.zones[goalZone];
  const activeMultiplier = zone.boostExpiry && zone.boostExpiry > new Date()
    ? zone.boostMultiplier
    : 1.0;
  const payoutMultiplier = zone.baseMultiplier * rarityBonus * activeMultiplier;

  return {
    ...state,
    status: 'goal',
    result: { goalScored: true, goalZone, goalType, payoutMultiplier },
  };
};
