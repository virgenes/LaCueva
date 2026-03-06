import React from 'react';
import { CombatSystem } from './CombatSystem';
import { Character } from '../types/GameTypes';

interface LandscapeCombatProps {
  playerParty: Character[];
  enemies: string[];
  onVictory: (exp: number, gold: number, items: string[]) => void;
  onDefeat: () => void;
  onFlee: () => void;
}

/**
 * Landscape combat: Left/Right dual-screen layout.
 * Left = enemies, Right = party + menus.
 * Minigames transition to a single centered screen with epic animation.
 */
export const LandscapeCombat: React.FC<LandscapeCombatProps> = ({
  playerParty, enemies, onVictory, onDefeat, onFlee,
}) => {
  return (
    <div className="fixed inset-0 z-[300] bg-black">
      <CombatSystem
        playerParty={playerParty}
        enemies={enemies}
        onVictory={onVictory}
        onDefeat={onDefeat}
        onFlee={onFlee}
        landscapeMode={true}
        landscapeHorizontal={true}
      />
    </div>
  );
};
