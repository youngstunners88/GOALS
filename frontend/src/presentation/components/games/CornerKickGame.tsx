/**
 * ═══════════════════════════════════════════════════════════════
 * PRESENTATION - CORNER KICK GAME
 * ═══════════════════════════════════════════════════════════════
 */

import React, { useState, useCallback } from 'react';
import { gameEngine } from '../../../application/services/GameEngine.ts';
import type { BoxZone, CornerKickState } from '../../../domain/entities/CornerKick.ts';
import { ZONE_CONFIG } from '../../../domain/entities/CornerKick.ts';

interface CornerKickGameProps {
  readonly onBack: () => void;
}

const ZONES: BoxZone[] = ['A', 'B', 'C', 'D', 'E', 'F'];

export const CornerKickGame: React.FC<CornerKickGameProps> = ({ onBack }) => {
  const [gameState, setGameState] = useState<CornerKickState | null>(null);
  const [selectedZone, setSelectedZone] = useState<BoxZone>('A');
  const [supplyAmount, setSupplyAmount] = useState<number>(10);
  const [walletAddress] = useState<string>('0xPlayer...');
  const [phase, setPhase] = useState<'setup' | 'supply' | 'crossed' | 'resolved'>('setup');
  const [log, setLog] = useState<string[]>([]);

  const startGame = useCallback(() => {
    const { state } = gameEngine.createCornerGame('De Bruyne', 67);
    setGameState(state);
    setPhase('supply');
    setLog(['Corner kick awarded. Taker: De Bruyne (67\')']);
  }, []);

  const supply = useCallback(() => {
    if (!gameState) return;
    const updated = gameEngine.supplyCornerZone(gameState.cornerId, selectedZone, walletAddress, supplyAmount);
    setGameState(updated);
    setLog(prev => [...prev, `Supplied ${supplyAmount} $GOALS to Zone ${selectedZone}`]);
  }, [gameState, selectedZone, supplyAmount, walletAddress]);

  const boost = useCallback(() => {
    if (!gameState) return;
    const updated = gameEngine.boostCornerZone(gameState.cornerId, selectedZone, walletAddress, 5);
    setGameState(updated);
    setLog(prev => [...prev, `Burned 5 $GOALS to boost Zone ${selectedZone}`]);
  }, [gameState, selectedZone, walletAddress]);

  const takeCorner = useCallback(() => {
    if (!gameState) return;
    setPhase('crossed');
    setLog(prev => [...prev, 'Corner taken... ball is in the air...']);
    setTimeout(() => {
      const goalScored = Math.random() > 0.65;
      const goalZone = goalScored ? selectedZone : null;
      const goalType = goalScored
        ? (['direct_header', 'volley', 'rebound_scramble'] as const)[Math.floor(Math.random() * 3)]
        : null;
      const updated = gameEngine.resolveCornerGame(gameState.cornerId, goalScored, goalZone ?? undefined, goalType ?? undefined);
      setGameState(updated);
      setPhase('resolved');
      if (goalScored && goalZone && goalType) {
        const payout = updated.result?.payoutMultiplier ?? 0;
        setLog(prev => [...prev, `GOAL! Zone ${goalZone} — ${goalType.replace('_', ' ')} — ${payout.toFixed(2)}x payout!`]);
      } else {
        setLog(prev => [...prev, 'Cleared. 80% returned. 20% rolls to jackpot.']);
      }
    }, 1500);
  }, [gameState, selectedZone]);

  if (phase === 'setup') {
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', padding: '40px 24px', color: 'white' }}>
        <button onClick={onBack} style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', marginBottom: '24px' }}>
          ← Back to Arena
        </button>
        <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📐</div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, margin: '0 0 12px' }}>Corner Kicks</h1>
          <p style={{ color: '#9ca3af', marginBottom: '32px' }}>
            Supply liquidity to zones in the penalty box. If a goal is scored from your zone,
            you earn a burst yield. Burn $GOALS to boost multipliers.
          </p>
          <button
            onClick={startGame}
            style={{
              padding: '16px 48px',
              background: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '18px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Enter the Box
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', padding: '40px 24px', color: 'white' }}>
      <button onClick={onBack} style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', marginBottom: '24px' }}>
        ← Back to Arena
      </button>

      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '24px' }}>Corner Kick — {gameState?.takerName} ({gameState?.matchMinute}')</h2>
          <div style={{ color: '#9ca3af', fontSize: '14px' }}>Jackpot Pool: {gameState?.jackpotPool.toFixed(2)} $GOALS</div>
        </div>

        {/* Zone Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
          {ZONES.map((z) => {
            const zone = gameState?.zones[z];
            const isSelected = selectedZone === z;
            return (
              <button
                key={z}
                onClick={() => setSelectedZone(z)}
                disabled={phase !== 'supply'}
                style={{
                  background: isSelected ? '#22c55e' : '#1e293b',
                  border: `2px solid ${isSelected ? '#22c55e' : '#374151'}`,
                  borderRadius: '12px',
                  padding: '16px',
                  color: 'white',
                  cursor: phase === 'supply' ? 'pointer' : 'default',
                  textAlign: 'left',
                }}
              >
                <div style={{ fontSize: '20px', fontWeight: 800, marginBottom: '4px' }}>Zone {z}</div>
                <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '8px' }}>{ZONE_CONFIG[z].description}</div>
                <div style={{ fontSize: '12px', fontWeight: 700 }}>{zone?.baseMultiplier}x base</div>
                <div style={{ fontSize: '12px', color: '#22c55e' }}>{zone?.totalLiquidity.toFixed(2)} $GOALS supplied</div>
                {zone && zone.boostMultiplier > 1 && (
                  <div style={{ fontSize: '11px', color: '#f59e0b', marginTop: '4px' }}>🔥 Boosted</div>
                )}
              </button>
            );
          })}
        </div>

        {/* Actions */}
        {phase === 'supply' && (
          <div style={{ background: '#1e293b', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Amount</label>
                <input
                  type="number"
                  value={supplyAmount}
                  onChange={(e) => setSupplyAmount(Number(e.target.value))}
                  style={{ background: '#0f172a', border: '1px solid #374151', borderRadius: '8px', padding: '10px', color: 'white', width: '120px' }}
                />
              </div>
              <button
                onClick={supply}
                style={{
                  padding: '12px 24px',
                  background: '#22c55e',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Supply to Zone {selectedZone}
              </button>
              <button
                onClick={boost}
                style={{
                  padding: '12px 24px',
                  background: '#f59e0b',
                  color: '#0f172a',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Burn to Boost
              </button>
              <button
                onClick={takeCorner}
                style={{
                  padding: '12px 24px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  marginLeft: 'auto',
                }}
              >
                Take Corner
              </button>
            </div>
          </div>
        )}

        {phase === 'crossed' && (
          <div style={{ textAlign: 'center', padding: '40px', background: '#1e293b', borderRadius: '12px', marginBottom: '24px' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚽💨</div>
            <div style={{ fontSize: '18px', fontWeight: 700 }}>Ball is in the air...</div>
          </div>
        )}

        {phase === 'resolved' && gameState?.result && (
          <div style={{ textAlign: 'center', padding: '32px', background: '#1e293b', borderRadius: '12px', marginBottom: '24px' }}>
            {gameState.result.goalScored ? (
              <>
                <div style={{ fontSize: '48px', marginBottom: '8px' }}>⚽🥅</div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#22c55e' }}>GOAL from Zone {gameState.result.goalZone}!</div>
                <div style={{ fontSize: '16px', color: '#9ca3af', marginTop: '8px' }}>
                  Payout multiplier: {gameState.result.payoutMultiplier.toFixed(2)}x
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: '48px', marginBottom: '8px' }}>🛡️</div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#9ca3af' }}>Cleared</div>
                <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>
                  80% returned. 20% added to next corner jackpot.
                </div>
              </>
            )}
            <button
              onClick={() => { setPhase('setup'); setGameState(null); }}
              style={{
                marginTop: '24px',
                padding: '12px 32px',
                background: '#374151',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Play Again
            </button>
          </div>
        )}

        {/* Log */}
        <div style={{ background: '#1e293b', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>Event Log</div>
          {log.map((l, i) => (
            <div key={i} style={{ fontSize: '13px', padding: '4px 0', borderBottom: '1px solid #374151', color: '#e5e7eb' }}>
              {l}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
