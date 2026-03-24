import { Message, TextChannel } from "discord.js";
import { loadConfig } from "../../utils/dataStore.js";
import { logAction } from "../admin/auditLog.js";

interface UserSpamEntry {
  timestamps: number[];
  recentContents: string[];
}

// In-memory spam tracking: Map<channelId, Map<userId, UserSpamEntry>>
const spamMap = new Map<string, Map<string, UserSpamEntry>>();

const RATE_WINDOW_MS = 5_000;
const RATE_THRESHOLD = 5;
const DUP_THRESHOLD = 3;
const TIMEOUT_SECONDS = 60;

/**
 * Anti-spam event handler. Call from messageCreate event.
 * - Detects 5+ messages in 5s → delete excess + timeout 60s
 * - Detects 3+ consecutive duplicate messages → delete duplicates
 * - Respects exempt channels from config.json
 */
export async function antiSpam(message: Message): Promise<void> {
  if (message.author.bot) return;
  if (!message.guild) return;
  if (!message.channel.isTextBased()) return;

  const config = loadConfig(message.guild.id);

  // Check exempt channels
  if (config.antiSpamExemptChannels.includes(message.channelId)) return;

  const channelId = message.channelId;
  const userId = message.author.id;
  const now = Date.now();

  // Initialize maps
  if (!spamMap.has(channelId)) spamMap.set(channelId, new Map());
  const channelMap = spamMap.get(channelId)!;

  if (!channelMap.has(userId)) {
    channelMap.set(userId, { timestamps: [], recentContents: [] });
  }

  const entry = channelMap.get(userId)!;

  // ── Rate spam detection ──────────────────────────────────────────────────
  // Prune timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => now - t < RATE_WINDOW_MS);
  entry.timestamps.push(now);

  if (entry.timestamps.length >= RATE_THRESHOLD) {
    // Delete the excess message
    try {
      await message.delete();
    } catch {
      // Already deleted
    }

    // Apply timeout
    try {
      const member = await message.guild.members.fetch(userId);
      if (member.moderatable) {
        await member.timeout(TIMEOUT_SECONDS * 1000, "Anti-spam: demasiados mensajes en poco tiempo");
      }
    } catch {
      // Member may not be moderatable
    }

    // Log to AuditLog
    await logAction(
      "antispam-rate",
      `<@${userId}> en <#${channelId}>`,
      "Sistema",
      new Date().toISOString(),
      message.guild
    );

    // Notify user
    try {
      await (message.channel as TextChannel).send({
        content: `⏱️ <@${userId}>, estás enviando mensajes demasiado rápido. Has recibido un timeout de ${TIMEOUT_SECONDS} segundos.`,
      });
    } catch {
      // Channel may not be writable
    }

    // Reset timestamps to prevent repeated triggers
    entry.timestamps = [];
    return;
  }

  // ── Duplicate spam detection ─────────────────────────────────────────────
  const content = message.content.trim();
  entry.recentContents.push(content);

  // Keep only last DUP_THRESHOLD + 1 entries
  if (entry.recentContents.length > DUP_THRESHOLD + 1) {
    entry.recentContents.shift();
  }

  if (entry.recentContents.length >= DUP_THRESHOLD) {
    const last = entry.recentContents.slice(-DUP_THRESHOLD);
    const allSame = last.every((c) => c === last[0]);

    if (allSame && content === last[0]) {
      // Delete the duplicate message
      try {
        await message.delete();
      } catch {
        // Already deleted
      }

      // Log to AuditLog
      await logAction(
        "antispam-duplicate",
        `<@${userId}> en <#${channelId}>`,
        "Sistema",
        new Date().toISOString(),
        message.guild
      );

      // Notify user
      try {
        await (message.channel as TextChannel).send({
          content: `🔁 <@${userId}>, por favor no repitas el mismo mensaje consecutivamente.`,
        });
      } catch {
        // Channel may not be writable
      }

      // Reset duplicate tracking
      entry.recentContents = [];
    }
  }
}
