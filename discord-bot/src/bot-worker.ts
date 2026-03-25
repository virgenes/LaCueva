/**
 * bot-worker.ts — Discord bot only, no HTTP server.
 * Connects to the bridge Web Service via HTTP to push/pull messages.
 * Deploy this as a Render Background Worker.
 */
import "./config.js";
import { config } from "./config.js";
import { client } from "./client.js";
import { loadCommands, registerCommands } from "./handlers/commandHandler.js";
import { registerEvents } from "./handlers/eventHandler.js";
import { setBroadcast } from "./modules/chatbridge/chatbridge.js";
import { logger } from "./utils/logger.js";
import type { BridgeMessage } from "./types/index.js";

process.on("unhandledRejection", (reason) => {
  console.error("[bot-worker] Unhandled rejection:", reason);
});

const BRIDGE_URL = config.BOT_WORKER_URL ?? "http://localhost:3001";
const BOT_SECRET = config.BRIDGE_SECRET ?? "";

/** Push a Discord message to the bridge so web clients receive it */
async function pushToBridge(msg: BridgeMessage): Promise<void> {
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (BOT_SECRET) headers["X-Bot-Secret"] = BOT_SECRET;
    await fetch(`${BRIDGE_URL}/internal/broadcast`, {
      method: "POST",
      headers,
      body: JSON.stringify(msg),
    });
  } catch (err) {
    logger.warn("[bot-worker] Failed to push to bridge:", err);
  }
}

/** Poll bridge for web messages and forward to Discord */
async function pollAndForward(): Promise<void> {
  // The bridge handles web→Discord forwarding via BOT_WORKER_URL
  // This worker just needs to stay connected and handle Discord events
}

async function main(): Promise<void> {
  logger.info("[bot-worker] Starting Discord bot worker...");

  // Wire chatbridge to push messages to bridge HTTP endpoint
  setBroadcast((msg: BridgeMessage) => {
    void pushToBridge(msg);
  });

  const commands = await loadCommands();
  registerEvents(client, commands);

  logger.info("[bot-worker] Attempting Discord login...");
  const loginTimeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Login timeout after 30s")), 30000)
  );

  try {
    await Promise.race([client.login(config.DISCORD_TOKEN), loginTimeout]);
    logger.info("[bot-worker] Login completed");
  } catch (err) {
    logger.error("[bot-worker] Login FAILED:", err);
    process.exit(1);
  }

  client.once("clientReady", (readyClient) => {
    logger.info(`[bot-worker] Discord client ready: ${readyClient.user.tag}`);
    // Register commands after ready
    registerCommands(commands).catch((e) => logger.error("[bot-worker] Command registration failed:", e));
  });

  void pollAndForward();
}

main().catch((err) => {
  logger.error("[bot-worker] Fatal error:", err);
  process.exit(1);
});
