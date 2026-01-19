import React, { useState, useEffect, useCallback } from 'react';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useSettings } from '@/contexts/SettingsContext';
import { X, Trophy, Zap, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ClickerGameProps {
  onClose: () => void;
}

interface FloatingNumber {
  id: number;
  value: number;
  x: number;
  y: number;
}

export const ClickerGame: React.FC<ClickerGameProps> = ({ onClose }) => {
  const { playClick, playHover, playSecretDiscovered } = useSoundEffects();
  const { language } = useSettings();
  const [clicks, setClicks] = useState(0);
  const [totalClicks, setTotalClicks] = useState(0);
  const [clickPower, setClickPower] = useState(1);
  const [autoClickers, setAutoClickers] = useState(0);
  const [floatingNumbers, setFloatingNumbers] = useState<FloatingNumber[]>([]);
  const [achievements, setAchievements] = useState<string[]>([]);

  const isSpanish = language === 'es';

  // Load saved progress
  useEffect(() => {
    try {
      const saved = localStorage.getItem('cave-clicker-save');
      if (saved) {
        const data = JSON.parse(saved);
        setClicks(data.clicks || 0);
        setTotalClicks(data.totalClicks || 0);
        setClickPower(data.clickPower || 1);
        setAutoClickers(data.autoClickers || 0);
        setAchievements(data.achievements || []);
      }
    } catch {}
  }, []);

  // Save progress
  useEffect(() => {
    try {
      localStorage.setItem('cave-clicker-save', JSON.stringify({
        clicks,
        totalClicks,
        clickPower,
        autoClickers,
        achievements,
      }));
    } catch {}
  }, [clicks, totalClicks, clickPower, autoClickers, achievements]);

  // Auto clickers
  useEffect(() => {
    if (autoClickers === 0) return;
    const interval = setInterval(() => {
      setClicks(prev => prev + autoClickers);
      setTotalClicks(prev => prev + autoClickers);
    }, 1000);
    return () => clearInterval(interval);
  }, [autoClickers]);

  // Check achievements
  useEffect(() => {
    const checkAchievement = (id: string, condition: boolean) => {
      if (condition && !achievements.includes(id)) {
        setAchievements(prev => [...prev, id]);
        playSecretDiscovered();
      }
    };

    checkAchievement('first100', totalClicks >= 100);
    checkAchievement('first1000', totalClicks >= 1000);
    checkAchievement('first10000', totalClicks >= 10000);
    checkAchievement('powerUp', clickPower >= 5);
    checkAchievement('automate', autoClickers >= 3);
  }, [totalClicks, clickPower, autoClickers, achievements, playSecretDiscovered]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    playClick();
    setClicks(prev => prev + clickPower);
    setTotalClicks(prev => prev + clickPower);

    // Add floating number
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setFloatingNumbers(prev => [...prev, { id, value: clickPower, x, y }]);
    setTimeout(() => {
      setFloatingNumbers(prev => prev.filter(n => n.id !== id));
    }, 1000);
  }, [clickPower, playClick]);

  const buyUpgrade = useCallback((type: 'power' | 'auto') => {
    const cost = type === 'power' ? clickPower * 50 : (autoClickers + 1) * 100;
    if (clicks >= cost) {
      playClick();
      setClicks(prev => prev - cost);
      if (type === 'power') {
        setClickPower(prev => prev + 1);
      } else {
        setAutoClickers(prev => prev + 1);
      }
    }
  }, [clicks, clickPower, autoClickers, playClick]);

  const powerCost = clickPower * 50;
  const autoCost = (autoClickers + 1) * 100;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-night-deep/95 backdrop-blur-sm">
      <div className="game-card p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-pixel text-lg text-star-gold flex items-center gap-2">
            ⭐ {isSpanish ? 'CLICKER VIRGEN' : 'VIRGIN CLICKER'}
          </h2>
          <button
            onClick={() => { playClick(); onClose(); }}
            onMouseEnter={playHover}
            className="p-2 rounded-sm border-2 border-neon-pink hover:bg-neon-pink/20 transition-colors"
          >
            <X size={16} className="text-neon-pink" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4 text-center">
          <div className="game-card px-2 py-1">
            <span className="font-pixel text-[8px] text-muted-foreground">
              {isSpanish ? 'PUNTOS' : 'POINTS'}
            </span>
            <p className="font-pixel text-sm text-neon-cyan">{clicks.toLocaleString()}</p>
          </div>
          <div className="game-card px-2 py-1">
            <span className="font-pixel text-[8px] text-muted-foreground flex items-center justify-center gap-1">
              <Zap size={10} /> {isSpanish ? 'PODER' : 'POWER'}
            </span>
            <p className="font-pixel text-sm text-neon-pink">x{clickPower}</p>
          </div>
          <div className="game-card px-2 py-1">
            <span className="font-pixel text-[8px] text-muted-foreground">
              {isSpanish ? 'AUTO' : 'AUTO'}
            </span>
            <p className="font-pixel text-sm text-star-gold">{autoClickers}/s</p>
          </div>
        </div>

        {/* Click Button */}
        <div className="relative flex justify-center mb-4">
          <button
            onClick={handleClick}
            onMouseEnter={playHover}
            className="relative w-32 h-32 rounded-full bg-gradient-to-br from-neon-pink via-neon-purple to-neon-cyan
              border-4 border-star-gold shadow-[0_0_30px_rgba(255,215,0,0.5)]
              hover:scale-105 active:scale-95 transition-transform
              flex items-center justify-center"
          >
            <span className="text-6xl">⭐</span>
            
            {/* Floating numbers */}
            <AnimatePresence>
              {floatingNumbers.map(num => (
                <motion.span
                  key={num.id}
                  initial={{ opacity: 1, y: 0, scale: 1 }}
                  animate={{ opacity: 0, y: -60, scale: 1.5 }}
                  exit={{ opacity: 0 }}
                  className="absolute font-pixel text-lg text-star-gold pointer-events-none"
                  style={{ left: num.x, top: num.y }}
                >
                  +{num.value}
                </motion.span>
              ))}
            </AnimatePresence>
          </button>
        </div>

        {/* Upgrades */}
        <div className="space-y-2 mb-4">
          <button
            onClick={() => buyUpgrade('power')}
            onMouseEnter={playHover}
            disabled={clicks < powerCost}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-sm border-2 transition-all
              ${clicks >= powerCost 
                ? 'border-neon-pink hover:bg-neon-pink/20' 
                : 'border-muted opacity-50 cursor-not-allowed'}`}
          >
            <span className="font-retro text-sm flex items-center gap-2">
              <Zap size={14} className="text-neon-pink" />
              {isSpanish ? 'Más Poder' : 'More Power'} (+1)
            </span>
            <span className="font-pixel text-xs text-star-gold">{powerCost} ⭐</span>
          </button>

          <button
            onClick={() => buyUpgrade('auto')}
            onMouseEnter={playHover}
            disabled={clicks < autoCost}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-sm border-2 transition-all
              ${clicks >= autoCost 
                ? 'border-neon-cyan hover:bg-neon-cyan/20' 
                : 'border-muted opacity-50 cursor-not-allowed'}`}
          >
            <span className="font-retro text-sm flex items-center gap-2">
              <Star size={14} className="text-neon-cyan" />
              {isSpanish ? 'Auto-Click' : 'Auto-Click'} (+1/s)
            </span>
            <span className="font-pixel text-xs text-star-gold">{autoCost} ⭐</span>
          </button>
        </div>

        {/* Achievements */}
        <div className="border-t border-border pt-3">
          <div className="flex items-center gap-2 mb-2">
            <Trophy size={14} className="text-star-gold" />
            <span className="font-pixel text-[8px] text-muted-foreground">
              {isSpanish ? 'LOGROS' : 'ACHIEVEMENTS'}: {achievements.length}/5
            </span>
          </div>
          <div className="flex gap-1">
            {['first100', 'first1000', 'first10000', 'powerUp', 'automate'].map((id, i) => (
              <div
                key={id}
                className={`w-8 h-8 rounded-sm flex items-center justify-center text-lg
                  ${achievements.includes(id) 
                    ? 'bg-star-gold/20 border border-star-gold' 
                    : 'bg-muted/30 border border-muted'}`}
                title={
                  id === 'first100' ? '100 clicks' :
                  id === 'first1000' ? '1000 clicks' :
                  id === 'first10000' ? '10000 clicks' :
                  id === 'powerUp' ? 'Power x5' :
                  'Auto-click x3'
                }
              >
                {achievements.includes(id) ? '🏆' : '?'}
              </div>
            ))}
          </div>
        </div>

        {/* Controls hint */}
        <p className="text-center mt-3 font-retro text-xs text-muted-foreground">
          ESC {isSpanish ? 'para salir' : 'to exit'}
        </p>
      </div>
    </div>
  );
};