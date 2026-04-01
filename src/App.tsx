import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, useLocation } from "react-router-dom"; // Mantenemos HashRouter estrictamente
import { SettingsProvider, useSettings } from "@/contexts/SettingsContext";
import { YouTubeMusicProvider } from "@/contexts/YouTubeMusicContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import { useEffect, useState } from "react";
import { DraggablePlayer } from "@/components/DraggablePlayer";
import { CustomCursor } from "@/components/CustomCursor";
import { AnimatePresence } from "framer-motion";
import Index from "./pages/Index";
import GamesPage from "./pages/GamesPage";
import ArtPage from "./pages/ArtPage";
import MusicPage from "./pages/MusicPage";
import ProjectsPage from "./pages/ProjectsPage";
import SlendermanPage from "./pages/SlendermanPage";
import NotFound from "./pages/NotFound";
import RPGPage from "./pages/RPGPage";
import DiscordPage from "./pages/DiscordPage";
import BotCommandsPage from "./pages/BotCommandsPage";

const BRIDGE_URL = import.meta.env.VITE_BRIDGE_URL ?? "http://localhost:3001";

const queryClient = new QueryClient();

const IpBlocker = ({ children }: { children: React.ReactNode }) => {
  const [banned, setBanned] = useState<boolean | null>(null);

  useEffect(() => {
    fetch(`${BRIDGE_URL}/api/status`)
      .then(res => res.json())
      .then(data => {
        setBanned(!!data.banned);
      })
      .catch(() => {
        // En caso de que el servidor no responda, evitar bloquear la app entera por falsos positivos
        setBanned(false);
      });
  }, []);

  if (banned === null) return null; // Loading state invisible y rápido

  if (banned) {
    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center p-8 bg-[#0a0a0a]"
        style={{ fontFamily: '"Press Start 2P", monospace', textAlign: "center" }}
      >
        <h1 className="text-4xl md:text-6xl text-red-600 mb-6" style={{ textShadow: "4px 4px 0px #4a0000" }}>ACCESO DENEGADO</h1>
        <p className="text-xl md:text-2xl text-red-400 mb-4 leading-relaxed">Has excedido el límite de uso de mensajes.</p>
        <p className="text-lg text-gray-400 mt-4 leading-relaxed">Tu dirección IP ha sido temporalmente bloqueada por 1 hora.</p>
        <p className="text-sm text-gray-500 mt-12 mb-0">La Cueva System Security</p>
      </div>
    );
  }

  return <>{children}</>;
};

// Animated Routes wrapper
const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Index />} />
        <Route path="/juegos" element={<GamesPage />} />
        <Route path="/arte" element={<ArtPage />} />
        <Route path="/musica" element={<MusicPage />} />
        <Route path="/proyectos" element={<ProjectsPage />} />
        <Route path="/proyectos/slenderman" element={<SlendermanPage />} />
        <Route path="/rpg" element={<RPGPage />} />
        <Route path="/discord" element={<DiscordPage />} />
        <Route path="/bot-commands" element={<BotCommandsPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

// Cursor wrapper that respects settings
const CursorWrapper = () => {
  const { customCursorEnabled } = useSettings();
  if (!customCursorEnabled) return null;
  return <CustomCursor />;
};

const App = () => (
  <SettingsProvider>
    <YouTubeMusicProvider>
      <FavoritesProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <CursorWrapper />
            <Toaster />
            <Sonner />
            <IpBlocker>
              <HashRouter> {/* Cambiado de BrowserRouter a HashRouter */}
                <AnimatedRoutes />
              </HashRouter>
              {/* YouTube Player persists across pages */}
              <DraggablePlayer />
            </IpBlocker>
          </TooltipProvider>
        </QueryClientProvider>
      </FavoritesProvider>
    </YouTubeMusicProvider>
  </SettingsProvider>
);

export default App;