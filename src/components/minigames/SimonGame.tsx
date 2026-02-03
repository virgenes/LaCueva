import React, { useState, useEffect, useCallback } from 'react';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useSettings } from '@/contexts/SettingsContext';
import { X, RotateCcw, Trophy, Play } from 'lucide-react';
import { motion } from 'framer-motion';

interface SimonGameProps {
  onClose: () => void;
}

const COLORS = [
  { id: 0, bg: 'bg-red-500', active: 'bg-red-300', shadow: 'shadow-[0_0_20px_rgba(239,68,68,0.8)]' },
  { id: 1, bg: 'bg-blue-500', active: 'bg-blue-300', shadow: 'shadow-[0_0_20px_rgba(59,130,246,0.8)]' },
  { id: 2, bg: 'bg-yellow-500', active: 'bg-yellow-300', shadow: 'shadow-[0_0_20px_rgba(234,179,8,0.8)]' },
  { id: 3, bg: 'bg-green-500', active: 'bg-green-300', shadow: 'shadow-[0_0_20px_rgba(34,197,94,0.8)]' },
];

type GameState = 'idle' | 'showing' | 'playing' | 'gameover';

export const SimonGame: React.FC<SimonGameProps> = ({ onClose }) => {
  const { playClick, playHover, playSecretDiscovered } = useSoundEffects();
  const { language } = useSettings();
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerSequence, setPlayerSequence] = useState<number[]>([]);
  const [activeColor, setActiveColor] = useState<number | null>(null);
  const [gameState, setGameState] = useState<GameState>('idle');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const isSpanish = language === 'es';

  useEffect(() => {
    const saved = localStorage.getItem('cave-simon-highscore');
    if (saved) setHighScore(parseInt(saved));
  }, []);

  const flashColor = useCallback((colorId: number, duration = 400) => {
    return new Promise<void>((resolve) => {
      setActiveColor(colorId);
      setTimeout(() => {
        setActiveColor(null);
        setTimeout(resolve, 100);
      }, duration);
    });
  }, []);

  const showSequence = useCallback(async (seq: number[]) => {
    setGameState('showing');
    await new Promise(r => setTimeout(r, 500));
    
    for (const colorId of seq) {
      await flashColor(colorId);
    }
    
    setGameState('playing');
    setPlayerSequence([]);
  }, [flashColor]);

  const addToSequence = useCallback(() => {
    const newColor = Math.floor(Math.random() * 4);
    const newSequence = [...sequence, newColor];
    setSequence(newSequence);
    showSequence(newSequence);
  }, [sequence, showSequence]);

  const startGame = useCallback(() => {
    playClick();
    setScore(0);
    setSequence([]);
    setPlayerSequence([]);
    const firstColor = Math.floor(Math.random() * 4);
    const newSequence = [firstColor];
    setSequence(newSequence);
    showSequence(newSequence);
  }, [playClick, showSequence]);

  const handleColorClick = useCallback(async (colorId: number) => {
    if (gameState !== 'playing') return;
    
    playClick();
    await flashColor(colorId, 200);
    
    const newPlayerSequence = [...playerSequence, colorId];
    setPlayerSequence(newPlayerSequence);

    // Check if correct
    const currentIndex = newPlayerSequence.length - 1;
    if (sequence[currentIndex] !== colorId) {
      // Wrong!
      setGameState('gameover');
      const finalScore = sequence.length - 1;
      setScore(finalScore);
      if (finalScore > highScore) {
        setHighScore(finalScore);
        localStorage.setItem('cave-simon-highscore', finalScore.toString());
      }
      return;
    }

    // Completed sequence?
    if (newPlayerSequence.length === sequence.length) {
      playSecretDiscovered();
      setScore(sequence.length);
      setTimeout(() => {
        addToSequence();
      }, 1000);
    }
  }, [gameState, playerSequence, sequence, highScore, playClick, flashColor, playSecretDiscovered, addToSequence]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-2 sm:p-4 bg-night-deep/95 backdrop-blur-sm">
      <div className="game-card p-3 sm:p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="font-pixel text-sm sm:text-lg text-neon-cyan flex items-center gap-2">
            🎵 SIMON
          </h2>
          <button
            onClick={() => { playClick(); onClose(); }}
            onMouseEnter={playHover}
            className="p-1.5 sm:p-2 rounded-sm border-2 border-neon-pink hover:bg-neon-pink/20 transition-colors"
          >
            <X size={14} className="text-neon-pink sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-4 mb-4">
          <div className="game-card px-3 py-1 text-center">
            <span className="font-pixel text-[7px] sm:text-[8px] text-muted-foreground">
              {isSpanish ? 'RONDA' : 'ROUND'}
            </span>
            <p className="font-pixel text-sm sm:text-lg text-neon-cyan">{score}</p>
          </div>
          <div className="game-card px-3 py-1 text-center">
            <span className="font-pixel text-[7px] sm:text-[8px] text-muted-foreground flex items-center justify-center gap-1">
              <Trophy size={8} /> BEST
            </span>
            <p className="font-pixel text-sm sm:text-lg text-star-gold">{highScore}</p>
          </div>
        </div>

        {/* Game Board */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4 max-w-[200px] sm:max-w-[240px] mx-auto">
          {COLORS.map((color) => (
            <motion.button
              key={color.id}
              onClick={() => handleColorClick(color.id)}
              whileTap={{ scale: 0.95 }}
              disabled={gameState !== 'playing'}
              className={`aspect-square rounded-lg transition-all duration-150
                ${activeColor === color.id ? `${color.active} ${color.shadow}` : color.bg}
                ${gameState === 'playing' ? 'cursor-pointer hover:opacity-90' : 'cursor-default'}
                border-4 border-night-deep/50`}
            />
          ))}
        </div>

        {/* Status */}
        <div className="text-center mb-4">
          {gameState === 'idle' && (
            <button
              onClick={startGame}
              onMouseEnter={playHover}
              className="flex items-center gap-2 px-6 py-3 mx-auto bg-neon-cyan text-night-deep font-pixel text-xs rounded-sm hover:shadow-neon transition-all"
            >
              <Play size={16} />
              {isSpanish ? 'JUGAR' : 'PLAY'}
            </button>
          )}
          {gameState === 'showing' && (
            <p className="font-pixel text-sm text-star-gold animate-pulse">
              {isSpanish ? '¡OBSERVA!' : 'WATCH!'}
            </p>
          )}
          {gameState === 'playing' && (
            <p className="font-pixel text-sm text-neon-cyan">
              {isSpanish ? 'TU TURNO' : 'YOUR TURN'} ({playerSequence.length}/{sequence.length})
            </p>
          )}
          {gameState === 'gameover' && (
            <div className="space-y-3">
              <p className="font-pixel text-lg text-neon-pink">
                {isSpanish ? '¡GAME OVER!' : 'GAME OVER!'}
              </p>
              <button
                onClick={startGame}
                onMouseEnter={playHover}
                className="flex items-center gap-2 px-4 py-2 mx-auto bg-neon-cyan text-night-deep font-pixel text-xs rounded-sm hover:shadow-neon transition-all"
              >
                <RotateCcw size={14} />
                {isSpanish ? 'REINTENTAR' : 'RETRY'}
              </button>
            </div>
          )}
        </div>

        {/* Instructions */}
        <p className="text-center font-retro text-[10px] sm:text-xs text-muted-foreground">
          {isSpanish 
            ? 'Repite la secuencia de colores' 
            : 'Repeat the color sequence'}
        </p>
      </div>
    </div>
  );
};
