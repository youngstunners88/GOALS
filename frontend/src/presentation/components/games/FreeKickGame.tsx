/**
 * ═══════════════════════════════════════════════════════════════
 * PRESENTATION - FREE KICK GAME
 * ═══════════════════════════════════════════════════════════════
 */

import React, { useState, useCallback } from 'react';
import { gameEngine } from '../../../application/services/GameEngine.ts';
import type { FreeKickState, ShotType } from '../../../domain/entities/FreeKick.ts';
import { RISK_TIER_CONFIG, SHOT_TYPE_MODIFIER, calculateRiskTier } from '../../../domain/entities/FreeKick.ts';

interface FreeKickGameProps {
  readonly onBack: () => void;
}

const SHOT_TYPES: { id: ShotType; label: string; description: string }[] = [
  { id: 'power_shot', label: 'Power Shot', description: 'Over the wall — high variance' },
  { id: 'curve_ball', label: 'Curve Ball', description: 'Around the wall — lower variance' },
  { id: 'chip', label: 'Chip', description: 'Over jumping wall — highest payout' },
];

export const FreeKickGame: React.FC<FreeKickGameProps> = ({ onBack }) => {
  const [gameState, setGameState] = useState<FreeKickState | null>(null);
  const [phase, setPhase] = useState<'setup' | 'stake' | 'taken' | 'resolved'>('setup');
  const [distance, setDistance] = useState<number>(24);
  const [angle, setAngle] = useState<number>(18);
  const [wallHeight, setWallHeight] = useState<number>(4);
  const [pressureIndex, setPressureIndex] = useState<number>(1.0);
  const [selectedShot, setSelectedShot] = useState<ShotType>('power_shot');
  const [collateral, setCollateral] = useState<number>(50);
  const [borrowed, setBorrowed] = useState<number>(50);
  const [walletAddress] = useState<string>('0xPlayer...');
  const [log, setLog] = useState<string[]>([]);

  const riskTier = calculateRiskTier(distance, angle);
  const tierConfig = RISK_TIER_CONFIG[riskTier];

  const startGame = useCallback(() => {
    const { state } = gameEngine.createFreeKickGame('Messi', distance, angle, wallHeight, pressureIndex);
    setGameState(state);
    setPhase('stake');
    setLog([`Free kick awarded. ${distance} yards, ${angle}°. Risk tier: ${riskTier.toUpperCase()}.`]);
  }, [distance, angle, wallHeight, pressureIndex, riskTier]);

  const placeStake = useCallback(() => {
    if (!gameState) return;
    const updated = gameEngine.stakeFreeKick(gameState.kickId, walletAddress, collateral, borrowed, selectedShot);
    setGameState(updated);
    setLog(prev => [...prev, `Staked ${collateral} collateral + ${borrowed} borrowed. Shot: ${selectedShot.replace('_', ' ')}.`]);
  }, [gameState, walletAddress, collateral, borrowed, selectedShot]);

  const takeKick = useCallback(() => {
    if (!gameState) return;
    setPhase('taken');
    setLog(prev => [...prev, 'Free kick taken...']);
    setTimeout(() => {
      const updated = gameEngine.resolveFreeKickGame(gameState.kickId, 0.12, 0.68);
      setGameState(updated);
      setPhase('resolved');
      if (updated.result?.outcome === 'goal') {
        setLog(prev => [...prev, `GOAL! ${updated.result?.payoutMultiplier.toFixed(2)}x payout!`]);
      } else if (updated.result?.outcome === 'save') {
        setLog(prev => [...prev, 'Saved by the keeper. Borrowed repaid.']);
      } else {
        setLog(prev => [...prev, `Missed. ${updated.result?.collateralBurned.toFixed(2)} burned. ${updated.result?.collateralRedistributed.toFixed(2)} to lenders.`]);
      }
    }, 1500);
  }, [gameState]);

  if (phase === 'setup') {
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', padding: '40px 24px', color: 'white' }}>
        <button onClick={onBack} style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', marginBottom: '24px' }}>
          ← Back to Arena
        </button>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎯</div>
            <h1 style={{ fontSize: '32px', fontWeight: 800, margin: '0 0 12px' }}>Free Kicks</h1>
            <p style={{ color: '#9ca3af' }}>
              Borrow $GOALS to take shots from dangerous positions. The farther out and riskier the angle, the higher the payout.
            </p>
          </div>

          <div style={{ background: '#1e293b', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px' }}>Kick Parameters</h3>
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Distance: {distance} yards</label>
                <input type="range" min={15} max={40} value={distance} onChange={(e) => setDistance(Number(e.target.value))} style={{ width: '100%', accentColor: '#3b82f6' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Angle: {angle}°</label>
                <input type="range" min={0} max={60} value={angle} onChange={(e) => setAngle(Number(e.target.value))} style={{ width: '100%', accentColor: '#3b82f6' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Wall Height: {wallHeight} players</label>
                <input type="range" min={1} max={7} value={wallHeight} onChange={(e) => setWallHeight(Number(e.target.value))} style={{ width: '100%', accentColor: '#3b82f6' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Match Pressure</label>
                <select
                  value={pressureIndex}
                  onChange={(e) => setPressureIndex(Number(e.target.value))}
                  style={{ background: '#0f172a', border: '1px solid #374151', borderRadius: '8px', padding: '10px', color: 'white', width: '100%' }}
                >
                  <option value={1.0}>Group Stage</option>
                  <option value={1.2}>Round of 16</option>
                  <option value={1.4}>Quarter Final</option>
                  <option value={1.6}>Semi Final</option>
                  <option value={1.8}>Final</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ background: '#1e293b', borderRadius: '12px', padding: '20px', marginBottom: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '4px' }}>Risk Tier</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: riskTier === 'safe' ? '#22c55e' : riskTier === 'standard' ? '#3b82f6' : riskTier === 'bold' ? '#f59e0b' : '#ef4444' }}>
              {riskTier.toUpperCase()}
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>{tierConfig.distance} | {tierConfig.angle} | {tierConfig.basePayout}x payout</div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <button
              onClick={startGame}
              style={{
                padding: '16px 48px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '18px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Set Up the Kick
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
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '24px' }}>{gameState?.takerName} — Free Kick</h2>
          <div style={{ color: '#9ca3af', fontSize: '14px' }}>
            {distance} yards | {angle}° | Wall: {wallHeight} | {riskTier.toUpperCase()}
          </div>
        </div>

        {/* Shot Selection */}
        {phase === 'stake' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
              {SHOT_TYPES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedShot(s.id)}
                  style={{
                    background: selectedShot === s.id ? '#3b82f6' : '#1e293b',
                    border: `2px solid ${selectedShot === s.id ? '#3b82f6' : '#374151'}`,
                    borderRadius: '12px',
                    padding: '16px',
                    color: 'white',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: '4px' }}>{s.label}</div>
                  <div style={{ fontSize: '11px', color: '#9ca3af' }}>{s.description}</div>
                  <div style={{ fontSize: '12px', color: '#22c55e', marginTop: '8px' }}>{SHOT_TYPE_MODIFIER[s.id].payoutBonus}x bonus</div>
                </button>
              ))}
            </div>

            <div style={{ background: '#1e293b', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '16px' }}>Stake</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Collateral (50%)</label>
                  <input
                    type="number"
                    value={collateral}
                    onChange={(e) => setCollateral(Number(e.target.value))}
                    style={{ background: '#0f172a', border: '1px solid #374151', borderRadius: '8px', padding: '10px', color: 'white', width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Borrowed (50%)</label>
                  <input
                    type="number"
                    value={borrowed}
                    onChange={(e) => setBorrowed(Number(e.target.value))}
                    style={{ background: '#0f172a', border: '1px solid #374151', borderRadius: '8px', padding: '10px', color: 'white', width: '100%' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={placeStake}
                  style={{
                    padding: '12px 24px',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Place Stake
                </button>
                <button
                  onClick={takeKick}
                  style={{
                    padding: '12px 24px',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Take the Shot
                </button>
              </div>
            </div>
          </>
        )}

        {phase === 'taken' && (
          <div style={{ textAlign: 'center', padding: '40px', background: '#1e293b', borderRadius: '12px', marginBottom: '24px' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚽🌪️</div>
            <div style={{ fontSize: '18px', fontWeight: 700 }}>The ball is curling toward goal...</div>
          </div>
        )}

        {phase === 'resolved' && gameState?.result && (
          <div style={{ textAlign: 'center', padding: '32px', background: '#1e293b', borderRadius: '12px', marginBottom: '24px' }}>
            {gameState.result.outcome === 'goal' ? (
              <>
                <div style={{ fontSize: '48px', marginBottom: '8px' }}>⚽🥅</div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#22c55e' }}>GOAL!</div>
                <div style={{ fontSize: '16px', color: '#9ca3af', marginTop: '8px' }}>
                  Payout: {gameState.result.payoutMultiplier.toFixed(2)}x
                </div>
              </>
            ) : gameState.result.outcome === 'save' ? (
              <>
                <div style={{ fontSize: '48px', marginBottom: '8px' }}>🧤</div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#3b82f6' }}>Saved</div>
                <div style={{ fontSize: '14px', color: '#9ca3af', marginTop: '8px' }}>
                  Borrowed repaid. Collateral returned minus interest.
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: '48px', marginBottom: '8px' }}>❌</div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#ef4444' }}>Missed / Blocked</div>
                <div style={{ fontSize: '14px', color: '#9ca3af', marginTop: '8px' }}>
                  {gameState.result.collateralBurned.toFixed(2)} burned. {gameState.result.collateralRedistributed.toFixed(2)} to lenders.
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
