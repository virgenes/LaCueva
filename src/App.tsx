import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom"; // Manteniendo HashRouter
import { SettingsProvider } from "@/contexts/SettingsContext";
import { YouTubeMusicProvider } from "@/contexts/YouTubeMusicContext";
import { YouTubePlayer } from "@/components/YouTubePlayer";

import Index from "./pages/Index";
import GamesPage from "./pages/GamesPage";
import ArtPage from "./pages/ArtPage";
import MusicPage from "./pages/MusicPage";
import NotFound from "./pages/NotFound";

// Crear instancia de QueryClient
const queryClient = new QueryClient();

const App = () => (
  <SettingsProvider>
    {/* Añadido el contexto de YouTubeMusic */}
    <YouTubeMusicProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          {/* Mantener HashRouter */}
          <HashRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/juegos" element={<GamesPage />} />
              <Route path="/arte" element={<ArtPage />} />
              <Route path="/musica" element={<MusicPage />} />
              {/* Otras rutas si es necesario */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </HashRouter>
          {/* El reproductor de YouTube persiste en toda la app */}
          <YouTubePlayer />
        </TooltipProvider>
      </QueryClientProvider>
    </YouTubeMusicProvider>
  </SettingsProvider>
);

export default App;