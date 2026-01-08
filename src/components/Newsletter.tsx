import React, { useState } from 'react';
import { GameCard } from './GameCard';
import { RetroButton } from './RetroButton';
import { useSoundEffects } from '@/hooks/useSoundEffects';

export const Newsletter: React.FC = () => {
  const { playClick, playHover, playSuccess } = useSoundEffects();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = () => {
    if (email) {
      playSuccess();
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 3000);
      setEmail('');
    }
  };

  return (
    <GameCard hoverable={false} className="mt-6 text-center relative overflow-visible">
      {/* Decorative elements */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-2xl animate-float">✉️</div>
      
      <h2 className="font-pixel text-sm text-primary mb-2 mt-2">
        NEWSLETTER
      </h2>
      <h3 className="font-cartoon text-xl text-secondary mb-4">
        Cartas de FurrosPaja
      </h3>

      <p className="font-cartoon text-sm text-muted-foreground mb-4">
        ¡Suscríbete para recibir actualizaciones mensuales sobre 
        nuevos juegos, arte y eventos especiales! 🎮✨
      </p>

      {subscribed ? (
        <div className="py-4 px-6 bg-neon-cyan/20 rounded-sm border-2 border-neon-cyan animate-bounce-in">
          <span className="font-pixel text-sm text-neon-cyan">
            ✓ ¡GRACIAS POR SUSCRIBIRTE!
          </span>
        </div>
      ) : (
        <>
          <div className="relative mb-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              onFocus={playHover}
              className="w-full px-4 py-3 bg-muted border-3 border-border rounded-sm
                font-retro text-lg text-foreground placeholder:text-muted-foreground
                focus:outline-none focus:border-neon-cyan focus:shadow-neon
                transition-all"
            />
          </div>

          <RetroButton 
            variant="pink" 
            size="lg"
            onClick={handleSubscribe}
            className="w-full"
          >
            🐾 SUSCRIBIRSE
          </RetroButton>
        </>
      )}

      <button
        onClick={playClick}
        onMouseEnter={playHover}
        className="mt-3 font-retro text-lg text-muted-foreground hover:text-primary transition-colors underline"
      >
        Ver Archivo de Cartas
      </button>
    </GameCard>
  );
};
