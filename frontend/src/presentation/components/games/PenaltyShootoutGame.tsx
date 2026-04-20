/**
 * ═══════════════════════════════════════════════════════════════
 * PRESENTATION - PENALTY SHOOTOUT GAME
 * ═══════════════════════════════════════════════════════════════
 */

import React, { useState, useCallback } from 'react';
import { gameEngine } from '../../../application/services/GameEngine.ts';
import type { AimZone, DiveZone, CommitTiming, ShotOutcome } from '../../../domain/entities/PenaltyShootout.ts';
import { DEFAULT_PENALTY_CONFIG } from '../../../domain/entities/PenaltyShootout.ts';

interface PenaltyShootoutGameProps {
  readonly onBack: () => void;
}

const AIM_ZONES: { id: AimZone; label: string }[] = [
  { id: 'tl', label: 'TL' }, { id: 'tc', label: 'TC' }, { id: 'tr', label: 'TR' },
  { id: 'ml', label: 'ML' }, { id: 'mc', label: 'MC' }, { id: 'mr', label: 'MR' },
  { id: 'bl', label: 'BL' }, { id: 'bc', label: 'BC' }, { id: 'br', label: 'BR' },
];

const TIMING_OPTIONS: { id: CommitTiming; label: string }[] = [
  { id: 'early', label: 'Early' },
  { id: 'balanced', label: 'Balanced' },
  { id: 'late', label: 'Late' },
];

export const PenaltyShootoutGame: React.FC<PenaltyShootoutGameProps> = ({ onBack }) => {
  const [gameId, setGameId] = useState<string | null>(null);
  const [role, setRole] = useState<'shooter' | 'keeper'>('shooter');
  const [shooterAim, setShooterAim] = useState<AimZone>('mc');
  const [shooterPower, setShooterPower] = useState<number>(75);
  const [keeperDive, setKeeperDive] = useState<DiveZone>('mc');
  const [keeperTiming, setKeeperTiming] = useState<CommitTiming>('balanced');
  const [lastOutcome, setLastOutcome] = useState<ShotOutcome | null>(null);
  const [roundHistory, setRoundHistory] = useState<string[]>([]);
  const [shooterScore, setShooterScore] = useState(0);
  const [keeperScore, setKeeperScore] = useState(0);
  const [round, setRound] = useState(1);
  const [isSuddenDeath, setIsSuddenDeath] = useState(false);
  const [phase, setPhase] = useState<'setup' | 'playing' | 'result'>('setup');

  const startGame = useCallback(() => {
    const { session } = gameEngine.createPenaltyGame();
    setGameId(session.id);
    setPhase('playing');
    setRound(1);
    setShooterScore(0);
    setKeeperScore(0);
    setIsSuddenDeath(false);
    setRoundHistory([]);
    setLastOutcome(null);
  }, []);

  const takeShot = useCallback(() => {
    if (!gameId) return;
    const { state, outcome } = gameEngine.executePenaltyRound(
      gameId,
      shooterAim,
      shooterPower,
      keeperDive,
      keeperTiming,
      0.78,
      0.22,
      isSuddenDeath ? 1.3 : 1.0
    );
    setLastOutcome(outcome);
    setShooterScore(state.shooterScore);
    setKeeperScore(state.keeperScore);
    setRound(state.round);
    setIsSuddenDeath(state.isSuddenDeath);
    setRoundHistory(prev => [...prev, `R${state.round - 1}: ${outcome.toUpperCase()}`]);
    setPhase('result');
  }, [gameId, shooterAim, shooterPower, keeperDive, keeperTiming, isSuddenDeath]);

  const nextRound = useCallback(() => {
    setPhase('playing');
    setLastOutcome(null);
  }, []);

  const resetGame = useCallback(() => {
    setPhase('setup');
    setGameId(null);
  }, []);

  if (phase === 'setup') {
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', padding: '40px 24px', color: 'white' }}>
        <button onClick={onBack} style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', marginBottom: '24px' }}>
          ← Back to Arena
        </button>
        <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🥅</div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, margin: '0 0 12px' }}>Penalty Shootout</h1>
          <p style={{ color: '#9ca3af', marginBottom: '32px' }}>
            Choose your side. Stake $GOALS. Take the shot or make the save.
            Sudden death after 5 rounds. Three losses in sudden death = liquidation.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '32px' }}>
            {(['shooter', 'keeper'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                style={{
                  padding: '16px 32px',
                  background: role === r ? '#ef4444' : '#1e293b',
                  color: 'white',
                  border: `1px solid ${role === r ? '#ef4444' : '#374151'}`,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  textTransform: 'capitalize',
                }}
              >
                {r}
              </button>
            ))}
          </div>

          <button
            onClick={startGame}
            style={{
              padding: '16px 48px',
              background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '18px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Start Game
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'result' && lastOutcome) {
    const isWin = role === 'shooter' ? lastOutcome === 'goal' : (lastOutcome === 'save' || lastOutcome === 'miss');
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', padding: '40px 24px', color: 'white', textAlign: 'center' }}>
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
          <div style={{ fontSize: '72px', marginBottom: '16px' }}>
            {lastOutcome === 'goal' ? '⚽' : lastOutcome === 'save' ? '🧤' : '❌'}
          </div>
          <h1 style={{ fontSize: '36px', fontWeight: 800, margin: '0 0 8px', color: isWin ? '#22c55e' : '#ef4444' }}>
            {lastOutcome === 'goal' ? 'GOAL!' : lastOutcome === 'save' ? 'SAVED!' : 'MISS!'}
          </h1>
          <p style={{ color: '#9ca3af', marginBottom: '24px' }}>
            {role === 'shooter'
              ? lastOutcome === 'goal' ? 'You found the back of the net.' : 'The keeper got the better of you.'
              : lastOutcome === 'goal' ? 'The shooter beat you.' : 'You made the save!'}
          </p>

          <div style={{ background: '#1e293b', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#9ca3af' }}>Shooter</div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#ef4444' }}>{shooterScore}</div>
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#6b7280' }}>—</div>
              <div>
                <div style={{ fontSize: '12px', color: '#9ca3af' }}>Keeper</div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#3b82f6' }}>{keeperScore}</div>
              </div>
            </div>
            {isSuddenDeath && (
              <div style={{ marginTop: '12px', color: '#f59e0b', fontWeight: 700, fontSize: '14px' }}>
                🔥 SUDDEN DEATH
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={nextRound}
              style={{
                padding: '14px 32px',
                background: '#22c55e',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Next Round
            </button>
            <button
              onClick={resetGame}
              style={{
                padding: '14px 32px',
                background: '#374151',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              New Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', padding: '40px 24px', color: 'white' }}>
      <button onClick={onBack} style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', marginBottom: '24px' }}>
        ← Back to Arena
      </button>

      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        {/* Scoreboard */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', background: '#1e293b', padding: '16px 24px', borderRadius: '12px' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#9ca3af' }}>Round</div>
            <div style={{ fontSize: '24px', fontWeight: 800 }}>{round} {isSuddenDeath ? <span style={{ color: '#f59e0b' }}>(SD)</span> : `/ ${DEFAULT_PENALTY_CONFIG.roundsUntilSuddenDeath}`}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 800 }}>
              <span style={{ color: '#ef4444' }}>{shooterScore}</span>
              <span style={{ color: '#6b7280', margin: '0 12px' }}>—</span>
              <span style={{ color: '#3b82f6' }}>{keeperScore}</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', color: '#9ca3af' }}>Role</div>
            <div style={{ fontSize: '14px', fontWeight: 700, textTransform: 'capitalize' }}>{role}</div>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Shooter Panel */}
          <div style={{ background: '#1e293b', borderRadius: '12px', padding: '24px', opacity: role === 'keeper' ? 0.6 : 1 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', color: '#ef4444' }}>⚽ Shooter</h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>Aim Zone</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                {AIM_ZONES.map((z) => (
                  <button
                    key={z.id}
                    onClick={() => setShooterAim(z.id)}
                    disabled={role === 'keeper'}
                    style={{
                      padding: '10px',
                      background: shooterAim === z.id ? '#ef4444' : '#374151',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: role === 'keeper' ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {z.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>Power: {shooterPower}%</label>
              <input
                type="range"
                min={0}
                max={100}
                value={shooterPower}
                disabled={role === 'keeper'}
                onChange={(e) => setShooterPower(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#ef4444' }}
              />
            </div>
          </div>

          {/* Keeper Panel */}
          <div style={{ background: '#1e293b', borderRadius: '12px', padding: '24px', opacity: role === 'shooter' ? 0.6 : 1 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', color: '#3b82f6' }}>🧤 Keeper</h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>Dive Zone</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                {AIM_ZONES.map((z) => (
                  <button
                    key={z.id}
                    onClick={() => setKeeperDive(z.id)}
                    disabled={role === 'shooter'}
                    style={{
                      padding: '10px',
                      background: keeperDive === z.id ? '#3b82f6' : '#374151',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: role === 'shooter' ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {z.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>Commit Timing</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                {TIMING_OPTIONS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setKeeperTiming(t.id)}
                    disabled={role === 'shooter'}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: keeperTiming === t.id ? '#3b82f6' : '#374151',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: role === 'shooter' ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <button
            onClick={takeShot}
            style={{
              padding: '16px 64px',
              background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '20px',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            TAKE THE SHOT
          </button>
        </div>

        {roundHistory.length > 0 && (
          <div style={{ marginTop: '32px', background: '#1e293b', borderRadius: '12px', padding: '16px' }}>
            <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>History</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {roundHistory.map((h, i) => (
                <span key={i} style={{ fontSize: '12px', background: '#0f172a', padding: '6px 10px', borderRadius: '6px' }}>
                  {h}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
