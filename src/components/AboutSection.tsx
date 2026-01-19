import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GameCard } from './GameCard';
import { PixelEmoji } from './PixelEmoji';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useSettings } from '@/contexts/SettingsContext';
import logoFurros from '@/assets/logo-furros.jpg';

export const AboutSection: React.FC = () => {
  const navigate = useNavigate();
  const { playClick, playHover } = useSoundEffects();
  const { t } = useSettings();

  return (
    <GameCard hoverable={false} className="mt-6">
      <h2 className="font-pixel text-sm text-primary mb-4 flex items-center gap-2 pb-3 border-b-2 border-dashed border-border">
        <PixelEmoji type="sparkle" size="md" animate />
        {t('section.about')}
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
            {t('about.hello')} <span className="text-neon-pink font-bold neon-text">{t('about.virgin')}</span> {t('about.potential')}, 
            {t('about.description')} <span className="text-neon-cyan font-bold neon-text">MAXIMO</span>
            {t('about.labyrinth')} <PixelEmoji type="game" size="sm" />
          </p>
          <p className="font-cartoon text-sm text-foreground mb-3">
            {t('about.explore1')} <span 
              className="text-neon-pink font-bold neon-text underline cursor-pointer hover:text-primary transition-colors"
              onClick={playClick}
              onMouseEnter={playHover}
            >
              {t('nav.explore').toLowerCase()}
            </span>
            {t('about.explore2')}
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <button 
              onClick={() => { playClick(); navigate('/juegos'); }}
              onMouseEnter={playHover}
              className="px-3 py-1.5 bg-muted rounded-sm font-retro text-sm text-muted-foreground 
                border border-border hover:border-neon-cyan hover:text-neon-cyan hover:shadow-neon 
                transition-all flex items-center gap-1"
            >
              <PixelEmoji type="game" size="sm" /> {t('nav.games')}
            </button>
            <button 
              onClick={() => { playClick(); navigate('/arte'); }}
              onMouseEnter={playHover}
              className="px-3 py-1.5 bg-muted rounded-sm font-retro text-sm text-muted-foreground 
                border border-border hover:border-neon-pink hover:text-neon-pink hover:shadow-neon-pink 
                transition-all flex items-center gap-1"
            >
              <PixelEmoji type="art" size="sm" /> {t('nav.art')}
            </button>
            <button 
              onClick={() => { playClick(); navigate('/musica'); }}
              onMouseEnter={playHover}
              className="px-3 py-1.5 bg-muted rounded-sm font-retro text-sm text-muted-foreground 
                border border-border hover:border-star-gold hover:text-star-gold hover:shadow-[0_0_10px_rgba(255,215,0,0.3)] 
                transition-all flex items-center gap-1"
            >
              <PixelEmoji type="music" size="sm" /> {t('nav.music')}
            </button>
          </div>
        </div>
      </div>
    </GameCard>
  );
};