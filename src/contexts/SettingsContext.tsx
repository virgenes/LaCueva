import { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

export type ThemeColor = 'default' | 'ocean' | 'forest' | 'sunset' | 'galaxy';
export type MusicType = 'none' | 'lofi' | 'relaxed' | 'indie' | 'soft-rock' | 'pop';
export type Language = 'es' | 'en';

interface SettingsContextType {
  theme: ThemeColor;
  setTheme: (theme: ThemeColor) => void;
  music: MusicType;
  setMusic: (music: MusicType) => void;
  language: Language;
  setLanguage: (language: Language) => void;
  isMusicPlaying: boolean;
  toggleMusic: () => void;
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
    'settings.theme': 'TEMA DE COLORES', 'settings.music': 'MÚSICA DE FONDO',
    'settings.level': 'Nivel de personalización: MAX', 'settings.exit': '◄ ESC para salir',
    'games.genre': 'Género', 'games.platform': 'Plataforma', 'games.all': 'Todos',
    'games.download': 'Descargar', 'games.play': 'Jugar Ahora',
    'games.description': 'DESCRIPCIÓN', 'games.downloads': 'DESCARGAS',
    'games.page': 'Página', 'games.of': 'de', 'games.found': 'juegos encontrados',
    'exit.title': '¿Seguro que quieres irte?', 'exit.subtitle': '¡Te extrañaremos!',
    'exit.yes': 'Sí, ¡adiós!', 'exit.no': '¡NO, me quedo!',
    'footer.visitors': 'Visitantes Únicos', 'footer.madeWith': 'Hecho con', 'footer.by': 'por',
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
    'settings.theme': 'COLOR THEME', 'settings.music': 'BACKGROUND MUSIC',
    'settings.level': 'Customization level: MAX', 'settings.exit': '◄ ESC to exit',
    'games.genre': 'Genre', 'games.platform': 'Platform', 'games.all': 'All',
    'games.download': 'Download', 'games.play': 'Play Now',
    'games.description': 'DESCRIPTION', 'games.downloads': 'DOWNLOADS',
    'games.page': 'Page', 'games.of': 'of', 'games.found': 'games found',
    'exit.title': 'Are you sure you want to leave?', 'exit.subtitle': "We'll miss you!",
    'exit.yes': 'Yes, goodbye!', 'exit.no': 'NO, I stay!',
    'footer.visitors': 'Unique Visitors', 'footer.madeWith': 'Made with', 'footer.by': 'by',
  },
};

const THEME_VARIABLES: Record<ThemeColor, Record<string, string>> = {
  default: { '--neon-cyan': '180 100% 50%', '--neon-pink': '320 100% 60%', '--neon-purple': '280 80% 55%', '--star-gold': '45 100% 65%', '--primary': '180 100% 50%', '--secondary': '300 70% 60%', '--accent': '45 100% 60%' },
  ocean: { '--neon-cyan': '200 100% 50%', '--neon-pink': '210 80% 60%', '--neon-purple': '220 70% 55%', '--star-gold': '190 100% 65%', '--primary': '200 100% 50%', '--secondary': '210 80% 60%', '--accent': '180 100% 60%' },
  forest: { '--neon-cyan': '140 100% 45%', '--neon-pink': '100 70% 50%', '--neon-purple': '160 60% 45%', '--star-gold': '60 100% 50%', '--primary': '140 100% 45%', '--secondary': '100 70% 50%', '--accent': '80 100% 55%' },
  sunset: { '--neon-cyan': '30 100% 55%', '--neon-pink': '350 100% 60%', '--neon-purple': '15 90% 55%', '--star-gold': '45 100% 65%', '--primary': '30 100% 55%', '--secondary': '350 100% 60%', '--accent': '50 100% 60%' },
  galaxy: { '--neon-cyan': '270 100% 60%', '--neon-pink': '300 100% 60%', '--neon-purple': '260 80% 55%', '--star-gold': '280 100% 70%', '--primary': '270 100% 60%', '--secondary': '300 100% 60%', '--accent': '290 100% 65%' },
};

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeColor>('default');
  const [music, setMusicState] = useState<MusicType>('none');
  const [language, setLanguageState] = useState<Language>('es');
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('cave-theme') as ThemeColor;
      const savedLanguage = localStorage.getItem('cave-language') as Language;
      if (savedTheme && THEME_VARIABLES[savedTheme]) setThemeState(savedTheme);
      if (savedLanguage && translations[savedLanguage]) setLanguageState(savedLanguage);
    } catch {}
  }, []);

  useEffect(() => {
    const variables = THEME_VARIABLES[theme];
    const root = document.documentElement;
    Object.entries(variables).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }, [theme]);

  const setTheme = (newTheme: ThemeColor) => {
    setThemeState(newTheme);
    try { localStorage.setItem('cave-theme', newTheme); } catch {}
  };

  const setMusic = (newMusic: MusicType) => {
    setMusicState(newMusic);
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setIsMusicPlaying(false);
  };

  const toggleMusic = () => {
    if (music === 'none') return;
    if (isMusicPlaying) {
      audioRef.current?.pause();
      setIsMusicPlaying(false);
    } else {
      setIsMusicPlaying(true);
    }
  };

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    try { localStorage.setItem('cave-language', newLanguage); } catch {}
  };

  const t = (key: string): string => translations[language][key] || key;

  return (
    <SettingsContext.Provider value={{ theme, setTheme, music, setMusic, language, setLanguage, isMusicPlaying, toggleMusic, t }}>
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
      music: 'none' as MusicType,
      setMusic: () => {},
      language: 'es' as Language,
      setLanguage: () => {},
      isMusicPlaying: false,
      toggleMusic: () => {},
      t: (key: string) => translations.es[key] || key,
    };
  }
  return context;
}
