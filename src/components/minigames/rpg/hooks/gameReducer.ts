// Pure game reducer — no side effects, fully testable
import { GameAction, EngineState } from '../types/GameActions';
import { InventoryEntry } from '../types/GameTypes';
import { imageTiles, isImageTile } from '../data/imageTiles';
import { teleporterConnections } from '../data/defaultMap';

// ============ PURE HELPER FUNCTIONS ============

/** Get tile at a position (supports both image tiles and array tiles) */
function getTileAtPure(state: EngineState, x: number, y: number) {
  const map = state.gameData.maps[state.currentMapId];
  if (!map) return null;
  const groundLayer = map.layers.find(l => l.name === 'ground');
  if (!groundLayer || y < 0 || y >= groundLayer.tiles.length || x < 0 || x >= groundLayer.tiles[0].length) {
    return null;
  }
  const tileId = groundLayer.tiles[y][x];
  if (!tileId) return null;
  if (isImageTile(tileId)) return imageTiles[tileId] || null;
  return state.gameData.tiles[tileId] || null;
}

/** Check if an NPC is at a position */
function getNpcAtPure(state: EngineState, x: number, y: number) {
  const map = state.gameData.maps[state.currentMapId];
  if (!map) return null;
  for (const npcId of map.npcs) {
    const npc = state.gameData.characters[npcId];
    if (npc && npc.position.x === x && npc.position.y === y) return npc;
  }
  return null;
}

/** Check if a position is walkable */
function canMoveToPure(state: EngineState, x: number, y: number): boolean {
  const tile = getTileAtPure(state, x, y);
  if (!tile || tile.solid) return false;
  if (getNpcAtPure(state, x, y)) return false;
  return true;
}

/** Get facing position based on direction */
function getFacingPos(pos: { x: number; y: number }, dir: string) {
  const p = { ...pos };
  switch (dir) {
    case 'up': p.y -= 1; break;
    case 'down': p.y += 1; break;
    case 'left': p.x -= 1; break;
    case 'right': p.x += 1; break;
  }
  return p;
}

/** Calculate new position after movement */
function movePlayerPure(state: EngineState, direction: 'up' | 'down' | 'left' | 'right'): EngineState {
  if (state.activeDialogueId || state.isPaused) return state;

  const newPos = getFacingPos(state.playerPosition, direction);

  if (!canMoveToPure(state, newPos.x, newPos.y)) {
    return state.playerDirection === direction
      ? { ...state, isWalking: false }
      : { ...state, playerDirection: direction, isWalking: false };
  }

  // Check for auto-teleport
  const tile = getTileAtPure(state, newPos.x, newPos.y);
  if (tile && tile.interactable && tile.interactionType === 'teleport') {
    const key = `${state.currentMapId}_${newPos.x}_${newPos.y}`;
    const conn = teleporterConnections[key];
    if (conn) {
      return {
        ...state,
        currentMapId: conn.mapId,
        playerPosition: { x: conn.x, y: conn.y },
        playerDirection: direction,
        isWalking: false,
      };
    }
  }

  return { ...state, playerPosition: newPos, playerDirection: direction, isWalking: true };
}

/** Start a dialogue by id */
function startDialoguePure(state: EngineState, dialogueId: string): EngineState {
  const dialogue = state.gameData.dialogues[dialogueId];
  if (!dialogue) return state;
  return {
    ...state,
    activeDialogueId: dialogueId,
    dialogueIndex: 0,
    isTyping: true,
    displayedText: '',
  };
}

/** Advance dialogue (next line, or close) */
function advanceDialoguePure(state: EngineState): EngineState {
  if (!state.activeDialogueId) return state;
  const dialogue = state.gameData.dialogues[state.activeDialogueId];
  if (!dialogue) return { ...state, activeDialogueId: null, dialogueIndex: 0 };

  if (state.isTyping) {
    const line = dialogue.lines[state.dialogueIndex];
    return { ...state, isTyping: false, displayedText: line?.text || '' };
  }

  if (state.dialogueIndex < dialogue.lines.length - 1) {
    return { ...state, dialogueIndex: state.dialogueIndex + 1, isTyping: true, displayedText: '' };
  }

  if (dialogue.choices && dialogue.choices.length > 0) return state;

  let newState = { ...state };
  if (dialogue.setFlag) {
    newState.flags = { ...newState.flags, [dialogue.setFlag]: true };
    newState.dialogueHistory = [...newState.dialogueHistory, dialogue.id];
  }
  if (dialogue.nextDialogueId && state.gameData.dialogues[dialogue.nextDialogueId]) {
    return startDialoguePure(newState, dialogue.nextDialogueId);
  }
  return { ...newState, activeDialogueId: null, dialogueIndex: 0, displayedText: '' };
}

/** Select a dialogue choice */
function selectChoicePure(state: EngineState, choiceIndex: number): EngineState {
  if (!state.activeDialogueId) return state;
  const dialogue = state.gameData.dialogues[state.activeDialogueId];
  if (!dialogue?.choices) return state;
  const choice = dialogue.choices[choiceIndex];
  if (!choice) return state;

  let newState = { ...state };
  if (choice.setFlag) {
    newState.flags = { ...newState.flags, [choice.setFlag]: true };
  }
  if (state.gameData.dialogues[choice.nextDialogueId]) {
    return startDialoguePure(newState, choice.nextDialogueId);
  }
  return { ...newState, activeDialogueId: null, dialogueIndex: 0, displayedText: '' };
}

/** Handle interact (talk to NPC, read sign, use teleporter) */
function interactPure(state: EngineState): EngineState {
  if (state.activeDialogueId) return advanceDialoguePure(state);

  const facingPos = getFacingPos(state.playerPosition, state.playerDirection);

  const npc = getNpcAtPure(state, facingPos.x, facingPos.y);
  if (npc && npc.dialogueIds.length > 0) {
    return startDialoguePure(state, npc.dialogueIds[0]);
  }

  const tile = getTileAtPure(state, facingPos.x, facingPos.y);
  if (tile && tile.interactable) {
    if (tile.interactionType === 'dialogue' && tile.interactionData) {
      return startDialoguePure(state, tile.interactionData);
    }
    if (tile.interactionType === 'teleport') {
      const key = `${state.currentMapId}_${facingPos.x}_${facingPos.y}`;
      const conn = teleporterConnections[key];
      if (conn) {
        return { ...state, currentMapId: conn.mapId, playerPosition: { x: conn.x, y: conn.y } };
      }
    }
  }

  return state;
}

// ============ INVENTORY HELPERS ============

function addInventoryItem(inventory: InventoryEntry[], itemId: string, quantity = 1): InventoryEntry[] {
  const existing = inventory.find(e => e.itemId === itemId);
  if (existing) {
    return inventory.map(e => e.itemId === itemId ? { ...e, quantity: e.quantity + quantity } : e);
  }
  return [...inventory, { itemId, quantity }];
}

function removeInventoryItem(inventory: InventoryEntry[], itemId: string, quantity = 1): InventoryEntry[] {
  return inventory
    .map(e => e.itemId === itemId ? { ...e, quantity: e.quantity - quantity } : e)
    .filter(e => e.quantity > 0);
}

// ============ THE REDUCER ============

export function gameReducer(state: EngineState, action: GameAction): EngineState {
  switch (action.type) {
    case 'MOVE_PLAYER':
      return movePlayerPure(state, action.direction);

    case 'STOP_WALKING':
      return state.isWalking ? { ...state, isWalking: false } : state;

    case 'TELEPORT':
      return { ...state, currentMapId: action.mapId, playerPosition: { x: action.x, y: action.y } };

    case 'START_DIALOGUE':
      return startDialoguePure(state, action.dialogueId);

    case 'ADVANCE_DIALOGUE':
      return interactPure(state);

    case 'SET_TYPING_TEXT':
      return { ...state, displayedText: action.text };

    case 'FINISH_TYPING':
      return { ...state, isTyping: false };

    case 'SELECT_DIALOGUE_CHOICE':
      return selectChoicePure(state, action.choiceIndex);

    case 'CLOSE_DIALOGUE':
      return { ...state, activeDialogueId: null, dialogueIndex: 0, displayedText: '', isTyping: false };

    case 'SET_FLAG':
      return { ...state, flags: { ...state.flags, [action.flag]: action.value } };

    case 'ADD_INVENTORY_ITEM':
      return { ...state, inventory: addInventoryItem(state.inventory, action.itemId, action.quantity) };

    case 'REMOVE_INVENTORY_ITEM':
      return { ...state, inventory: removeInventoryItem(state.inventory, action.itemId, action.quantity) };

    case 'ADD_GOLD':
      return { ...state, gold: state.gold + action.amount };

    case 'UPDATE_CHARACTER_STATS': {
      const chars = { ...state.gameData.characters };
      if (chars[action.characterId]) {
        chars[action.characterId] = { ...chars[action.characterId], stats: action.stats };
      }
      const levels = { ...state.characterLevels, [action.characterId]: { level: action.stats.level, exp: action.stats.exp } };
      return { ...state, gameData: { ...state.gameData, characters: chars }, characterLevels: levels };
    }

    case 'SET_PAUSED':
      return { ...state, isPaused: action.paused };

    case 'TOGGLE_MOD_MENU':
      return { ...state, showModMenu: !state.showModMenu };

    case 'SET_MOD_MENU':
      return { ...state, showModMenu: action.show };

    case 'SET_LANGUAGE':
      return { ...state, language: action.language };

    case 'UPDATE_GAME_DATA':
      return { ...state, gameData: action.data };

    case 'LOAD_STATE':
      return { ...state, ...action.payload };

    case 'RESET':
      return action.initialState;

    default:
      return state;
  }
}

// Export pure helpers for external use (e.g., GameCanvas collision checks)
export { getTileAtPure, getNpcAtPure, canMoveToPure };
