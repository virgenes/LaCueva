import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, useLocation } from "react-router-dom"; // Mantenemos HashRouter
import { SettingsProvider, useSettings } from "@/contexts/SettingsContext"; // Añadido useSettings
import { YouTubeMusicProvider } from "@/contexts/YouTubeMusicContext";
import { DraggablePlayer } from "@/components/DraggablePlayer"; // Cambiado a DraggablePlayer
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

// Wrapper del cursor que respeta la configuración (Nueva funcionalidad)
const CursorWrapper = () => {
  const { customCursorEnabled } = useSettings();
  if (!customCursorEnabled) return null;
  return <CustomCursor />;
};

const App = () => (
  <SettingsProvider>
    <YouTubeMusicProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          {/* Lógica condicional del cursor importada del nuevo código */}
          <CursorWrapper />
          
          <Toaster />
          <Sonner />
          
          {/* Mantenemos HashRouter estrictamente */}
          <HashRouter>
            <AnimatedRoutes />
          </HashRouter>
          
          {/* Reemplazado por DraggablePlayer que persiste en todas las páginas */}
          <DraggablePlayer />
        </TooltipProvider>
      </QueryClientProvider>
    </YouTubeMusicProvider>
  </SettingsProvider>
);

export default App;