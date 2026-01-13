import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameCard } from './GameCard';
import { PixelEmoji } from './PixelEmoji';
import { GuestBook } from './GuestBook';
import { FAQSection } from './FAQSection';
import { useSoundEffects } from '@/hooks/useSoundEffects';

interface ForYouItem {
  id: number;
  title: string;
  subtitle?: string;
  emojiType: 'chat' | 'art' | 'book' | 'mail';
  color: string;
  action: 'faq' | 'gallery' | 'guestbook';
}

const forYouItems: ForYouItem[] = [
  { id: 1, title: '¡Pregúntanos!', subtitle: 'FAQ y contacto', emojiType: 'chat', color: 'from-neon-pink to-secondary', action: 'faq' },
  { id: 2, title: 'Galería', subtitle: 'Ver arte', emojiType: 'art', color: 'from-neon-cyan to-primary', action: 'gallery' },
  { id: 3, title: 'Libro de Visitas', subtitle: 'Mensaje de Maximo', emojiType: 'book', color: 'from-star-gold to-accent', action: 'guestbook' },
];

export const ForYouSection: React.FC = () => {
  const navigate = useNavigate();
  const { playClick, playHover, playMenuOpen } = useSoundEffects();
  const [guestBookOpen, setGuestBookOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);

  const handleItemClick = (action: string) => {
    playMenuOpen();
    if (action === 'gallery') {
      navigate('/arte');
    } else if (action === 'guestbook') {
      setGuestBookOpen(true);
    } else if (action === 'faq') {
      setFaqOpen(true);
    }
  };

  return (
    <>
      <GameCard hoverable={false} className="mt-4">
        <h2 className="font-pixel text-sm text-primary mb-4 flex items-center gap-2 pb-3 border-b-2 border-dashed border-border">
          <PixelEmoji type="star" size="md" animate />
          PARA TI
        </h2>

        <div className="grid grid-cols-1 gap-3">
          {forYouItems.map((item) => (
            <div
              key={item.id}
              onClick={() => handleItemClick(item.action)}
              onMouseEnter={playHover}
              className="relative group cursor-pointer"
            >
              <div className={`
                p-3 rounded-sm border-2 border-night-deep
                bg-gradient-to-br ${item.color}
                shadow-pixel
                transition-all duration-200
                group-hover:-translate-y-1 group-hover:-translate-x-1
                group-hover:shadow-pixel-lg
              `}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="group-hover:animate-wiggle">
                    <PixelEmoji type={item.emojiType} size="md" />
                  </div>
                </div>
                <h3 className="font-pixel text-[8px] text-night-deep leading-tight">
                  {item.title}
                </h3>
                {item.subtitle && (
                  <p className="font-retro text-sm text-night-deep/80 mt-1">
                    {item.subtitle}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </GameCard>

      <GuestBook isOpen={guestBookOpen} onClose={() => setGuestBookOpen(false)} />
      <FAQSection isOpen={faqOpen} onClose={() => setFaqOpen(false)} />
    </>
  );
};
