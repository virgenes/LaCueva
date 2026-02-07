import { Dialogue, Character, GameItem } from '../types/GameTypes';
import { prologueDialogues } from './prologueDialogues';
import { protagonistCharacters } from './protagonistSprites';

// Default dialogues - fully moddable
export const defaultDialogues: Record<string, Dialogue> = {
  // Welcome sign
  sign_welcome: {
    id: 'sign_welcome',
    speakerId: 'narrator',
    lines: [
      {
        text: '"Welcome to the Memory Garden. Everything here... can be changed."',
        textEs: '"Bienvenido al Jardín de la Memoria. Todo aquí... puede ser cambiado."',
        emotion: 'neutral',
      },
    ],
  },

  // Mysterious figure - first encounter
  mysterious_intro: {
    id: 'mysterious_intro',
    speakerId: 'mysterious',
    lines: [
      {
        text: '...You can see me?',
        textEs: '...¿Puedes verme?',
        emotion: 'surprised',
      },
      {
        text: "Interesting. Most who come here only see what they expect to see.",
        textEs: 'Interesante. La mayoría que viene aquí solo ve lo que espera ver.',
        emotion: 'neutral',
      },
      {
        text: "I am... what remains. A fragment of code, perhaps. Or a forgotten memory.",
        textEs: 'Soy... lo que queda. Un fragmento de código, quizás. O un recuerdo olvidado.',
        emotion: 'sad',
      },
    ],
    choices: [
      {
        text: "Who are you really?",
        textEs: "¿Quién eres realmente?",
        nextDialogueId: 'mysterious_identity',
      },
      {
        text: "What is this place?",
        textEs: "¿Qué es este lugar?",
        nextDialogueId: 'mysterious_place',
      },
      {
        text: "I should go...",
        textEs: "Debería irme...",
        nextDialogueId: 'mysterious_goodbye',
      },
    ],
  },

  mysterious_identity: {
    id: 'mysterious_identity',
    speakerId: 'mysterious',
    lines: [
      {
        text: "I am called many things. The Editor. The Watcher. The One Who Knows.",
        textEs: "Me llaman de muchas formas. El Editor. El Vigilante. El Que Sabe.",
        emotion: 'neutral',
      },
      {
        text: "But names are just labels. What matters is what we DO, not what we're called.",
        textEs: "Pero los nombres son solo etiquetas. Lo que importa es lo que HACEMOS, no cómo nos llaman.",
        emotion: 'happy',
      },
      {
        text: "Do you know that you can change everything here? Even me?",
        textEs: "¿Sabes que puedes cambiar todo aquí? ¿Incluso a mí?",
        emotion: 'surprised',
      },
    ],
    nextDialogueId: 'mysterious_modding',
  },

  mysterious_place: {
    id: 'mysterious_place',
    speakerId: 'mysterious',
    lines: [
      {
        text: "This is the Memory Garden. A place between worlds.",
        textEs: "Este es el Jardín de la Memoria. Un lugar entre mundos.",
        emotion: 'neutral',
      },
      {
        text: "Every tile, every word, every color... it's all just data waiting to be rewritten.",
        textEs: "Cada baldosa, cada palabra, cada color... todo es solo datos esperando ser reescritos.",
        emotion: 'neutral',
      },
      {
        text: "You have more power here than you realize.",
        textEs: "Tienes más poder aquí del que crees.",
        emotion: 'happy',
      },
    ],
    nextDialogueId: 'mysterious_modding',
  },

  mysterious_modding: {
    id: 'mysterious_modding',
    speakerId: 'mysterious',
    lines: [
      {
        text: "Look in the MOD MENU. There you'll find the tools to reshape reality.",
        textEs: "Mira en el MENÚ DE MODS. Allí encontrarás las herramientas para remodelar la realidad.",
        emotion: 'happy',
      },
      {
        text: "Change my words. Change my appearance. Change the very ground beneath your feet.",
        textEs: "Cambia mis palabras. Cambia mi apariencia. Cambia el mismo suelo bajo tus pies.",
        emotion: 'neutral',
      },
      {
        text: "Nothing here is permanent. That's both beautiful and terrifying, isn't it?",
        textEs: "Nada aquí es permanente. Eso es hermoso y aterrador a la vez, ¿no?",
        emotion: 'sad',
      },
    ],
    setFlag: 'talked_to_mysterious',
  },

  mysterious_goodbye: {
    id: 'mysterious_goodbye',
    speakerId: 'mysterious',
    lines: [
      {
        text: "Running won't change what you are. What WE are.",
        textEs: "Huir no cambiará lo que eres. Lo que SOMOS.",
        emotion: 'sad',
      },
      {
        text: "But go. Explore. When you're ready to understand... I'll be here.",
        textEs: "Pero ve. Explora. Cuando estés listo para entender... estaré aquí.",
        emotion: 'neutral',
      },
    ],
  },

  // Meta dialogue - when player discovers mod menu
  meta_mod_discovery: {
    id: 'meta_mod_discovery',
    speakerId: 'narrator',
    lines: [
      {
        text: "[SYSTEM] You've discovered the Modification Interface.",
        textEs: "[SISTEMA] Has descubierto la Interfaz de Modificación.",
        emotion: 'neutral',
      },
      {
        text: "From here, you can edit sprites, dialogues, and the map itself.",
        textEs: "Desde aquí, puedes editar sprites, diálogos, y el mapa mismo.",
        emotion: 'neutral',
      },
      {
        text: "Your changes are saved locally. Export them to share with others.",
        textEs: "Tus cambios se guardan localmente. Expórtalos para compartir con otros.",
        emotion: 'neutral',
      },
    ],
  },

  // Narrator - internal thoughts
  narrator_beginning: {
    id: 'narrator_beginning',
    speakerId: 'narrator',
    lines: [
      {
        text: "(This place feels... familiar. Like a dream I've had before.)",
        textEs: "(Este lugar se siente... familiar. Como un sueño que he tenido antes.)",
        emotion: 'neutral',
      },
      {
        text: "(I should explore. Maybe I'll find answers.)",
        textEs: "(Debería explorar. Quizás encuentre respuestas.)",
        emotion: 'neutral',
      },
    ],
  },

  // Import all prologue dialogues
  ...prologueDialogues,
};

// Default characters - includes protagonists
export const defaultCharacters: Record<string, Character> = {
  player: {
    id: 'player',
    name: 'Wanderer',
    nameEs: 'Viajero',
    spriteId: 'player',
    position: { x: 5, y: 5 },
    direction: 'down',
    isPlayer: true,
    dialogueIds: [],
    stats: {
      hp: 100,
      maxHp: 100,
      speed: 4,
    },
  },

  mysterious: {
    id: 'mysterious',
    name: '???',
    nameEs: '???',
    spriteId: 'npc_mysterious',
    position: { x: 8, y: 3 },
    direction: 'down',
    isPlayer: false,
    dialogueIds: ['mysterious_intro'],
    stats: {
      hp: 999,
      maxHp: 999,
      speed: 0,
    },
  },

  narrator: {
    id: 'narrator',
    name: 'Narrator',
    nameEs: 'Narrador',
    spriteId: 'player',
    position: { x: 0, y: 0 },
    direction: 'down',
    isPlayer: false,
    dialogueIds: [],
    stats: {
      hp: 0,
      maxHp: 0,
      speed: 0,
    },
  },

  // Include all protagonist characters
  ...protagonistCharacters,
};

// Default items
export const defaultItems: Record<string, GameItem> = {
  old_key: {
    id: 'old_key',
    name: 'Old Key',
    nameEs: 'Llave Vieja',
    description: 'A rusty key. It might open something.',
    descriptionEs: 'Una llave oxidada. Podría abrir algo.',
    spriteId: 'item_key',
    usable: false,
  },

  memory_fragment: {
    id: 'memory_fragment',
    name: 'Memory Fragment',
    nameEs: 'Fragmento de Memoria',
    description: 'A glowing shard of crystallized memory.',
    descriptionEs: 'Un fragmento brillante de memoria cristalizada.',
    spriteId: 'item_fragment',
    usable: true,
    useEffect: 'reveal_truth',
  },

  healing_potion: {
    id: 'healing_potion',
    name: 'Healing Potion',
    nameEs: 'Poción Curativa',
    description: 'Restores 50 HP to one ally.',
    descriptionEs: 'Restaura 50 HP a un aliado.',
    spriteId: 'item_potion',
    usable: true,
    useEffect: 'heal_50',
  },

  void_crystal: {
    id: 'void_crystal',
    name: 'Void Crystal',
    nameEs: 'Cristal del Vacío',
    description: 'A fragment from the dimension between worlds.',
    descriptionEs: 'Un fragmento de la dimensión entre mundos.',
    spriteId: 'item_crystal',
    usable: false,
  },

  slime_essence: {
    id: 'slime_essence',
    name: 'Slime Essence',
    nameEs: 'Esencia de Slime',
    description: 'Sticky substance from a defeated slime.',
    descriptionEs: 'Sustancia pegajosa de un slime derrotado.',
    spriteId: 'item_slime',
    usable: false,
  },
};
