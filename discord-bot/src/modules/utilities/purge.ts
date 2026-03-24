import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  GuildMember,
  TextChannel,
  PermissionFlagsBits,
  type SlashCommandIntegerOption,
  type SlashCommandUserOption,
} from "discord.js";
import { readData } from "../../utils/dataStore.js";
import { buildEmbed } from "../../utils/embeds.js";
import { getMessage } from "../../utils/personality.js";
import { logAction } from "../admin/auditLog.js";
import type { GuildConfig } from "../../types/index.js";

function loadConfig(): GuildConfig {
  return readData<GuildConfig>("config.json", {
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
}

export const data = new SlashCommandBuilder()
  .setName("purge")
  .setDescription("Elimina mensajes en masa del canal")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
  .addIntegerOption((opt: SlashCommandIntegerOption) =>
    opt
      .setName("cantidad")
      .setDescription("Número de mensajes a eliminar (1–100)")
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(100)
  )
  .addUserOption((opt: SlashCommandUserOption) =>
    opt
      .setName("user")
      .setDescription("Filtrar mensajes de un usuario específico")
      .setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guild || !interaction.channel) {
    await interaction.reply({ content: "Este comando solo funciona en un servidor.", ephemeral: true });
    return;
  }

  const amount = interaction.options.getInteger("cantidad", true);

  // Validate range [1, 100]
  if (amount < 1 || amount > 100) {
    await interaction.reply({
      embeds: [
        buildEmbed("error", {
          title: "❌ Rango inválido",
          description: "La cantidad debe estar entre **1** y **100** mensajes.",
        }),
      ],
      ephemeral: true,
    });
    return;
  }

  const targetUser = interaction.options.getUser("user");
  const channel = interaction.channel as TextChannel;

  await interaction.deferReply({ ephemeral: true });

  let deleted = 0;

  try {
    if (targetUser) {
      // Fetch up to 100 messages and filter by user
      const messages = await channel.messages.fetch({ limit: 100 });
      const userMessages = messages
        .filter((m) => m.author.id === targetUser.id)
        .first(amount);

      if (userMessages.length > 0) {
        const toDelete = userMessages.map((m) => m.id);
        if (toDelete.length === 1) {
          await channel.messages.delete(toDelete[0]!);
          deleted = 1;
        } else {
          const result = await channel.bulkDelete(toDelete, true);
          deleted = result.size;
        }
      }
    } else {
      // Delete the last N messages
      const result = await channel.bulkDelete(amount, true);
      deleted = result.size;
    }
  } catch {
    await interaction.editReply({
      embeds: [
        buildEmbed("error", {
          title: "❌ Error al eliminar mensajes",
          description: "No se pudieron eliminar los mensajes. Verifica que el bot tenga permisos de `Manage Messages`.",
        }),
      ],
    });
    return;
  }

  const config = loadConfig();
  const mode = config.personalityMode;

  const confirmMsg = getMessage(
    "purge",
    { count: String(deleted) },
    mode
  );

  // Log to AuditLog
  await logAction(
    "purge",
    `Canal: ${channel.name} — ${deleted} mensajes${targetUser ? ` de ${targetUser.username}` : ""}`,
    `<@${interaction.user.id}> (${interaction.user.username})`,
    new Date().toISOString(),
    interaction.guild
  );

  await interaction.editReply({
    embeds: [
      buildEmbed("success", {
        title: "🧹 Purge completado",
        description: confirmMsg,
        fields: [
          { name: "Mensajes eliminados", value: String(deleted), inline: true },
          { name: "Canal", value: `<#${channel.id}>`, inline: true },
          ...(targetUser ? [{ name: "Usuario filtrado", value: `<@${targetUser.id}>`, inline: true }] : []),
        ],
        footer: new Date().toLocaleString("es-ES"),
      }),
    ],
  });
}
