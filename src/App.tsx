import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, useLocation } from "react-router-dom"; // Mantenemos HashRouter estrictamente
import { SettingsProvider, useSettings } from "@/contexts/SettingsContext";
import { YouTubeMusicProvider } from "@/contexts/YouTubeMusicContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import { DraggablePlayer } from "@/components/DraggablePlayer";
import { CustomCursor } from "@/components/CustomCursor";
import { AnimatePresence } from "framer-motion";
import Index from "./pages/Index";
import GamesPage from "./pages/GamesPage";
import ArtPage from "./pages/ArtPage";
import MusicPage from "./pages/MusicPage";
import NotFound from "./pages/NotFound";
import RPGPage from "./pages/RPGPage";
import DiscordPage from "./pages/DiscordPage";
import BotCommandsPage from "./pages/BotCommandsPage";

const queryClient = new QueryClient();

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
            <HashRouter> {/* Cambiado de BrowserRouter a HashRouter */}
              <AnimatedRoutes />
            </HashRouter>
            {/* YouTube Player persists across pages */}
            <DraggablePlayer />
          </TooltipProvider>
        </QueryClientProvider>
      </FavoritesProvider>
    </YouTubeMusicProvider>
  </SettingsProvider>
);

export default App;