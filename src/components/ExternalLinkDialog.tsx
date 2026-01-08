import React from 'react';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { ExternalLink, X } from 'lucide-react';

interface ExternalLinkDialogProps {
  isOpen: boolean;
  url: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ExternalLinkDialog: React.FC<ExternalLinkDialogProps> = ({
  isOpen,
  url,
  onConfirm,
  onCancel
}) => {
  const { playClick, playHover } = useSoundEffects();

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-night-deep/95 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div 
        className="w-full max-w-md game-card relative animate-bounce-in text-center"
        onClick={(e) => e.stopPropagation()}
        style={{
          border: '4px solid hsl(var(--star-gold))',
          boxShadow: '0 0 30px hsl(var(--star-gold) / 0.4)'
        }}
      >
        {/* Warning Icon */}
        <div className="mb-4">
          <span className="text-6xl animate-wiggle inline-block">⚠️</span>
        </div>

        {/* Message */}
        <h2 className="font-pixel text-sm text-star-gold mb-4">
          ¿Seguro que quieres irte de la página web?
        </h2>

        <p className="font-retro text-base text-muted-foreground mb-2">
          Estás a punto de visitar:
        </p>
        <p className="font-cartoon text-sm text-neon-cyan break-all bg-muted/30 p-2 rounded-sm mb-6">
          {url}
        </p>

        {/* Buttons */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => { playClick(); onConfirm(); }}
            onMouseEnter={playHover}
            className="px-6 py-3 bg-neon-cyan text-night-deep font-pixel text-[10px] rounded-sm
              border-2 border-night-deep shadow-pixel hover:shadow-pixel-lg hover:-translate-y-1
              transition-all duration-200 flex items-center gap-2"
          >
            <ExternalLink size={14} />
            ¡SÍ!
          </button>
          
          <button
            onClick={() => { playClick(); onCancel(); }}
            onMouseEnter={playHover}
            className="px-6 py-3 bg-neon-pink text-night-deep font-pixel text-[10px] rounded-sm
              border-2 border-night-deep shadow-pixel hover:shadow-pixel-lg hover:-translate-y-1
              transition-all duration-200 flex items-center gap-2"
          >
            <X size={14} />
            NO
          </button>
        </div>

        <p className="font-retro text-sm text-muted-foreground/60 mt-4">
          Para más comodidad y cero tropiezos 🎮
        </p>
      </div>
    </div>
  );
};
