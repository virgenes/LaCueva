export const DEFAULT_BRIDGE_URL = "http://localhost:3001";
export const GITHUB_TUNNEL_URL = "https://raw.githubusercontent.com/virgenes/LaCueva/main/tunnel-url.txt";

let cachedBridgeUrl: string | null = null;

export async function getBridgeUrl(): Promise<string> {
  if (cachedBridgeUrl) return cachedBridgeUrl;

  const isGitHubPages = window.location.hostname.includes("github.io");

  // 1. Si estamos en local (localhost, 127.0.0.1, etc.) usamos la URL local
  if (!isGitHubPages) {
    const envUrl = import.meta.env.VITE_BRIDGE_URL;
    if (envUrl && !envUrl.includes("localhost") && !envUrl.includes("127.0.0.1")) {
      cachedBridgeUrl = envUrl;
      return envUrl;
    }
    // Si estamos en localhost directo
    cachedBridgeUrl = window.location.origin.includes("3001") ? window.location.origin : DEFAULT_BRIDGE_URL;
    return cachedBridgeUrl;
  }

  // 2. Si estamos en GitHub Pages, obtenemos la URL activa del túnel de Cloudflare
  try {
    const res = await fetch(`${GITHUB_TUNNEL_URL}?t=${Date.now()}`);
    if (res.ok) {
      const url = (await res.text()).trim();
      if (url.startsWith("https://")) {
        cachedBridgeUrl = url;
        return url;
      }
    }
  } catch {
    // Si falla la lectura, fallback a env
  }

  return import.meta.env.VITE_BRIDGE_URL ?? DEFAULT_BRIDGE_URL;
}

export function getWsUrl(httpUrl: string): string {
  return httpUrl.replace(/^http/, "ws");
}
