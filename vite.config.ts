import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Obtener timestamp para cache busting
const timestamp = Date.now();

export default defineConfig(({ mode }) => ({
  base: "/LaCueva/",
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    emptyOutDir: true,
    // Configuración OPTIMIZADA para GitHub Pages
    rollupOptions: {
      output: {
        // Archivos estáticos (imágenes, fuentes, etc.)
        assetFileNames: (assetInfo) => {
          const extType = assetInfo.name.split('.').pop()?.toLowerCase() || 'bin';
          const folderMap: Record<string, string> = {
            'png': 'img',
            'jpg': 'img',
            'jpeg': 'img',
            'svg': 'img',
            'gif': 'img',
            'ico': 'img',
            'webp': 'img',
            'css': 'css',
            'woff': 'fonts',
            'woff2': 'fonts',
            'ttf': 'fonts',
            'eot': 'fonts',
            'opus': 'music',
            'mp3': 'music',
            'wav': 'music',
          };
          const folder = folderMap[extType] || 'misc';
          return `assets/${folder}/[name]-[hash][extname]`;
        },
        // Archivos JavaScript - CON TIMESTAMP para evitar caché
        chunkFileNames: `assets/js/[name]-[hash].${timestamp}.js`,
        entryFileNames: `assets/js/[name]-[hash].${timestamp}.js`,
      }
    }
  }
}));