// Discriminated union of all game actions for the pure reducer
import { GameData, InventoryEntry, CharacterStats } from './GameTypes';

export type GameAction =
  // Movement
  | { type: 'MOVE_PLAYER'; direction: 'up' | 'down' | 'left' | 'right' }
  | { type: 'STOP_WALKING' }
  | { type: 'TELEPORT'; mapId: string; x: number; y: number }
  
  // Dialogue
  | { type: 'START_DIALOGUE'; dialogueId: string }
  | { type: 'ADVANCE_DIALOGUE' }
  | { type: 'SET_TYPING_TEXT'; text: string }
  | { type: 'FINISH_TYPING' }
  | { type: 'SELECT_DIALOGUE_CHOICE'; choiceIndex: number }
  | { type: 'CLOSE_DIALOGUE' }
  
  // Flags & Inventory
  | { type: 'SET_FLAG'; flag: string; value: boolean }
  | { type: 'ADD_INVENTORY_ITEM'; itemId: string; quantity?: number }
  | { type: 'REMOVE_INVENTORY_ITEM'; itemId: string; quantity?: number }
  | { type: 'ADD_GOLD'; amount: number }
  
  // Character progression
  | { type: 'UPDATE_CHARACTER_STATS'; characterId: string; stats: CharacterStats }
  
  // Game mode
  | { type: 'SET_PAUSED'; paused: boolean }
  | { type: 'TOGGLE_MOD_MENU' }
  | { type: 'SET_MOD_MENU'; show: boolean }
  
  // Language
  | { type: 'SET_LANGUAGE'; language: string }
  
  // Data (mods)
  | { type: 'UPDATE_GAME_DATA'; data: GameData }
  
  // Persistence
  | { type: 'LOAD_STATE'; payload: Partial<EngineState> }
  | { type: 'RESET'; initialState: EngineState };

// Full engine state managed by the reducer
export interface EngineState {
  // Persistent game state
  currentMapId: string;
  playerPosition: { x: number; y: number };
  playerDirection: 'up' | 'down' | 'left' | 'right';
  flags: Record<string, boolean>;
  inventory: InventoryEntry[];
  dialogueHistory: string[];
  playtime: number;
  savedAt: number;
  gold: number;
  characterLevels: Record<string, { level: number; exp: number }>;
  
  // Runtime UI state
  isWalking: boolean;
  activeDialogueId: string | null;
  dialogueIndex: number;
  displayedText: string;
  isTyping: boolean;
  isPaused: boolean;
  showModMenu: boolean;
  language: string;
  
  // Game data (static + mods)
  gameData: GameData;
}
