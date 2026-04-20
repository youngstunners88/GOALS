/**
 * ═══════════════════════════════════════════════════════════════
 * PRESENTATION - BATTLE PAGE (GAMING HUB)
 * ═══════════════════════════════════════════════════════════════
 */

import React, { useState } from 'react';
import { GameHub } from '../components/games/GameHub.tsx';
import { PenaltyShootoutGame } from '../components/games/PenaltyShootoutGame.tsx';
import { CornerKickGame } from '../components/games/CornerKickGame.tsx';
import { FreeKickGame } from '../components/games/FreeKickGame.tsx';
import type { ActiveGame } from '../components/games/GameHub.tsx';

export const BattlePage: React.FC = () => {
  const [activeGame, setActiveGame] = useState<ActiveGame>('hub');

  switch (activeGame) {
    case 'penalty':
      return <PenaltyShootoutGame onBack={() => setActiveGame('hub')} />;
    case 'corner':
      return <CornerKickGame onBack={() => setActiveGame('hub')} />;
    case 'freekick':
      return <FreeKickGame onBack={() => setActiveGame('hub')} />;
    default:
      return <GameHub onSelectGame={setActiveGame} />;
  }
};
