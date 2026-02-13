import { useReducer } from 'react';
import { GameState, GameData, Dialogue, Position } from '../types/GameTypes';
import { imageTiles, isImageTile, ImageTile } from '../data/imageTiles';
import { defaultMaps, teleporterConnections } from '../data/defaultMap';
import { defaultSprites, defaultTiles } from '../data/defaultSprites';
import { defaultDialogues, defaultCharacters, defaultItems } from '../data/defaultDialogues';

export type GameAction =
  | { type: 'MOVE_PLAYER'; direction: 'up' | 'down' | 'left' | 'right'; canMove: (x: number, y: number) => boolean }
  | { type: 'SET_PLAYER_POSITION'; position: Position }
  | { type: 'TELEPORT'; mapId: string; position: Position }
  | { type: 'START_DIALOGUE'; dialogue: Dialogue }
  | { type: 'ADVANCE_DIALOGUE' }
  | { type: 'SELECT_DIALOGUE_CHOICE'; choiceIndex: number; dialogues: Record<string, Dialogue> }
  | { type: 'SET_TYPING_TEXT'; text: string; isTyping: boolean }
  | { type: 'CLOSE_DIALOGUE' }
  | { type: 'SET_GAME_MODE'; mode: GameMode }
  | { type: 'TOGGLE_MOD_MENU'; show?: boolean }
  | { type: 'TOGGLE_PAUSE' }
  | { type: 'SET_FLAG'; key: string; value: boolean }
  | { type: 'ADD_INVENTORY_ITEM'; itemId: string }
  | { type: 'UPDATE_GAME_DATA'; data: Partial<GameData> }
  | { type: 'TICK_PLAYTIME' };

export type GameMode = 'menu' | 'prologue' | 'playing' | 'combat';

export interface GameStateWithData {
  gameState: GameState;
  gameData: GameData;
  activeDialogue: Dialogue | null;
  dialogueIndex: number;
  displayedText: string;
  isTyping: boolean;
  gameMode: GameMode;
  showModMenu: boolean;
  isPaused: boolean;
  language: 'en' | 'es';
}

const initialGameData: GameData = {
  version: '1.0.0',
  title: 'Echoes of Memory',
  titleEs: 'Ecos de la Memoria',
  author: 'Maximo',
  sprites: defaultSprites,
  characters: defaultCharacters,
  dialogues: defaultDialogues,
  tiles: defaultTiles,
  maps: defaultMaps,
  items: defaultItems,
  config: {
    tileSize: 32,
    playerSpeed: 4,
    dialogueSpeed: 30,
    showFps: false,
    musicVolume: 0.5,
    sfxVolume: 0.7,
  },
};

const createInitialGameState = (gameData: GameData): GameState => {
  const startMap = gameData.maps['memory_garden'];
  return {
    currentMapId: 'memory_garden',
    playerPosition: { ...startMap.spawnPoint },
    playerDirection: 'down',
    flags: {},
    inventory: [],
    dialogueHistory: [],
    playtime: 0,
    savedAt: Date.now(),
  };
};

export const getInitialState = (): GameStateWithData => ({
  gameState: createInitialGameState(initialGameData),
  gameData: initialGameData,
  activeDialogue: null,
  dialogueIndex: 0,
  displayedText: '',
  isTyping: false,
  gameMode: 'menu',
  showModMenu: false,
  isPaused: false,
  language: 'en',
});

const movePlayerPure = (
  gameState: GameState,
  direction: 'up' | 'down' | 'left' | 'right',
  canMove: (x: number, y: number) => boolean
): GameState => {
  const newPos = { ...gameState.playerPosition };
  switch (direction) {
    case 'up':    newPos.y -= 1; break;
    case 'down':  newPos.y += 1; break;
    case 'left':  newPos.x -= 1; break;
    case 'right': newPos.x += 1; break;
  }
  if (canMove(newPos.x, newPos.y)) {
    return { ...gameState, playerPosition: newPos, playerDirection: direction };
  }
  return { ...gameState, playerDirection: direction };
};

const advanceDialoguePure = (state: GameStateWithData): Partial<GameStateWithData> => {
  const { activeDialogue, dialogueIndex, displayedText, isTyping, language, gameData } = state;
  if (!activeDialogue) return {};

  const currentLine = activeDialogue.lines[dialogueIndex];
  const fullText = language === 'es' ? currentLine.textEs : currentLine.text;

  if (isTyping && displayedText.length < fullText.length) return {};
  if (displayedText.length < fullText.length) return { displayedText: fullText, isTyping: false };

  if (dialogueIndex < activeDialogue.lines.length - 1) {
    const nextLine = activeDialogue.lines[dialogueIndex + 1];
    const nextFullText = language === 'es' ? nextLine.textEs : nextLine.text;
    return { dialogueIndex: dialogueIndex + 1, displayedText: '', isTyping: true };
  }

  if (activeDialogue.choices?.length) return { isTyping: false };

  const updates: Partial<GameStateWithData> = {
    activeDialogue: null,
    dialogueIndex: 0,
    displayedText: '',
    isTyping: false,
  };

  if (activeDialogue.setFlag) {
    updates.gameState = {
      ...state.gameState,
      flags: { ...state.gameState.flags, [activeDialogue.setFlag]: true },
      dialogueHistory: [...state.gameState.dialogueHistory, activeDialogue.id],
    };
  }

  if (activeDialogue.nextDialogueId && gameData.dialogues[activeDialogue.nextDialogueId]) {
    const nextDlg = gameData.dialogues[activeDialogue.nextDialogueId];
    const nextFullText = language === 'es' ? nextDlg.lines[0].textEs : nextDlg.lines[0].text;
    updates.activeDialogue = nextDlg;
    updates.dialogueIndex = 0;
    updates.displayedText = '';
    updates.isTyping = true;
  }

  return updates;
};

export function gameReducer(state: GameStateWithData, action: GameAction): GameStateWithData {
  switch (action.type) {
    case 'MOVE_PLAYER':
      return { ...state, gameState: movePlayerPure(state.gameState, action.direction, action.canMove) };
    case 'SET_PLAYER_POSITION':
      return { ...state, gameState: { ...state.gameState, playerPosition: action.position } };
    case 'TELEPORT':
      return { ...state, gameState: { ...state.gameState, currentMapId: action.mapId, playerPosition: action.position } };
    case 'START_DIALOGUE':
      return { ...state, activeDialogue: action.dialogue, dialogueIndex: 0, displayedText: '', isTyping: true };
    case 'ADVANCE_DIALOGUE':
      return { ...state, ...advanceDialoguePure(state) };
    case 'SELECT_DIALOGUE_CHOICE': {
      if (!state.activeDialogue?.choices) return state;
      const choice = state.activeDialogue.choices[action.choiceIndex];
      const updates: Partial<GameStateWithData> = {
        activeDialogue: null,
        dialogueIndex: 0,
        displayedText: '',
        isTyping: false,
      };
      if (choice.setFlag) {
        updates.gameState = { ...state.gameState, flags: { ...state.gameState.flags, [choice.setFlag]: true } };
      }
      if (choice.nextDialogueId && action.dialogues[choice.nextDialogueId]) {
        const nextDlg = action.dialogues[choice.nextDialogueId];
        const nextFullText = state.language === 'es' ? nextDlg.lines[0].textEs : nextDlg.lines[0].text;
        updates.activeDialogue = nextDlg;
        updates.dialogueIndex = 0;
        updates.displayedText = '';
        updates.isTyping = true;
      }
      return { ...state, ...updates };
    }
    case 'SET_TYPING_TEXT':
      return { ...state, displayedText: action.text, isTyping: action.isTyping };
    case 'CLOSE_DIALOGUE':
      return { ...state, activeDialogue: null, dialogueIndex: 0, displayedText: '', isTyping: false };
    case 'SET_GAME_MODE':
      return { ...state, gameMode: action.mode };
    case 'TOGGLE_MOD_MENU':
      return { ...state, showModMenu: action.show ?? !state.showModMenu };
    case 'TOGGLE_PAUSE':
      return { ...state, isPaused: !state.isPaused };
    case 'SET_FLAG':
      return { ...state, gameState: { ...state.gameState, flags: { ...state.gameState.flags, [action.key]: action.value } } };
    case 'ADD_INVENTORY_ITEM':
      return { ...state, gameState: { ...state.gameState, inventory: [...state.gameState.inventory, action.itemId] } };
    case 'UPDATE_GAME_DATA':
      return { ...state, gameData: { ...state.gameData, ...action.data } };
    case 'TICK_PLAYTIME':
      return { ...state, gameState: { ...state.gameState, playtime: state.gameState.playtime + 1 } };
    default:
      return state;
  }
}

// ============================================================================
// 🚀 NUEVO: Custom hook useGameReducer
// ============================================================================
export const useGameReducer = (initialState: GameStateWithData) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  return { state, dispatch };
};