import type { Request, Response, NextFunction } from "express";

const BAN_DURATION_MS = 3600_000; // 1 hora de ban
const WINDOW_MS = 60_000;         // Ventana para el flood (ej. 3 mensajes por minuto, o en general)
const MAX_REQUESTS = 3;

interface RateEntry {
  count: number;
  resetAt: number;
  bannedUntil?: number;
}

const ipMap = new Map<string, RateEntry>();

export function getIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  return req.socket.remoteAddress ?? "unknown";
}

export function isIpBanned(ip: string): boolean {
  const entry = ipMap.get(ip);
  if (!entry) return false;
  if (entry.bannedUntil && Date.now() < entry.bannedUntil) {
    return true;
  }
  return false;
}

export function rateLimiter(req: Request, res: Response, next: NextFunction): void {
  const ip = getIp(req);
  const now = Date.now();

  let entry = ipMap.get(ip);
  
  // Si ya tiene ban, comprobamos si sigue vigente
  if (entry && entry.bannedUntil) {
    if (now < entry.bannedUntil) {
      res.status(403).json({ error: "Access Denied: Banned for 1 hour." });
      return;
    } else {
      // El ban expiró, limpiamos state
      entry.bannedUntil = undefined;
      entry.count = 0;
      entry.resetAt = now + WINDOW_MS;
    }
  }

  if (!entry || now >= entry.resetAt) {
    entry = { count: 0, resetAt: now + WINDOW_MS };
    ipMap.set(ip, entry);
  }

  entry.count++;

  if (entry.count > MAX_REQUESTS) {
    // Excedió el límite de 3 veces. Aplicar IP BAN
    entry.bannedUntil = now + BAN_DURATION_MS;
    res.setHeader("Retry-After", Math.ceil(BAN_DURATION_MS / 1000));
    res.status(403).json({ error: "Has excedido el límite de mensajes. Acceso bloqueado por 1 hora en tu IP." });
    return;
  }

  next();
}
