import React, { useState, useCallback, useEffect } from 'react';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useSettings } from '@/contexts/SettingsContext';
import { X, RotateCcw, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';

interface TicTacToeProps {
  onClose: () => void;
}

type Player = 'X' | 'O' | null;
type Board = Player[];

const WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
  [0, 4, 8], [2, 4, 6], // diagonals
];

export const TicTacToe: React.FC<TicTacToeProps> = ({ onClose }) => {
  const { playClick, playHover, playSecretDiscovered } = useSoundEffects();
  const { language } = useSettings();
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [winner, setWinner] = useState<Player | 'draw' | null>(null);
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);

  const isSpanish = language === 'es';

  useEffect(() => {
    const savedWins = localStorage.getItem('cave-tictactoe-wins');
    const savedLosses = localStorage.getItem('cave-tictactoe-losses');
    if (savedWins) setWins(parseInt(savedWins));
    if (savedLosses) setLosses(parseInt(savedLosses));
  }, []);

  const checkWinner = useCallback((b: Board): { winner: Player | 'draw' | null; line: number[] | null } => {
    for (const line of WINNING_LINES) {
      const [a, c, d] = line;
      if (b[a] && b[a] === b[c] && b[a] === b[d]) {
        return { winner: b[a], line };
      }
    }
    if (b.every(cell => cell !== null)) {
      return { winner: 'draw', line: null };
    }
    return { winner: null, line: null };
  }, []);

  const minimax = useCallback((b: Board, isMaximizing: boolean): number => {
    const result = checkWinner(b);
    if (result.winner === 'O') return 10;
    if (result.winner === 'X') return -10;
    if (result.winner === 'draw') return 0;

    if (isMaximizing) {
      let best = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (b[i] === null) {
          b[i] = 'O';
          best = Math.max(best, minimax(b, false));
          b[i] = null;
        }
      }
      return best;
    } else {
      let best = Infinity;
      for (let i = 0; i < 9; i++) {
        if (b[i] === null) {
          b[i] = 'X';
          best = Math.min(best, minimax(b, true));
          b[i] = null;
        }
      }
      return best;
    }
  }, [checkWinner]);

  const aiMove = useCallback((currentBoard: Board) => {
    let bestScore = -Infinity;
    let bestMove = -1;

    // Add some randomness for easier gameplay
    if (Math.random() < 0.3) {
      const available = currentBoard.map((c, i) => c === null ? i : -1).filter(i => i !== -1);
      if (available.length > 0) {
        bestMove = available[Math.floor(Math.random() * available.length)];
      }
    } else {
      for (let i = 0; i < 9; i++) {
        if (currentBoard[i] === null) {
          currentBoard[i] = 'O';
          const score = minimax(currentBoard, false);
          currentBoard[i] = null;
          if (score > bestScore) {
            bestScore = score;
            bestMove = i;
          }
        }
      }
    }

    if (bestMove !== -1) {
      const newBoard = [...currentBoard];
      newBoard[bestMove] = 'O';
      setBoard(newBoard);
      
      const result = checkWinner(newBoard);
      if (result.winner) {
        setWinner(result.winner);
        setWinningLine(result.line);
        if (result.winner === 'O') {
          setLosses(prev => {
            const n = prev + 1;
            localStorage.setItem('cave-tictactoe-losses', n.toString());
            return n;
          });
        }
      } else {
        setIsPlayerTurn(true);
      }
    }
  }, [checkWinner, minimax]);

  const handleCellClick = useCallback((index: number) => {
    if (board[index] || winner || !isPlayerTurn) return;
    
    playClick();
    const newBoard = [...board];
    newBoard[index] = 'X';
    setBoard(newBoard);

    const result = checkWinner(newBoard);
    if (result.winner) {
      setWinner(result.winner);
      setWinningLine(result.line);
      if (result.winner === 'X') {
        playSecretDiscovered();
        setWins(prev => {
          const n = prev + 1;
          localStorage.setItem('cave-tictactoe-wins', n.toString());
          return n;
        });
      }
    } else {
      setIsPlayerTurn(false);
      setTimeout(() => aiMove(newBoard), 500);
    }
  }, [board, winner, isPlayerTurn, playClick, checkWinner, playSecretDiscovered, aiMove]);

  const resetGame = useCallback(() => {
    playClick();
    setBoard(Array(9).fill(null));
    setIsPlayerTurn(true);
    setWinner(null);
    setWinningLine(null);
  }, [playClick]);

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
          <h2 className="font-pixel text-sm sm:text-lg text-neon-pink flex items-center gap-2">
            ❌ TIC-TAC-TOE
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
            <span className="font-pixel text-[7px] sm:text-[8px] text-neon-cyan flex items-center justify-center gap-1">
              <Trophy size={8} /> {isSpanish ? 'VICTORIAS' : 'WINS'}
            </span>
            <p className="font-pixel text-sm sm:text-lg text-neon-cyan">{wins}</p>
          </div>
          <div className="game-card px-3 py-1 text-center">
            <span className="font-pixel text-[7px] sm:text-[8px] text-neon-pink">
              {isSpanish ? 'DERROTAS' : 'LOSSES'}
            </span>
            <p className="font-pixel text-sm sm:text-lg text-neon-pink">{losses}</p>
          </div>
        </div>

        {/* Game Board */}
        <div className="grid grid-cols-3 gap-2 max-w-[200px] sm:max-w-[240px] mx-auto mb-4">
          {board.map((cell, index) => (
            <motion.button
              key={index}
              onClick={() => handleCellClick(index)}
              whileTap={{ scale: 0.95 }}
              className={`aspect-square rounded-sm text-2xl sm:text-4xl font-bold flex items-center justify-center
                border-2 transition-all
                ${winningLine?.includes(index) ? 'bg-star-gold/30 border-star-gold' : 'bg-muted border-border'}
                ${!cell && !winner ? 'hover:border-neon-cyan hover:bg-neon-cyan/10 cursor-pointer' : ''}`}
            >
              {cell === 'X' && <span className="text-neon-cyan">✕</span>}
              {cell === 'O' && <span className="text-neon-pink">○</span>}
            </motion.button>
          ))}
        </div>

        {/* Status */}
        <div className="text-center mb-4">
          {winner ? (
            <div className="space-y-3">
              <p className="font-pixel text-lg">
                {winner === 'X' && <span className="text-neon-cyan">{isSpanish ? '¡GANASTE!' : 'YOU WIN!'}</span>}
                {winner === 'O' && <span className="text-neon-pink">{isSpanish ? '¡PERDISTE!' : 'YOU LOSE!'}</span>}
                {winner === 'draw' && <span className="text-star-gold">{isSpanish ? '¡EMPATE!' : 'DRAW!'}</span>}
              </p>
              <button
                onClick={resetGame}
                onMouseEnter={playHover}
                className="flex items-center gap-2 px-4 py-2 mx-auto bg-neon-cyan text-night-deep font-pixel text-xs rounded-sm hover:shadow-neon transition-all"
              >
                <RotateCcw size={14} />
                {isSpanish ? 'JUGAR DE NUEVO' : 'PLAY AGAIN'}
              </button>
            </div>
          ) : (
            <p className="font-pixel text-sm">
              {isPlayerTurn 
                ? <span className="text-neon-cyan">{isSpanish ? 'TU TURNO (X)' : 'YOUR TURN (X)'}</span>
                : <span className="text-neon-pink animate-pulse">{isSpanish ? 'CPU PENSANDO...' : 'CPU THINKING...'}</span>}
            </p>
          )}
        </div>

        {/* Instructions */}
        <p className="text-center font-retro text-[10px] sm:text-xs text-muted-foreground">
          {isSpanish ? 'Tú juegas con X • ESC para salir' : 'You play as X • ESC to exit'}
        </p>
      </div>
    </div>
  );
};
