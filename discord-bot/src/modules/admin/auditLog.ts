import { Guild, TextChannel, EmbedBuilder, Channel } from "discord.js";
import { readData, writeData } from "../../utils/dataStore.js";
import { EMBED_COLORS } from "../../utils/embeds.js";
import type { GuildConfig } from "../../types/index.js";

/**
 * Logs an administrative action to the configured logs channel.
 */
export async function logAction(
  type: string,
  affected: string,
  moderator: string,
  timestamp: string,
  guild: Guild
): Promise<void> {
  const config = readData<GuildConfig>("config.json", {
    guildId: "",
    logsChannelId: null,
    autoRoleId: null,
    autoRoleEnabled: false,
    chatBridgeChannelId: null,
    chatBridgeReadOnly: false,
    announcementsChannelId: null,
    personalityMode: "friki",
    gifUrls: { welcome: "", ban: "", ticket: "", event: "" },
    antiSpamExemptChannels: [],
    trustedBots: [],
  });

  if (!config.logsChannelId) return;

  try {
    const channel = await guild.channels.fetch(config.logsChannelId);
    if (!channel || !channel.isTextBased()) return;

    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.info)
      .setTitle(`📋 AuditLog — ${type}`)
      .addFields(
        { name: "Acción", value: type, inline: true },
        { name: "Afectado", value: affected, inline: true },
        { name: "Moderador", value: moderator, inline: true },
        { name: "Timestamp", value: timestamp, inline: false }
      )
      .setTimestamp(new Date(timestamp));

    await (channel as TextChannel).send({ embeds: [embed] });
  } catch {
    // Channel may have been deleted or bot lacks permissions — fail silently
  }
}

/**
 * Called when a channel is deleted. Disables logsChannelId if it matches.
 */
export async function onChannelDelete(channel: Channel): Promise<void> {
  const config = readData<GuildConfig>("config.json", {
    guildId: "",
    logsChannelId: null,
    autoRoleId: null,
    autoRoleEnabled: false,
    chatBridgeChannelId: null,
    chatBridgeReadOnly: false,
    announcementsChannelId: null,
    personalityMode: "friki",
    gifUrls: { welcome: "", ban: "", ticket: "", event: "" },
    antiSpamExemptChannels: [],
    trustedBots: [],
  });

  if (config.logsChannelId !== channel.id) return;

  config.logsChannelId = null;
  writeData("config.json", config);

  // Notify guild owner by DM if possible
  try {
    if (!channel.isDMBased() && "guild" in channel && channel.guild) {
      const owner = await channel.guild.fetchOwner();
      await owner.send(
        "⚠️ El canal de logs del bot ha sido eliminado. El AuditLog ha sido desactivado automáticamente. Configura uno nuevo con `/logs set <canal>`."
      );
    }
  } catch {
    // DM may fail — fail silently
  }
}
