/**
 * ═══════════════════════════════════════════════════════════════
 * APPLICATION - GAME ENGINE SERVICE
 * ═══════════════════════════════════════════════════════════════
 */

import type { GameSession, GameStake, StakeSide } from '../../domain/entities/GameSession.ts';
import { createGameSession, addStake } from '../../domain/entities/GameSession.ts';
import type { PenaltyShootoutState, PenaltyRound, ShotOutcome } from '../../domain/entities/PenaltyShootout.ts';
import { createInitialPenaltyState, addRound, resolveShot } from '../../domain/entities/PenaltyShootout.ts';
import type { CornerKickState, BoxZone, GoalType } from '../../domain/entities/CornerKick.ts';
import { createEmptyCornerState, supplyToZone, boostZone, resolveCorner } from '../../domain/entities/CornerKick.ts';
import type { FreeKickState } from '../../domain/entities/FreeKick.ts';
import { createFreeKickState, resolveFreeKick, type ShotType } from '../../domain/entities/FreeKick.ts';

export class GameEngine {
  private sessions = new Map<string, GameSession>();
  private penaltyStates = new Map<string, PenaltyShootoutState>();
  private cornerStates = new Map<string, CornerKickState>();
  private freeKickStates = new Map<string, FreeKickState>();

  // ─── Game Session Management ───

  createSession(gameType: 'penalty_shootout' | 'corner_kick' | 'free_kick', durationMinutes = 5): GameSession {
    const id = `game_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);
    const session = createGameSession(id, gameType, expiresAt);
    this.sessions.set(id, session);
    return session;
  }

  getSession(id: string): GameSession | undefined {
    return this.sessions.get(id);
  }

  placeStake(sessionId: string, walletAddress: string, amount: number, side: StakeSide): GameSession {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Session not found');
    if (session.status !== 'lobby') throw new Error('Session not open for stakes');

    const stake: GameStake = {
      playerId: `player_${Math.random().toString(36).slice(2, 8)}`,
      walletAddress,
      amount,
      side,
      timestamp: new Date(),
    };

    const updated = addStake(session, stake);
    this.sessions.set(sessionId, updated);
    return updated;
  }

  // ─── Penalty Shootout ───

  createPenaltyGame(): { session: GameSession; state: PenaltyShootoutState } {
    const session = this.createSession('penalty_shootout');
    const state = createInitialPenaltyState();
    this.penaltyStates.set(session.id, state);
    return { session, state };
  }

  getPenaltyState(sessionId: string): PenaltyShootoutState | undefined {
    return this.penaltyStates.get(sessionId);
  }

  executePenaltyRound(
    sessionId: string,
    shooterAim: string,
    shooterPower: number,
    keeperDive: string,
    keeperTiming: string,
    shooterXg = 0.75,
    keeperSaveRate = 0.22,
    pressureIndex = 1.0
  ): { state: PenaltyShootoutState; outcome: ShotOutcome } {
    const currentState = this.penaltyStates.get(sessionId);
    if (!currentState) throw new Error('Penalty game not found');

    const outcome = resolveShot(
      shooterAim as any,
      shooterPower,
      keeperDive as any,
      keeperTiming as any,
      shooterXg,
      keeperSaveRate,
      pressureIndex
    );

    const round: PenaltyRound = {
      roundNumber: currentState.round,
      shooterAim: shooterAim as any,
      shooterPower,
      keeperDive: keeperDive as any,
      keeperTiming: keeperTiming as any,
      outcome,
      shooterPoolWon: outcome === 'goal',
    };

    const newState = addRound(currentState, round);
    this.penaltyStates.set(sessionId, newState);
    return { state: newState, outcome };
  }

  // ─── Corner Kick ───

  createCornerGame(takerName: string, matchMinute: number): { session: GameSession; state: CornerKickState } {
    const session = this.createSession('corner_kick', 3);
    const state = createEmptyCornerState(session.id, takerName, matchMinute);
    this.cornerStates.set(session.id, state);
    return { session, state };
  }

  getCornerState(sessionId: string): CornerKickState | undefined {
    return this.cornerStates.get(sessionId);
  }

  supplyCornerZone(sessionId: string, zone: BoxZone, walletAddress: string, amount: number): CornerKickState {
    const state = this.cornerStates.get(sessionId);
    if (!state) throw new Error('Corner game not found');
    if (state.status !== 'open') throw new Error('Corner not open for supply');

    const updated = supplyToZone(state, zone, {
      walletAddress,
      amount,
      timestamp: new Date(),
    });
    this.cornerStates.set(sessionId, updated);
    return updated;
  }

  boostCornerZone(sessionId: string, zone: BoxZone, _walletAddress: string, burnAmount: number): CornerKickState {
    const state = this.cornerStates.get(sessionId);
    if (!state) throw new Error('Corner game not found');

    const updated = boostZone(state, zone, burnAmount * 0.1, 30);
    this.cornerStates.set(sessionId, updated);
    return updated;
  }

  resolveCornerGame(sessionId: string, goalScored: boolean, goalZone?: BoxZone, goalType?: GoalType): CornerKickState {
    const state = this.cornerStates.get(sessionId);
    if (!state) throw new Error('Corner game not found');

    const updated = resolveCorner(state, goalScored, goalZone ?? null, goalType ?? null);
    this.cornerStates.set(sessionId, updated);
    return updated;
  }

  // ─── Free Kick ───

  createFreeKickGame(
    takerName: string,
    distance: number,
    angle: number,
    wallHeight: number,
    pressureIndex: number
  ): { session: GameSession; state: FreeKickState } {
    const session = this.createSession('free_kick', 3);
    const state = createFreeKickState(session.id, takerName, distance, angle, wallHeight, pressureIndex);
    this.freeKickStates.set(session.id, state);
    return { session, state };
  }

  getFreeKickState(sessionId: string): FreeKickState | undefined {
    return this.freeKickStates.get(sessionId);
  }

  stakeFreeKick(
    sessionId: string,
    _walletAddress: string,
    collateral: number,
    borrowed: number,
    shotType: ShotType
  ): FreeKickState {
    const state = this.freeKickStates.get(sessionId);
    if (!state) throw new Error('Free kick game not found');
    if (state.status !== 'open') throw new Error('Free kick not open for stakes');

    const updated: FreeKickState = {
      ...state,
      stakes: [
        ...state.stakes,
        { walletAddress: _walletAddress, collateral, borrowed, shotType, timestamp: new Date() },
      ],
    };
    this.freeKickStates.set(sessionId, updated);
    return updated;
  }

  resolveFreeKickGame(sessionId: string, takerConversionRate = 0.08, keeperSaveRate = 0.70): FreeKickState {
    const state = this.freeKickStates.get(sessionId);
    if (!state) throw new Error('Free kick game not found');

    const result = resolveFreeKick(state, takerConversionRate, keeperSaveRate);
    const updated: FreeKickState = {
      ...state,
      status: 'resolved',
      result,
    };
    this.freeKickStates.set(sessionId, updated);
    return updated;
  }
}

export const gameEngine = new GameEngine();
