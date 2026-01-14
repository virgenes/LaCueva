import React, { useEffect, useState, useCallback } from 'react';
import { useSoundEffects } from '@/hooks/useSoundEffects';

const SECRET_CODE = ['V', 'I', 'R', 'G', 'E', 'N'];
// Dancing celebration GIF from Giphy (more reliable)
const GIF_URL = 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif';

export const KonamiEasterEgg: React.FC = () => {
  const [inputSequence, setInputSequence] = useState<string[]>([]);
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const { playSecretDiscovered } = useSoundEffects();

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Only track letter keys
    const key = event.key.toUpperCase();
    if (!/^[A-Z]$/.test(key)) return;

    setInputSequence(prev => {
      const newSequence = [...prev, key].slice(-SECRET_CODE.length);
      
      // Check if sequence matches
      if (newSequence.join('') === SECRET_CODE.join('')) {
        playSecretDiscovered();
        setShowEasterEgg(true);
        return [];
      }
      
      return newSequence;
    });
  }, [playSecretDiscovered]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setShowEasterEgg(false);
      setIsClosing(false);
    }, 300);
  }, []);

  // Auto-close after 8 seconds
  useEffect(() => {
    if (showEasterEgg) {
      const timer = setTimeout(handleClose, 8000);
      return () => clearTimeout(timer);
    }
  }, [showEasterEgg, handleClose]);

  if (!showEasterEgg) return null;

  return (
    <div 
      className={`fixed inset-0 z-[99999] flex items-center justify-center transition-all duration-300 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      
      {/* Content */}
      <div 
        className={`relative z-10 transition-all duration-500 ${
          isClosing ? 'scale-75 opacity-0' : 'scale-100 opacity-100'
        }`}
      >
        {/* Decorative frame */}
        <div className="relative p-2 bg-gradient-to-br from-neon-pink via-neon-cyan to-star-gold rounded-lg shadow-2xl">
          <div className="bg-night-deep p-4 rounded-md">
            {/* Title */}
            <div className="text-center mb-4">
              <h2 className="font-pixel text-xl text-neon-pink neon-text-pink animate-pulse">
                ★ SECRETO DESCUBIERTO ★
              </h2>
              <p className="font-retro text-star-gold mt-2">¡Eres un verdadero VIRGEN!</p>
            </div>
            
            {/* GIF */}
            <div className="relative overflow-hidden rounded-md border-4 border-neon-cyan shadow-neon">
              <img 
                src={GIF_URL}
                alt="Easter Egg Dance"
                className="w-80 h-auto max-w-full"
              />
            </div>
            
            {/* Click to close hint */}
            <p className="text-center mt-4 font-pixel text-xs text-muted-foreground animate-pulse">
              Click para cerrar
            </p>
          </div>
        </div>

        {/* Floating emojis */}
        <div className="absolute -top-6 -left-6 text-4xl animate-bounce">🎉</div>
        <div className="absolute -top-6 -right-6 text-4xl animate-bounce" style={{ animationDelay: '0.2s' }}>🎊</div>
        <div className="absolute -bottom-6 -left-6 text-4xl animate-bounce" style={{ animationDelay: '0.4s' }}>✨</div>
        <div className="absolute -bottom-6 -right-6 text-4xl animate-bounce" style={{ animationDelay: '0.6s' }}>🌟</div>
      </div>

      {/* Confetti effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute text-2xl animate-confetti"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          >
            {['⭐', '✦', '♦', '●', '★'][Math.floor(Math.random() * 5)]}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes confetti {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti 4s linear infinite;
        }
      `}</style>
    </div>
  );
};
