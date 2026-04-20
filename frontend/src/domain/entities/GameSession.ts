/**
 * ═══════════════════════════════════════════════════════════════
 * DOMAIN - GAME SESSION ENTITY
 * ═══════════════════════════════════════════════════════════════
 */

export type GameType = 'penalty_shootout' | 'corner_kick' | 'free_kick';
export type GameStatus = 'lobby' | 'active' | 'resolved' | 'cancelled';
export type GameOutcome = 'win' | 'loss' | 'draw' | 'pending';

export interface GameSession {
  readonly id: string;
  readonly gameType: GameType;
  readonly status: GameStatus;
  readonly createdAt: Date;
  readonly expiresAt: Date;
  readonly stakes: ReadonlyArray<GameStake>;
  readonly outcome: GameOutcome;
  readonly resultPayload: unknown;
}

export interface GameStake {
  readonly playerId: string;
  readonly walletAddress: string;
  readonly amount: number;
  readonly side: StakeSide;
  readonly timestamp: Date;
}

export type StakeSide = 'shooter' | 'keeper' | 'zone_a' | 'zone_b' | 'zone_c' | 'zone_d' | 'zone_e' | 'zone_f' | 'safe' | 'standard' | 'bold' | 'hail_mary';

export const createGameSession = (
  id: string,
  gameType: GameType,
  expiresAt: Date
): GameSession => ({
  id,
  gameType,
  status: 'lobby',
  createdAt: new Date(),
  expiresAt,
  stakes: [],
  outcome: 'pending',
  resultPayload: null,
});

export const addStake = (
  session: GameSession,
  stake: GameStake
): GameSession => ({
  ...session,
  stakes: [...session.stakes, stake],
});

export const resolveGame = (
  session: GameSession,
  outcome: GameOutcome,
  resultPayload: unknown
): GameSession => ({
  ...session,
  status: 'resolved',
  outcome,
  resultPayload,
});
