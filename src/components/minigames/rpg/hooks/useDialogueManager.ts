// useDialogueManager — Handles typing effect, extracted from useGameEngine
// Dispatches SET_TYPING_TEXT and FINISH_TYPING to the reducer

import { useEffect } from 'react';
import { EngineState, GameAction } from '../types/GameActions';

export function useDialogueManager(
  state: EngineState,
  dispatch: React.Dispatch<GameAction>
) {
  useEffect(() => {
    if (!state.activeDialogueId || !state.isTyping) return;

    const dialogue = state.gameData.dialogues[state.activeDialogueId];
    if (!dialogue) return;

    const line = dialogue.lines[state.dialogueIndex];
    if (!line) return;

    // Use correct language text
    const fullText = state.language === 'es' ? line.textEs : line.text;

    if (state.displayedText.length >= fullText.length) {
      dispatch({ type: 'FINISH_TYPING' });
      return;
    }

    const timer = setTimeout(() => {
      dispatch({
        type: 'SET_TYPING_TEXT',
        text: fullText.substring(0, state.displayedText.length + 1),
      });
    }, state.gameData.config.dialogueSpeed);

    return () => clearTimeout(timer);
  }, [
    state.activeDialogueId,
    state.dialogueIndex,
    state.displayedText,
    state.isTyping,
    state.language,
    state.gameData,
    dispatch,
  ]);
}
