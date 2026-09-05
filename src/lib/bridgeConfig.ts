export const DEFAULT_BRIDGE_URL = "http://localhost:3001";
export const GITHUB_TUNNEL_URL = "https://raw.githubusercontent.com/virgenes/LaCueva/main/tunnel-url.txt";

let cachedBridgeUrl: string | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 30000; // 30s cache para no saturar raw.githubusercontent

export function invalidateBridgeUrl(): void {
  cachedBridgeUrl = null;
  lastFetchTime = 0;
}

export async function getBridgeUrl(forceRefresh: boolean = false): Promise<string> {
  const isLocalhost =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

  // Si estamos en localhost directo (desarrollo local en la misma PC)
  if (isLocalhost) {
    return window.location.origin.includes("3001")
      ? window.location.origin
      : (import.meta.env.VITE_BRIDGE_URL ?? DEFAULT_BRIDGE_URL);
  }

  // Si estamos en cualquier dispositivo externo (móvil, tablet, GitHub Pages, etc.)
  const now = Date.now();
  if (!forceRefresh && cachedBridgeUrl && now - lastFetchTime < CACHE_TTL_MS) {
    return cachedBridgeUrl;
  }

  try {
    const res = await fetch(`${GITHUB_TUNNEL_URL}?_t=${now}`, {
      cache: "no-store",
    });
    if (res.ok) {
      const url = (await res.text()).trim();
      if (url.startsWith("https://")) {
        cachedBridgeUrl = url;
        lastFetchTime = now;
        return url;
      }
    }
  } catch (err) {
    console.warn("[bridge] Error al consultar tunnel-url.txt:", err);
  }

  // Fallback si la petición falla
  if (cachedBridgeUrl) return cachedBridgeUrl;
  return import.meta.env.VITE_BRIDGE_URL ?? DEFAULT_BRIDGE_URL;
}

export function getWsUrl(httpUrl: string): string {
  if (httpUrl.startsWith("https://")) {
    return httpUrl.replace(/^https:\/\//, "wss://");
  }
  return httpUrl.replace(/^http:\/\//, "ws://");
}
