/**
 * ═══════════════════════════════════════════════════════════════
 * APPLICATION - JOIN GAME DTO
 * ═══════════════════════════════════════════════════════════════
 */

import type { GameType, StakeSide } from '../../domain/entities/GameSession.ts';
import type { AimZone, DiveZone, CommitTiming, ShotPower } from '../../domain/entities/PenaltyShootout.ts';
import type { BoxZone } from '../../domain/entities/CornerKick.ts';
import type { ShotType } from '../../domain/entities/FreeKick.ts';

export interface JoinGameDTO {
  readonly gameType: GameType;
  readonly walletAddress: string;
  readonly amount: number;
  readonly side: StakeSide;
}

export interface PenaltyActionDTO {
  readonly gameId: string;
  readonly walletAddress: string;
  readonly role: 'shooter' | 'keeper';
  readonly shooterAim?: AimZone;
  readonly shooterPower?: ShotPower;
  readonly keeperDive?: DiveZone;
  readonly keeperTiming?: CommitTiming;
}

export interface CornerSupplyDTO {
  readonly cornerId: string;
  readonly walletAddress: string;
  readonly zone: BoxZone;
  readonly amount: number;
}

export interface CornerBoostDTO {
  readonly cornerId: string;
  readonly walletAddress: string;
  readonly zone: BoxZone;
  readonly burnAmount: number;
}

export interface FreeKickStakeDTO {
  readonly kickId: string;
  readonly walletAddress: string;
  readonly collateral: number;
  readonly borrowed: number;
  readonly shotType: ShotType;
}
