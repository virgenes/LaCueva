import React, { useState } from 'react';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useSettings } from '@/contexts/SettingsContext';
import { X, Gamepad2 } from 'lucide-react';
import { SnakeGame } from './SnakeGame';
import { PongGame } from './PongGame';
import { ClickerGame } from './ClickerGame';
import { MemoryGame } from './MemoryGame';
import { SimonGame } from './SimonGame';
import { TicTacToe } from './TicTacToe';
import { ReactionGame } from './ReactionGame';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MiniGamesHubProps {
  isOpen: boolean;
  onClose: () => void;
}

type GameType = 'snake' | 'pong' | 'clicker' | 'memory' | 'simon' | 'tictactoe' | 'reaction' | null;

const games = [
  { id: 'snake' as const, name: '🐍 Snake', nameEn: '🐍 Snake', color: 'neon-cyan', desc: 'Clásico arcade', descEn: 'Classic arcade' },
  { id: 'pong' as const, name: '🏓 Pong', nameEn: '🏓 Pong', color: 'neon-pink', desc: 'VS CPU', descEn: 'VS CPU' },
  { id: 'memory' as const, name: '🧠 Memory', nameEn: '🧠 Memory', color: 'neon-purple', desc: 'Encuentra parejas', descEn: 'Find pairs' },
  { id: 'simon' as const, name: '🎵 Simon', nameEn: '🎵 Simon', color: 'neon-cyan', desc: 'Repite secuencias', descEn: 'Repeat sequences' },
  { id: 'tictactoe' as const, name: '❌ Tic-Tac-Toe', nameEn: '❌ Tic-Tac-Toe', color: 'neon-pink', desc: 'VS Inteligencia Artificial', descEn: 'VS AI' },
  { id: 'reaction' as const, name: '⚡ Reacción', nameEn: '⚡ Reaction', color: 'star-gold', desc: 'Pon a prueba tus reflejos', descEn: 'Test your reflexes' },
  { id: 'clicker' as const, name: '⭐ Clicker Virgen', nameEn: '⭐ Virgin Clicker', color: 'star-gold', desc: 'Incremental', descEn: 'Incremental' },
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
  if (activeGame === 'memory') return <MemoryGame onClose={handleCloseGame} />;
  if (activeGame === 'simon') return <SimonGame onClose={handleCloseGame} />;
  if (activeGame === 'tictactoe') return <TicTacToe onClose={handleCloseGame} />;
  if (activeGame === 'reaction') return <ReactionGame onClose={handleCloseGame} />;

  return (
    <div 
      className="fixed inset-0 z-[250] flex items-center justify-center p-2 sm:p-4 bg-night-deep/95 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="game-card p-4 sm:p-6 max-w-md w-full max-h-[85vh] animate-bounce-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="font-pixel text-sm sm:text-lg text-primary flex items-center gap-2">
            <Gamepad2 className="text-neon-pink w-5 h-5 sm:w-6 sm:h-6" />
            {isSpanish ? 'MINI-JUEGOS' : 'MINI-GAMES'}
          </h2>
          <button
            onClick={() => { playClick(); onClose(); }}
            onMouseEnter={playHover}
            className="p-1.5 sm:p-2 rounded-sm border-2 border-neon-pink hover:bg-neon-pink/20 transition-colors"
          >
            <X size={14} className="text-neon-pink sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Games list - Scrollable */}
        <ScrollArea className="h-[55vh] sm:h-auto sm:max-h-[50vh] pr-2">
          <div className="grid grid-cols-2 sm:grid-cols-1 gap-2 sm:gap-3">
            {games.map((game) => (
              <button
                key={game.id}
                onClick={() => handleSelectGame(game.id)}
                onMouseEnter={playHover}
                className={`flex flex-col sm:flex-row items-center gap-2 sm:gap-4 p-3 sm:p-4 rounded-sm border-2 border-${game.color}/50
                  hover:border-${game.color} hover:shadow-[0_0_15px_rgba(0,255,255,0.3)]
                  hover:-translate-x-0 sm:hover:-translate-x-1 transition-all bg-muted/30 text-center sm:text-left`}
              >
                <span className="text-2xl sm:text-3xl">{game.name.split(' ')[0]}</span>
                <div className="flex-1">
                  <h3 className="font-pixel text-[10px] sm:text-sm text-foreground">
                    {game.name.split(' ').slice(1).join(' ')}
                  </h3>
                  <p className="font-retro text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
                    {isSpanish ? game.desc : game.descEn}
                  </p>
                </div>
                <span className="hidden sm:block text-neon-cyan">▶</span>
              </button>
            ))}
          </div>
        </ScrollArea>

        {/* Footer hint */}
        <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-border text-center">
          <p className="font-retro text-[10px] sm:text-xs text-muted-foreground">
            {isSpanish 
              ? '¡Escribe "VIRGEN" en cualquier momento para desbloquear un secreto!' 
              : 'Type "VIRGEN" anytime to unlock a secret!'}
          </p>
        </div>
      </div>
    </div>
  );
};