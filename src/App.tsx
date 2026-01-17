import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, useLocation } from "react-router-dom"; // Corregido aquí
import { SettingsProvider } from "@/contexts/SettingsContext";
import { YouTubeMusicProvider } from "@/contexts/YouTubeMusicContext";
import { YouTubePlayer } from "@/components/YouTubePlayer";
import { CustomCursor } from "@/components/CustomCursor";
import { AnimatePresence } from "framer-motion";

import Index from "./pages/Index";
import GamesPage from "./pages/GamesPage";
import ArtPage from "./pages/ArtPage";
import MusicPage from "./pages/MusicPage";
import NotFound from "./pages/NotFound";

// Crear instancia de QueryClient
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

const App = () => (
  <SettingsProvider>
    <YouTubeMusicProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          {/* Añadido el CustomCursor */}
          <CustomCursor />
          <Toaster />
          <Sonner />
          {/* Mantener HashRouter */}
          <HashRouter>
            {/* Usar la función AnimatedRoutes para envolver Routes con AnimatePresence */}
            <AnimatedRoutes />
          </HashRouter>
          {/* El reproductor de YouTube persiste en toda la app */}
          <YouTubePlayer />
        </TooltipProvider>
      </QueryClientProvider>
    </YouTubeMusicProvider>
  </SettingsProvider>
);

export default App;