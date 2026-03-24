import { GuildMember, TextChannel, EmbedBuilder, ChannelType } from "discord.js";
import { loadConfig } from "../../utils/dataStore.js";
import { EMBED_COLORS } from "../../utils/embeds.js";
import { getMessage } from "../../utils/personality.js";

/**
 * Sends a welcome embed to the announcements channel (or first available text channel)
 * when a new member joins the guild.
 */
export async function welcomeMessage(member: GuildMember): Promise<void> {
  const config = loadConfig(member.guild.id);
  const mode = config.personalityMode;

  // Resolve target channel: announcements > first text channel
  let targetChannel: TextChannel | null = null;

  if (config.announcementsChannelId) {
    try {
      const ch = await member.guild.channels.fetch(config.announcementsChannelId);
      if (ch && ch.isTextBased() && ch.type === ChannelType.GuildText) {
        targetChannel = ch as TextChannel;
      }
    } catch {
      // Channel not found — fall through to first text channel
    }
  }

  if (!targetChannel) {
    const firstText = member.guild.channels.cache.find(
      (ch) => ch.type === ChannelType.GuildText && ch.isTextBased()
    ) as TextChannel | undefined;
    targetChannel = firstText ?? null;
  }

  if (!targetChannel) return;

  const welcomeText = getMessage(
    "welcome",
    { member: `<@${member.id}>` },
    mode
  );

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.success)
    .setTitle("👋 ¡Nuevo miembro!")
    .setDescription(welcomeText)
    .setThumbnail(member.user.displayAvatarURL())
    .setTimestamp();

  // Attach welcome GIF if configured and accessible (skip in formal mode)
  if (mode !== "formal" && config.gifUrls.welcome) {
    try {
      const res = await fetch(config.gifUrls.welcome, { method: "HEAD" });
      if (res.ok) embed.setImage(config.gifUrls.welcome);
    } catch {
      // GIF not accessible — omit image
    }
  }

  try {
    await targetChannel.send({ embeds: [embed] });
  } catch {
    // Channel send failed — fail silently
  }
}
