import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SettingsProvider } from "@/contexts/SettingsContext";
import Index from "./pages/Index";
import GamesPage from "./pages/GamesPage";
import ArtPage from "./pages/ArtPage";
import MusicPage from "./pages/MusicPage";
import NotFound from "./pages/NotFound";

// Crear instancia de QueryClient
const queryClient = new QueryClient();

const App = () => (
  <SettingsProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {/* Configuración del BrowserRouter con basename para la subcarpeta */}
        <BrowserRouter basename="/LaCueva">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/juegos" element={<GamesPage />} />
            <Route path="/arte" element={<ArtPage />} />
            <Route path="/musica" element={<MusicPage />} />
            {/* Puedes agregar más rutas si lo necesitas */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </SettingsProvider>
);

export default App;