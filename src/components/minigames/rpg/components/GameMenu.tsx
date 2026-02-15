import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '@/contexts/SettingsContext';
import { GameState, GameData, Character, GameItem } from '../types/GameTypes';
import { heroClasses, characterClassMap } from '../data/heroClasses';

interface GameMenuProps {
  gameState: GameState;
  gameData: GameData;
  party: Character[];
  onClose: () => void;
  onUseItem?: (itemId: string, targetId: string) => void;
}

type TabType = 'stat' | 'item' | 'equip';

export const GameMenu: React.FC<GameMenuProps> = ({
  gameState,
  gameData,
  party,
  onClose,
  onUseItem,
}) => {
  const { language } = useSettings();
  const isSpanish = language === 'es';
  const [activeTab, setActiveTab] = useState<TabType>('stat');
  const [selectedCharIndex, setSelectedCharIndex] = useState(0);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const selectedChar = party[selectedCharIndex];
  const charClass = selectedChar ? heroClasses[characterClassMap[selectedChar.id]] : null;

  const inventoryItems = gameState.inventory
    .map(entry => {
      const item = gameData.items[entry.itemId];
      if (!item) return null;
      return { ...item, quantity: entry.quantity };
    })
    .filter(Boolean) as (GameItem & { quantity: number })[];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex bg-black"
    >
      {/* Left sidebar - character info + tabs */}
      <div className="w-28 sm:w-36 border-r-2 border-white/30 flex flex-col">
        {/* Character summary box */}
        <div className="border-b-2 border-white/30 p-2">
          {selectedChar && (
            <>
              <p className="font-pixel text-[10px] text-white">{selectedChar.name}</p>
              {charClass && (
                <p className="font-pixel text-[7px]" style={{ color: charClass.accentColor }}>
                  {charClass.icon} {isSpanish ? charClass.nameEs : charClass.name}
                </p>
              )}
              <div className="mt-1 space-y-0.5">
                <p className="font-pixel text-[7px] text-white/70">
                  LV: {selectedChar.stats.level}
                </p>
                <p className="font-pixel text-[7px] text-white/70">
                  HP: {selectedChar.stats.hp}/{selectedChar.stats.maxHp}
                </p>
                <p className="font-pixel text-[7px] text-yellow-400">
                  G: {gameState.gold || 0}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Tab buttons */}
        <div className="border-b-2 border-white/30 p-1.5 space-y-1">
          {[
            { id: 'stat' as TabType, label: 'STAT' },
            { id: 'item' as TabType, label: 'ITEM' },
            { id: 'equip' as TabType, label: isSpanish ? 'EQUIPO' : 'EQUIP' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full px-2 py-1.5 font-pixel text-[9px] text-left border-2 rounded-sm transition-colors
                ${activeTab === tab.id
                  ? 'border-white text-white bg-white/10'
                  : 'border-white/20 text-white/50 hover:border-white/50 hover:text-white/80'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Party list */}
        <div className="flex-1 p-1.5 space-y-1 overflow-y-auto">
          {party.map((char, idx) => {
            const cc = heroClasses[characterClassMap[char.id]];
            return (
              <button
                key={char.id}
                onClick={() => setSelectedCharIndex(idx)}
                className={`w-full px-1.5 py-1 text-left border rounded-sm transition-colors font-pixel text-[7px]
                  ${selectedCharIndex === idx
                    ? 'border-white/60 bg-white/10 text-white'
                    : 'border-transparent text-white/40 hover:text-white/70'
                  }`}
              >
                <span>{cc?.icon} </span>
                {char.name}
                <span className="text-white/30 ml-1">L{char.stats.level}</span>
              </button>
            );
          })}
        </div>

        {/* Close */}
        <div className="border-t-2 border-white/30 p-1.5">
          <button
            onClick={onClose}
            className="w-full px-2 py-1.5 font-pixel text-[8px] text-red-400 border border-red-400/50 rounded-sm hover:bg-red-400/10 transition-colors"
          >
            {isSpanish ? 'CERRAR' : 'CLOSE'}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-3 overflow-y-auto">
        <AnimatePresence mode="wait">
          {/* STAT tab */}
          {activeTab === 'stat' && selectedChar && (
            <motion.div
              key="stat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {/* Name header */}
              <div className="border-2 border-white/30 p-3 rounded-sm">
                <h3 className="font-pixel text-sm text-white mb-2">
                  - "{isSpanish ? selectedChar.nameEs : selectedChar.name}"
                </h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                  <p className="font-pixel text-[8px] text-white/70">
                    · LV: <span className="text-white">{selectedChar.stats.level}</span>
                  </p>
                  <p className="font-pixel text-[8px] text-white/70">
                    · EXP: <span className="text-white">{selectedChar.stats.exp}</span>
                  </p>
                  <p className="font-pixel text-[8px] text-white/70">
                    · HP: <span className="text-white">{selectedChar.stats.hp}/{selectedChar.stats.maxHp}</span>
                  </p>
                  <p className="font-pixel text-[8px] text-white/70">
                    · NEXT: <span className="text-white">{selectedChar.stats.expToNext - selectedChar.stats.exp}</span>
                  </p>
                </div>
              </div>

              {/* Combat stats */}
              <div className="border-2 border-white/30 p-3 rounded-sm space-y-1">
                {[
                  { label: 'AT', value: selectedChar.stats.attack, color: '#f97316' },
                  { label: 'DEF', value: selectedChar.stats.defense, color: '#3b82f6' },
                  { label: 'MAG', value: selectedChar.stats.magic, color: '#a855f7' },
                  { label: 'SPD', value: selectedChar.stats.speed, color: '#eab308' },
                ].map(stat => (
                  <div key={stat.label} className="flex items-center gap-2">
                    <span className="font-pixel text-[8px] text-white/60 w-8">{stat.label}:</span>
                    <span className="font-pixel text-[9px] text-white">{stat.value}</span>
                    <div className="flex-1 h-1.5 bg-white/10 rounded-sm overflow-hidden ml-2">
                      <div
                        className="h-full rounded-sm transition-all"
                        style={{ width: `${Math.min(100, (stat.value / 30) * 100)}%`, backgroundColor: stat.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Class info */}
              {charClass && (
                <div className="border-2 border-white/30 p-3 rounded-sm">
                  <p className="font-pixel text-[8px] text-white/50 mb-1">
                    {isSpanish ? 'CLASE' : 'CLASS'}: <span style={{ color: charClass.accentColor }}>{isSpanish ? charClass.nameEs : charClass.name}</span>
                  </p>
                  <p className="font-pixel text-[7px] text-white/60">
                    {isSpanish ? charClass.descriptionEs : charClass.description}
                  </p>
                </div>
              )}

              {/* Footer */}
              <div className="border-2 border-white/30 p-2 rounded-sm flex justify-between">
                <p className="font-pixel text-[7px] text-yellow-400">
                  GOLD: {gameState.gold || 0}
                </p>
                <p className="font-pixel text-[7px] text-white/40">
                  {isSpanish ? 'Tiempo' : 'Time'}: {Math.floor(gameState.playtime / 60)}:{String(gameState.playtime % 60).padStart(2, '0')}
                </p>
              </div>
            </motion.div>
          )}

          {/* ITEM tab */}
          {activeTab === 'item' && (
            <motion.div
              key="item"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="border-2 border-white/30 p-3 rounded-sm">
                <h3 className="font-pixel text-[10px] text-white mb-2">
                  {isSpanish ? 'INVENTARIO' : 'INVENTORY'}
                  <span className="text-white/30 ml-2">{inventoryItems.length}/20</span>
                </h3>
                {inventoryItems.length === 0 ? (
                  <p className="font-pixel text-[8px] text-white/30 text-center py-4">
                    {isSpanish ? '(vacío)' : '(empty)'}
                  </p>
                ) : (
                  <div className="space-y-1">
                    {inventoryItems.map(item => (
                      <button
                        key={item.id}
                        onClick={() => setSelectedItem(selectedItem === item.id ? null : item.id)}
                        className={`w-full text-left px-2 py-1 font-pixel text-[8px] border rounded-sm transition-colors
                          ${selectedItem === item.id
                            ? 'border-yellow-400 bg-yellow-400/10 text-white'
                            : 'border-white/10 text-white/70 hover:border-white/30'
                          }`}
                      >
                        <span>{isSpanish ? item.nameEs : item.name}</span>
                        <span className="text-white/30 float-right">x{item.quantity}</span>
                      </button>
                    ))}
                  </div>
                )}

                {selectedItem && (() => {
                  const item = inventoryItems.find(i => i.id === selectedItem);
                  if (!item) return null;
                  return (
                    <div className="mt-2 border-t border-white/20 pt-2">
                      <p className="font-pixel text-[7px] text-white/60">
                        {isSpanish ? item.descriptionEs : item.description}
                      </p>
                      {item.usable && (
                        <button
                          onClick={() => onUseItem?.(item.id, party[selectedCharIndex]?.id || '')}
                          className="mt-1 px-3 py-1 font-pixel text-[7px] text-green-400 border border-green-400/50 rounded-sm hover:bg-green-400/10"
                        >
                          {isSpanish ? 'USAR' : 'USE'}
                        </button>
                      )}
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          )}

          {/* EQUIP tab */}
          {activeTab === 'equip' && (
            <motion.div
              key="equip"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="border-2 border-white/30 p-3 rounded-sm">
                <h3 className="font-pixel text-[10px] text-white mb-2">{isSpanish ? 'EQUIPAMIENTO' : 'EQUIPMENT'}</h3>
                <div className="space-y-2">
                  {[
                    { slot: isSpanish ? 'ARMA' : 'WEAPON', value: isSpanish ? '(ninguna)' : '(none)' },
                    { slot: isSpanish ? 'ARMADURA' : 'ARMOR', value: isSpanish ? '(ninguna)' : '(none)' },
                    { slot: isSpanish ? 'ACCESORIO' : 'ACCESSORY', value: isSpanish ? '(ninguno)' : '(none)' },
                  ].map(eq => (
                    <div key={eq.slot} className="flex items-center gap-2">
                      <span className="font-pixel text-[8px] text-white/50 w-20">{eq.slot}:</span>
                      <span className="font-pixel text-[8px] text-white/30">{eq.value}</span>
                    </div>
                  ))}
                </div>
                <p className="font-pixel text-[7px] text-white/20 mt-3 text-center">
                  {isSpanish ? '(Próximamente)' : '(Coming soon)'}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
