import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useSettings } from '@/contexts/SettingsContext';
import { X, RotateCcw, Trophy, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface Position {
  x: number;
  y: number;
}

interface SnakeGameProps {
  onClose: () => void;
}

const GRID_SIZE = 12; // Reduced for mobile
const INITIAL_SPEED = 180;
const CELL_SIZE_MOBILE = 18;
const CELL_SIZE_DESKTOP = 20;

export const SnakeGame: React.FC<SnakeGameProps> = ({ onClose }) => {
  const { playClick, playHover } = useSoundEffects();
  const { language } = useSettings();
  const [snake, setSnake] = useState<Position[]>([{ x: 6, y: 6 }]);
  const [food, setFood] = useState<Position>({ x: 4, y: 4 });
  const [direction, setDirection] = useState<'UP' | 'DOWN' | 'LEFT' | 'RIGHT'>('RIGHT');
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const gameLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const directionRef = useRef(direction);

  const isSpanish = language === 'es';
  const cellSize = isMobile ? CELL_SIZE_MOBILE : CELL_SIZE_DESKTOP;

  // Detect mobile
  useEffect(() => {
    setIsMobile(window.innerWidth < 640);
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem('cave-snake-highscore');
    if (saved) setHighScore(parseInt(saved));
  }, []);

  // Save high score
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('cave-snake-highscore', score.toString());
    }
  }, [score, highScore]);

  const generateFood = useCallback((currentSnake: Position[]): Position => {
    let newFood: Position;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    return newFood;
  }, []);

  const resetGame = useCallback(() => {
    playClick();
    const initialSnake = [{ x: 6, y: 6 }];
    setSnake(initialSnake);
    setFood(generateFood(initialSnake));
    setDirection('RIGHT');
    directionRef.current = 'RIGHT';
    setIsGameOver(false);
    setIsPaused(false);
    setScore(0);
  }, [generateFood, playClick]);

  const moveSnake = useCallback(() => {
    if (isGameOver || isPaused) return;

    setSnake(currentSnake => {
      const head = { ...currentSnake[0] };
      const dir = directionRef.current;

      switch (dir) {
        case 'UP': head.y -= 1; break;
        case 'DOWN': head.y += 1; break;
        case 'LEFT': head.x -= 1; break;
        case 'RIGHT': head.x += 1; break;
      }

      // Check wall collision
      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        setIsGameOver(true);
        return currentSnake;
      }

      // Check self collision
      if (currentSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
        setIsGameOver(true);
        return currentSnake;
      }

      const newSnake = [head, ...currentSnake];

      // Check food collision
      if (head.x === food.x && head.y === food.y) {
        setScore(prev => prev + 10);
        setFood(generateFood(newSnake));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [isGameOver, isPaused, food, generateFood]);

  // Game loop
  useEffect(() => {
    gameLoopRef.current = setInterval(moveSnake, INITIAL_SPEED - Math.min(score, 80));
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [moveSnake, score]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === ' ') {
        setIsPaused(prev => !prev);
        return;
      }

      const newDirection = {
        'ArrowUp': 'UP',
        'ArrowDown': 'DOWN',
        'ArrowLeft': 'LEFT',
        'ArrowRight': 'RIGHT',
        'w': 'UP', 'W': 'UP',
        's': 'DOWN', 'S': 'DOWN',
        'a': 'LEFT', 'A': 'LEFT',
        'd': 'RIGHT', 'D': 'RIGHT',
      }[e.key] as 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | undefined;

      if (newDirection) {
        const opposites: Record<string, string> = {
          'UP': 'DOWN', 'DOWN': 'UP', 'LEFT': 'RIGHT', 'RIGHT': 'LEFT'
        };
        if (opposites[newDirection] !== directionRef.current) {
          directionRef.current = newDirection;
          setDirection(newDirection);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Touch controls
  const handleDirection = (newDirection: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
    const opposites: Record<string, string> = {
      'UP': 'DOWN', 'DOWN': 'UP', 'LEFT': 'RIGHT', 'RIGHT': 'LEFT'
    };
    if (opposites[newDirection] !== directionRef.current) {
      playClick();
      directionRef.current = newDirection;
      setDirection(newDirection);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-2 sm:p-4 bg-night-deep/95 backdrop-blur-sm">
      <div className="game-card p-3 sm:p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-2 sm:mb-4">
          <h2 className="font-pixel text-sm sm:text-lg text-neon-cyan flex items-center gap-2">
            🐍 SNAKE
          </h2>
          <button
            onClick={() => { playClick(); onClose(); }}
            onMouseEnter={playHover}
            className="p-1.5 sm:p-2 rounded-sm border-2 border-neon-pink hover:bg-neon-pink/20 transition-colors"
          >
            <X size={14} className="text-neon-pink sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Scores */}
        <div className="flex justify-between mb-2 sm:mb-4 text-center gap-2">
          <div className="game-card px-2 sm:px-3 py-1 flex-1">
            <span className="font-pixel text-[7px] sm:text-[8px] text-muted-foreground">SCORE</span>
            <p className="font-pixel text-xs sm:text-sm text-neon-cyan">{score}</p>
          </div>
          <div className="game-card px-2 sm:px-3 py-1 flex-1">
            <span className="font-pixel text-[7px] sm:text-[8px] text-muted-foreground flex items-center justify-center gap-1">
              <Trophy size={8} /> BEST
            </span>
            <p className="font-pixel text-xs sm:text-sm text-star-gold">{highScore}</p>
          </div>
        </div>

        {/* Game Grid */}
        <div 
          className="relative bg-night-deep border-2 sm:border-4 border-neon-cyan rounded-sm mx-auto"
          style={{ 
            width: GRID_SIZE * cellSize + 4,
            height: GRID_SIZE * cellSize + 4,
          }}
        >
          {/* Grid cells */}
          {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => (
            <div
              key={i}
              className="absolute border border-muted/10"
              style={{
                width: cellSize,
                height: cellSize,
                left: (i % GRID_SIZE) * cellSize,
                top: Math.floor(i / GRID_SIZE) * cellSize,
              }}
            />
          ))}

          {/* Snake */}
          {snake.map((segment, index) => (
            <div
              key={index}
              className={`absolute rounded-sm transition-all duration-75 ${
                index === 0 
                  ? 'bg-neon-cyan shadow-neon' 
                  : 'bg-neon-cyan/70'
              }`}
              style={{
                width: cellSize,
                height: cellSize,
                left: segment.x * cellSize,
                top: segment.y * cellSize,
              }}
            />
          ))}

          {/* Food */}
          <div
            className="absolute bg-neon-pink rounded-full animate-pulse shadow-neon-pink"
            style={{
              width: cellSize,
              height: cellSize,
              left: food.x * cellSize,
              top: food.y * cellSize,
            }}
          />

          {/* Game Over / Paused Overlay */}
          {(isGameOver || isPaused) && (
            <div className="absolute inset-0 bg-night-deep/90 flex flex-col items-center justify-center">
              <p className="font-pixel text-sm sm:text-lg text-neon-pink mb-3">
                {isGameOver ? (isSpanish ? '¡GAME OVER!' : 'GAME OVER!') : (isSpanish ? 'PAUSADO' : 'PAUSED')}
              </p>
              {isGameOver && (
                <button
                  onClick={resetGame}
                  onMouseEnter={playHover}
                  className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-neon-cyan text-night-deep font-pixel text-[10px] sm:text-xs rounded-sm hover:shadow-neon transition-all"
                >
                  <RotateCcw size={12} />
                  {isSpanish ? 'REINICIAR' : 'RESTART'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Mobile Touch Controls */}
        <div className="sm:hidden mt-4 flex flex-col items-center gap-1">
          <button
            onClick={() => handleDirection('UP')}
            className="w-12 h-10 rounded-sm bg-muted border-2 border-neon-cyan/50 flex items-center justify-center active:bg-neon-cyan/30"
          >
            <ChevronUp size={24} className="text-neon-cyan" />
          </button>
          <div className="flex gap-8">
            <button
              onClick={() => handleDirection('LEFT')}
              className="w-12 h-10 rounded-sm bg-muted border-2 border-neon-cyan/50 flex items-center justify-center active:bg-neon-cyan/30"
            >
              <ChevronLeft size={24} className="text-neon-cyan" />
            </button>
            <button
              onClick={() => handleDirection('RIGHT')}
              className="w-12 h-10 rounded-sm bg-muted border-2 border-neon-cyan/50 flex items-center justify-center active:bg-neon-cyan/30"
            >
              <ChevronRight size={24} className="text-neon-cyan" />
            </button>
          </div>
          <button
            onClick={() => handleDirection('DOWN')}
            className="w-12 h-10 rounded-sm bg-muted border-2 border-neon-cyan/50 flex items-center justify-center active:bg-neon-cyan/30"
          >
            <ChevronDown size={24} className="text-neon-cyan" />
          </button>
        </div>

        {/* Controls hint - Desktop only */}
        <p className="hidden sm:block text-center mt-4 font-retro text-xs text-muted-foreground">
          {isSpanish 
            ? '↑↓←→ o WASD para mover • ESPACIO para pausar • ESC para salir' 
            : '↑↓←→ or WASD to move • SPACE to pause • ESC to exit'}
        </p>
      </div>
    </div>
  );
};