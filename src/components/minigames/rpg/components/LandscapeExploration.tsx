import React from 'react';
import { GameCanvas, MapMonster } from './GameCanvas';
import { DialogueBox } from './DialogueBox';
import { LandscapeTouchControls } from './LandscapeTouchControls';
import { GameMenu } from './GameMenu';
import { GameData, GameState, GameMap, Character } from '../types/GameTypes';
import { SpatialHash } from '../systems/SpatialHash';
import { Save, Settings, X, Swords } from 'lucide-react';
import { monsterRegistry } from '../data/monsters';

interface LandscapeExplorationProps {
  gameData: GameData;
  gameState: GameState;
  currentMap: GameMap;
  mapMonsters: MapMonster[];
  onMonsterEncounter: (monster: MapMonster) => void;
  spatialHash?: SpatialHash;
  isWalking: boolean;
  selectedCharacterId: string;
  timeOfDay: number;
  activeDialogue: any;
  dialogueIndex: number;
  displayedText: string;
  isTyping: boolean;
  showGameMenu: boolean;
  isPaused: boolean;
  showModMenu: boolean;
  partyCharacters: Character[];
  isSpanish: boolean;
  onMove: (dir: 'up' | 'down' | 'left' | 'right') => void;
  onInteract: () => void;
  onSelectChoice: (idx: number) => void;
  onToggleMenu: () => void;
  onFullscreen: () => void;
  onSave: () => void;
  onSettings: () => void;
  onClose: () => void;
  onCloseMenu: () => void;
  onUseItem: (itemId: string, targetId: string) => void;
  onResume: () => void;
}

/**
 * Full-screen landscape exploration layout (PSP-style).
 * Game canvas fills the entire screen, controls overlay on sides.
 */
export const LandscapeExploration: React.FC<LandscapeExplorationProps> = ({
  gameData, gameState, currentMap, mapMonsters, onMonsterEncounter,
  spatialHash, isWalking, selectedCharacterId, timeOfDay,
  activeDialogue, dialogueIndex, displayedText, isTyping,
  showGameMenu, isPaused, showModMenu, partyCharacters, isSpanish,
  onMove, onInteract, onSelectChoice, onToggleMenu, onFullscreen,
  onSave, onSettings, onClose, onCloseMenu, onUseItem, onResume,
}) => {
  const hostileCount = mapMonsters.filter(m => monsterRegistry[m.monsterId]?.hostile).length;

  return (
    <div className="fixed inset-0 z-[300] bg-black flex items-center justify-center">
      {/* HUD - top bar (minimal, semi-transparent) */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-3 py-1 bg-black/40 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="font-pixel text-[7px] text-white/60 truncate max-w-[100px]">
            {isSpanish ? currentMap?.nameEs : currentMap?.name}
          </span>
          {hostileCount > 0 && (
            <div className="flex items-center gap-0.5 px-1 py-0.5 border border-red-500/40 rounded-sm">
              <Swords size={8} className="text-red-400" />
              <span className="font-pixel text-[6px] text-red-400">{hostileCount}</span>
            </div>
          )}
          <span className="font-pixel text-[7px] text-yellow-400/50">
            {timeOfDay < 0.2 || timeOfDay > 0.8 ? '🌙' : timeOfDay < 0.3 || timeOfDay > 0.7 ? '🌅' : '☀️'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onSave} className="p-1 rounded-sm hover:bg-white/10"><Save size={10} className="text-white/50" /></button>
          <button onClick={onSettings} className="p-1 rounded-sm hover:bg-white/10"><Settings size={10} className="text-white/50" /></button>
          <button onClick={onClose} className="p-1 rounded-sm hover:bg-red-500/10"><X size={10} className="text-red-400/60" /></button>
        </div>
      </div>

      {/* Game canvas - slightly inset for comfort */}
      <div className="absolute inset-0 flex items-center justify-center px-4 py-6">
        <div className="w-full h-full max-w-[92%] max-h-[88%] rounded-md overflow-hidden border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.8)]">
          <GameCanvas
            gameData={gameData} gameState={gameState} currentMap={currentMap}
            pixelSize={4}
            mapMonsters={mapMonsters} onMonsterEncounter={onMonsterEncounter}
            spatialHash={spatialHash} isMobile={true} isWalking={isWalking}
            selectedCharacterId={selectedCharacterId}
            timeOfDay={timeOfDay}
            suppressOverlay={showGameMenu || isPaused}
          />
        </div>
      </div>

      {/* Dialogue overlay */}
      {activeDialogue && (
        <div className="absolute bottom-0 left-0 right-0 z-50">
          <DialogueBox
            dialogue={activeDialogue} dialogueIndex={dialogueIndex}
            displayedText={displayedText} isTyping={isTyping} gameData={gameData}
            onAdvance={onInteract} onSelectChoice={onSelectChoice}
          />
        </div>
      )}

      {/* Touch controls overlay (PSP-style) */}
      {!showGameMenu && !isPaused && !activeDialogue && (
        <LandscapeTouchControls
          onMove={onMove}
          onInteract={onInteract}
          onMenu={onToggleMenu}
          onFullscreen={onFullscreen}
          disabled={!!showModMenu || isPaused}
        />
      )}

      {/* Game menu overlay */}
      {showGameMenu && (
        <div className="absolute inset-0 z-[65]">
          <GameMenu
            gameState={gameState} gameData={gameData} party={partyCharacters}
            onClose={onCloseMenu} onUseItem={onUseItem}
          />
        </div>
      )}

      {/* Pause overlay */}
      {isPaused && !showModMenu && !showGameMenu && (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-[70]">
          <p className="font-pixel text-xl text-white mb-6">{isSpanish ? 'PAUSA' : 'PAUSED'}</p>
          <button onClick={onResume}
            className="px-6 py-3 font-pixel text-sm border-2 border-white rounded-sm text-white hover:bg-white/10">
            {isSpanish ? 'CONTINUAR' : 'CONTINUE'}
          </button>
        </div>
      )}
    </div>
  );
};
