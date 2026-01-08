import React, { useState } from 'react';
import { GameCard } from './GameCard';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface FeedItem {
  id: number;
  date: Date;
  content: string;
  link?: string;
  emoji: string;
}

// ============================================================
// NEWSFEED - FÁCIL DE EDITAR
// Para agregar noticias, simplemente copia el formato abajo:
// { id: NÚMERO, date: new Date() o subDays(new Date(), DÍAS_ATRÁS), content: 'TU TEXTO', emoji: 'EMOJI', link: 'URL_OPCIONAL' }
// ============================================================

const feedItems: FeedItem[] = [
  { 
    id: 1, 
    date: new Date(), 
    content: 'SE AGREGÓ PÁGINA WEB.', 
    emoji: '🌐',
    link: '#'
  },
  { 
    id: 2, 
    date: subDays(new Date(), 1), 
    content: '¡Se creó cuenta de TikTok!', 
    emoji: '🎵',
    link: 'https://www.tiktok.com/@cuevadelosvirgenes0'
  },
  { 
    id: 3, 
    date: subDays(new Date(), 2), 
    content: '¡Ya se agregaron algunos videojuegos, véanlos!', 
    emoji: '🎮',
    link: '#'
  },
  { 
    id: 4, 
    date: subDays(new Date(), 3), 
    content: '¡Se subió nuevo video!', 
    emoji: '📺',
    link: 'https://www.youtube.com/watch?v=DHX0F4EtUg0'
  },
];

export const Newsfeed: React.FC = () => {
  const { playClick, playHover } = useSoundEffects();
  const [showAll, setShowAll] = useState(false);

  const displayedItems = showAll ? feedItems : feedItems.slice(0, 5);

  return (
    <GameCard hoverable={false} className="mt-4">
      <h2 className="font-pixel text-sm text-primary mb-4 flex items-center gap-2 pb-3 border-b-2 border-dashed border-border">
        <span className="text-neon-pink animate-sparkle">📰</span>
        NEWSFEED
      </h2>

      <div className="space-y-3">
        {displayedItems.map((item) => (
          <div 
            key={item.id}
            className="flex gap-3 p-2 rounded-sm hover:bg-muted/50 transition-colors cursor-pointer group"
            onClick={playClick}
            onMouseEnter={playHover}
          >
            <span className="text-lg group-hover:animate-wiggle">{item.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="font-retro text-lg text-muted-foreground">
                {format(item.date, 'dd/MM/yyyy', { locale: es })}
              </p>
              <p className="font-cartoon text-sm text-foreground group-hover:text-primary transition-colors">
                {item.content}
                {item.link && (
                  <span className="text-neon-cyan ml-1 underline">→</span>
                )}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-border text-center">
        <button 
          onClick={() => { playClick(); setShowAll(!showAll); }}
          onMouseEnter={playHover}
          className="font-pixel text-[10px] text-primary hover:text-neon-pink transition-colors"
        >
          {showAll ? '[ ver menos ]' : '[ ver archivo ]'}
        </button>
      </div>

      {/* Status prepucio style widget */}
      <div className="mt-4 p-3 bg-muted/30 rounded-sm border border-border">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-pixel text-[8px] text-muted-foreground">status.prepucio</span>
          <span className="w-2 h-2 rounded-full bg-neon-cyan animate-sparkle" />
        </div>
        <p className="font-retro text-lg text-foreground">
          📅 Hace 2 días
        </p>
        <p className="font-cartoon text-sm text-muted-foreground italic">
          "Trabajando en nuevos proyectos secretos... 👀"
        </p>
      </div>
    </GameCard>
  );
};
