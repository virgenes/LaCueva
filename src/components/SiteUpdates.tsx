import React from 'react';
import { GameCard } from './GameCard';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface Update {
  date: Date;
  title: string;
  link?: string;
}

const updates: Update[] = [
  { date: new Date(), title: '¡Página web creada! Bienvenidos a La Cueva de los Vírgenes', link: '#' },
  { date: subDays(new Date(), 1), title: 'Se agregó sección de videojuegos con interfaz retro', link: '#' },
  { date: subDays(new Date(), 2), title: 'Nueva cuenta de TikTok creada, ¡síguenos!', link: 'https://www.tiktok.com/@cuevadelosvirgenes0' },
  { date: subDays(new Date(), 3), title: 'Configurado el reproductor de música retro', link: '#' },
  { date: subDays(new Date(), 5), title: 'Galería de arte en construcción...', link: '#' },
];

export const SiteUpdates: React.FC = () => {
  const { playClick, playHover } = useSoundEffects();

  return (
    <GameCard hoverable={false} className="mt-6">
      <h2 className="font-pixel text-sm text-primary mb-4 flex items-center gap-2 pb-3 border-b-2 border-dashed border-border">
        <span className="text-star-gold animate-sparkle">📝</span>
        ACTUALIZACIONES DEL SITIO
      </h2>

      <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar">
        {updates.map((update, index) => (
          <div 
            key={index}
            className="flex gap-3 group cursor-pointer hover:bg-muted/30 p-2 rounded-sm transition-colors"
            onClick={playClick}
            onMouseEnter={playHover}
          >
            <span className="font-retro text-lg text-muted-foreground whitespace-nowrap">
              📅 {format(update.date, 'dd/MM/yyyy', { locale: es })}
            </span>
            <p className="font-cartoon text-sm text-foreground group-hover:text-primary transition-colors">
              {update.title}
              {update.link && (
                <span className="text-neon-cyan ml-1">→</span>
              )}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-border text-center">
        <button
          onClick={playClick}
          onMouseEnter={playHover}
          className="retro-btn w-full"
        >
          ✉️ Suscríbete al Newsletter
        </button>
      </div>
    </GameCard>
  );
};
