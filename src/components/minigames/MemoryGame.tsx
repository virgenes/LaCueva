import React, { useState, useEffect } from 'react';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useSettings } from '@/contexts/SettingsContext';
import { X, RotateCcw, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';

interface MemoryGameProps {
  onClose: () => void;
}

const CARD_EMOJIS = ['🎮', '🕹️', '👾', '🎲', '🏆', '⭐', '🎯', '🔥'];

interface Card {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export const MemoryGame: React.FC<MemoryGameProps> = ({ onClose }) => {
  const { playClick, playHover, playSecretDiscovered } = useSoundEffects();
  const { language } = useSettings();
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [bestScore, setBestScore] = useState<number | null>(null);
  const [isWon, setIsWon] = useState(false);

  const isSpanish = language === 'es';

  // Initialize game
  const initGame = () => {
    const shuffled = [...CARD_EMOJIS, ...CARD_EMOJIS]
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({
        id: index,
        emoji,
        isFlipped: false,
        isMatched: false,
      }));
    setCards(shuffled);
    setFlippedCards([]);
    setMoves(0);
    setMatches(0);
    setIsWon(false);
  };

  useEffect(() => {
    initGame();
    const saved = localStorage.getItem('cave-memory-best');
    if (saved) setBestScore(parseInt(saved));
  }, []);

  const handleCardClick = (id: number) => {
    if (isChecking || flippedCards.length >= 2) return;
    if (cards[id].isFlipped || cards[id].isMatched) return;

    playClick();
    const newCards = [...cards];
    newCards[id].isFlipped = true;
    setCards(newCards);
    
    const newFlipped = [...flippedCards, id];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(prev => prev + 1);
      setIsChecking(true);

      const [first, second] = newFlipped;
      if (cards[first].emoji === cards[second].emoji) {
        // Match!
        setTimeout(() => {
          playSecretDiscovered();
          const matched = [...cards];
          matched[first].isMatched = true;
          matched[second].isMatched = true;
          setCards(matched);
          setMatches(prev => prev + 1);
          setFlippedCards([]);
          setIsChecking(false);

          // Check win
          if (matches + 1 === CARD_EMOJIS.length) {
            setIsWon(true);
            const finalMoves = moves + 1;
            if (!bestScore || finalMoves < bestScore) {
              setBestScore(finalMoves);
              localStorage.setItem('cave-memory-best', finalMoves.toString());
            }
          }
        }, 300);
      } else {
        // No match
        setTimeout(() => {
          const reset = [...cards];
          reset[first].isFlipped = false;
          reset[second].isFlipped = false;
          setCards(reset);
          setFlippedCards([]);
          setIsChecking(false);
        }, 1000);
      }
    }
  };

  const handleReset = () => {
    playClick();
    initGame();
  };

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
          <h2 className="font-pixel text-sm sm:text-lg text-neon-purple flex items-center gap-2">
            🧠 MEMORY
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
        <div className="flex justify-between gap-2 mb-3 sm:mb-4">
          <div className="game-card px-2 py-1 flex-1 text-center">
            <span className="font-pixel text-[7px] sm:text-[8px] text-muted-foreground">
              {isSpanish ? 'MOVIMIENTOS' : 'MOVES'}
            </span>
            <p className="font-pixel text-xs sm:text-sm text-neon-cyan">{moves}</p>
          </div>
          <div className="game-card px-2 py-1 flex-1 text-center">
            <span className="font-pixel text-[7px] sm:text-[8px] text-muted-foreground">
              {isSpanish ? 'PAREJAS' : 'PAIRS'}
            </span>
            <p className="font-pixel text-xs sm:text-sm text-neon-pink">{matches}/{CARD_EMOJIS.length}</p>
          </div>
          <div className="game-card px-2 py-1 flex-1 text-center">
            <span className="font-pixel text-[7px] sm:text-[8px] text-muted-foreground flex items-center justify-center gap-1">
              <Trophy size={8} /> BEST
            </span>
            <p className="font-pixel text-xs sm:text-sm text-star-gold">{bestScore ?? '-'}</p>
          </div>
        </div>

        {/* Card Grid */}
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2 mb-3 sm:mb-4">
          {cards.map((card) => (
            <motion.button
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              whileTap={{ scale: 0.95 }}
              className={`aspect-square rounded-sm text-xl sm:text-2xl flex items-center justify-center transition-all duration-300
                ${card.isFlipped || card.isMatched 
                  ? 'bg-muted border-2 border-neon-cyan' 
                  : 'bg-gradient-to-br from-neon-pink to-neon-purple border-2 border-neon-pink hover:shadow-neon-pink'}
                ${card.isMatched ? 'opacity-60' : ''}`}
            >
              {(card.isFlipped || card.isMatched) ? card.emoji : '❓'}
            </motion.button>
          ))}
        </div>

        {/* Win Overlay */}
        {isWon && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 bg-night-deep/95 flex flex-col items-center justify-center rounded-sm"
          >
            <span className="text-5xl mb-3">🎉</span>
            <p className="font-pixel text-lg text-star-gold mb-2">
              {isSpanish ? '¡GANASTE!' : 'YOU WIN!'}
            </p>
            <p className="font-retro text-sm text-muted-foreground mb-4">
              {isSpanish ? `En ${moves} movimientos` : `In ${moves} moves`}
            </p>
            <button
              onClick={handleReset}
              onMouseEnter={playHover}
              className="flex items-center gap-2 px-4 py-2 bg-neon-cyan text-night-deep font-pixel text-xs rounded-sm hover:shadow-neon transition-all"
            >
              <RotateCcw size={14} />
              {isSpanish ? 'JUGAR DE NUEVO' : 'PLAY AGAIN'}
            </button>
          </motion.div>
        )}

        {/* Reset Button */}
        <button
          onClick={handleReset}
          onMouseEnter={playHover}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-muted rounded-sm border-2 border-border hover:border-neon-pink transition-all"
        >
          <RotateCcw size={12} className="text-neon-pink" />
          <span className="font-pixel text-[8px] sm:text-[9px] text-foreground">
            {isSpanish ? 'REINICIAR' : 'RESET'}
          </span>
        </button>
      </div>
    </div>
  );
};
