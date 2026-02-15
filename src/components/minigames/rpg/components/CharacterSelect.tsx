import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { SpriteRenderer } from './SpriteRenderer';
import { heroClasses, characterClassMap, HeroClass } from '../data/heroClasses';
import { protagonistSprites, protagonistCharacters } from '../data/protagonistSprites';
import { imageSprites, PLAYER_SPRITE_SHEET_ID } from '../data/imageSprites';

interface CharacterSelectProps {
  onSelect: (characterId: string) => void;
  onBack: () => void;
}

const characterOrder = ['matias', 'maximo', 'miguel', 'elias', 'alejandro', 'angel'];

export const CharacterSelect: React.FC<CharacterSelectProps> = ({ onSelect, onBack }) => {
  const { language } = useSettings();
  const isSpanish = language === 'es';
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [confirmed, setConfirmed] = useState(false);

  const charId = characterOrder[selectedIndex];
  const classId = characterClassMap[charId];
  const heroClass = heroClasses[classId];
  const charData = protagonistCharacters[charId];
  const sprite = protagonistSprites[charId];
  const hasSpriteSheet = charId === 'matias'; // Only Matías has a PNG sheet

  const prev = useCallback(() => {
    setSelectedIndex(i => (i - 1 + characterOrder.length) % characterOrder.length);
    setConfirmed(false);
  }, []);

  const next = useCallback(() => {
    setSelectedIndex(i => (i + 1) % characterOrder.length);
    setConfirmed(false);
  }, []);

  const handleConfirm = () => {
    if (confirmed) {
      onSelect(charId);
    } else {
      setConfirmed(true);
    }
  };

  // Render sprite sheet preview for Matías, fallback pixel art for others
  const renderCharacterPreview = () => {
    if (hasSpriteSheet) {
      const sheet = imageSprites[PLAYER_SPRITE_SHEET_ID];
      if (sheet) {
        const anim = sheet.animations['idle_down'];
        const scaleSize = 96;
        const scaleX = scaleSize / sheet.frameWidth;
        const scaleY = scaleSize / sheet.frameHeight;
        return (
          <div
            style={{
              width: scaleSize,
              height: scaleSize,
              backgroundImage: `url(${sheet.src})`,
              backgroundPosition: `0px ${-(anim.row * sheet.frameHeight) * scaleY}px`,
              backgroundSize: `${sheet.frameWidth * 4 * scaleX}px ${sheet.frameHeight * 4 * scaleY}px`,
              backgroundRepeat: 'no-repeat',
              imageRendering: 'pixelated',
            }}
          />
        );
      }
    }
    // Fallback to pixel art
    return <SpriteRenderer sprite={sprite.frames[0]} size={12} />;
  };

  return (
    <div className="absolute inset-0 bg-black flex flex-col overflow-hidden">
      {/* Top border */}
      <div className="h-1 bg-white/20" />

      {/* Header */}
      <div className="px-4 py-3 border-b-2 border-white/20">
        <h2 className="font-pixel text-sm text-white text-center tracking-widest">
          {isSpanish ? '◆ ELIGE TU HÉROE ◆' : '◆ CHOOSE YOUR HERO ◆'}
        </h2>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Character preview - left panel */}
        <div className="flex-1 flex flex-col items-center justify-center relative p-4">
          {/* Navigation arrows */}
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 text-white/50 hover:text-white transition-colors z-10"
          >
            <ChevronLeft size={28} />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-white/50 hover:text-white transition-colors z-10"
          >
            <ChevronRight size={28} />
          </button>

          <AnimatePresence mode="wait">
            <motion.div
              key={charId}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center"
            >
              {/* Character sprite */}
              <div
                className="border-4 rounded-sm p-4 mb-3"
                style={{ borderColor: heroClass.accentColor, backgroundColor: `${heroClass.accentColor}10` }}
              >
                {renderCharacterPreview()}
              </div>

              {/* Name & Class */}
              <div className="text-center">
                <h3 className="font-pixel text-lg text-white">{charData.name}</h3>
                <div className="flex items-center gap-2 justify-center mt-1">
                  <span className="text-lg">{heroClass.icon}</span>
                  <span className="font-pixel text-xs" style={{ color: heroClass.accentColor }}>
                    {isSpanish ? heroClass.nameEs : heroClass.name}
                  </span>
                </div>
              </div>

              {/* Dots */}
              <div className="flex gap-1.5 mt-3">
                {characterOrder.map((_, idx) => (
                  <div
                    key={idx}
                    className="w-2 h-2 rounded-full transition-colors"
                    style={{
                      backgroundColor: idx === selectedIndex ? heroClass.accentColor : 'rgba(255,255,255,0.2)',
                    }}
                  />
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Stats panel - right side (Undertale-style black box with white border) */}
        <div className="flex-1 border-l-2 border-white/20 p-3 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={charId}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {/* Description */}
              <div className="border-2 border-white/30 p-3 rounded-sm">
                <p className="font-pixel text-[9px] text-white/90 leading-relaxed">
                  {isSpanish ? heroClass.descriptionEs : heroClass.description}
                </p>
              </div>

              {/* Stats */}
              <div className="border-2 border-white/30 p-3 rounded-sm">
                <h4 className="font-pixel text-[9px] text-white/50 mb-2">STATS</h4>
                <div className="space-y-1.5">
                  {[
                    { label: 'HP', value: heroClass.statModifiers.hp || 100, max: 150, color: '#ef4444' },
                    { label: 'ATK', value: heroClass.statModifiers.attack || 10, max: 20, color: '#f97316' },
                    { label: 'DEF', value: heroClass.statModifiers.defense || 5, max: 20, color: '#3b82f6' },
                    { label: 'MAG', value: heroClass.statModifiers.magic || 8, max: 20, color: '#a855f7' },
                    { label: 'SPD', value: heroClass.statModifiers.speed || 3, max: 10, color: '#eab308' },
                  ].map(stat => (
                    <div key={stat.label} className="flex items-center gap-2">
                      <span className="font-pixel text-[8px] text-white/70 w-8">{stat.label}</span>
                      <div className="flex-1 h-2 bg-white/10 rounded-sm overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(stat.value / stat.max) * 100}%` }}
                          transition={{ delay: 0.2, duration: 0.5 }}
                          className="h-full rounded-sm"
                          style={{ backgroundColor: stat.color }}
                        />
                      </div>
                      <span className="font-pixel text-[8px] text-white/50 w-6 text-right">{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strengths / Weaknesses */}
              <div className="grid grid-cols-2 gap-2">
                <div className="border-2 border-green-500/40 p-2 rounded-sm">
                  <h4 className="font-pixel text-[7px] text-green-400 mb-1">
                    {isSpanish ? 'FORTALEZAS' : 'STRENGTHS'}
                  </h4>
                  {(isSpanish ? heroClass.strengthsEs : heroClass.strengths).map((s, i) => (
                    <p key={i} className="font-pixel text-[7px] text-green-300/80">+ {s}</p>
                  ))}
                </div>
                <div className="border-2 border-red-500/40 p-2 rounded-sm">
                  <h4 className="font-pixel text-[7px] text-red-400 mb-1">
                    {isSpanish ? 'DEBILIDADES' : 'WEAKNESSES'}
                  </h4>
                  {(isSpanish ? heroClass.weaknessesEs : heroClass.weaknesses).map((w, i) => (
                    <p key={i} className="font-pixel text-[7px] text-red-300/80">- {w}</p>
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom action bar - Undertale style */}
      <div className="border-t-2 border-white/20 p-3 flex items-center justify-between">
        <button
          onClick={onBack}
          className="px-4 py-2 font-pixel text-xs text-white/50 border-2 border-white/20 rounded-sm hover:border-white/50 hover:text-white transition-colors"
        >
          {isSpanish ? '← VOLVER' : '← BACK'}
        </button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleConfirm}
          className="px-6 py-2 font-pixel text-xs rounded-sm border-2 transition-colors"
          style={{
            borderColor: heroClass.accentColor,
            color: confirmed ? 'black' : heroClass.accentColor,
            backgroundColor: confirmed ? heroClass.accentColor : 'transparent',
          }}
        >
          {confirmed
            ? (isSpanish ? '✓ CONFIRMAR' : '✓ CONFIRM')
            : (isSpanish ? 'ELEGIR' : 'SELECT')}
        </motion.button>
      </div>

      {/* Bottom border */}
      <div className="h-1 bg-white/20" />
    </div>
  );
};
