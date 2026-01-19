import React, { useState } from 'react';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useSettings } from '@/contexts/SettingsContext';
import { X, Gamepad2 } from 'lucide-react';
import { SnakeGame } from './SnakeGame';
import { PongGame } from './PongGame';
import { ClickerGame } from './ClickerGame';

interface MiniGamesHubProps {
  isOpen: boolean;
  onClose: () => void;
}

type GameType = 'snake' | 'pong' | 'clicker' | null;

const games = [
  { id: 'snake' as const, name: '🐍 Snake', nameEn: '🐍 Snake', color: 'neon-cyan' },
  { id: 'pong' as const, name: '🏓 Pong', nameEn: '🏓 Pong', color: 'neon-pink' },
  { id: 'clicker' as const, name: '⭐ Clicker Virgen', nameEn: '⭐ Virgin Clicker', color: 'star-gold' },
];

export const MiniGamesHub: React.FC<MiniGamesHubProps> = ({ isOpen, onClose }) => {
  const { playClick, playHover, playMenuOpen } = useSoundEffects();
  const { language } = useSettings();
  const [activeGame, setActiveGame] = useState<GameType>(null);

  const isSpanish = language === 'es';

  if (!isOpen) return null;

  const handleSelectGame = (gameId: GameType) => {
    playMenuOpen();
    setActiveGame(gameId);
  };

  const handleCloseGame = () => {
    playClick();
    setActiveGame(null);
  };

  // Render active game
  if (activeGame === 'snake') return <SnakeGame onClose={handleCloseGame} />;
  if (activeGame === 'pong') return <PongGame onClose={handleCloseGame} />;
  if (activeGame === 'clicker') return <ClickerGame onClose={handleCloseGame} />;

  return (
    <div 
      className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-night-deep/95 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="game-card p-6 max-w-md w-full animate-bounce-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-pixel text-lg text-primary flex items-center gap-2">
            <Gamepad2 className="text-neon-pink" />
            {isSpanish ? 'MINI-JUEGOS' : 'MINI-GAMES'}
          </h2>
          <button
            onClick={() => { playClick(); onClose(); }}
            onMouseEnter={playHover}
            className="p-2 rounded-sm border-2 border-neon-pink hover:bg-neon-pink/20 transition-colors"
          >
            <X size={16} className="text-neon-pink" />
          </button>
        </div>

        {/* Games list */}
        <div className="space-y-3">
          {games.map((game) => (
            <button
              key={game.id}
              onClick={() => handleSelectGame(game.id)}
              onMouseEnter={playHover}
              className={`w-full flex items-center gap-4 p-4 rounded-sm border-2 border-${game.color}/50
                hover:border-${game.color} hover:shadow-[0_0_15px_rgba(0,255,255,0.3)]
                hover:-translate-x-1 transition-all bg-muted/30`}
            >
              <span className="text-3xl">{game.name.split(' ')[0]}</span>
              <div className="flex-1 text-left">
                <h3 className="font-pixel text-sm text-foreground">
                  {isSpanish ? game.name : game.nameEn}
                </h3>
                <p className="font-retro text-xs text-muted-foreground">
                  {game.id === 'snake' && (isSpanish ? 'Clásico arcade' : 'Classic arcade')}
                  {game.id === 'pong' && (isSpanish ? 'VS CPU' : 'VS CPU')}
                  {game.id === 'clicker' && (isSpanish ? 'Incremental' : 'Incremental')}
                </p>
              </div>
              <span className="text-neon-cyan">▶</span>
            </button>
          ))}
        </div>

        {/* Footer hint */}
        <div className="mt-6 pt-4 border-t border-border text-center">
          <p className="font-retro text-xs text-muted-foreground">
            {isSpanish 
              ? '¡Escribe "VIRGEN" en cualquier momento para desbloquear un secreto!' 
              : 'Type "VIRGEN" anytime to unlock a secret!'}
          </p>
        </div>
      </div>
    </div>
  );
};