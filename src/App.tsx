import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, useLocation } from "react-router-dom"; // Mantenemos HashRouter estrictamente
import { SettingsProvider, useSettings } from "@/contexts/SettingsContext";
import { YouTubeMusicProvider } from "@/contexts/YouTubeMusicContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext"; // NUEVO: Importación de favoritos
import { DraggablePlayer } from "@/components/DraggablePlayer";
import { CustomCursor } from "@/components/CustomCursor";
import { AnimatePresence } from "framer-motion";

import Index from "./pages/Index";
import GamesPage from "./pages/GamesPage";
import ArtPage from "./pages/ArtPage";
import MusicPage from "./pages/MusicPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Componente para envolver las rutas con animaciones
const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Index />} />
        <Route path="/juegos" element={<GamesPage />} />
        <Route path="/arte" element={<ArtPage />} />
        <Route path="/musica" element={<MusicPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

// Wrapper del cursor que respeta la configuración
const CursorWrapper = () => {
  const { customCursorEnabled } = useSettings();
  if (!customCursorEnabled) return null;
  return <CustomCursor />;
};

const App = () => (
  <SettingsProvider>
    <YouTubeMusicProvider>
      {/* NUEVO: FavoritesProvider agregado a la jerarquía */}
      <FavoritesProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            {/* Lógica condicional del cursor */}
            <CursorWrapper />
            
            <Toaster />
            <Sonner />
            
            {/* Mantenemos HashRouter estrictamente */}
            <HashRouter>
              <AnimatedRoutes />
            </HashRouter>
            
            {/* Reproductor persistente */}
            <DraggablePlayer />
          </TooltipProvider>
        </QueryClientProvider>
      </FavoritesProvider>
    </YouTubeMusicProvider>
  </SettingsProvider>
);

export default App;