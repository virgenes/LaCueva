// usePersistence — Multi-slot save system with versioning and migrations

import { useCallback } from 'react';
import { GameState } from '../types/GameTypes';

const SAVE_VERSION = '2.0.0';
const SAVE_PREFIX = 'rpg_save_v2_slot_';
const MAX_SLOTS = 5;

export interface SaveData {
  version: string;
  gameState: Omit<GameState, 'savedAt'> & { savedAt: number };
  modsEnabled: string[];
  savedAt: number;
}

// Migration functions from old versions
const migrations: Record<string, (data: any) => any> = {
  // From no version / v1 to v2
  'legacy': (data: any) => {
    return {
      version: '2.0.0',
      gameState: {
        currentMapId: data.currentMapId || 'memory_garden',
        playerPosition: data.playerPosition || { x: 25, y: 20 },
        playerDirection: data.playerDirection || 'down',
        flags: data.flags || {},
        inventory: data.inventory || [],
        dialogueHistory: data.dialogueHistory || [],
        playtime: data.playtime || 0,
        savedAt: data.savedAt || Date.now(),
      },
      modsEnabled: [],
      savedAt: data.savedAt || Date.now(),
    };
  },
};

function migrate(raw: any): SaveData {
  // If it has no version, it's a legacy save
  if (!raw.version) {
    return migrations.legacy(raw);
  }
  // Already current version
  if (raw.version === SAVE_VERSION) {
    return raw as SaveData;
  }
  // Future migrations would chain here
  return migrations.legacy(raw);
}

export function usePersistence() {
  const saveGame = useCallback((
    slotId: number,
    gameState: GameState,
    modsEnabled: string[] = []
  ) => {
    const saveData: SaveData = {
      version: SAVE_VERSION,
      gameState: { ...gameState, savedAt: Date.now() },
      modsEnabled,
      savedAt: Date.now(),
    };
    try {
      localStorage.setItem(`${SAVE_PREFIX}${slotId}`, JSON.stringify(saveData));
    } catch (e) {
      console.error('Failed to save game:', e);
    }
  }, []);

  const loadGame = useCallback((slotId: number): SaveData | null => {
    try {
      const raw = localStorage.getItem(`${SAVE_PREFIX}${slotId}`);
      if (!raw) {
        // Try loading legacy save for slot 0
        if (slotId === 0) {
          const legacy = localStorage.getItem('rpg_game_state');
          if (legacy) return migrate(JSON.parse(legacy));
        }
        return null;
      }
      return migrate(JSON.parse(raw));
    } catch (e) {
      console.error('Failed to load game:', e);
      return null;
    }
  }, []);

  const hasSaveData = useCallback((slotId: number): boolean => {
    const exists = !!localStorage.getItem(`${SAVE_PREFIX}${slotId}`);
    if (!exists && slotId === 0) {
      return !!localStorage.getItem('rpg_game_state');
    }
    return exists;
  }, []);

  const deleteSave = useCallback((slotId: number) => {
    localStorage.removeItem(`${SAVE_PREFIX}${slotId}`);
  }, []);

  const getSaveSlots = useCallback((): (SaveData | null)[] => {
    const slots: (SaveData | null)[] = [];
    for (let i = 0; i < MAX_SLOTS; i++) {
      slots.push(loadGame(i));
    }
    return slots;
  }, [loadGame]);

  return { saveGame, loadGame, hasSaveData, deleteSave, getSaveSlots, MAX_SLOTS };
}
