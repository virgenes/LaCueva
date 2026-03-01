import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, BookOpen, Settings, Maximize, Volume2, VolumeX, Info } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { SpriteRenderer } from './SpriteRenderer';
import { matiasSprite, angelSprite, alejandroSprite, miguelSprite, eliasSprite, maximoSprite } from '../data/protagonistSprites';
import { heroClasses, characterClassMap } from '../data/heroClasses';

interface MainMenuProps {
  onStartStory: () => void;
  onStartFree: () => void;
  onSettings: () => void;
  hasSaveData: boolean;
  onContinue?: () => void;
}

// Cave character walking scene
const CaveScene: React.FC = React.memo(() => {
  const allSprites = [
    { sprite: matiasSprite, name: 'Matías', id: 'matias' },
    { sprite: angelSprite, name: 'Ángel', id: 'angel' },
    { sprite: alejandroSprite, name: 'Alejandro', id: 'alejandro' },
    { sprite: miguelSprite, name: 'Miguel', id: 'miguel' },
    { sprite: eliasSprite, name: 'Elías', id: 'elias' },
    { sprite: maximoSprite, name: 'Máximo', id: 'maximo' },
  ];

  // Random order, but first one always holds the torch
  const order = useMemo(() => {
    const indices = [0, 1, 2, 3, 4, 5];
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices.map(i => allSprites[i]);
  }, []);

  const [walkFrame, setWalkFrame] = useState(0);
  const [torchFlicker, setTorchFlicker] = useState(0.8);

  useEffect(() => {
    const walkInterval = setInterval(() => setWalkFrame(p => (p + 1) % 2), 300);
    const flickerInterval = setInterval(() => setTorchFlicker(0.6 + Math.random() * 0.4), 150);
    return () => { clearInterval(walkInterval); clearInterval(flickerInterval); };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Cave background */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(180deg, #0a0a0f 0%, #111118 30%, #0d0d14 60%, #080810 100%)',
      }} />

      {/* Cave ceiling stalactites */}
      {Array.from({ length: 12 }, (_, i) => (
        <div key={`stal-${i}`} className="absolute" style={{
          left: `${(i * 37 + 5) % 100}%`,
          top: 0,
          width: `${6 + (i % 4) * 3}px`,
          height: `${20 + (i * 13) % 40}px`,
          background: 'linear-gradient(180deg, #1a1a25, #0d0d14)',
          borderRadius: '0 0 3px 3px',
          opacity: 0.7,
        }} />
      ))}

      {/* Cave floor */}
      <div className="absolute bottom-0 left-0 right-0" style={{
        height: '35%',
        background: 'linear-gradient(0deg, #1a1520 0%, #151118 50%, transparent 100%)',
      }} />

      {/* Floor details - rocks */}
      {Array.from({ length: 8 }, (_, i) => (
        <div key={`rock-${i}`} className="absolute" style={{
          left: `${(i * 29 + 10) % 95}%`,
          bottom: `${5 + (i * 7) % 15}%`,
          width: `${4 + (i % 3) * 3}px`,
          height: `${3 + (i % 2) * 2}px`,
          backgroundColor: '#2a2530',
          borderRadius: '50%',
          opacity: 0.6,
        }} />
      ))}

      {/* Torch light effect from leader */}
      <div className="absolute" style={{
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        width: '300px',
        height: '300px',
        background: `radial-gradient(ellipse at 50% 40%, rgba(255,160,50,${torchFlicker * 0.15}) 0%, rgba(255,100,20,${torchFlicker * 0.08}) 30%, transparent 60%)`,
        pointerEvents: 'none',
        zIndex: 5,
      }} />

      {/* Ambient glowing cracks */}
      {[0, 1, 2].map(i => (
        <div key={`crack-${i}`} className="absolute" style={{
          left: `${10 + i * 35}%`,
          top: `${20 + i * 15}%`,
          width: '2px',
          height: `${15 + i * 8}px`,
          background: `linear-gradient(180deg, transparent, rgba(100,50,200,${0.15 + Math.random() * 0.1}), transparent)`,
          transform: `rotate(${i * 30 - 20}deg)`,
        }} />
      ))}

      {/* Walking characters */}
      <div className="absolute left-1/2 top-[55%] -translate-x-1/2 flex items-end" style={{ zIndex: 10 }}>
        {order.map((char, idx) => {
          const isLeader = idx === 0;
          const classId = characterClassMap[char.id];
          const heroClass = heroClasses[classId];
          const frame = char.sprite.frames[walkFrame] || char.sprite.frames[0];
          
          return (
            <div key={char.id} className="relative" style={{
              marginLeft: idx === 0 ? 0 : '-4px',
              animation: `cave-walk-bob 0.6s ease-in-out ${idx * 0.1}s infinite`,
            }}>
              {/* Torch for leader */}
              {isLeader && (
                <div className="absolute -top-6 -right-1" style={{ zIndex: 15 }}>
                  {/* Torch stick */}
                  <div style={{
                    width: '3px', height: '12px',
                    backgroundColor: '#8B4513',
                    margin: '0 auto',
                  }} />
                  {/* Flame */}
                  <div style={{
                    width: '8px', height: '10px',
                    background: `radial-gradient(ellipse at 50% 70%, #ff6600 0%, #ff4400 40%, #ff2200 70%, transparent 100%)`,
                    borderRadius: '50% 50% 30% 30%',
                    position: 'absolute', top: '-8px', left: '-2px',
                    animation: 'torch-flame 0.2s ease-in-out infinite alternate',
                    boxShadow: `0 0 8px rgba(255,100,0,${torchFlicker * 0.6}), 0 0 16px rgba(255,60,0,${torchFlicker * 0.3})`,
                  }} />
                </div>
              )}
              {/* Character shadow */}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2" style={{
                width: '16px', height: '4px',
                background: 'radial-gradient(ellipse, rgba(0,0,0,0.5) 0%, transparent 70%)',
              }} />
              {/* Character sprite with class tint glow */}
              <div style={{
                filter: isLeader
                  ? `drop-shadow(0 0 4px rgba(255,120,30,${torchFlicker * 0.4}))`
                  : `drop-shadow(0 0 2px rgba(255,100,30,${torchFlicker * 0.15 * Math.max(0, 1 - idx * 0.15)}))`,
                opacity: Math.max(0.3, 1 - idx * 0.1),
              }}>
                <SpriteRenderer sprite={frame} size={6} />
              </div>
              {/* Name label */}
              <div className="text-center mt-0.5">
                <span className="font-pixel text-[5px]" style={{
                  color: heroClass?.accentColor || '#888',
                  opacity: 0.7,
                  textShadow: '0 0 4px rgba(0,0,0,0.8)',
                }}>
                  {char.name}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Fog at bottom */}
      <div className="absolute bottom-0 left-0 right-0" style={{
        height: '20%',
        background: 'linear-gradient(0deg, rgba(20,15,25,0.9), transparent)',
        pointerEvents: 'none',
        zIndex: 15,
      }} />

      {/* Spooky particles */}
      {Array.from({ length: 6 }, (_, i) => (
        <div key={`particle-${i}`} className="absolute rounded-full" style={{
          width: '2px', height: '2px',
          backgroundColor: `rgba(150,100,255,${0.2 + Math.random() * 0.3})`,
          left: `${10 + i * 15}%`,
          animation: `spooky-float ${4 + i * 1.5}s ease-in-out ${i * 0.8}s infinite`,
          zIndex: 3,
        }} />
      ))}

      {/* CSS for cave animations */}
      <style>{`
        @keyframes cave-walk-bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        @keyframes torch-flame {
          0% { transform: scaleX(0.9) scaleY(1); }
          100% { transform: scaleX(1.1) scaleY(1.15); }
        }
        @keyframes spooky-float {
          0%, 100% { transform: translateY(100px); opacity: 0; }
          30% { opacity: 0.5; }
          70% { opacity: 0.3; }
          50% { transform: translateY(-50px); }
        }
      `}</style>
    </div>
  );
});

export const MainMenu: React.FC<MainMenuProps> = ({
  onStartStory, onStartFree, onSettings, hasSaveData, onContinue,
}) => {
  const { language } = useSettings();
  const isSpanish = language === 'es';
  const [showCredits, setShowCredits] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) { document.documentElement.requestFullscreen(); setIsFullscreen(true); }
    else { document.exitFullscreen(); setIsFullscreen(false); }
  };

  useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', h);
    return () => document.removeEventListener('fullscreenchange', h);
  }, []);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden">
      {/* Cave background scene */}
      <CaveScene />

      {/* Top controls */}
      <div className="absolute top-2 right-2 flex gap-1 z-30">
        <button onClick={() => setIsMuted(!isMuted)}
          className="p-1.5 rounded-sm border border-white/20 bg-black/60 hover:bg-white/10 transition-colors">
          {isMuted ? <VolumeX size={14} className="text-white/60" /> : <Volume2 size={14} className="text-white/60" />}
        </button>
        <button onClick={toggleFullscreen}
          className="p-1.5 rounded-sm border border-white/20 bg-black/60 hover:bg-white/10 transition-colors">
          <Maximize size={14} className="text-white/60" />
        </button>
        <button onClick={onSettings}
          className="p-1.5 rounded-sm border border-white/20 bg-black/60 hover:bg-white/10 transition-colors">
          <Settings size={14} className="text-white/60" />
        </button>
      </div>

      {/* Title overlay */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, type: 'spring' }}
        className="text-center mb-4 z-20 relative"
      >
        <h1 className="font-pixel text-xl sm:text-2xl text-amber-400 mb-1 tracking-wider"
          style={{ textShadow: '0 0 20px rgba(255,160,50,0.4), 2px 2px 0 #000' }}>
          ECOS DE
        </h1>
        <h1 className="font-pixel text-2xl sm:text-3xl text-red-400 tracking-widest"
          style={{ textShadow: '0 0 20px rgba(255,50,50,0.3), 2px 2px 0 #000' }}>
          MEMORIA
        </h1>
        <motion.div
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="font-retro text-[8px] text-white/40 mt-2"
          style={{ textShadow: '0 0 8px rgba(255,100,50,0.3)' }}
        >
          {isSpanish ? 'Un RPG Experimental Modificable' : 'A Moddable Experimental RPG'}
        </motion.div>
      </motion.div>

      {/* Menu buttons */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col gap-2 w-48 z-20 relative"
      >
        {hasSaveData && onContinue && (
          <motion.button whileHover={{ scale: 1.05, x: 5 }} whileTap={{ scale: 0.95 }}
            onClick={onContinue}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 border-2 border-amber-400 rounded-sm font-pixel text-xs text-amber-400 hover:bg-amber-500/30 transition-colors backdrop-blur-sm"
            style={{ textShadow: '0 0 8px rgba(255,160,50,0.4)' }}>
            <Play size={14} />
            {isSpanish ? 'Continuar' : 'Continue'}
          </motion.button>
        )}
        <motion.button whileHover={{ scale: 1.05, x: 5 }} whileTap={{ scale: 0.95 }}
          onClick={onStartStory}
          className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border-2 border-red-400 rounded-sm font-pixel text-xs text-red-400 hover:bg-red-500/30 transition-colors backdrop-blur-sm">
          <BookOpen size={14} />
          {isSpanish ? 'Modo Historia' : 'Story Mode'}
        </motion.button>
        <motion.button whileHover={{ scale: 1.05, x: 5 }} whileTap={{ scale: 0.95 }}
          onClick={onStartFree}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500/20 border-2 border-orange-400 rounded-sm font-pixel text-xs text-orange-400 hover:bg-orange-500/30 transition-colors backdrop-blur-sm">
          <Play size={14} />
          {isSpanish ? 'Modo Libre' : 'Free Mode'}
        </motion.button>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => setShowCredits(true)}
          className="flex items-center justify-center gap-1 px-4 py-1.5 font-retro text-[8px] text-white/30 hover:text-white/60 transition-colors">
          <Info size={10} />
          {isSpanish ? 'Créditos' : 'Credits'}
        </motion.button>
      </motion.div>

      {/* Footer */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
        className="absolute bottom-2 text-center z-20">
        <p className="font-retro text-[7px] text-white/30">
          {isSpanish ? 'Creado por ' : 'Created by '}
          <span className="text-amber-400/50">Cueva Virgen</span>
        </p>
        <p className="font-retro text-[6px] text-white/20">v1.0.0 Alpha</p>
      </motion.div>

      {/* Credits Modal */}
      <AnimatePresence>
        {showCredits && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/95 flex items-center justify-center z-50"
            onClick={() => setShowCredits(false)}>
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}
              className="bg-black border-2 border-white/30 p-4 rounded-sm max-w-xs"
              onClick={e => e.stopPropagation()}>
              <h2 className="font-pixel text-sm text-amber-400 mb-3 text-center">
                {isSpanish ? 'CRÉDITOS' : 'CREDITS'}
              </h2>
              <div className="space-y-2 text-center font-retro text-[9px]">
                <div><p className="text-white/40">{isSpanish ? 'Diseño y Programación' : 'Design & Programming'}</p><p className="text-white/80">Cueva Virgen</p></div>
                <div><p className="text-white/40">{isSpanish ? 'Motor de Juego' : 'Game Engine'}</p><p className="text-white/80">React + TypeScript</p></div>
                <div><p className="text-white/40">{isSpanish ? 'Inspiración' : 'Inspiration'}</p><p className="text-white/80">Heartbound, UNDERTALE, RPG Maker</p></div>
              </div>
              <button onClick={() => setShowCredits(false)}
                className="mt-4 w-full py-1 font-pixel text-[8px] text-red-400 hover:bg-red-400/20 border border-red-400/50 rounded-sm transition-colors">
                {isSpanish ? 'Cerrar' : 'Close'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
