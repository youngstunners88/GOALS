/**
 * ═══════════════════════════════════════════════════════════════
 * PRESENTATION - GAME HUB
 * ═══════════════════════════════════════════════════════════════
 */

import React from 'react';

export type ActiveGame = 'hub' | 'penalty' | 'corner' | 'freekick';

interface GameHubProps {
  readonly onSelectGame: (game: ActiveGame) => void;
}

const games = [
  {
    id: 'penalty' as ActiveGame,
    title: 'Penalty Shootout',
    tagline: 'One shot. One bet. Live or liquidated.',
    icon: '🥅',
    color: '#ef4444',
    features: ['1v1 Staking Pools', 'Sudden Death Rounds', 'Liquidation Mechanics'],
  },
  {
    id: 'corner' as ActiveGame,
    title: 'Corner Kicks',
    tagline: 'Pack the box. Supply the liquidity. Head the yield.',
    icon: '📐',
    color: '#22c55e',
    features: ['6-Zone Box LPs', 'Burn-to-Boost', 'Progressive Jackpot'],
  },
  {
    id: 'freekick' as ActiveGame,
    title: 'Free Kicks',
    tagline: 'Bend the ball. Borrow the capital. Curve the market.',
    icon: '🎯',
    color: '#3b82f6',
    features: ['Risk-Tier Engine', 'Borrow-to-Shoot', 'Multi-Oracle Resolve'],
  },
];

export const GameHub: React.FC<GameHubProps> = ({ onSelectGame }) => {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0f172a',
        padding: '60px 24px',
        color: 'white',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚔️</div>
        <h1 style={{ fontSize: '36px', fontWeight: 800, margin: '0 0 12px' }}>
          Battle Arena
        </h1>
        <p style={{ color: '#9ca3af', maxWidth: '600px', margin: '0 auto', fontSize: '16px' }}>
          Stake $GOALS on live football moments. Three mini-games. Real odds. On-chain resolution.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
          maxWidth: '960px',
          margin: '0 auto',
        }}
      >
        {games.map((game) => (
          <button
            key={game.id}
            onClick={() => onSelectGame(game.id)}
            style={{
              background: '#1e293b',
              border: `1px solid ${game.color}30`,
              borderRadius: '16px',
              padding: '32px',
              textAlign: 'left',
              cursor: 'pointer',
              color: 'white',
              transition: 'all 0.2s',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = `${game.color}80`;
              e.currentTarget.style.transform = 'translateY(-4px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = `${game.color}30`;
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{ fontSize: '40px' }}>{game.icon}</div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>{game.title}</h2>
            <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0, fontStyle: 'italic' }}>
              {game.tagline}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
              {game.features.map((f) => (
                <span
                  key={f}
                  style={{
                    fontSize: '12px',
                    color: game.color,
                    background: `${game.color}15`,
                    padding: '6px 10px',
                    borderRadius: '6px',
                    fontWeight: 600,
                  }}
                >
                  {f}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
