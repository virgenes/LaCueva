import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';

// ============================================================
// IMPORTACIÓN DE MÚSICA (Desde src/assets/music)
// ============================================================
import zeldaTheme from '@/assets/music/zelda-theme.opus';
import lofiTrack from '@/assets/music/lofi-relaxing.opus';
import vibRibbon from '@/assets/music/vib-ribbon.opus';

export type ThemeColor = 'default' | 'ocean' | 'forest' | 'sunset' | 'galaxy';
export type BackgroundMusicType = 'none' | 'lofi' | 'vib-ribbon' | 'zelda';
export type Language = 'es' | 'en';

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
  t: (key: string) => string;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

const translations: Record<Language, Record<string, string>> = {
  es: {
    'nav.home': 'Inicio', 'nav.games': 'Juegos', 'nav.music': 'Música', 'nav.art': 'Arte',
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
    'games.genre': 'Género', 'games.platform': 'Plataforma', 'games.all': 'Todos',
    'games.download': 'Descargar', 'games.play': 'Jugar Ahora',
    'games.description': 'DESCRIPCIÓN', 'games.downloads': 'DESCARGAS',
    'games.page': 'Página', 'games.of': 'de', 'games.found': 'juegos encontrados',
    'exit.title': '¿Seguro que quieres irte?', 'exit.subtitle': '¡Te extrañaremos!',
    'exit.yes': 'Sí, ¡adiós!', 'exit.no': '¡NO, me quedo!',
    'footer.visitors': 'Visitantes Únicos', 'footer.madeWith': 'Hecho con', 'footer.by': 'por',
    'music.title': 'REPRODUCTOR DE MÚSICA', 'music.nowPlaying': 'Reproduciendo ahora',
    'music.playlist': 'Lista de reproducción', 'music.volume': 'Volumen',
  },
  en: {
    'nav.home': 'Home', 'nav.games': 'Games', 'nav.music': 'Music', 'nav.art': 'Art',
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
    'games.genre': 'Genre', 'games.platform': 'Platform', 'games.all': 'All',
    'games.download': 'Download', 'games.play': 'Play Now',
    'games.description': 'DESCRIPTION', 'games.downloads': 'DOWNLOADS',
    'games.page': 'Page', 'games.of': 'of', 'games.found': 'games found',
    'exit.title': 'Are you sure you want to leave?', 'exit.subtitle': "We'll miss you!",
    'exit.yes': 'Yes, goodbye!', 'exit.no': 'NO, I stay!',
    'footer.visitors': 'Unique Visitors', 'footer.madeWith': 'Made with', 'footer.by': 'by',
    'music.title': 'MUSIC PLAYER', 'music.nowPlaying': 'Now Playing',
    'music.playlist': 'Playlist', 'music.volume': 'Volume',
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
// MAPA DE ARCHIVOS DE MÚSICA (Usando las variables importadas)
// ============================================================
const MUSIC_FILES: Record<BackgroundMusicType, string> = {
  none: '',
  lofi: lofiTrack,
  'vib-ribbon': vibRibbon,
  zelda: zeldaTheme,
};

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeColor>('default');
  const [backgroundMusic, setBackgroundMusicState] = useState<BackgroundMusicType>('none');
  const [language, setLanguageState] = useState<Language>('es');
  const [isBgMusicPlaying, setIsBgMusicPlaying] = useState(false);
  const [bgMusicVolume, setBgMusicVolumeState] = useState(0.2); // 20% max
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load saved settings
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('cave-theme') as ThemeColor;
      const savedLanguage = localStorage.getItem('cave-language') as Language;
      const savedVolume = localStorage.getItem('cave-bg-volume');
      if (savedTheme && THEME_VARIABLES[savedTheme]) setThemeState(savedTheme);
      if (savedLanguage && translations[savedLanguage]) setLanguageState(savedLanguage);
      if (savedVolume) setBgMusicVolumeState(Math.min(parseFloat(savedVolume), 0.2));
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

  // Handle background music
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
      // Si cambiamos de canción y ya estaba sonando algo, reproducimos la nueva
      if (isBgMusicPlaying) {
        audioRef.current.play().catch(() => setIsBgMusicPlaying(false));
      }
    }
  }, [backgroundMusic]); // Quitamos bgMusicVolume e isBgMusicPlaying de aquí para evitar reinicios

  // Update volume separately
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
    // Si cambiamos la música, pausamos la actual si existía
    if (audioRef.current) {
      audioRef.current.pause();
      // No reseteamos a null aquí para permitir que el useEffect maneje el cambio de src
    }
    setBackgroundMusicState(newMusic);
    // Nota: El useEffect se encargará de cargar el nuevo audio
    // Mantenemos el estado de reproducción en false hasta que el usuario decida activarlo explícitamente
    // o si vienes de MusicNotification que llama a toggleBgMusic después
    setIsBgMusicPlaying(false);
  }, []);

  const toggleBgMusic = useCallback(() => {
    if (backgroundMusic === 'none') return;
    
    if (isBgMusicPlaying) {
      audioRef.current?.pause();
      setIsBgMusicPlaying(false);
    } else {
      // Crear instancia si no existe (caso borde)
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

  const t = useCallback((key: string): string => translations[language][key] || key, [language]);

  return (
    <SettingsContext.Provider value={{ 
      theme, setTheme, 
      backgroundMusic, setBackgroundMusic, 
      language, setLanguage, 
      isBgMusicPlaying, toggleBgMusic,
      bgMusicVolume, setBgMusicVolume,
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
      t: (key: string) => translations.es[key] || key,
    };
  }
  return context;
}