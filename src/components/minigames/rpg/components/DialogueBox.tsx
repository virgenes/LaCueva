import React from 'react';
import { Dialogue, GameData } from '../types/GameTypes';
import { useSettings } from '@/contexts/SettingsContext';

interface DialogueBoxProps {
  dialogue: Dialogue;
  dialogueIndex: number;
  displayedText: string;
  isTyping: boolean;
  gameData: GameData;
  onAdvance: () => void;
  onSelectChoice: (index: number) => void;
}

export const DialogueBox: React.FC<DialogueBoxProps> = ({
  dialogue,
  dialogueIndex,
  displayedText,
  isTyping,
  gameData,
  onAdvance,
  onSelectChoice,
}) => {
  const { language } = useSettings();
  const isSpanish = language === 'es';

  const speaker = gameData.characters[dialogue.speakerId];
  const speakerName = speaker 
    ? (isSpanish ? speaker.nameEs : speaker.name) 
    : 'Narrator';

  const currentLine = dialogue.lines[dialogueIndex];
  const isLastLine = dialogueIndex >= dialogue.lines.length - 1;
  const showChoices = isLastLine && !isTyping && dialogue.choices && dialogue.choices.length > 0;

  // Get text in correct language
  const fullText = currentLine 
    ? (isSpanish ? currentLine.textEs : currentLine.text)
    : '';
  const textToShow = isTyping 
    ? (isSpanish ? displayedText : displayedText) // TODO: type in correct language
    : fullText;

  return (
    <div 
      className="absolute bottom-2 left-2 right-2 z-50"
      onClick={(e) => {
        e.stopPropagation();
        if (!showChoices) onAdvance();
      }}
    >
      <div className="bg-night-deep/95 border-2 border-neon-cyan p-3 rounded-sm pixel-border">
        {/* Speaker name */}
        <div className="font-pixel text-[8px] text-neon-pink mb-1">
          {speakerName}
        </div>
        
        {/* Dialogue text */}
        <div className="font-retro text-sm text-foreground min-h-[40px] leading-relaxed">
          {textToShow}
          {isTyping && <span className="animate-pulse">▌</span>}
        </div>

        {/* Choices */}
        {showChoices && (
          <div className="mt-3 space-y-1">
            {dialogue.choices!.map((choice, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectChoice(index);
                }}
                className="block w-full text-left px-2 py-1 font-retro text-xs
                  bg-muted/50 border border-border rounded-sm
                  hover:bg-neon-cyan/20 hover:border-neon-cyan hover:text-neon-cyan
                  transition-all"
              >
                ▶ {isSpanish ? choice.textEs : choice.text}
              </button>
            ))}
          </div>
        )}

        {/* Continue indicator */}
        {!showChoices && !isTyping && (
          <div className="text-right mt-1">
            <span className="font-pixel text-[6px] text-muted-foreground animate-pulse">
              {isSpanish ? '[ESPACIO/CLICK]' : '[SPACE/CLICK]'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
