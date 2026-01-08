import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameCard } from './GameCard';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { ChevronDown, ChevronUp, Mail, ExternalLink } from 'lucide-react';
import { ExternalLinkDialog } from './ExternalLinkDialog';

interface FAQItem {
  question: string;
  answer: React.ReactNode;
}

const faqItems: FAQItem[] = [
  {
    question: '¿De qué trata nuestro proyecto?',
    answer: (
      <p>
        Somos 6 integrantes con la razón de existir de una papa, o sea, un chiste, queremos divertirnos 
        subiendo videos, nuevos contenidos al canal y a nuestros medios, nos divertimos subiendo de 
        calidad cada uno de nuestros contenidos en cada parte que hacemos, ¡Ya verán que podemos crecer!
      </p>
    )
  },
  {
    question: '¿De dónde viene esta página Web?',
    answer: (
      <div>
        <p className="mb-2">
          De parte de nuestro gran amigo <span className="text-neon-pink font-bold neon-text">Maximo</span> que 
          es el editor del canal, narrador, excéntrico, programador y pues él quiso más que todo hacer una 
          carta de presentación, para comunicarse más no solo con la audiencia sino más que todo para contactarnos 
          y a ver si nos sale un Sugar Daddy o Sugar Mommy, necesitamos plata, el editor está cansado.
        </p>
        <p className="text-muted-foreground/70 italic text-sm mt-3">
          (JAJAJAJ, es gracioso hablar en tercera persona, maldita sea, qué hago con mi vida)
        </p>
      </div>
    )
  },
  {
    question: '¿Quiénes son?',
    answer: (
      <div>
        <p className="mb-3">
          Estamos conformados por 6 personas actualmente (Tal vez menos, tal vez más) pero por ahora somos:
        </p>
        <ul className="space-y-1 font-retro text-base">
          <li className="flex items-center gap-2">
            <span className="text-neon-cyan">▸</span>
            <span className="text-neon-pink font-bold">Maximo</span> - Editor, programador, narrador
          </li>
          <li className="flex items-center gap-2">
            <span className="text-neon-cyan">▸</span>
            <span className="text-star-gold font-bold">Elias</span> - Ayudante, narrador
          </li>
          <li className="flex items-center gap-2">
            <span className="text-neon-cyan">▸</span>
            <span className="text-accent font-bold">Angel</span> - Narrador
          </li>
          <li className="flex items-center gap-2">
            <span className="text-neon-cyan">▸</span>
            <span className="text-neon-purple font-bold">Matias</span> - Narrador
          </li>
          <li className="flex items-center gap-2">
            <span className="text-neon-cyan">▸</span>
            <span className="text-secondary font-bold">Alejandro</span> - Narrador
          </li>
          <li className="flex items-center gap-2">
            <span className="text-neon-cyan">▸</span>
            <span className="text-primary font-bold">Miguel</span> - Narrador
          </li>
        </ul>
      </div>
    )
  }
];

interface FAQSectionProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FAQSection: React.FC<FAQSectionProps> = ({ isOpen, onClose }) => {
  const { playClick, playHover } = useSoundEffects();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const [externalLink, setExternalLink] = useState<{ isOpen: boolean; url: string }>({ isOpen: false, url: '' });

  const toggleFAQ = (index: number) => {
    playClick();
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const handleExternalLink = (url: string) => {
    setExternalLink({ isOpen: true, url });
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-night-deep/95 backdrop-blur-sm overflow-y-auto"
        onClick={onClose}
      >
        <div 
          className="w-full max-w-2xl game-card relative animate-bounce-in my-8"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            onMouseEnter={playHover}
            className="absolute top-2 right-2 w-8 h-8 bg-muted rounded-sm border-2 border-border 
              flex items-center justify-center hover:border-neon-pink hover:shadow-neon-pink transition-all z-10"
          >
            ✕
          </button>

          <h2 className="font-pixel text-lg text-primary mb-6 text-center neon-text">
            ❓ PREGUNTAS FRECUENTES ❓
          </h2>

          {/* FAQ Items */}
          <div className="space-y-3 mb-8">
            {faqItems.map((item, index) => (
              <div 
                key={index}
                className={`bg-muted/30 rounded-sm border-2 transition-all overflow-hidden
                  ${expandedIndex === index ? 'border-neon-cyan shadow-neon' : 'border-border hover:border-neon-pink'}`}
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  onMouseEnter={playHover}
                  className="w-full p-4 flex items-center justify-between text-left"
                >
                  <span className="font-pixel text-[10px] text-accent pr-4">{item.question}</span>
                  {expandedIndex === index ? (
                    <ChevronUp size={18} className="text-neon-cyan flex-shrink-0" />
                  ) : (
                    <ChevronDown size={18} className="text-muted-foreground flex-shrink-0" />
                  )}
                </button>
                
                {expandedIndex === index && (
                  <div className="px-4 pb-4 font-cartoon text-sm text-foreground border-t border-border/50 pt-3">
                    {item.answer}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Contact Section */}
          <div className="bg-gradient-to-r from-neon-pink/10 via-neon-cyan/10 to-neon-purple/10 rounded-sm p-4 border-2 border-star-gold">
            <h3 className="font-pixel text-[10px] text-star-gold mb-4 text-center">
              📧 ÚNICOS CONTACTOS 📧
            </h3>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-sm">
                <Mail size={16} className="text-neon-cyan" />
                <span className="font-retro text-sm text-foreground">Cuevavirgen7@gmail.com</span>
              </div>
              
              <button
                onClick={() => handleExternalLink('https://www.youtube.com/@CuevadelosVirgenes')}
                onMouseEnter={playHover}
                className="w-full flex items-center gap-2 p-2 bg-muted/30 rounded-sm border border-transparent
                  hover:border-red-500 hover:shadow-[0_0_10px_rgba(255,0,0,0.3)] transition-all"
              >
                <span className="text-lg">📺</span>
                <span className="font-retro text-sm text-foreground">YouTube</span>
                <ExternalLink size={12} className="text-muted-foreground ml-auto" />
              </button>

              <button
                onClick={() => handleExternalLink('https://discord.gg/PFvsgRvfYd')}
                onMouseEnter={playHover}
                className="w-full flex items-center gap-2 p-2 bg-muted/30 rounded-sm border border-transparent
                  hover:border-indigo-500 hover:shadow-[0_0_10px_rgba(99,102,241,0.3)] transition-all"
              >
                <span className="text-lg">💬</span>
                <span className="font-retro text-sm text-foreground">Discord</span>
                <ExternalLink size={12} className="text-muted-foreground ml-auto" />
              </button>

              <button
                onClick={() => handleExternalLink('https://www.tiktok.com/@cuevadelosvirgenes0')}
                onMouseEnter={playHover}
                className="w-full flex items-center gap-2 p-2 bg-muted/30 rounded-sm border border-transparent
                  hover:border-pink-500 hover:shadow-[0_0_10px_rgba(236,72,153,0.3)] transition-all"
              >
                <span className="text-lg">🎵</span>
                <span className="font-retro text-sm text-foreground">TikTok</span>
                <ExternalLink size={12} className="text-muted-foreground ml-auto" />
              </button>
            </div>

            <p className="font-cartoon text-sm text-muted-foreground text-center mt-4">
              Somos un proyecto profesional dentro de todo lo que cabe, pero recuerda que 
              nuestra esencia simplemente es ser relajados. ✨
            </p>
          </div>
        </div>
      </div>

      <ExternalLinkDialog
        isOpen={externalLink.isOpen}
        url={externalLink.url}
        onConfirm={() => {
          window.open(externalLink.url, '_blank');
          setExternalLink({ isOpen: false, url: '' });
        }}
        onCancel={() => setExternalLink({ isOpen: false, url: '' })}
      />
    </>
  );
};
