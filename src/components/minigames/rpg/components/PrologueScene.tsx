import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '@/contexts/SettingsContext';
import { SpriteRenderer } from './SpriteRenderer';
import { 
  matiasSprite, 
  angelSprite, 
  alejandroSprite, 
  miguelSprite, 
  eliasSprite, 
  maximoSprite 
} from '../data/protagonistSprites';

interface PrologueSceneProps {
  onComplete: () => void;
  onSkip: () => void;
}

type ProloguePhase = 
  | 'classroom_normal' 
  | 'dialogue' 
  | 'earthquake' 
  | 'portal_open' 
  | 'falling' 
  | 'new_world' 
  | 'complete';

interface DialogueLine {
  speaker: string;
  text: string;
  textEs: string;
  emotion?: string;
}

export const PrologueScene: React.FC<PrologueSceneProps> = ({ onComplete, onSkip }) => {
  const { language } = useSettings();
  const isSpanish = language === 'es';
  
  const [phase, setPhase] = useState<ProloguePhase>('classroom_normal');
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [shakeIntensity, setShakeIntensity] = useState(0);

  const characterSprites = {
    matias: matiasSprite.frames[0],
    angel: angelSprite.frames[0],
    alejandro: alejandroSprite.frames[0],
    miguel: miguelSprite.frames[0],
    elias: eliasSprite.frames[0],
    maximo: maximoSprite.frames[0],
  };

  const characterNames: Record<string, string> = {
    matias: 'Matías',
    angel: 'Ángel',
    alejandro: 'Alejandro',
    miguel: 'Miguel',
    elias: 'Elías',
    maximo: 'Máximo',
    narrator: isSpanish ? 'Narrador' : 'Narrator',
  };

  // Prologue dialogue sequence
  const dialogueSequence: DialogueLine[] = [
    { speaker: 'narrator', text: '[ A regular day at school... ]', textEs: '[ Un día normal en la escuela... ]' },
    { speaker: 'miguel', text: "Did you guys see the meteor shower last night? It was INSANE!", textEs: "¿Vieron la lluvia de meteoros anoche? ¡Estuvo INCREÍBLE!", emotion: 'happy' },
    { speaker: 'matias', text: "*adjusts glasses* Actually, those weren't ordinary meteors...", textEs: "*ajusta sus lentes* En realidad, no eran meteoros ordinarios...", emotion: 'neutral' },
    { speaker: 'angel', text: "*quietly* I... I had a strange dream about them...", textEs: "*en voz baja* Yo... tuve un sueño extraño sobre ellos...", emotion: 'sad' },
    { speaker: 'elias', text: "Dreams? Come on, science explains everything!", textEs: "¿Sueños? ¡Vamos, la ciencia lo explica todo!", emotion: 'happy' },
    { speaker: 'maximo', text: "I don't know... I feel like something is about to change.", textEs: "No sé... Siento que algo está a punto de cambiar.", emotion: 'neutral' },
    { speaker: 'alejandro', text: "*looks down* Maybe we should focus on the test...", textEs: "*mira hacia abajo* Tal vez deberíamos enfocarnos en el examen...", emotion: 'sad' },
  ];

  const earthquakeDialogue: DialogueLine[] = [
    { speaker: 'narrator', text: '[ SUDDENLY - The ground shakes violently! ]', textEs: '[ DE REPENTE - ¡El suelo tiembla violentamente! ]' },
    { speaker: 'narrator', text: '[ Objects fall. Windows crack. A deafening roar fills the air. ]', textEs: '[ Los objetos caen. Las ventanas se agrietan. Un rugido ensordecedor llena el aire. ]' },
  ];

  const portalDialogue: DialogueLine[] = [
    { speaker: 'narrator', text: '[ A blinding light erupts from the floor... ]', textEs: '[ Una luz cegadora erupciona del piso... ]' },
    { speaker: 'miguel', text: "WHAT THE—?! HOLD ON TO SOMETHING!", textEs: "¿¡QUÉ DEMONIOS—?! ¡SUJÉTENSE DE ALGO!" },
  ];

  const fallingDialogue: DialogueLine[] = [
    { speaker: 'narrator', text: '[ The floor opens into an infinite void... ]', textEs: '[ El piso se abre hacia un vacío infinito... ]' },
    { speaker: 'narrator', text: '[ One by one, they fall through space and time... ]', textEs: '[ Uno por uno, caen a través del espacio y tiempo... ]' },
  ];

  const newWorldDialogue: DialogueLine[] = [
    { speaker: 'narrator', text: '[ ... ]', textEs: '[ ... ]' },
    { speaker: 'narrator', text: '[ You wake up in an unfamiliar place. ]', textEs: '[ Despiertas en un lugar desconocido. ]' },
    { speaker: 'narrator', text: '[ This world feels... wrong. Like a half-forgotten memory. ]', textEs: '[ Este mundo se siente... mal. Como un recuerdo a medio olvidar. ]' },
    { speaker: 'narrator', text: '[ You must find a way back. But first... you must understand. ]', textEs: '[ Debes encontrar un camino de regreso. Pero primero... debes entender. ]' },
  ];

  const getCurrentDialogue = useCallback(() => {
    switch (phase) {
      case 'dialogue': return dialogueSequence;
      case 'earthquake': return earthquakeDialogue;
      case 'portal_open': return portalDialogue;
      case 'falling': return fallingDialogue;
      case 'new_world': return newWorldDialogue;
      default: return [];
    }
  }, [phase]);

  // Typing effect
  useEffect(() => {
    const dialogue = getCurrentDialogue();
    if (dialogue.length === 0 || dialogueIndex >= dialogue.length) return;

    const currentLine = dialogue[dialogueIndex];
    const fullText = isSpanish ? currentLine.textEs : currentLine.text;
    
    if (!isTyping && displayedText.length < fullText.length) {
      setIsTyping(true);
    }

    if (isTyping && displayedText.length < fullText.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + fullText[prev.length]);
      }, 30);
      return () => clearTimeout(timer);
    } else if (isTyping && displayedText.length >= fullText.length) {
      setIsTyping(false);
    }
  }, [dialogueIndex, displayedText, isTyping, phase, isSpanish, getCurrentDialogue]);

  // Advance dialogue
  const advanceDialogue = useCallback(() => {
    const dialogue = getCurrentDialogue();
    
    if (dialogue.length === 0) return;
    
    if (isTyping) {
      const currentLine = dialogue[dialogueIndex];
      const fullText = isSpanish ? currentLine.textEs : currentLine.text;
      setDisplayedText(fullText);
      setIsTyping(false);
      return;
    }

    if (dialogueIndex < dialogue.length - 1) {
      setDialogueIndex(prev => prev + 1);
      setDisplayedText('');
      setIsTyping(true);
    } else {
      setDialogueIndex(0);
      setDisplayedText('');
      setIsTyping(true);
      
      switch (phase) {
        case 'classroom_normal':
          setPhase('dialogue');
          break;
        case 'dialogue':
          setPhase('earthquake');
          break;
        case 'earthquake':
          setPhase('portal_open');
          break;
        case 'portal_open':
          setPhase('falling');
          break;
        case 'falling':
          setPhase('new_world');
          break;
        case 'new_world':
          setPhase('complete');
          onComplete();
          break;
        default:
          break;
      }
    }
  }, [dialogueIndex, isTyping, phase, isSpanish, getCurrentDialogue, onComplete]);

  // Earthquake shake effect
  useEffect(() => {
    if (phase === 'earthquake') {
      const shakeInterval = setInterval(() => {
        setShakeIntensity(Math.random() * 10 - 5);
      }, 50);
      return () => clearInterval(shakeInterval);
    } else {
      setShakeIntensity(0);
    }
  }, [phase]);

  // Auto-start dialogue after classroom_normal
  useEffect(() => {
    if (phase === 'classroom_normal') {
      const timer = setTimeout(() => {
        setPhase('dialogue');
        setIsTyping(true);
        setDisplayedText('');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  // Handle keyboard and click events
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'Spacebar') {
        e.preventDefault();
        advanceDialogue();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [advanceDialogue]);

  const currentDialogue = getCurrentDialogue();
  const currentLine = currentDialogue[dialogueIndex];

  return (
    <motion.div
      className="absolute inset-0 bg-night-deep overflow-hidden"
      onClick={advanceDialogue}
      style={{
        transform: `translate(${shakeIntensity}px, ${shakeIntensity * 0.5}px)`,
        transition: phase === 'earthquake' ? 'none' : 'transform 0.1s',
      }}
    >
      {/* Skip button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onSkip();
        }}
        className="absolute top-2 right-2 z-50 px-2 py-1 font-pixel text-[8px] 
          text-muted-foreground hover:text-foreground transition-colors bg-card/50 rounded-sm"
      >
        {isSpanish ? 'SALTAR ▶▶' : 'SKIP ▶▶'}
      </button>

      {/* Background layers based on phase */}
      <AnimatePresence mode="wait">
        {/* Classroom scene */}
        {(phase === 'classroom_normal' || phase === 'dialogue' || phase === 'earthquake') && (
          <motion.div
            key="classroom"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-b from-[#d4c4a8] to-[#b8a88c]"
          >
            {/* Classroom elements */}
            <div className="absolute top-4 left-4 right-4 h-16 bg-[#2d4a3e] border-4 border-[#5c3d2e]">
              <div className="text-center font-retro text-white/50 text-xs mt-4">
                {isSpanish ? '[ PIZARRÓN ]' : '[ CHALKBOARD ]'}
              </div>
            </div>
            
            {/* Windows */}
            <div className="absolute top-4 right-4 w-20 h-24 bg-[#87CEEB]/70 border-4 border-[#8b7355]">
              {phase === 'earthquake' && (
                <motion.div
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 0.1, repeat: Infinity }}
                  className="absolute inset-0 bg-white"
                />
              )}
            </div>

            {/* Characters arranged in classroom */}
            <div className="absolute bottom-32 left-0 right-0 flex justify-center gap-4">
              {Object.entries(characterSprites).map(([id, sprite], index) => (
                <motion.div
                  key={id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: 1, 
                    y: phase === 'earthquake' ? [0, -5, 5, 0] : 0,
                  }}
                  transition={{ 
                    delay: index * 0.2,
                    y: { 
                      duration: 0.1, 
                      repeat: phase === 'earthquake' ? Infinity : 0,
                      repeatType: 'loop' 
                    },
                  }}
                  className="relative"
                >
                  <SpriteRenderer sprite={sprite} size={5} />
                  {currentLine?.speaker === id && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-4 left-1/2 -translate-x-1/2 w-2 h-2 
                        bg-neon-cyan rounded-full"
                    />
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Portal opening */}
        {phase === 'portal_open' && (
          <motion.div
            key="portal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-gradient-to-b from-[#d4c4a8] to-[#1a1a2e]"
          >
            {/* Portal effect */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 2, 3], opacity: [0, 1, 0.8] }}
              transition={{ duration: 2 }}
              className="absolute bottom-1/3 left-1/2 -translate-x-1/2 w-32 h-32 
                rounded-full bg-gradient-to-r from-neon-pink via-neon-purple to-neon-cyan 
                blur-lg"
            />
            
            {/* Characters being pulled */}
            <div className="absolute bottom-24 left-0 right-0 flex justify-center gap-4">
              {Object.entries(characterSprites).map(([id, sprite], index) => (
                <motion.div
                  key={id}
                  animate={{ 
                    y: [0, 50, 200],
                    scale: [1, 0.8, 0.3],
                    opacity: [1, 1, 0],
                    rotate: [0, 10, -10, 0],
                  }}
                  transition={{ 
                    delay: index * 0.3,
                    duration: 2,
                  }}
                >
                  <SpriteRenderer sprite={sprite} size={5} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Falling through void */}
        {phase === 'falling' && (
          <motion.div
            key="falling"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-gradient-to-b from-[#1a1a2e] via-[#2a1a4a] to-[#1a1a2e]"
          >
            {/* Falling particles */}
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: Math.random() * 400 - 50,
                  y: -50,
                  opacity: 0.5,
                }}
                animate={{ 
                  y: 600,
                  opacity: [0.5, 1, 0],
                }}
                transition={{ 
                  duration: 2 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
                className="absolute w-1 h-8 bg-gradient-to-b from-neon-cyan to-transparent rounded-full"
              />
            ))}

            {/* Falling characters */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              {Object.entries(characterSprites).map(([id, sprite], index) => (
                <motion.div
                  key={id}
                  initial={{ opacity: 0 }}
                  animate={{ 
                    opacity: [0, 1, 1, 0],
                    y: [0, 50, 100, 200],
                    rotate: [0, 180, 360],
                    scale: [0.5, 1, 1, 0.5],
                  }}
                  transition={{ 
                    duration: 3,
                    delay: index * 0.4,
                    repeat: Infinity,
                    repeatDelay: 1,
                  }}
                  className="absolute"
                  style={{
                    left: `${(index % 3) * 40 - 40}px`,
                    top: `${Math.floor(index / 3) * 40 - 20}px`,
                  }}
                >
                  <SpriteRenderer sprite={sprite} size={4} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* New world */}
        {phase === 'new_world' && (
          <motion.div
            key="newworld"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-gradient-to-b from-[#1a2a3a] via-[#2a3a4a] to-[#1a2a3a]"
          >
            {/* Mysterious landscape hints */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              className="absolute inset-0"
              style={{
                background: 'radial-gradient(circle at 50% 80%, #00fff5 0%, transparent 40%)',
              }}
            />
            
            {/* Characters waking up */}
            <div className="absolute bottom-24 left-0 right-0 flex justify-center gap-3">
              {Object.entries(characterSprites).map(([id, sprite], index) => (
                <motion.div
                  key={id}
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.3 }}
                >
                  <SpriteRenderer sprite={sprite} size={4} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dialogue box */}
      {currentLine && phase !== 'classroom_normal' && (
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="absolute bottom-4 left-4 right-4 bg-night-deep/95 border-2 
            border-neon-cyan p-3 rounded-sm z-50"
        >
          <div className="font-pixel text-[9px] text-neon-pink mb-1">
            {characterNames[currentLine.speaker] || currentLine.speaker}
          </div>
          <div className="font-retro text-sm text-foreground min-h-[40px]">
            {displayedText}
            {isTyping && <span className="animate-pulse">▌</span>}
          </div>
          {!isTyping && (
            <div className="text-right">
              <span className="font-pixel text-[7px] text-muted-foreground animate-pulse">
                {isSpanish ? '[CLICK/ESPACIO]' : '[CLICK/SPACE]'}
              </span>
            </div>
          )}
        </motion.div>
      )}

      {/* Phase indicator */}
      {phase === 'classroom_normal' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute bottom-4 left-0 right-0 text-center"
        >
          <span className="font-pixel text-sm text-neon-cyan animate-pulse">
            {isSpanish ? 'PRÓLOGO' : 'PROLOGUE'}
          </span>
        </motion.div>
      )}
    </motion.div>
  );
};
