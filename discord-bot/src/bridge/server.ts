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
import { rateLimiter } from "./rateLimiter.js";
import { config } from "../config.js";

const MAX_CONTENT_LENGTH = 2000;

let discordClient: Client | null = null;
const wss = new WebSocketServer({ noServer: true });

/** Register the Discord client so the bridge can post messages to Discord */
export function setDiscordClient(client: Client): void {
  discordClient = client;
}

/** Broadcast a BridgeMessage to all connected WebSocket clients and store it */
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

  // CORS
  const corsOrigin = config.BRIDGE_CORS_ORIGIN ?? "*";
  app.use((_req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", corsOrigin);
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    next();
  });

  app.options("*", (_req, res) => res.sendStatus(204));
  app.use(express.json({ limit: "8kb" }));

  // GET /api/messages?limit=50
  app.get("/api/messages", (req, res) => {
    const limit = Math.min(parseInt(String(req.query.limit ?? "50"), 10) || 50, 50);
    res.json(getMessages(limit));
  });

  // POST /api/messages — web → Discord
  app.post("/api/messages", rateLimiter, async (req, res) => {
    // Determine read-only mode from any guild config (single-guild assumption for bridge)
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

    // Broadcast to WebSocket clients
    broadcast(msg);

    // Post to Discord channel
    if (!discordClient) {
      logger.warn("[bridge] discordClient not set — bot may not be ready yet");
    } else if (!cfg?.chatBridgeChannelId) {
      logger.warn(`[bridge] chatBridgeChannelId not configured for guild ${guildId}`);
    } else {
      try {
        logger.info(`[bridge] Posting to channel ${cfg.chatBridgeChannelId}`);
        const channel = await discordClient.channels.fetch(cfg.chatBridgeChannelId);
        if (channel?.isTextBased() && "send" in channel) {
          await channel.send(`**[Web] ${cleanAuthor}:** ${cleanContent}`);
          logger.info("[bridge] Message posted to Discord successfully");
        } else {
          logger.warn("[bridge] Channel not found or not text-based");
        }
      } catch (err) {
        logger.error("[bridge] Failed to post message to Discord:", err);
      }
    }

    res.status(201).json(msg);
  });

  const httpServer = createServer(app);

  // Upgrade HTTP → WebSocket
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
