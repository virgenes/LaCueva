import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ChannelType,
  PermissionFlagsBits,
  ButtonInteraction,
  GuildMember,
  TextChannel,
  EmbedBuilder,
  ComponentType,
  OverwriteType,
} from "discord.js";
import { readData } from "../../utils/dataStore.js";
import { buildEmbed, EMBED_COLORS } from "../../utils/embeds.js";
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

// Track open tickets: memberId → channelId
const openTickets = new Map<string, string>();

const TICKET_BUTTON_ID = "open_ticket";

export const data = new SlashCommandBuilder()
  .setName("ticket")
  .setDescription("Gestiona el sistema de tickets de soporte")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
  .addSubcommand((sub) =>
    sub
      .setName("setup")
      .setDescription("Publica el panel de apertura de tickets en el canal actual")
  )
  .addSubcommand((sub) =>
    sub
      .setName("close")
      .setDescription("Cierra el ticket actual, envía resumen por DM y elimina el canal")
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guild || !interaction.channel) {
    await interaction.reply({ content: "Este comando solo funciona en un servidor.", ephemeral: true });
    return;
  }

  const subcommand = interaction.options.getSubcommand();

  if (subcommand === "setup") {
    await handleSetup(interaction);
  } else if (subcommand === "close") {
    await handleClose(interaction);
  }
}

async function handleSetup(interaction: ChatInputCommandInteraction): Promise<void> {
  const button = new ButtonBuilder()
    .setCustomId(TICKET_BUTTON_ID)
    .setLabel("🎫 Abrir Ticket")
    .setStyle(ButtonStyle.Primary);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.info)
    .setTitle("🎫 Sistema de Tickets")
    .setDescription(
      "¿Necesitas ayuda o tienes algún problema? Haz clic en el botón de abajo para abrir un ticket privado con el equipo de moderación."
    )
    .setFooter({ text: "Solo puedes tener un ticket abierto a la vez." });

  await interaction.reply({ embeds: [embed], components: [row] });
}

async function handleClose(interaction: ChatInputCommandInteraction): Promise<void> {
  const channel = interaction.channel as TextChannel;

  // Verify this is a ticket channel
  if (!channel.name.startsWith("ticket-")) {
    await interaction.reply({
      embeds: [
        buildEmbed("error", {
          title: "❌ No es un canal de ticket",
          description: "Este comando solo puede usarse dentro de un canal de ticket.",
        }),
      ],
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply();

  // Find the member who owns this ticket
  const ownerEntry = [...openTickets.entries()].find(([, chId]) => chId === channel.id);
  const ownerId = ownerEntry?.[0];

  // Collect messages for summary
  const messages = await channel.messages.fetch({ limit: 100 });
  const sortedMessages = [...messages.values()].reverse();
  const summary = sortedMessages
    .filter((m) => !m.author.bot)
    .slice(0, 20)
    .map((m) => `**${m.author.username}** (${new Date(m.createdTimestamp).toLocaleString("es-ES")}): ${m.content}`)
    .join("\n");

  const config = loadConfig();
  const mode = config.personalityMode;

  // Send DM summary to ticket owner
  if (ownerId) {
    try {
      const owner = await interaction.guild!.members.fetch(ownerId);
      const closeMsg = getMessage(
        "ticketClose",
        { member: interaction.user.username },
        mode
      );

      const dmEmbed = new EmbedBuilder()
        .setColor(EMBED_COLORS.info)
        .setTitle(`📁 Resumen del ticket: ${channel.name}`)
        .setDescription(summary || "No hay mensajes en el ticket.")
        .addFields({ name: "Cerrado por", value: interaction.user.username, inline: true })
        .setTimestamp();

      await owner.send({ content: closeMsg, embeds: [dmEmbed] });
    } catch {
      // DM may be disabled — continue
    }

    openTickets.delete(ownerId);
  }

  // Log to AuditLog
  await logAction(
    "ticket_close",
    `Canal: ${channel.name}${ownerId ? ` (owner: <@${ownerId}>)` : ""}`,
    `<@${interaction.user.id}> (${interaction.user.username})`,
    new Date().toISOString(),
    interaction.guild!
  );

  await interaction.editReply({
    embeds: [
      buildEmbed("success", {
        title: "✅ Ticket cerrado",
        description: "El canal será eliminado en 5 segundos. Se ha enviado un resumen por DM.",
      }),
    ],
  });

  // Delete channel after short delay
  setTimeout(async () => {
    try {
      await channel.delete("Ticket cerrado");
    } catch {
      // Channel may already be deleted
    }
  }, 5000);
}

/**
 * Handles the "Abrir Ticket" button interaction.
 * Should be called from the interactionCreate event handler.
 */
export async function handleTicketButton(interaction: ButtonInteraction): Promise<void> {
  if (interaction.customId !== TICKET_BUTTON_ID) return;
  if (!interaction.guild) return;

  const member = interaction.member as GuildMember;
  const existingChannelId = openTickets.get(member.id);

  // Check if member already has an open ticket
  if (existingChannelId) {
    try {
      const existingChannel = await interaction.guild.channels.fetch(existingChannelId);
      if (existingChannel) {
        await interaction.reply({
          content: `Ya tienes un ticket abierto: <#${existingChannelId}>. Por favor, usa ese canal.`,
          ephemeral: true,
        });
        return;
      }
    } catch {
      // Channel no longer exists — clean up
      openTickets.delete(member.id);
    }
  }

  await interaction.deferReply({ ephemeral: true });

  const config = loadConfig();
  const mode = config.personalityMode;

  // Find roles with MANAGE_CHANNELS permission
  const manageRoles = interaction.guild.roles.cache.filter((role) =>
    role.permissions.has(PermissionFlagsBits.ManageChannels)
  );

  // Create private ticket channel
  let ticketChannel: TextChannel;
  try {
    ticketChannel = await interaction.guild.channels.create({
      name: `ticket-${member.user.username.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        {
          id: interaction.guild.id, // @everyone
          type: OverwriteType.Role,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: member.id,
          type: OverwriteType.Member,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
          ],
        },
        ...manageRoles.map((role) => ({
          id: role.id,
          type: OverwriteType.Role as typeof OverwriteType.Role,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.ManageMessages,
          ],
        })),
      ],
    });
  } catch {
    await interaction.editReply({
      content: "❌ No se pudo crear el canal de ticket. Verifica que el bot tenga permisos de `Manage Channels`.",
    });
    return;
  }

  // Register ticket
  openTickets.set(member.id, ticketChannel.id);

  // Build welcome embed with optional GIF
  const gifUrl = config.gifUrls.ticket;
  let imageUrl: string | undefined;

  if (gifUrl && mode !== "formal") {
    try {
      const res = await fetch(gifUrl, { method: "HEAD" });
      if (res.ok) imageUrl = gifUrl;
    } catch {
      // GIF not accessible — omit
    }
  }

  const openMsg = getMessage(
    "ticketOpen",
    { member: member.user.username, channel: `<#${ticketChannel.id}>` },
    mode
  );

  const welcomeEmbed = new EmbedBuilder()
    .setColor(EMBED_COLORS.info)
    .setTitle("🎫 Ticket abierto")
    .setDescription(openMsg)
    .addFields(
      { name: "Usuario", value: `<@${member.id}>`, inline: true },
      { name: "Canal", value: `<#${ticketChannel.id}>`, inline: true }
    )
    .setFooter({ text: "Usa /ticket close para cerrar este ticket." })
    .setTimestamp();

  if (imageUrl) welcomeEmbed.setImage(imageUrl);

  await ticketChannel.send({ content: `<@${member.id}>`, embeds: [welcomeEmbed] });

  // Log to AuditLog
  await logAction(
    "ticket_open",
    `<@${member.id}> (${member.user.username})`,
    `Sistema`,
    new Date().toISOString(),
    interaction.guild
  );

  await interaction.editReply({
    content: `✅ Tu ticket ha sido creado: <#${ticketChannel.id}>`,
  });
}
