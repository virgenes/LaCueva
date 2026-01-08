import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GameCard } from './GameCard';
import { PixelEmoji } from './PixelEmoji';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import logoFurros from '@/assets/logo-furros.jpg';

export const AboutSection: React.FC = () => {
  const navigate = useNavigate();
  const { playClick, playHover } = useSoundEffects();

  return (
    <GameCard hoverable={false} className="mt-6">
      <h2 className="font-pixel text-sm text-primary mb-4 flex items-center gap-2 pb-3 border-b-2 border-dashed border-border">
        <PixelEmoji type="sparkle" size="md" animate />
        Si eres nuevo aquí...
      </h2>

      <div className="flex gap-4">
        <div className="flex-shrink-0">
          <img 
            src={logoFurros}
            alt="Avatar"
            className="w-16 h-16 rounded-full border-3 border-neon-pink shadow-neon-pink animate-float"
          />
        </div>
        <div className="flex-1">
          <p className="font-cartoon text-sm text-foreground mb-3">
            ¡Hola! <span className="text-neon-pink font-bold neon-text">Virgen</span> en potencia, 
            estás en la guarida de estos niños olor a pescado. Revisa nuestra página para ver 
            proyectos sumamente asquerosos jijiji! Actualmente el sitio se está trabajando, 
            todo gracias a <span className="text-neon-cyan font-bold neon-text">MAXIMO</span>, 
            se ha vuelto un laberinto y hay muchas páginas que actualizar. <PixelEmoji type="game" size="sm" />
          </p>
          <p className="font-cartoon text-sm text-foreground mb-3">
            Si quieres entrar a ver qué contenido podemos traerles les recomiendo explorar 
            la zona de <span 
              className="text-neon-pink font-bold neon-text underline cursor-pointer hover:text-primary transition-colors"
              onClick={playClick}
              onMouseEnter={playHover}
            >
              explorar
            </span>, hice una guía que te puede ayudar. ¡Explica las conexiones entre todo! 
            Y si deseas un acceso más directo, puedes darle clicks a los iconitos que están abajo 
            para revisar rápidamente.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <button 
              onClick={() => { playClick(); navigate('/juegos'); }}
              onMouseEnter={playHover}
              className="px-3 py-1.5 bg-muted rounded-sm font-retro text-sm text-muted-foreground 
                border border-border hover:border-neon-cyan hover:text-neon-cyan hover:shadow-neon 
                transition-all flex items-center gap-1"
            >
              <PixelEmoji type="game" size="sm" /> Juegos
            </button>
            <button 
              onClick={() => { playClick(); navigate('/arte'); }}
              onMouseEnter={playHover}
              className="px-3 py-1.5 bg-muted rounded-sm font-retro text-sm text-muted-foreground 
                border border-border hover:border-neon-pink hover:text-neon-pink hover:shadow-neon-pink 
                transition-all flex items-center gap-1"
            >
              <PixelEmoji type="art" size="sm" /> Arte
            </button>
            <button 
              onClick={() => { playClick(); navigate('/musica'); }}
              onMouseEnter={playHover}
              className="px-3 py-1.5 bg-muted rounded-sm font-retro text-sm text-muted-foreground 
                border border-border hover:border-star-gold hover:text-star-gold hover:shadow-[0_0_10px_rgba(255,215,0,0.3)] 
                transition-all flex items-center gap-1"
            >
              <PixelEmoji type="music" size="sm" /> Música
            </button>
          </div>
        </div>
      </div>
    </GameCard>
  );
};
