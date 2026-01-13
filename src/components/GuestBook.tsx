import React, { useState, useEffect } from 'react';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface GuestBookProps {
  isOpen: boolean;
  onClose: () => void;
}

const bookPages = [
  `Hola, les habla Maximo, soy el creador de esta pagina WEB, soy aun muy novato, pero me encanta hacer estos proyectos para "La cueva de los virgenes", quisiera que nos den mucho apoyo, porque todo esto no es fácil de hacer, ni crear, ni de presentar.`,
  
  `Hemos trabajado por muchas travesías y seguiremos batallando por aun más, quiero que sepan que este proyecto yo no lo dejare morir y les invito a subscribirse y seguirnos en nuestras redes sociales, eso me haría muy feliz.`,
  
  `Si tienen dudas de lo que le depara el canal, no se preocupen, este canal tal vez subamos videos cada 8 meses JAJAJA, pero seguiremos subiendo videos, con cada vez más calidad.`,
  
  `Aprendemos de nuestros errores y sabemos que podemos lograr grandes cosas gracias a TI y simplemente muchas gracias por leer esto, es un sueño gigantesco hacer todo esto junto a mis hermanos. ;)`,
  
  `- Maximo ♥`
];

export const GuestBook: React.FC<GuestBookProps> = ({ isOpen, onClose }) => {
  const { playClick, playHover } = useSoundEffects();
  const [currentPage, setCurrentPage] = useState(0);

  // Minecraft-like page turn sound
  const playPageTurn = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.type = 'square';
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  };

  const nextPage = () => {
    if (currentPage < bookPages.length - 1) {
      playPageTurn();
      setCurrentPage(prev => prev + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      playPageTurn();
      setCurrentPage(prev => prev - 1);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setCurrentPage(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{
        backgroundImage: 'linear-gradient(to bottom, rgba(139, 90, 43, 0.9), rgba(101, 67, 33, 0.95))',
        backdropFilter: 'blur(4px)'
      }}
      onClick={onClose}
    >
      <div 
        className="relative max-w-2xl w-full animate-bounce-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          onMouseEnter={playHover}
          className="absolute -top-4 -right-4 w-10 h-10 z-20
            flex items-center justify-center transition-all"
          style={{
            background: 'linear-gradient(135deg, #8B4513, #654321)',
            border: '3px solid #2F1810',
            imageRendering: 'pixelated',
            boxShadow: '2px 2px 0 #2F1810'
          }}
        >
          <X size={20} className="text-[#DEB887]" />
        </button>

        {/* Book Container */}
        <div 
          className="relative p-8"
          style={{
            background: 'linear-gradient(135deg, #8B7355 0%, #6B5344 50%, #5D4735 100%)',
            border: '6px solid #3D2817',
            borderRadius: '4px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 0 20px rgba(0,0,0,0.3)',
            imageRendering: 'pixelated'
          }}
        >
          {/* Book spine decoration */}
          <div 
            className="absolute left-1/2 top-0 bottom-0 w-4 -translate-x-1/2"
            style={{
              background: 'linear-gradient(to right, #3D2817, #5D4735, #3D2817)',
              boxShadow: 'inset 2px 0 4px rgba(0,0,0,0.5), inset -2px 0 4px rgba(0,0,0,0.5)'
            }}
          />

          {/* Book Title */}
          <div className="text-center mb-4 relative z-10">
            <h2 
              className="text-2xl tracking-widest"
              style={{
                fontFamily: '"Press Start 2P", monospace',
                fontSize: '12px',
                color: '#2F1810',
                textShadow: '1px 1px 0 #DEB887'
              }}
            >
              📖 LIBRO DE VISITAS 📖
            </h2>
          </div>

          {/* Open Book Pages */}
          <div className="flex gap-4">
            {/* Left Page */}
            <div 
              className="flex-1 p-6 min-h-[300px] relative"
              style={{
                background: 'linear-gradient(135deg, #F5E6D3 0%, #E8D5BA 100%)',
                border: '2px solid #8B7355',
                boxShadow: 'inset 0 0 10px rgba(0,0,0,0.1)',
                borderRadius: '2px'
              }}
            >
              {/* Page lines */}
              <div className="absolute inset-4 pointer-events-none">
                {[...Array(12)].map((_, i) => (
                  <div 
                    key={i} 
                    className="h-px w-full mb-5 opacity-20"
                    style={{ background: '#8B7355' }}
                  />
                ))}
              </div>

              {/* Page Content */}
              <p 
                className="relative z-10 leading-relaxed"
                style={{
                  fontFamily: '"VT323", monospace',
                  fontSize: '18px',
                  color: '#2F1810',
                  lineHeight: '1.8'
                }}
              >
                {bookPages[currentPage]}
              </p>

              {/* Page Number */}
              <div 
                className="absolute bottom-2 left-1/2 -translate-x-1/2"
                style={{
                  fontFamily: '"Press Start 2P", monospace',
                  fontSize: '8px',
                  color: '#8B7355'
                }}
              >
                {currentPage + 1} / {bookPages.length}
              </div>
            </div>

            {/* Right Page - Preview of next */}
            <div 
              className="flex-1 p-6 min-h-[300px] relative hidden md:block"
              style={{
                background: 'linear-gradient(135deg, #F5E6D3 0%, #E8D5BA 100%)',
                border: '2px solid #8B7355',
                boxShadow: 'inset 0 0 10px rgba(0,0,0,0.1)',
                borderRadius: '2px'
              }}
            >
              {/* Page lines */}
              <div className="absolute inset-4 pointer-events-none">
                {[...Array(12)].map((_, i) => (
                  <div 
                    key={i} 
                    className="h-px w-full mb-5 opacity-20"
                    style={{ background: '#8B7355' }}
                  />
                ))}
              </div>

              {/* Next Page Preview */}
              {currentPage < bookPages.length - 1 && (
                <p 
                  className="relative z-10 leading-relaxed opacity-80"
                  style={{
                    fontFamily: '"VT323", monospace',
                    fontSize: '18px',
                    color: '#2F1810',
                    lineHeight: '1.8'
                  }}
                >
                  {bookPages[currentPage + 1]}
                </p>
              )}

              {currentPage === bookPages.length - 1 && (
                <div className="flex items-center justify-center h-full">
                  <span 
                    className="text-6xl opacity-30"
                    style={{ imageRendering: 'pixelated' }}
                  >
                    📕
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-4">
            <button
              onClick={prevPage}
              onMouseEnter={playHover}
              disabled={currentPage === 0}
              className="px-4 py-2 flex items-center gap-2 disabled:opacity-30 transition-all
                hover:scale-105 disabled:hover:scale-100"
              style={{
                fontFamily: '"Press Start 2P", monospace',
                fontSize: '10px',
                color: '#F5E6D3',
                background: currentPage === 0 ? '#5D4735' : '#8B4513',
                border: '3px solid #2F1810',
                boxShadow: '2px 2px 0 #2F1810',
                imageRendering: 'pixelated'
              }}
            >
              <ChevronLeft size={16} />
              ANTERIOR
            </button>

            <button
              onClick={nextPage}
              onMouseEnter={playHover}
              disabled={currentPage === bookPages.length - 1}
              className="px-4 py-2 flex items-center gap-2 disabled:opacity-30 transition-all
                hover:scale-105 disabled:hover:scale-100"
              style={{
                fontFamily: '"Press Start 2P", monospace',
                fontSize: '10px',
                color: '#F5E6D3',
                background: currentPage === bookPages.length - 1 ? '#5D4735' : '#8B4513',
                border: '3px solid #2F1810',
                boxShadow: '2px 2px 0 #2F1810',
                imageRendering: 'pixelated'
              }}
            >
              SIGUIENTE
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Book shadow */}
        <div 
          className="absolute -bottom-4 left-4 right-4 h-8 -z-10"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.4) 0%, transparent 70%)'
          }}
        />
      </div>
    </div>
  );
};
