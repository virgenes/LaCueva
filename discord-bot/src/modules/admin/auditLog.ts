import {
  Guild,
  TextChannel,
  EmbedBuilder,
  Channel,
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ChannelType,
  PermissionFlagsBits,
  type SlashCommandChannelOption,
} from "discord.js";
import { loadConfig, saveConfig } from "../../utils/dataStore.js";
import { EMBED_COLORS } from "../../utils/embeds.js";

// ─── logAction ────────────────────────────────────────────────────────────────

/**
 * Logs an administrative action to the configured logs channel.
 * Requirements: 16.1, 16.2
 */
export async function logAction(
  type: string,
  affected: string,
  moderator: string,
  timestamp: string,
  guild: Guild
): Promise<void> {
  const config = loadConfig(guild.id);
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

// ─── /logs set command ────────────────────────────────────────────────────────

/**
 * Slash command `/logs set <canal>` — configures the logs channel.
 * Requirements: 16.3
 */
export const data = new SlashCommandBuilder()
  .setName("logs")
  .setDescription("Configura el canal de logs del bot")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addSubcommand((sub) =>
    sub
      .setName("set")
      .setDescription("Establece el canal de logs")
      .addChannelOption((opt: SlashCommandChannelOption) =>
        opt
          .setName("canal")
          .setDescription("Canal de texto donde se registrarán las acciones")
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(true)
      )
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guild) {
    await interaction.reply({
      content: "Este comando solo funciona en un servidor.",
      ephemeral: true,
    });
    return;
  }

  const sub = interaction.options.getSubcommand();

  if (sub === "set") {
    const channel = interaction.options.getChannel("canal", true);
    const config = loadConfig(interaction.guild.id);
    config.logsChannelId = channel.id;
    saveConfig(config);

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(EMBED_COLORS.success)
          .setTitle("✅ Canal de logs configurado")
          .setDescription(
            `El canal de logs ha sido establecido en <#${channel.id}>. Todas las acciones administrativas se registrarán allí.`
          ),
      ],
    });

    // Log the configuration action itself
    await logAction(
      "Canal de logs configurado",
      `<#${channel.id}>`,
      `<@${interaction.user.id}> (${interaction.user.username})`,
      new Date().toISOString(),
      interaction.guild
    );
  }
}

// ─── channelDelete listener ───────────────────────────────────────────────────

/**
 * Called when a channel is deleted. Disables logsChannelId if it matches,
 * then notifies the guild owner by DM.
 * Requirements: 16.4
 */
export async function handleChannelDelete(channel: Channel): Promise<void> {
  return onChannelDelete(channel);
}

export async function onChannelDelete(channel: Channel): Promise<void> {
  if (channel.isDMBased() || !("guild" in channel) || !channel.guild) return;

  const config = loadConfig(channel.guild.id);
  if (config.logsChannelId !== channel.id) return;

  config.logsChannelId = null;
  saveConfig(config);

  try {
    const owner = await channel.guild.fetchOwner();
    await owner.send(
      "⚠️ El canal de logs del bot ha sido eliminado. El AuditLog ha sido desactivado automáticamente. Configura uno nuevo con `/logs set <canal>`."
    );
  } catch {
    // DM may fail — fail silently
  }
}
