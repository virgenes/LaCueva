import { Dialogue } from '../types/GameTypes';

// Prologue and character dialogues
export const prologueDialogues: Record<string, Dialogue> = {
  // Prologue sequence
  prologue_start: {
    id: 'prologue_start',
    speakerId: 'narrator',
    lines: [
      {
        text: '[ A regular day at school... ]',
        textEs: '[ Un día normal en la escuela... ]',
        emotion: 'neutral',
      },
      {
        text: 'The six friends gathered around a desk, chatting about nothing in particular.',
        textEs: 'Los seis amigos se reunieron alrededor de un escritorio, charlando sobre nada en particular.',
        emotion: 'neutral',
      },
    ],
    nextDialogueId: 'prologue_friends',
  },

  prologue_friends: {
    id: 'prologue_friends',
    speakerId: 'miguel',
    lines: [
      {
        text: "Did you guys see the meteor shower last night? It was INSANE!",
        textEs: "¿Vieron la lluvia de meteoros anoche? ¡Estuvo INCREÍBLE!",
        emotion: 'happy',
      },
    ],
    nextDialogueId: 'prologue_matias_reply',
  },

  prologue_matias_reply: {
    id: 'prologue_matias_reply',
    speakerId: 'matias',
    lines: [
      {
        text: "*adjusts glasses* Actually, those weren't ordinary meteors. The trajectory was... unusual.",
        textEs: "*ajusta sus lentes* En realidad, no eran meteoros ordinarios. La trayectoria era... inusual.",
        emotion: 'neutral',
      },
    ],
    nextDialogueId: 'prologue_angel_reply',
  },

  prologue_angel_reply: {
    id: 'prologue_angel_reply',
    speakerId: 'angel',
    lines: [
      {
        text: "*quietly* I... I had a strange dream about them. Like they were calling to me...",
        textEs: "*en voz baja* Yo... tuve un sueño extraño sobre ellos. Como si me estuvieran llamando...",
        emotion: 'sad',
      },
    ],
    nextDialogueId: 'prologue_elias_reply',
  },

  prologue_elias_reply: {
    id: 'prologue_elias_reply',
    speakerId: 'elias',
    lines: [
      {
        text: "Dreams? Calling? Come on, that's just superstition! Science explains everything!",
        textEs: "¿Sueños? ¿Llamados? ¡Vamos, eso es solo superstición! ¡La ciencia lo explica todo!",
        emotion: 'happy',
      },
    ],
    nextDialogueId: 'prologue_maximo_reply',
  },

  prologue_maximo_reply: {
    id: 'prologue_maximo_reply',
    speakerId: 'maximo',
    lines: [
      {
        text: "I don't know... I've been feeling something weird too. Like the world is about to change.",
        textEs: "No sé... Yo también he sentido algo raro. Como si el mundo estuviera a punto de cambiar.",
        emotion: 'neutral',
      },
    ],
    nextDialogueId: 'prologue_alejandro_reply',
  },

  prologue_alejandro_reply: {
    id: 'prologue_alejandro_reply',
    speakerId: 'alejandro',
    lines: [
      {
        text: "*looks down* Maybe we should just focus on the test tomorrow...",
        textEs: "*mira hacia abajo* Tal vez deberíamos enfocarnos en el examen de mañana...",
        emotion: 'sad',
      },
    ],
    nextDialogueId: 'prologue_earthquake',
  },

  prologue_earthquake: {
    id: 'prologue_earthquake',
    speakerId: 'narrator',
    lines: [
      {
        text: '[ SUDDENLY - The ground begins to shake violently! ]',
        textEs: '[ DE REPENTE - ¡El suelo comienza a temblar violentamente! ]',
        emotion: 'surprised',
      },
      {
        text: '[ Objects fall from desks. The windows crack. A deafening roar fills the air. ]',
        textEs: '[ Los objetos caen de los escritorios. Las ventanas se agrietan. Un rugido ensordecedor llena el aire. ]',
        emotion: 'angry',
      },
      {
        text: '[ A blinding light erupts from the center of the floor... ]',
        textEs: '[ Una luz cegadora erupciona del centro del piso... ]',
        emotion: 'surprised',
      },
    ],
    nextDialogueId: 'prologue_portal',
  },

  prologue_portal: {
    id: 'prologue_portal',
    speakerId: 'miguel',
    lines: [
      {
        text: "WHAT THE—?! EVERYONE, HOLD ON TO SOMETHING!",
        textEs: "¿¡QUÉ DEMONIOS—?! ¡TODOS, SUJÉTENSE DE ALGO!",
        emotion: 'surprised',
      },
    ],
    nextDialogueId: 'prologue_fall',
  },

  prologue_fall: {
    id: 'prologue_fall',
    speakerId: 'narrator',
    lines: [
      {
        text: '[ The floor opens into an infinite void. One by one, they fall... ]',
        textEs: '[ El piso se abre hacia un vacío infinito. Uno por uno, caen... ]',
        emotion: 'sad',
      },
      {
        text: "[ Matías reaches for his glasses as they slip away... ]",
        textEs: "[ Matías intenta alcanzar sus lentes mientras se escapan... ]",
        emotion: 'sad',
      },
      {
        text: '[ Ángel screams silently, his voice lost in the void... ]',
        textEs: '[ Ángel grita en silencio, su voz perdida en el vacío... ]',
        emotion: 'sad',
      },
      {
        text: '[ The six friends fall through space and time, memories swirling around them... ]',
        textEs: '[ Los seis amigos caen a través del espacio y tiempo, memorias arremolinándose a su alrededor... ]',
        emotion: 'sad',
      },
    ],
    nextDialogueId: 'prologue_new_world',
  },

  prologue_new_world: {
    id: 'prologue_new_world',
    speakerId: 'narrator',
    lines: [
      {
        text: '[ ... ]',
        textEs: '[ ... ]',
        emotion: 'neutral',
      },
      {
        text: '[ You wake up in an unfamiliar place. Your friends are scattered nearby. ]',
        textEs: '[ Despiertas en un lugar desconocido. Tus amigos están dispersos cerca. ]',
        emotion: 'neutral',
      },
      {
        text: '[ This world feels... wrong. Like a memory half-forgotten. ]',
        textEs: '[ Este mundo se siente... mal. Como un recuerdo a medio olvidar. ]',
        emotion: 'neutral',
      },
      {
        text: '[ You must find a way back. But first... you must understand what happened. ]',
        textEs: '[ Debes encontrar un camino de regreso. Pero primero... debes entender qué pasó. ]',
        emotion: 'neutral',
      },
    ],
    setFlag: 'prologue_complete',
  },

  // Character individual dialogues
  matias_intro: {
    id: 'matias_intro',
    speakerId: 'matias',
    lines: [
      {
        text: "*adjusts broken glasses* According to my calculations, we've been displaced approximately... everywhere.",
        textEs: "*ajusta sus lentes rotos* Según mis cálculos, hemos sido desplazados aproximadamente... a todas partes.",
        emotion: 'neutral',
      },
      {
        text: "The laws of physics here don't match our reality. Fascinating and terrifying.",
        textEs: "Las leyes de la física aquí no coinciden con nuestra realidad. Fascinante y aterrador.",
        emotion: 'surprised',
      },
    ],
  },

  angel_intro: {
    id: 'angel_intro',
    speakerId: 'angel',
    lines: [
      {
        text: "*whispers* I... I feel like I've been here before. In my dreams.",
        textEs: "*susurra* Yo... siento que he estado aquí antes. En mis sueños.",
        emotion: 'sad',
      },
      {
        text: "Maybe... maybe my dreams were warnings. I should have told you all...",
        textEs: "Quizás... quizás mis sueños eran advertencias. Debí haberles contado...",
        emotion: 'sad',
      },
    ],
  },

  alejandro_intro: {
    id: 'alejandro_intro',
    speakerId: 'alejandro',
    lines: [
      {
        text: "*looks around nervously* What do we do now? I'm not... I'm not good in these situations.",
        textEs: "*mira alrededor nerviosamente* ¿Qué hacemos ahora? No soy... no soy bueno en estas situaciones.",
        emotion: 'sad',
      },
      {
        text: "But... I'll try. For all of us. I won't let fear stop me.",
        textEs: "Pero... lo intentaré. Por todos nosotros. No dejaré que el miedo me detenga.",
        emotion: 'neutral',
      },
    ],
  },

  miguel_intro: {
    id: 'miguel_intro',
    speakerId: 'miguel',
    lines: [
      {
        text: "Okay, this is CRAZY, but also kind of AWESOME?! An adventure!",
        textEs: "¡Oye, esto es una LOCURA, pero también es un poco GENIAL?! ¡Una aventura!",
        emotion: 'happy',
      },
      {
        text: "We're gonna figure this out together. That's what friends do, right?",
        textEs: "Vamos a resolver esto juntos. Eso es lo que hacen los amigos, ¿verdad?",
        emotion: 'happy',
      },
    ],
  },

  elias_intro: {
    id: 'elias_intro',
    speakerId: 'elias',
    lines: [
      {
        text: "Okay, okay, let me think... There has to be a logical explanation for all this.",
        textEs: "Bien, bien, déjame pensar... Tiene que haber una explicación lógica para todo esto.",
        emotion: 'neutral',
      },
      {
        text: "Parallel dimensions? Quantum tunneling? Or... something beyond science entirely?",
        textEs: "¿Dimensiones paralelas? ¿Túnel cuántico? O... ¿algo más allá de la ciencia?",
        emotion: 'surprised',
      },
    ],
  },

  maximo_intro: {
    id: 'maximo_intro',
    speakerId: 'maximo',
    lines: [
      {
        text: "*looks at surroundings coolly* I always knew something like this would happen.",
        textEs: "*mira los alrededores con calma* Siempre supe que algo así pasaría.",
        emotion: 'neutral',
      },
      {
        text: "Don't ask me how. I just... felt it. This world has been waiting for us.",
        textEs: "No me pregunten cómo. Solo... lo sentí. Este mundo nos estaba esperando.",
        emotion: 'neutral',
      },
    ],
  },

  // Environment interactions
  desk_examine: {
    id: 'desk_examine',
    speakerId: 'narrator',
    lines: [
      {
        text: 'An old wooden desk. Notebooks and pencils are scattered across it.',
        textEs: 'Un viejo escritorio de madera. Cuadernos y lápices están esparcidos sobre él.',
        emotion: 'neutral',
      },
    ],
  },

  chalkboard_read: {
    id: 'chalkboard_read',
    speakerId: 'narrator',
    lines: [
      {
        text: 'The chalkboard has strange symbols written on it. They seem to shift when you look away.',
        textEs: 'El pizarrón tiene símbolos extraños escritos. Parecen moverse cuando miras hacia otro lado.',
        emotion: 'neutral',
      },
    ],
  },

  crystal_examine: {
    id: 'crystal_examine',
    speakerId: 'narrator',
    lines: [
      {
        text: 'A luminous crystal hums with energy. It feels... alive.',
        textEs: 'Un cristal luminoso vibra con energía. Se siente... vivo.',
        emotion: 'surprised',
      },
      {
        text: 'You feel memories that are not your own flooding your mind...',
        textEs: 'Sientes recuerdos que no son tuyos inundando tu mente...',
        emotion: 'surprised',
      },
    ],
  },

  bed_rest: {
    id: 'bed_rest',
    speakerId: 'narrator',
    lines: [
      {
        text: 'The bed looks dusty but comfortable. Maybe you should rest...',
        textEs: 'La cama se ve polvorienta pero cómoda. Tal vez deberías descansar...',
        emotion: 'neutral',
      },
    ],
    choices: [
      {
        text: 'Rest here',
        textEs: 'Descansar aquí',
        nextDialogueId: 'bed_dream',
        setFlag: 'rested',
      },
      {
        text: 'Keep exploring',
        textEs: 'Seguir explorando',
        nextDialogueId: 'bed_refuse',
      },
    ],
  },

  bed_dream: {
    id: 'bed_dream',
    speakerId: 'narrator',
    lines: [
      {
        text: 'You close your eyes... and dream of the world before.',
        textEs: 'Cierras los ojos... y sueñas con el mundo de antes.',
        emotion: 'neutral',
      },
      {
        text: '[ HP restored. ]',
        textEs: '[ HP restaurado. ]',
        emotion: 'happy',
      },
    ],
  },

  bed_refuse: {
    id: 'bed_refuse',
    speakerId: 'narrator',
    lines: [
      {
        text: "No time to rest. There's too much to discover.",
        textEs: 'No hay tiempo para descansar. Hay demasiado que descubrir.',
        emotion: 'neutral',
      },
    ],
  },
};
