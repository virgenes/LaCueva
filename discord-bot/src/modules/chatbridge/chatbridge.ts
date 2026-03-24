import type { Message } from "discord.js";
import { v4 as uuidv4 } from "uuid";
import type { BridgeMessage } from "../../types/index.js";
import { loadConfig } from "../../utils/dataStore.js";
import { logger } from "../../utils/logger.js";

// Lazy import to avoid circular deps — bridge server is started separately
let broadcastFn: ((msg: BridgeMessage) => void) | null = null;

export function setBroadcast(fn: (msg: BridgeMessage) => void): void {
  broadcastFn = fn;
}

/**
 * Called on every messageCreate event.
 * Forwards messages from the configured chatBridgeChannelId to the web via WebSocket.
 */
export async function chatbridge(message: Message): Promise<void> {
  if (message.author.bot) {
    // Allow trusted bots through, block all others
    const cfg = loadConfig(message.guildId ?? "");
    if (!cfg?.trustedBots?.includes(message.author.id)) return;
  }

  const cfg = loadConfig(message.guildId ?? "");
  if (!cfg?.chatBridgeChannelId) return;
  if (message.channelId !== cfg.chatBridgeChannelId) return;

  const bridgeMsg: BridgeMessage = {
    id: uuidv4(),
    author: message.author.username,
    content: message.content,
    source: "discord",
    timestamp: message.createdAt.toISOString(),
    avatarUrl: message.author.displayAvatarURL({ size: 64 }),
  };

  if (broadcastFn) {
    broadcastFn(bridgeMsg);
  } else {
    logger.debug("[chatbridge] No broadcast function registered yet");
  }
}
