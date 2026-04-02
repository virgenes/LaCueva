import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useSettings } from '@/contexts/SettingsContext';
import { X, Trophy, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface ReactionGameProps {
  onClose: () => void;
}

type GameState = 'waiting' | 'ready' | 'go' | 'result' | 'tooEarly';

export const ReactionGame: React.FC<ReactionGameProps> = ({ onClose }) => {
  const { playClick, playHover, playSecretDiscovered } = useSoundEffects();
  const { language } = useSettings();
  const [gameState, setGameState] = useState<GameState>('waiting');
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const [attempts, setAttempts] = useState<number[]>([]);
  const startTimeRef = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isSpanish = language === 'es';

  useEffect(() => {
    const saved = localStorage.getItem('cave-reaction-best');
    if (saved) setBestTime(parseInt(saved));
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const startRound = useCallback(() => {
    playClick();
    setGameState('ready');
    setReactionTime(null);

    const delay = 2000 + Math.random() * 3000; // 2-5 seconds
    timeoutRef.current = setTimeout(() => {
      setGameState('go');
      startTimeRef.current = Date.now();
    }, delay);
  }, [playClick]);

  const handleClick = useCallback(() => {
    if (gameState === 'waiting' || gameState === 'result' || gameState === 'tooEarly') {
      startRound();
      return;
    }

    if (gameState === 'ready') {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setGameState('tooEarly');
      return;
    }

    if (gameState === 'go') {
      const time = Date.now() - startTimeRef.current;
      setReactionTime(time);
      setGameState('result');
      setAttempts(prev => [...prev.slice(-4), time]);

      if (!bestTime || time < bestTime) {
        setBestTime(time);
        localStorage.setItem('cave-reaction-best', time.toString());
        playSecretDiscovered();
      } else {
        playClick();
      }
    }
  }, [gameState, bestTime, playClick, playSecretDiscovered, startRound]);

  const getAverageTime = useCallback(() => {
    if (attempts.length === 0) return null;
    return Math.round(attempts.reduce((a, b) => a + b, 0) / attempts.length);
  }, [attempts]);

  const getReactionRating = useCallback((time: number) => {
    if (time < 200) return { text: isSpanish ? '¡INCREÍBLE!' : 'INCREDIBLE!', color: 'text-star-gold' };
    if (time < 250) return { text: isSpanish ? '¡EXCELENTE!' : 'EXCELLENT!', color: 'text-neon-cyan' };
    if (time < 300) return { text: isSpanish ? '¡MUY BIEN!' : 'VERY GOOD!', color: 'text-green-400' };
    if (time < 400) return { text: isSpanish ? 'BIEN' : 'GOOD', color: 'text-neon-pink' };
    return { text: isSpanish ? 'SIGUE INTENTANDO' : 'KEEP TRYING', color: 'text-muted-foreground' };
  }, [isSpanish]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === ' ') handleClick();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, handleClick]);

  const average = getAverageTime();

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-2 sm:p-4 bg-night-deep/95 backdrop-blur-sm">
      <div className="game-card p-3 sm:p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="font-pixel text-sm sm:text-lg text-star-gold flex items-center gap-2">
            <Zap size={18} /> {isSpanish ? 'REACCIÓN' : 'REACTION'}
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
            <span className="font-pixel text-[7px] sm:text-[8px] text-muted-foreground flex items-center justify-center gap-1">
              <Trophy size={8} /> BEST
            </span>
            <p className="font-pixel text-sm sm:text-lg text-star-gold">
              {bestTime ? `${bestTime}ms` : '-'}
            </p>
          </div>
          <div className="game-card px-3 py-1 text-center">
            <span className="font-pixel text-[7px] sm:text-[8px] text-muted-foreground">
              {isSpanish ? 'PROMEDIO' : 'AVERAGE'}
            </span>
            <p className="font-pixel text-sm sm:text-lg text-neon-cyan">
              {average ? `${average}ms` : '-'}
            </p>
          </div>
        </div>

        {/* Game Area */}
        <motion.button
          onClick={handleClick}
          whileTap={{ scale: 0.98 }}
          className={`w-full aspect-[4/3] rounded-sm flex flex-col items-center justify-center transition-colors
            ${gameState === 'waiting' ? 'bg-neon-cyan/20 border-2 border-neon-cyan' : ''}
            ${gameState === 'ready' ? 'bg-neon-pink/20 border-2 border-neon-pink' : ''}
            ${gameState === 'go' ? 'bg-green-500/30 border-2 border-green-500 animate-pulse' : ''}
            ${gameState === 'result' ? 'bg-star-gold/20 border-2 border-star-gold' : ''}
            ${gameState === 'tooEarly' ? 'bg-red-500/20 border-2 border-red-500' : ''}`}
        >
          {gameState === 'waiting' && (
            <>
              <span className="text-4xl mb-2">👆</span>
              <p className="font-pixel text-xs sm:text-sm text-neon-cyan">
                {isSpanish ? 'TOCA PARA EMPEZAR' : 'TAP TO START'}
              </p>
            </>
          )}
          {gameState === 'ready' && (
            <>
              <span className="text-4xl mb-2">⏳</span>
              <p className="font-pixel text-xs sm:text-sm text-neon-pink">
                {isSpanish ? 'ESPERA EL VERDE...' : 'WAIT FOR GREEN...'}
              </p>
            </>
          )}
          {gameState === 'go' && (
            <>
              <span className="text-5xl mb-2">⚡</span>
              <p className="font-pixel text-lg sm:text-xl text-green-400">
                {isSpanish ? '¡AHORA!' : 'NOW!'}
              </p>
            </>
          )}
          {gameState === 'result' && reactionTime && (
            <>
              <span className="text-4xl mb-2">🎯</span>
              <p className="font-pixel text-2xl sm:text-3xl text-star-gold mb-1">
                {reactionTime}ms
              </p>
              <p className={`font-pixel text-xs ${getReactionRating(reactionTime).color}`}>
                {getReactionRating(reactionTime).text}
              </p>
              <p className="font-retro text-[10px] text-muted-foreground mt-2">
                {isSpanish ? 'Toca para intentar de nuevo' : 'Tap to try again'}
              </p>
            </>
          )}
          {gameState === 'tooEarly' && (
            <>
              <span className="text-4xl mb-2">❌</span>
              <p className="font-pixel text-sm text-red-400">
                {isSpanish ? '¡MUY PRONTO!' : 'TOO EARLY!'}
              </p>
              <p className="font-retro text-[10px] text-muted-foreground mt-2">
                {isSpanish ? 'Toca para intentar de nuevo' : 'Tap to try again'}
              </p>
            </>
          )}
        </motion.button>

        {/* Recent attempts */}
        {attempts.length > 0 && (
          <div className="mt-4 flex justify-center gap-2">
            {attempts.map((time, i) => (
              <span 
                key={i} 
                className="font-pixel text-[10px] text-muted-foreground px-2 py-1 bg-muted/30 rounded-sm"
              >
                {time}ms
              </span>
            ))}
          </div>
        )}

        {/* Instructions */}
        <p className="text-center mt-4 font-retro text-[10px] sm:text-xs text-muted-foreground">
          {isSpanish ? 'ESPACIO o click cuando veas verde' : 'SPACE or click when you see green'}
        </p>
      </div>
    </div>
  );
};
