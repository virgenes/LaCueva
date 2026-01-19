import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useSettings } from '@/contexts/SettingsContext';
import { X, RotateCcw, Trophy } from 'lucide-react';

interface PongGameProps {
  onClose: () => void;
}

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 300;
const PADDLE_HEIGHT = 60;
const PADDLE_WIDTH = 10;
const BALL_SIZE = 10;
const PADDLE_SPEED = 8;
const INITIAL_BALL_SPEED = 4;

export const PongGame: React.FC<PongGameProps> = ({ onClose }) => {
  const { playClick, playHover } = useSoundEffects();
  const { language } = useSettings();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const isSpanish = language === 'es';

  // Game state refs
  const playerY = useRef(CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2);
  const aiY = useRef(CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2);
  const ballX = useRef(CANVAS_WIDTH / 2);
  const ballY = useRef(CANVAS_HEIGHT / 2);
  const ballVX = useRef(INITIAL_BALL_SPEED);
  const ballVY = useRef(INITIAL_BALL_SPEED * (Math.random() > 0.5 ? 1 : -1));
  const keysPressed = useRef<Set<string>>(new Set());

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem('cave-pong-highscore');
    if (saved) setHighScore(parseInt(saved));
  }, []);

  const resetBall = useCallback(() => {
    ballX.current = CANVAS_WIDTH / 2;
    ballY.current = CANVAS_HEIGHT / 2;
    ballVX.current = INITIAL_BALL_SPEED * (Math.random() > 0.5 ? 1 : -1);
    ballVY.current = INITIAL_BALL_SPEED * (Math.random() > 0.5 ? 1 : -1);
  }, []);

  const resetGame = useCallback(() => {
    playClick();
    setPlayerScore(0);
    setAiScore(0);
    setIsGameOver(false);
    setIsPaused(false);
    playerY.current = CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2;
    aiY.current = CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2;
    resetBall();
  }, [playClick, resetBall]);

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
      if (keysPressed.current.has('ArrowUp') || keysPressed.current.has('w') || keysPressed.current.has('W')) {
        playerY.current = Math.max(0, playerY.current - PADDLE_SPEED);
      }
      if (keysPressed.current.has('ArrowDown') || keysPressed.current.has('s') || keysPressed.current.has('S')) {
        playerY.current = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, playerY.current + PADDLE_SPEED);
      }

      // AI movement
      const aiCenter = aiY.current + PADDLE_HEIGHT / 2;
      if (ballY.current < aiCenter - 10) {
        aiY.current = Math.max(0, aiY.current - PADDLE_SPEED * 0.6);
      } else if (ballY.current > aiCenter + 10) {
        aiY.current = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, aiY.current + PADDLE_SPEED * 0.6);
      }

      // Move ball
      ballX.current += ballVX.current;
      ballY.current += ballVY.current;

      // Ball collision with top/bottom walls
      if (ballY.current <= 0 || ballY.current >= CANVAS_HEIGHT - BALL_SIZE) {
        ballVY.current *= -1;
      }

      // Ball collision with paddles
      // Player paddle (left)
      if (
        ballX.current <= PADDLE_WIDTH + 10 &&
        ballY.current + BALL_SIZE >= playerY.current &&
        ballY.current <= playerY.current + PADDLE_HEIGHT
      ) {
        ballVX.current = Math.abs(ballVX.current) * 1.05;
        const hitPos = (ballY.current - playerY.current) / PADDLE_HEIGHT;
        ballVY.current = (hitPos - 0.5) * 8;
      }

      // AI paddle (right)
      if (
        ballX.current >= CANVAS_WIDTH - PADDLE_WIDTH - 10 - BALL_SIZE &&
        ballY.current + BALL_SIZE >= aiY.current &&
        ballY.current <= aiY.current + PADDLE_HEIGHT
      ) {
        ballVX.current = -Math.abs(ballVX.current) * 1.05;
        const hitPos = (ballY.current - aiY.current) / PADDLE_HEIGHT;
        ballVY.current = (hitPos - 0.5) * 8;
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
      if (ballX.current >= CANVAS_WIDTH) {
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
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw center line
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.moveTo(CANVAS_WIDTH / 2, 0);
      ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw paddles
      ctx.fillStyle = '#00ffff';
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 10;
      ctx.fillRect(10, playerY.current, PADDLE_WIDTH, PADDLE_HEIGHT);
      
      ctx.fillStyle = '#ff69b4';
      ctx.shadowColor = '#ff69b4';
      ctx.fillRect(CANVAS_WIDTH - PADDLE_WIDTH - 10, aiY.current, PADDLE_WIDTH, PADDLE_HEIGHT);

      // Draw ball
      ctx.fillStyle = '#ffd700';
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(ballX.current + BALL_SIZE / 2, ballY.current + BALL_SIZE / 2, BALL_SIZE / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      animationId = requestAnimationFrame(gameLoop);
    };

    animationId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationId);
  }, [isPaused, isGameOver, highScore, resetBall]);

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

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-night-deep/95 backdrop-blur-sm">
      <div className="game-card p-6" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-pixel text-lg text-neon-pink flex items-center gap-2">
            🏓 PONG
          </h2>
          <div className="flex items-center gap-2">
            <div className="game-card px-2 py-1 flex items-center gap-1">
              <Trophy size={12} className="text-star-gold" />
              <span className="font-pixel text-[10px] text-star-gold">{highScore}</span>
            </div>
            <button
              onClick={() => { playClick(); onClose(); }}
              onMouseEnter={playHover}
              className="p-2 rounded-sm border-2 border-neon-pink hover:bg-neon-pink/20 transition-colors"
            >
              <X size={16} className="text-neon-pink" />
            </button>
          </div>
        </div>

        {/* Score display */}
        <div className="flex justify-center gap-8 mb-4">
          <div className="text-center">
            <span className="font-pixel text-[8px] text-neon-cyan">{isSpanish ? 'TÚ' : 'YOU'}</span>
            <p className="font-pixel text-2xl text-neon-cyan">{playerScore}</p>
          </div>
          <span className="font-pixel text-2xl text-muted-foreground">-</span>
          <div className="text-center">
            <span className="font-pixel text-[8px] text-neon-pink">CPU</span>
            <p className="font-pixel text-2xl text-neon-pink">{aiScore}</p>
          </div>
        </div>

        {/* Game canvas */}
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="border-4 border-neon-cyan rounded-sm"
          />

          {/* Game Over / Paused Overlay */}
          {(isGameOver || isPaused) && (
            <div className="absolute inset-0 bg-night-deep/90 flex flex-col items-center justify-center rounded-sm">
              <p className="font-pixel text-lg text-neon-pink mb-2">
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
                  className="flex items-center gap-2 px-4 py-2 bg-neon-cyan text-night-deep font-pixel text-xs rounded-sm hover:shadow-neon transition-all"
                >
                  <RotateCcw size={14} />
                  {isSpanish ? 'REINICIAR' : 'RESTART'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Controls hint */}
        <p className="text-center mt-4 font-retro text-xs text-muted-foreground">
          {isSpanish 
            ? '↑↓ o WS para mover • ESPACIO para pausar • ESC para salir' 
            : '↑↓ or WS to move • SPACE to pause • ESC to exit'}
        </p>
      </div>
    </div>
  );
};