import express from "express";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { v4 as uuidv4 } from "uuid";
import type { Client } from "discord.js";
import type { BridgeMessage } from "../types/index.js";
import { sanitize } from "../utils/sanitize.js";
import { loadConfig } from "../utils/dataStore.js";
import { logger } from "../utils/logger.js";
import { addMessage, getMessages } from "./messageStore.js";
import { rateLimiter, isIpBanned, getIp } from "./rateLimiter.js";
import { config } from "../config.js";

const MAX_CONTENT_LENGTH = 2000;

let discordClient: Client | null = null;
const wss = new WebSocketServer({ noServer: true });

export function setDiscordClient(client: Client): void {
  discordClient = client;
}

export function broadcast(msg: BridgeMessage): void {
  addMessage(msg);
  const payload = JSON.stringify(msg);
  wss.clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  });
}

export function createBridgeServer(): ReturnType<typeof createServer> {
  const app = express();

  const corsOrigin = config.BRIDGE_CORS_ORIGIN ?? "*";
  app.use((_req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", corsOrigin);
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Bot-Secret");
    next();
  });

  app.options("*", (_req, res) => res.sendStatus(204));
  app.use(express.json({ limit: "8kb" }));

  // GET /api/status (Check if IP is banned)
  app.get("/api/status", (req, res) => {
    const ip = getIp(req);
    const banned = isIpBanned(ip);
    res.json({ banned });
  });

  // GET /api/messages
  app.get("/api/messages", (req, res) => {
    const limit = Math.min(parseInt(String(req.query.limit ?? "50"), 10) || 50, 50);
    res.json(getMessages(limit));
  });

  // POST /internal/broadcast — bot worker → bridge (push Discord messages to web clients)
  app.post("/internal/broadcast", (req, res) => {
    const secret = req.headers["x-bot-secret"];
    if (config.BRIDGE_SECRET && secret !== config.BRIDGE_SECRET) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const msg = req.body as BridgeMessage;
    if (!msg?.id || !msg?.content) {
      res.status(400).json({ error: "Invalid message" });
      return;
    }
    broadcast(msg);
    res.status(200).json({ ok: true });
  });

  // POST /api/messages — web → Discord (via bot worker or direct if bot is local)
  app.post("/api/messages", rateLimiter, async (req, res) => {
    const guildId = config.GUILD_ID;
    const cfg = guildId ? loadConfig(guildId) : null;

    if (cfg?.chatBridgeReadOnly) {
      res.status(403).json({ error: "Bridge is in read-only mode." });
      return;
    }

    const { author, content } = req.body as { author?: string; content?: string };

    if (!author || typeof author !== "string" || author.trim().length === 0) {
      res.status(400).json({ error: "author is required." });
      return;
    }
    if (!content || typeof content !== "string" || content.trim().length === 0) {
      res.status(400).json({ error: "content is required." });
      return;
    }

    const cleanContent = sanitize(content.trim());
    const cleanAuthor = sanitize(author.trim()).slice(0, 32);

    if (cleanContent.length > MAX_CONTENT_LENGTH) {
      res.status(400).json({ error: `Message exceeds ${MAX_CONTENT_LENGTH} characters.` });
      return;
    }

    const msg: BridgeMessage = {
      id: uuidv4(),
      author: cleanAuthor,
      content: cleanContent,
      source: "web",
      timestamp: new Date().toISOString(),
    };

    broadcast(msg);

    // If bot is running in same process, use it directly
    if (discordClient && cfg?.chatBridgeChannelId) {
      try {
        const channel = await discordClient.channels.fetch(cfg.chatBridgeChannelId);
        if (channel?.isTextBased() && "send" in channel) {
          await channel.send(`**[Web] ${cleanAuthor}:** ${cleanContent}`);
          logger.info("[bridge] Message posted to Discord via local client");
        }
      } catch (err) {
        logger.error("[bridge] Failed to post to Discord:", err);
      }
    } else if (config.BOT_WORKER_URL) {
      // Forward to bot worker
      try {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (config.BRIDGE_SECRET) headers["X-Bot-Secret"] = config.BRIDGE_SECRET;
        await fetch(`${config.BOT_WORKER_URL}/send`, {
          method: "POST",
          headers,
          body: JSON.stringify({ author: cleanAuthor, content: cleanContent }),
        });
      } catch (err) {
        logger.warn("[bridge] Could not forward to bot worker:", err);
      }
    } else {
      logger.warn("[bridge] No Discord client available to send message");
    }

    res.status(201).json(msg);
  });

  const httpServer = createServer(app);

  httpServer.on("upgrade", (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  });

  wss.on("connection", (ws) => {
    logger.info("[bridge] WebSocket client connected");
    ws.on("close", () => logger.info("[bridge] WebSocket client disconnected"));
    ws.on("error", (err) => logger.error("[bridge] WebSocket error:", err));
  });

  return httpServer;
}

export function startBridgeServer(port: number = config.BRIDGE_PORT): void {
  const server = createBridgeServer();
  server.listen(port, () => {
    logger.info(`[bridge] Server listening on port ${port}`);
  });
}
