import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';

// ============================================================
// IMPORTACIÓN DE MÚSICA - RESTAURADO DEL CÓDIGO ANTIGUO
// ============================================================
import zeldaTheme from '@/assets/music/zelda-theme.opus';
import lofiTrack from '@/assets/music/lofi-relaxing.opus';
import vibRibbon from '@/assets/music/vib-ribbon.opus';

export type ThemeColor = 'default' | 'ocean' | 'forest' | 'sunset' | 'galaxy';
export type BackgroundMusicType = 'none' | 'lofi' | 'vib-ribbon' | 'zelda';
export type Language = 'es' | 'en';

// Configuración de rendimiento/gráficos
export interface PerformanceSettings {
  animationsEnabled: boolean;
  particlesEnabled: boolean;
  neonEffectsEnabled: boolean;
  soundEffectsEnabled: boolean;
  floatingAssetsEnabled: boolean;
}

interface SettingsContextType {
  theme: ThemeColor;
  setTheme: (theme: ThemeColor) => void;
  backgroundMusic: BackgroundMusicType;
  setBackgroundMusic: (music: BackgroundMusicType) => void;
  language: Language;
  setLanguage: (language: Language) => void;
  isBgMusicPlaying: boolean;
  bgMusicVolume: number;
  setBgMusicVolume: (volume: number) => void;
  toggleBgMusic: () => void;
  customCursorEnabled: boolean;
  setCustomCursorEnabled: (enabled: boolean) => void;
  // Rendimiento
  performanceSettings: PerformanceSettings;
  setPerformanceSetting: (key: keyof PerformanceSettings, value: boolean) => void;
  // Contenido adulto
  adultContentEnabled: boolean;
  setAdultContentEnabled: (enabled: boolean) => void;
  t: (key: string) => string;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

const translations: Record<Language, Record<string, string>> = {
  es: {
    'nav.home': 'Inicio', 'nav.games': 'Juegos', 'nav.music': 'Música', 'nav.art': 'Arte', 'nav.minigames': 'Mini Juegos',
    'nav.explore': 'Explorar', 'nav.settings': 'Config', 'nav.back': 'Volver al Inicio',
    'section.forYou': 'PARA TI', 'section.faq': '¡Pregúntanos!', 'section.gallery': 'Galería',
    'section.guestbook': 'Libro de Visitas', 'section.updates': 'ACTUALIZACIONES DEL SITIO',
    'section.newsfeed': 'NOTICIAS', 'section.about': 'Si eres nuevo aquí...',
    'section.announcement': 'ANUNCIO', 'section.games': 'VIDEOJUEGOS',
    'section.music': 'MÚSICA', 'section.art': 'GALERÍA DE ARTE',
    'settings.title': '⚔️ CONFIGURACIÓN ⚔️', 'settings.language': 'IDIOMA',
    'settings.theme': 'TEMA DE COLORES', 'settings.bgMusic': 'MÚSICA DE FONDO',
    'settings.volume': 'Volumen', 'settings.musicOff': 'Música desactivada por defecto',
    'settings.level': 'Nivel de personalización: MAX', 'settings.exit': '◄ ESC para salir',
    'settings.cursor': 'CURSOR PERSONALIZADO', 'settings.cursorHint': 'Desactiva para usar el cursor normal del sistema',
    // Performance settings
    'settings.performance': 'RENDIMIENTO / GRÁFICOS',
    'settings.performanceHint': 'Desactiva efectos para mejorar el rendimiento',
    'settings.animations': 'Animaciones',
    'settings.particles': 'Partículas y estrellas',
    'settings.neonEffects': 'Efectos neón/brillos',
    'settings.soundEffects': 'Sonidos de clicks',
    'settings.floatingAssets': 'Assets flotantes',
    // Adult content
    'settings.adultContent': 'CONTENIDO +18',
    'settings.adultContentHint': 'Mostrar juegos para adultos',
    'adult.warning.title': '⚠️ ADVERTENCIA +18 ⚠️',
    'adult.warning.message': 'Esta sección contiene contenido exclusivo para mayores de edad. Al continuar, confirmas que tienes 18 años o más.',
    'adult.warning.confirm': 'Sí, soy mayor de 18',
    'adult.warning.cancel': 'No, salir',
    'games.adultFilter': 'Mostrar +18',
    'games.genre': 'Género', 'games.platform': 'Plataforma', 'games.all': 'Todos',
    'games.download': 'Descargar', 'games.play': 'Jugar Ahora',
    'games.description': 'DESCRIPCIÓN', 'games.downloads': 'DESCARGAS',
    'games.page': 'Página', 'games.of': 'de', 'games.found': 'juegos encontrados',
    'exit.title': '¿Seguro que quieres irte?', 'exit.subtitle': '¡Te extrañaremos!',
    'exit.yes': 'Sí, ¡adiós!', 'exit.no': '¡NO, me quedo!',
    'footer.visitors': 'visitantes únicos', 'footer.madeWith': 'Hecho con', 'footer.by': 'por',
    'footer.followUs': 'SÍGUENOS EN REDES', 'footer.yourWeb': '¿TU PROPIA WEB?',
    'footer.epicCollection': 'COLECCIÓN ÉPICA', 'footer.affiliatedBadges': 'insignias afiliadas',
    'footer.rights': 'Todos los derechos reservados', 'footer.madeWithLove': 'Hecho con 💜 y mucho café ☕',
    'music.title': 'REPRODUCTOR DE MÚSICA', 'music.nowPlaying': 'Reproduciendo ahora',
    'music.playlist': 'Lista de reproducción', 'music.volume': 'Volumen',
    'header.welcome': '¡BIENVENIDOS A LA CUEVA DE LOS VÍRGENES!',
    'header.epic': 'El lugar más épico del internet',
    'header.updates': '¡Nuevas actualizaciones cada semana!',
    'header.join': '¡Únete a nuestra comunidad gamer!',
    'header.subtitle': 'La Comunidad Más Friki',
    'header.achievement': 'Logro Desbloqueado', 'header.stalker': 'Stalker Profesional',
    'sidebar.online': 'En línea', 'sidebar.theCave': 'LA CUEVA', 'sidebar.ofVirgins': '¡De los Vírgenes!',
    'about.hello': '¡Hola!', 'about.virgin': 'Virgen', 'about.potential': 'en potencia',
    'about.description': 'estás en la guarida de estos niños olor a pescado. Revisa nuestra página para ver proyectos sumamente asquerosos jijiji! Actualmente el sitio se está trabajando, todo gracias a',
    'about.labyrinth': ', se ha vuelto un laberinto y hay muchas páginas que actualizar.',
    'about.explore1': 'Si quieres entrar a ver qué contenido podemos traerles les recomiendo explorar la zona de',
    'about.explore2': ', hice una guía que te puede ayudar. ¡Explica las conexiones entre todo! Y si deseas un acceso más directo, puedes darle clicks a los iconitos que están abajo para revisar rápidamente.',
  },
  en: {
    'nav.home': 'Home', 'nav.games': 'Games', 'nav.music': 'Music', 'nav.art': 'Art', 'nav.minigames': 'Minigames',
    'nav.explore': 'Explore', 'nav.settings': 'Settings', 'nav.back': 'Back to Home',
    'section.forYou': 'FOR YOU', 'section.faq': 'Ask Us!', 'section.gallery': 'Gallery',
    'section.guestbook': 'Guest Book', 'section.updates': 'SITE UPDATES',
    'section.newsfeed': 'NEWS', 'section.about': 'If you are new here...',
    'section.announcement': 'ANNOUNCEMENT', 'section.games': 'VIDEO GAMES',
    'section.music': 'MUSIC', 'section.art': 'ART GALLERY',
    'settings.title': '⚔️ SETTINGS ⚔️', 'settings.language': 'LANGUAGE',
    'settings.theme': 'COLOR THEME', 'settings.bgMusic': 'BACKGROUND MUSIC',
    'settings.volume': 'Volume', 'settings.musicOff': 'Music disabled by default',
    'settings.level': 'Customization level: MAX', 'settings.exit': '◄ ESC to exit',
    'settings.cursor': 'CUSTOM CURSOR', 'settings.cursorHint': 'Disable to use the normal system cursor',
    // Performance settings
    'settings.performance': 'PERFORMANCE / GRAPHICS',
    'settings.performanceHint': 'Disable effects to improve performance',
    'settings.animations': 'Animations',
    'settings.particles': 'Particles and stars',
    'settings.neonEffects': 'Neon/glow effects',
    'settings.soundEffects': 'Click sounds',
    'settings.floatingAssets': 'Floating assets',
    // Adult content
    'settings.adultContent': '+18 CONTENT',
    'settings.adultContentHint': 'Show adult games',
    'adult.warning.title': '⚠️ WARNING +18 ⚠️',
    'adult.warning.message': 'This section contains content exclusively for adults. By continuing, you confirm that you are 18 years or older.',
    'adult.warning.confirm': 'Yes, I am 18+',
    'adult.warning.cancel': 'No, exit',
    'games.adultFilter': 'Show +18',
    'games.genre': 'Genre', 'games.platform': 'Platform', 'games.all': 'All',
    'games.download': 'Download', 'games.play': 'Play Now',
    'games.description': 'DESCRIPTION', 'games.downloads': 'DOWNLOADS',
    'games.page': 'Page', 'games.of': 'of', 'games.found': 'games found',
    'exit.title': 'Are you sure you want to leave?', 'exit.subtitle': "We'll miss you!",
    'exit.yes': 'Yes, goodbye!', 'exit.no': 'NO, I stay!',
    'footer.visitors': 'unique visitors', 'footer.madeWith': 'Made with', 'footer.by': 'by',
    'footer.followUs': 'FOLLOW US', 'footer.yourWeb': 'YOUR OWN WEBSITE?',
    'footer.epicCollection': 'EPIC COLLECTION', 'footer.affiliatedBadges': 'affiliated badges',
    'footer.rights': 'All rights reserved', 'footer.madeWithLove': 'Made with 💜 and lots of coffee ☕',
    'music.title': 'MUSIC PLAYER', 'music.nowPlaying': 'Now Playing',
    'music.playlist': 'Playlist', 'music.volume': 'Volume',
    'header.welcome': 'WELCOME TO LA CUEVA DE LOS VÍRGENES!',
    'header.epic': 'The most epic place on the internet',
    'header.updates': 'New updates every week!',
    'header.join': 'Join our gamer community!',
    'header.subtitle': 'The Geekiest Community',
    'header.achievement': 'Achievement Unlocked', 'header.stalker': 'Professional Stalker',
    'sidebar.online': 'Online', 'sidebar.theCave': 'THE CAVE', 'sidebar.ofVirgins': 'Of the Virgins!',
    'about.hello': 'Hello!', 'about.virgin': 'Virgin', 'about.potential': 'in potential',
    'about.description': "you're in the lair of these fishy-smelling kids. Check out our page to see super disgusting projects hehe! The site is currently being worked on, all thanks to",
    'about.labyrinth': ", it has become a labyrinth and there are many pages to update.",
    'about.explore1': 'If you want to see what content we can bring you, I recommend exploring the',
    'about.explore2': ' area, I made a guide that can help you. It explains the connections between everything! And if you want more direct access, you can click on the icons below to quickly check.',
  },
};

const THEME_VARIABLES: Record<ThemeColor, Record<string, string>> = {
  default: { '--neon-cyan': '180 100% 50%', '--neon-pink': '320 100% 60%', '--neon-purple': '280 80% 55%', '--star-gold': '45 100% 65%', '--primary': '180 100% 50%', '--secondary': '300 70% 60%', '--accent': '45 100% 60%' },
  ocean: { '--neon-cyan': '200 100% 50%', '--neon-pink': '210 80% 60%', '--neon-purple': '220 70% 55%', '--star-gold': '190 100% 65%', '--primary': '200 100% 50%', '--secondary': '210 80% 60%', '--accent': '180 100% 60%' },
  forest: { '--neon-cyan': '140 100% 45%', '--neon-pink': '100 70% 50%', '--neon-purple': '160 60% 45%', '--star-gold': '60 100% 50%', '--primary': '140 100% 45%', '--secondary': '100 70% 50%', '--accent': '80 100% 55%' },
  sunset: { '--neon-cyan': '30 100% 55%', '--neon-pink': '350 100% 60%', '--neon-purple': '15 90% 55%', '--star-gold': '45 100% 65%', '--primary': '30 100% 55%', '--secondary': '350 100% 60%', '--accent': '50 100% 60%' },
  galaxy: { '--neon-cyan': '270 100% 60%', '--neon-pink': '300 100% 60%', '--neon-purple': '260 80% 55%', '--star-gold': '280 100% 70%', '--primary': '270 100% 60%', '--secondary': '300 100% 60%', '--accent': '290 100% 65%' },
};

// ============================================================
// ARCHIVOS DE MÚSICA - RESTAURADO DEL CÓDIGO ANTIGUO
// ============================================================
const MUSIC_FILES: Record<BackgroundMusicType, string> = {
  none: '',
  lofi: lofiTrack,
  'vib-ribbon': vibRibbon,
  zelda: zeldaTheme,
};

const DEFAULT_PERFORMANCE: PerformanceSettings = {
  animationsEnabled: true,
  particlesEnabled: true,
  neonEffectsEnabled: true,
  soundEffectsEnabled: true,
  floatingAssetsEnabled: true,
};

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeColor>('default');
  const [backgroundMusic, setBackgroundMusicState] = useState<BackgroundMusicType>('none');
  const [language, setLanguageState] = useState<Language>('es');
  const [isBgMusicPlaying, setIsBgMusicPlaying] = useState(false);
  const [bgMusicVolume, setBgMusicVolumeState] = useState(0.2);
  const [customCursorEnabled, setCustomCursorEnabledState] = useState(true);
  const [performanceSettings, setPerformanceSettingsState] = useState<PerformanceSettings>(DEFAULT_PERFORMANCE);
  const [adultContentEnabled, setAdultContentEnabledState] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load saved settings
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('cave-theme') as ThemeColor;
      const savedLanguage = localStorage.getItem('cave-language') as Language;
      const savedVolume = localStorage.getItem('cave-bg-volume');
      const savedCursor = localStorage.getItem('cave-custom-cursor');
      const savedPerformance = localStorage.getItem('cave-performance');
      const savedAdultContent = localStorage.getItem('cave-adult-content');
      if (savedTheme && THEME_VARIABLES[savedTheme]) setThemeState(savedTheme);
      if (savedLanguage && translations[savedLanguage]) setLanguageState(savedLanguage);
      if (savedVolume) setBgMusicVolumeState(Math.min(parseFloat(savedVolume), 0.2));
      if (savedCursor !== null) setCustomCursorEnabledState(savedCursor === 'true');
      if (savedPerformance) setPerformanceSettingsState({ ...DEFAULT_PERFORMANCE, ...JSON.parse(savedPerformance) });
      if (savedAdultContent === 'true') setAdultContentEnabledState(true);
    } catch {}
  }, []);

  // Apply theme
  useEffect(() => {
    const variables = THEME_VARIABLES[theme];
    const root = document.documentElement;
    Object.entries(variables).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }, [theme]);

  // Handle background music - RESTAURADO DEL CÓDIGO ANTIGUO
  useEffect(() => {
    if (backgroundMusic === 'none') {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsBgMusicPlaying(false);
      return;
    }

    const musicFile = MUSIC_FILES[backgroundMusic];
    if (!musicFile) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(musicFile);
      audioRef.current.loop = true;
      audioRef.current.volume = bgMusicVolume;
    } else {
      audioRef.current.src = musicFile;
      if (isBgMusicPlaying) {
        audioRef.current.play().catch(() => setIsBgMusicPlaying(false));
      }
    }
  }, [backgroundMusic]);

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = bgMusicVolume;
    }
  }, [bgMusicVolume]);

  const setTheme = useCallback((newTheme: ThemeColor) => {
    setThemeState(newTheme);
    try { localStorage.setItem('cave-theme', newTheme); } catch {}
  }, []);

  const setBackgroundMusic = useCallback((newMusic: BackgroundMusicType) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setBackgroundMusicState(newMusic);
    setIsBgMusicPlaying(false);
  }, []);

  const toggleBgMusic = useCallback(() => {
    if (backgroundMusic === 'none') return;
    
    if (isBgMusicPlaying) {
      audioRef.current?.pause();
      setIsBgMusicPlaying(false);
    } else {
      if (!audioRef.current) {
        audioRef.current = new Audio(MUSIC_FILES[backgroundMusic]);
        audioRef.current.loop = true;
        audioRef.current.volume = bgMusicVolume;
      }
      audioRef.current.play()
        .then(() => setIsBgMusicPlaying(true))
        .catch(() => setIsBgMusicPlaying(false));
    }
  }, [backgroundMusic, isBgMusicPlaying, bgMusicVolume]);

  const setBgMusicVolume = useCallback((volume: number) => {
    const clampedVolume = Math.min(Math.max(volume, 0), 0.2); // Max 20%
    setBgMusicVolumeState(clampedVolume);
    try { localStorage.setItem('cave-bg-volume', clampedVolume.toString()); } catch {}
  }, []);

  const setLanguage = useCallback((newLanguage: Language) => {
    setLanguageState(newLanguage);
    try { localStorage.setItem('cave-language', newLanguage); } catch {}
  }, []);

  const setCustomCursorEnabled = useCallback((enabled: boolean) => {
    setCustomCursorEnabledState(enabled);
    try { localStorage.setItem('cave-custom-cursor', enabled.toString()); } catch {}
  }, []);

  const setPerformanceSetting = useCallback((key: keyof PerformanceSettings, value: boolean) => {
    setPerformanceSettingsState(prev => {
      const newSettings = { ...prev, [key]: value };
      try { localStorage.setItem('cave-performance', JSON.stringify(newSettings)); } catch {}
      return newSettings;
    });
  }, []);

  const setAdultContentEnabled = useCallback((enabled: boolean) => {
    setAdultContentEnabledState(enabled);
    try { localStorage.setItem('cave-adult-content', enabled.toString()); } catch {}
  }, []);

  const t = useCallback((key: string): string => translations[language][key] || key, [language]);

  return (
    <SettingsContext.Provider value={{ 
      theme, setTheme, 
      backgroundMusic, setBackgroundMusic, 
      language, setLanguage, 
      isBgMusicPlaying, toggleBgMusic,
      bgMusicVolume, setBgMusicVolume,
      customCursorEnabled, setCustomCursorEnabled,
      performanceSettings, setPerformanceSetting,
      adultContentEnabled, setAdultContentEnabled,
      t 
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    return {
      theme: 'default' as ThemeColor,
      setTheme: () => {},
      backgroundMusic: 'none' as BackgroundMusicType,
      setBackgroundMusic: () => {},
      language: 'es' as Language,
      setLanguage: () => {},
      isBgMusicPlaying: false,
      toggleBgMusic: () => {},
      bgMusicVolume: 0.2,
      setBgMusicVolume: () => {},
      customCursorEnabled: true,
      setCustomCursorEnabled: () => {},
      performanceSettings: {
        animationsEnabled: true,
        particlesEnabled: true,
        neonEffectsEnabled: true,
        soundEffectsEnabled: true,
        floatingAssetsEnabled: true,
      } as PerformanceSettings,
      setPerformanceSetting: () => {},
      adultContentEnabled: false,
      setAdultContentEnabled: () => {},
      t: (key: string) => translations.es[key] || key,
    };
  }
  return context;
}