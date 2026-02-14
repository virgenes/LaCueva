import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Users, Package, BarChart3, Heart, Sword, Shield, Zap, Star, Coins } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { GameState, GameData, Character, GameItem } from '../types/GameTypes';

interface GameMenuProps {
  gameState: GameState;
  gameData: GameData;
  party: Character[];
  onClose: () => void;
  onUseItem?: (itemId: string, targetId: string) => void;
}

type TabType = 'stats' | 'party' | 'items';

export const GameMenu: React.FC<GameMenuProps> = ({
  gameState,
  gameData,
  party,
  onClose,
  onUseItem,
}) => {
  const { language } = useSettings();
  const isSpanish = language === 'es';
  const [activeTab, setActiveTab] = useState<TabType>('stats');
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(party[0]?.id || null);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const tabs: { id: TabType; label: string; labelEs: string; icon: React.ReactNode }[] = [
    { id: 'stats', label: 'Stats', labelEs: 'Stats', icon: <BarChart3 size={14} /> },
    { id: 'party', label: 'Party', labelEs: 'Grupo', icon: <Users size={14} /> },
    { id: 'items', label: 'Items', labelEs: 'Objetos', icon: <Package size={14} /> },
  ];

  const selectedChar = party.find(c => c.id === selectedCharacter);

  // Real inventory from gameState
  const inventoryItems = gameState.inventory
    .map(entry => {
      const item = gameData.items[entry.itemId];
      if (!item) return null;
      return { ...item, quantity: entry.quantity };
    })
    .filter(Boolean) as (GameItem & { quantity: number })[];

  const getStatBar = (current: number, max: number, color: string) => {
    const percentage = Math.min(100, (current / max) * 100);
    return (
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          className={`h-full ${color}`}
        />
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-night-deep/95 z-50 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b border-pixel-border bg-card/50">
        <div className="flex items-center gap-3">
          <h2 className="font-pixel text-sm text-neon-cyan">
            {isSpanish ? 'MENÚ' : 'MENU'}
          </h2>
          <div className="flex items-center gap-1 font-pixel text-[8px] text-star-gold">
            <Coins size={10} /> {gameState.gold || 0}G
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-neon-pink/20 rounded-sm transition-colors"
        >
          <X size={16} className="text-neon-pink" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-pixel-border">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1 py-2 font-pixel text-[8px] transition-colors
              ${activeTab === tab.id 
                ? 'bg-neon-cyan/20 text-neon-cyan border-b-2 border-neon-cyan' 
                : 'text-muted-foreground hover:text-foreground'}`}
          >
            {tab.icon}
            {isSpanish ? tab.labelEs : tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-2">
        <AnimatePresence mode="wait">
          {/* Stats Tab */}
          {activeTab === 'stats' && selectedChar && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-3"
            >
              <div className="flex gap-2 overflow-x-auto pb-2">
                {party.map(char => (
                  <button
                    key={char.id}
                    onClick={() => setSelectedCharacter(char.id)}
                    className={`flex-shrink-0 p-1 rounded-sm border-2 transition-colors
                      ${selectedCharacter === char.id 
                        ? 'border-neon-cyan bg-neon-cyan/20' 
                        : 'border-border hover:border-muted-foreground'}`}
                  >
                    <div className="w-8 h-8 bg-muted rounded-sm flex items-center justify-center">
                      <span className="text-sm">{char.name.charAt(0)}</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="bg-card/50 border border-pixel-border rounded-sm p-3">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-muted rounded-sm flex items-center justify-center">
                    <User size={24} className="text-neon-cyan" />
                  </div>
                  <div>
                    <h3 className="font-pixel text-sm text-foreground">
                      {isSpanish ? selectedChar.nameEs : selectedChar.name}
                    </h3>
                    <p className="font-retro text-[8px] text-muted-foreground flex items-center gap-1">
                      <Star size={8} className="text-star-gold" />
                      Lv.{selectedChar.stats.level} | EXP: {selectedChar.stats.exp}/{selectedChar.stats.expToNext}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="flex items-center gap-1 font-retro text-[8px] text-foreground">
                        <Heart size={10} className="text-red-500" /> HP
                      </span>
                      <span className="font-pixel text-[8px]">
                        {selectedChar.stats.hp}/{selectedChar.stats.maxHp}
                      </span>
                    </div>
                    {getStatBar(selectedChar.stats.hp, selectedChar.stats.maxHp, 'bg-red-500')}
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="flex items-center gap-1 font-retro text-[8px] text-foreground">
                        <Sword size={10} className="text-orange-500" /> ATK
                      </span>
                      <span className="font-pixel text-[8px]">{selectedChar.stats.attack}</span>
                    </div>
                    {getStatBar(selectedChar.stats.attack, 50, 'bg-orange-500')}
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="flex items-center gap-1 font-retro text-[8px] text-foreground">
                        <Shield size={10} className="text-blue-500" /> DEF
                      </span>
                      <span className="font-pixel text-[8px]">{selectedChar.stats.defense}</span>
                    </div>
                    {getStatBar(selectedChar.stats.defense, 50, 'bg-blue-500')}
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="flex items-center gap-1 font-retro text-[8px] text-foreground">
                        <Zap size={10} className="text-purple-500" /> MAG
                      </span>
                      <span className="font-pixel text-[8px]">{selectedChar.stats.magic}</span>
                    </div>
                    {getStatBar(selectedChar.stats.magic, 50, 'bg-purple-500')}
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="flex items-center gap-1 font-retro text-[8px] text-foreground">
                        <Zap size={10} className="text-yellow-500" /> SPD
                      </span>
                      <span className="font-pixel text-[8px]">{selectedChar.stats.speed}</span>
                    </div>
                    {getStatBar(selectedChar.stats.speed, 20, 'bg-yellow-500')}
                  </div>
                </div>
              </div>

              <div className="text-center font-retro text-[8px] text-muted-foreground">
                {isSpanish ? 'Tiempo de juego: ' : 'Play time: '}
                {Math.floor(gameState.playtime / 60)}:{String(gameState.playtime % 60).padStart(2, '0')}
              </div>
            </motion.div>
          )}

          {/* Party Tab */}
          {activeTab === 'party' && (
            <motion.div
              key="party"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-2"
            >
              {party.map((char, index) => (
                <motion.div
                  key={char.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3 p-2 bg-card/50 border border-pixel-border rounded-sm"
                >
                  <div className="w-10 h-10 bg-muted rounded-sm flex items-center justify-center">
                    <span className="text-lg">{char.name.charAt(0)}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-pixel text-[9px] text-foreground">
                      {isSpanish ? char.nameEs : char.name}
                      <span className="ml-1 text-star-gold">Lv.{char.stats.level}</span>
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-red-500"
                          style={{ width: `${(char.stats.hp / char.stats.maxHp) * 100}%` }}
                        />
                      </div>
                      <span className="font-retro text-[7px] text-muted-foreground">
                        {char.stats.hp}/{char.stats.maxHp}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Items Tab */}
          {activeTab === 'items' && (
            <motion.div
              key="items"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-2"
            >
              <div className="grid grid-cols-2 gap-2">
                {inventoryItems.map((item, index) => (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => setSelectedItem(selectedItem === item.id ? null : item.id)}
                    className={`p-2 bg-card/50 border rounded-sm text-left transition-colors
                      ${selectedItem === item.id 
                        ? 'border-neon-cyan bg-neon-cyan/10' 
                        : 'border-pixel-border hover:border-muted-foreground'}`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-muted rounded-sm flex items-center justify-center">
                        <Package size={12} className={item.usable ? 'text-green-500' : 'text-muted-foreground'} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-pixel text-[7px] text-foreground truncate">
                          {isSpanish ? item.nameEs : item.name}
                        </h4>
                        <p className="font-retro text-[6px] text-muted-foreground">
                          x{item.quantity}
                        </p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>

              <AnimatePresence>
                {selectedItem && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-card border border-neon-cyan/50 rounded-sm p-2 mt-2"
                  >
                    {(() => {
                      const item = inventoryItems.find(i => i.id === selectedItem);
                      if (!item) return null;
                      return (
                        <>
                          <h4 className="font-pixel text-[9px] text-neon-cyan mb-1">
                            {isSpanish ? item.nameEs : item.name}
                          </h4>
                          <p className="font-retro text-[8px] text-foreground mb-2">
                            {isSpanish ? item.descriptionEs : item.description}
                          </p>
                          {item.usable && (
                            <button
                              onClick={() => onUseItem?.(item.id, party[0]?.id || '')}
                              className="w-full py-1 font-pixel text-[7px] text-green-500 
                                border border-green-500 rounded-sm hover:bg-green-500/20 transition-colors"
                            >
                              {isSpanish ? 'USAR' : 'USE'}
                            </button>
                          )}
                        </>
                      );
                    })()}
                  </motion.div>
                )}
              </AnimatePresence>

              {inventoryItems.length === 0 && (
                <div className="text-center py-8">
                  <Package size={32} className="text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="font-retro text-[8px] text-muted-foreground">
                    {isSpanish ? 'Sin objetos' : 'No items'}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-pixel-border bg-card/50">
        <div className="flex items-center justify-between font-retro text-[7px] text-muted-foreground">
          <span>{isSpanish ? 'Posición:' : 'Position:'} ({gameState.playerPosition.x}, {gameState.playerPosition.y})</span>
          <span>{isSpanish ? 'Mapa:' : 'Map:'} {gameState.currentMapId}</span>
        </div>
      </div>
    </motion.div>
  );
};
