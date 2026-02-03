import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useSettings } from '@/contexts/SettingsContext';
import { X, RotateCcw, Trophy, ChevronUp, ChevronDown } from 'lucide-react';

interface PongGameProps {
  onClose: () => void;
}

export const PongGame: React.FC<PongGameProps> = ({ onClose }) => {
  const { playClick, playHover } = useSoundEffects();
  const { language } = useSettings();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 300, height: 200 });

  const isSpanish = language === 'es';

  // Responsive canvas size
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const maxWidth = Math.min(containerRef.current.clientWidth - 20, 400);
        setCanvasSize({
          width: maxWidth,
          height: Math.floor(maxWidth * 0.75)
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Game state refs
  const paddleHeight = canvasSize.height * 0.2;
  const paddleWidth = 8;
  const ballSize = 8;
  const paddleSpeed = canvasSize.height * 0.025;
  const initialBallSpeed = canvasSize.width * 0.012;

  const playerY = useRef(canvasSize.height / 2 - paddleHeight / 2);
  const aiY = useRef(canvasSize.height / 2 - paddleHeight / 2);
  const ballX = useRef(canvasSize.width / 2);
  const ballY = useRef(canvasSize.height / 2);
  const ballVX = useRef(initialBallSpeed);
  const ballVY = useRef(initialBallSpeed * (Math.random() > 0.5 ? 1 : -1));
  const keysPressed = useRef<Set<string>>(new Set());
  const touchDirection = useRef<'up' | 'down' | null>(null);

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem('cave-pong-highscore');
    if (saved) setHighScore(parseInt(saved));
  }, []);

  const resetBall = useCallback(() => {
    ballX.current = canvasSize.width / 2;
    ballY.current = canvasSize.height / 2;
    ballVX.current = initialBallSpeed * (Math.random() > 0.5 ? 1 : -1);
    ballVY.current = initialBallSpeed * (Math.random() > 0.5 ? 1 : -1);
  }, [canvasSize, initialBallSpeed]);

  const resetGame = useCallback(() => {
    playClick();
    setPlayerScore(0);
    setAiScore(0);
    setIsGameOver(false);
    setIsPaused(false);
    playerY.current = canvasSize.height / 2 - paddleHeight / 2;
    aiY.current = canvasSize.height / 2 - paddleHeight / 2;
    resetBall();
  }, [playClick, resetBall, canvasSize.height, paddleHeight]);

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const gameLoop = () => {
      if (isPaused || isGameOver) {
        animationId = requestAnimationFrame(gameLoop);
        return;
      }

      // Move player paddle
      if (keysPressed.current.has('ArrowUp') || keysPressed.current.has('w') || keysPressed.current.has('W') || touchDirection.current === 'up') {
        playerY.current = Math.max(0, playerY.current - paddleSpeed);
      }
      if (keysPressed.current.has('ArrowDown') || keysPressed.current.has('s') || keysPressed.current.has('S') || touchDirection.current === 'down') {
        playerY.current = Math.min(canvasSize.height - paddleHeight, playerY.current + paddleSpeed);
      }

      // AI movement
      const aiCenter = aiY.current + paddleHeight / 2;
      if (ballY.current < aiCenter - 10) {
        aiY.current = Math.max(0, aiY.current - paddleSpeed * 0.5);
      } else if (ballY.current > aiCenter + 10) {
        aiY.current = Math.min(canvasSize.height - paddleHeight, aiY.current + paddleSpeed * 0.5);
      }

      // Move ball
      ballX.current += ballVX.current;
      ballY.current += ballVY.current;

      // Ball collision with top/bottom walls
      if (ballY.current <= 0 || ballY.current >= canvasSize.height - ballSize) {
        ballVY.current *= -1;
      }

      // Ball collision with paddles
      if (
        ballX.current <= paddleWidth + 8 &&
        ballY.current + ballSize >= playerY.current &&
        ballY.current <= playerY.current + paddleHeight
      ) {
        ballVX.current = Math.abs(ballVX.current) * 1.03;
        const hitPos = (ballY.current - playerY.current) / paddleHeight;
        ballVY.current = (hitPos - 0.5) * 6;
      }

      if (
        ballX.current >= canvasSize.width - paddleWidth - 8 - ballSize &&
        ballY.current + ballSize >= aiY.current &&
        ballY.current <= aiY.current + paddleHeight
      ) {
        ballVX.current = -Math.abs(ballVX.current) * 1.03;
        const hitPos = (ballY.current - aiY.current) / paddleHeight;
        ballVY.current = (hitPos - 0.5) * 6;
      }

      // Scoring
      if (ballX.current <= 0) {
        setAiScore(prev => {
          const newScore = prev + 1;
          if (newScore >= 5) setIsGameOver(true);
          return newScore;
        });
        resetBall();
      }
      if (ballX.current >= canvasSize.width) {
        setPlayerScore(prev => {
          const newScore = prev + 1;
          if (newScore > highScore) {
            setHighScore(newScore);
            localStorage.setItem('cave-pong-highscore', newScore.toString());
          }
          if (newScore >= 5) setIsGameOver(true);
          return newScore;
        });
        resetBall();
      }

      // Draw
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

      // Draw center line
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.moveTo(canvasSize.width / 2, 0);
      ctx.lineTo(canvasSize.width / 2, canvasSize.height);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw paddles
      ctx.fillStyle = '#00ffff';
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 8;
      ctx.fillRect(8, playerY.current, paddleWidth, paddleHeight);
      
      ctx.fillStyle = '#ff69b4';
      ctx.shadowColor = '#ff69b4';
      ctx.fillRect(canvasSize.width - paddleWidth - 8, aiY.current, paddleWidth, paddleHeight);

      // Draw ball
      ctx.fillStyle = '#ffd700';
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(ballX.current + ballSize / 2, ballY.current + ballSize / 2, ballSize / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      animationId = requestAnimationFrame(gameLoop);
    };

    animationId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationId);
  }, [isPaused, isGameOver, highScore, resetBall, canvasSize, paddleHeight, paddleSpeed]);

  // Keyboard input
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
      keysPressed.current.add(e.key);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onClose]);

  // Touch handlers
  const handleTouchStart = (direction: 'up' | 'down') => {
    touchDirection.current = direction;
  };
  const handleTouchEnd = () => {
    touchDirection.current = null;
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-2 sm:p-4 bg-night-deep/95 backdrop-blur-sm">
      <div ref={containerRef} className="game-card p-3 sm:p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-2 sm:mb-4">
          <h2 className="font-pixel text-sm sm:text-lg text-neon-pink flex items-center gap-2">
            🏓 PONG
          </h2>
          <div className="flex items-center gap-2">
            <div className="game-card px-2 py-1 flex items-center gap-1">
              <Trophy size={10} className="text-star-gold" />
              <span className="font-pixel text-[8px] sm:text-[10px] text-star-gold">{highScore}</span>
            </div>
            <button
              onClick={() => { playClick(); onClose(); }}
              onMouseEnter={playHover}
              className="p-1.5 sm:p-2 rounded-sm border-2 border-neon-pink hover:bg-neon-pink/20 transition-colors"
            >
              <X size={14} className="text-neon-pink sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>

        {/* Score display */}
        <div className="flex justify-center gap-6 sm:gap-8 mb-2 sm:mb-4">
          <div className="text-center">
            <span className="font-pixel text-[7px] sm:text-[8px] text-neon-cyan">{isSpanish ? 'TÚ' : 'YOU'}</span>
            <p className="font-pixel text-xl sm:text-2xl text-neon-cyan">{playerScore}</p>
          </div>
          <span className="font-pixel text-xl sm:text-2xl text-muted-foreground">-</span>
          <div className="text-center">
            <span className="font-pixel text-[7px] sm:text-[8px] text-neon-pink">CPU</span>
            <p className="font-pixel text-xl sm:text-2xl text-neon-pink">{aiScore}</p>
          </div>
        </div>

        {/* Game canvas with touch controls */}
        <div className="flex items-center justify-center gap-2">
          {/* Left touch controls - Mobile */}
          <div className="sm:hidden flex flex-col gap-2">
            <button
              onTouchStart={() => handleTouchStart('up')}
              onTouchEnd={handleTouchEnd}
              onMouseDown={() => handleTouchStart('up')}
              onMouseUp={handleTouchEnd}
              onMouseLeave={handleTouchEnd}
              className="w-10 h-16 rounded-sm bg-muted border-2 border-neon-cyan/50 flex items-center justify-center active:bg-neon-cyan/30"
            >
              <ChevronUp size={20} className="text-neon-cyan" />
            </button>
            <button
              onTouchStart={() => handleTouchStart('down')}
              onTouchEnd={handleTouchEnd}
              onMouseDown={() => handleTouchStart('down')}
              onMouseUp={handleTouchEnd}
              onMouseLeave={handleTouchEnd}
              className="w-10 h-16 rounded-sm bg-muted border-2 border-neon-cyan/50 flex items-center justify-center active:bg-neon-cyan/30"
            >
              <ChevronDown size={20} className="text-neon-cyan" />
            </button>
          </div>

          {/* Canvas */}
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={canvasSize.width}
              height={canvasSize.height}
              className="border-2 sm:border-4 border-neon-cyan rounded-sm"
            />

            {/* Game Over / Paused Overlay */}
            {(isGameOver || isPaused) && (
              <div className="absolute inset-0 bg-night-deep/90 flex flex-col items-center justify-center rounded-sm">
                <p className="font-pixel text-sm sm:text-lg text-neon-pink mb-2">
                  {isGameOver 
                    ? (playerScore >= 5 
                      ? (isSpanish ? '¡GANASTE!' : 'YOU WIN!') 
                      : (isSpanish ? '¡PERDISTE!' : 'YOU LOSE!'))
                    : (isSpanish ? 'PAUSADO' : 'PAUSED')}
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
        </div>

        {/* Controls hint */}
        <p className="hidden sm:block text-center mt-4 font-retro text-xs text-muted-foreground">
          {isSpanish 
            ? '↑↓ o WS para mover • ESPACIO para pausar • ESC para salir' 
            : '↑↓ or WS to move • SPACE to pause • ESC to exit'}
        </p>
      </div>
    </div>
  );
};