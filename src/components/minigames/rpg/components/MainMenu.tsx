import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, BookOpen, Settings, Maximize, Volume2, VolumeX, Info } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { SpriteRenderer } from './SpriteRenderer';
import { matiasSprite, angelSprite, alejandroSprite, miguelSprite, eliasSprite, maximoSprite } from '../data/protagonistSprites';
import { useFullscreen } from '@/hooks/useFullscreen';

interface MainMenuProps {
  onStartStory: () => void;
  onStartFree: () => void;
  onSettings: () => void;
  hasSaveData: boolean;
  onContinue?: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onStartStory,
  onStartFree,
  onSettings,
  hasSaveData,
  onContinue,
}) => {
  const { language } = useSettings();
  const isSpanish = language === 'es';
  const [showCredits, setShowCredits] = useState(false);
  const [currentSpriteIndex, setCurrentSpriteIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const { isFullscreen, toggleFullscreen } = useFullscreen(gameContainerRef);

  const sprites = [
    matiasSprite.frames[0],
    angelSprite.frames[0],
    alejandroSprite.frames[0],
    miguelSprite.frames[0],
    eliasSprite.frames[0],
    maximoSprite.frames[0],
  ];

  const characterNames = ['Matías', 'Ángel', 'Alejandro', 'Miguel', 'Elías', 'Máximo'];

  // Rotate through character sprites
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSpriteIndex(prev => (prev + 1) % sprites.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [sprites.length]);

  // Handle fullscreen toggle with better error handling
  const handleFullscreenToggle = async () => {
    try {
      await toggleFullscreen();
    } catch (error) {
      console.error('Fullscreen error:', error);
      // Fallback: Toggle a CSS class for fullscreen simulation
      if (gameContainerRef.current) {
        gameContainerRef.current.classList.toggle('fullscreen-simulated');
      }
    }
  };

  return (
    <div 
      ref={gameContainerRef}
      className="absolute inset-0 bg-gradient-to-b from-night-deep via-card to-night-deep flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-neon-cyan/30 rounded-full"
            initial={{ 
              x: Math.random() * 400, 
              y: Math.random() * 600,
              opacity: 0.3,
            }}
            animate={{
              y: [null, -100],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 5 + Math.random() * 5,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>

      {/* Top controls */}
      <div className="absolute top-2 right-2 flex gap-1 z-50">
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="p-1.5 rounded-sm border border-border bg-muted/50 hover:bg-muted transition-colors"
        >
          {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </button>
        <button
          onClick={handleFullscreenToggle}
          className="p-1.5 rounded-sm border border-border bg-muted/50 hover:bg-muted transition-colors"
        >
          <Maximize size={14} className={isFullscreen ? 'text-neon-cyan' : ''} />
        </button>
        <button
          onClick={onSettings}
          className="p-1.5 rounded-sm border border-border bg-muted/50 hover:bg-muted transition-colors"
        >
          <Settings size={14} />
        </button>
      </div>

      {/* Title */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, type: 'spring' }}
        className="text-center mb-6"
      >
        <h1 className="font-pixel text-xl sm:text-2xl text-neon-cyan mb-1 tracking-wider">
          ECOS DE
        </h1>
        <h1 className="font-pixel text-2xl sm:text-3xl text-neon-pink tracking-widest">
          MEMORIA
        </h1>
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="font-retro text-[8px] text-muted-foreground mt-2"
        >
          {isSpanish ? 'Un RPG Experimental Modificable' : 'A Moddable Experimental RPG'}
        </motion.div>
      </motion.div>

      {/* Character showcase */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3, type: 'spring' }}
        className="mb-6 relative"
      >
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSpriteIndex}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              className="relative"
            >
              <SpriteRenderer sprite={sprites[currentSpriteIndex]} size={8} />
              <motion.div
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute -bottom-4 left-1/2 -translate-x-1/2 font-pixel text-[7px] text-star-gold whitespace-nowrap"
              >
                {characterNames[currentSpriteIndex]}
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
        
        {/* Character dots */}
        <div className="flex justify-center gap-1 mt-6">
          {sprites.map((_, idx) => (
            <div
              key={idx}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                idx === currentSpriteIndex ? 'bg-neon-cyan' : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </motion.div>

      {/* Menu buttons */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex flex-col gap-2 w-48"
      >
        {hasSaveData && onContinue && (
          <motion.button
            whileHover={{ scale: 1.05, x: 5 }}
            whileTap={{ scale: 0.95 }}
            onClick={onContinue}
            className="flex items-center gap-2 px-4 py-2 bg-neon-cyan/20 border-2 border-neon-cyan 
              rounded-sm font-pixel text-xs text-neon-cyan hover:bg-neon-cyan/30 transition-colors"
          >
            <Play size={14} />
            {isSpanish ? 'Continuar' : 'Continue'}
          </motion.button>
        )}

        <motion.button
          whileHover={{ scale: 1.05, x: 5 }}
          whileTap={{ scale: 0.95 }}
          onClick={onStartStory}
          className="flex items-center gap-2 px-4 py-2 bg-neon-pink/20 border-2 border-neon-pink 
            rounded-sm font-pixel text-xs text-neon-pink hover:bg-neon-pink/30 transition-colors"
        >
          <BookOpen size={14} />
          {isSpanish ? 'Modo Historia' : 'Story Mode'}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05, x: 5 }}
          whileTap={{ scale: 0.95 }}
          onClick={onStartFree}
          className="flex items-center gap-2 px-4 py-2 bg-star-gold/20 border-2 border-star-gold 
            rounded-sm font-pixel text-xs text-star-gold hover:bg-star-gold/30 transition-colors"
        >
          <Play size={14} />
          {isSpanish ? 'Modo Libre' : 'Free Mode'}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowCredits(true)}
          className="flex items-center justify-center gap-1 px-4 py-1.5 
            font-retro text-[8px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <Info size={10} />
          {isSpanish ? 'Créditos' : 'Credits'}
        </motion.button>
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-2 text-center"
      >
        <p className="font-retro text-[7px] text-muted-foreground">
          {isSpanish ? 'Creado por ' : 'Created by '}
          <span className="text-neon-purple">Cueva Virgen</span>
        </p>
        <p className="font-retro text-[6px] text-muted-foreground/50">
          v1.0.0 Alpha
        </p>
      </motion.div>

      {/* Credits Modal */}
      <AnimatePresence>
        {showCredits && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-night-deep/95 flex items-center justify-center z-50"
            onClick={() => setShowCredits(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-card border-2 border-pixel-border p-4 rounded-sm max-w-xs"
              onClick={e => e.stopPropagation()}
            >
              <h2 className="font-pixel text-sm text-neon-cyan mb-3 text-center">
                {isSpanish ? 'CRÉDITOS' : 'CREDITS'}
              </h2>
              
              <div className="space-y-2 text-center font-retro text-[9px]">
                <div>
                  <p className="text-muted-foreground">{isSpanish ? 'Diseño y Programación' : 'Design & Programming'}</p>
                  <p className="text-foreground">Cueva Virgen</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{isSpanish ? 'Arte de Personajes' : 'Character Art'}</p>
                  <p className="text-foreground">Pixel Art Team</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{isSpanish ? 'Motor de Juego' : 'Game Engine'}</p>
                  <p className="text-foreground">React + TypeScript</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{isSpanish ? 'Inspiración' : 'Inspiration'}</p>
                  <p className="text-foreground">Heartbound, UNDERTALE, RPG Maker</p>
                </div>
              </div>

              <button
                onClick={() => setShowCredits(false)}
                className="mt-4 w-full py-1 font-pixel text-[8px] text-neon-pink hover:bg-neon-pink/20 
                  border border-neon-pink rounded-sm transition-colors"
              >
                {isSpanish ? 'Cerrar' : 'Close'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};