import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  GuildMember,
  PermissionFlagsBits,
  ChannelType,
  OverwriteType,
  type TextChannel,
  type SlashCommandUserOption,
  type SlashCommandStringOption,
  type SlashCommandIntegerOption,
} from "discord.js";
import { buildEmbed } from "../../utils/embeds.js";
import { logAction } from "../admin/auditLog.js";

// ─── Duration parser ──────────────────────────────────────────────────────────

/**
 * Parses a duration string like "1d", "2h", "30m" into milliseconds.
 * Returns null if the format is invalid.
 */
export function parseDuration(str: string): number | null {
  const match = str.trim().match(/^(\d+)(d|h|m)$/i);
  if (!match) return null;

  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case "d": return value * 24 * 60 * 60 * 1000;
    case "h": return value * 60 * 60 * 1000;
    case "m": return value * 60 * 1000;
    default:  return null;
  }
}

// ─── Slash command definition ─────────────────────────────────────────────────

export const data = new SlashCommandBuilder()
  .setName("timeout")
  .setDescription("Comandos de moderación extendida")
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
  // /timeout @user <duración> [razón]
  .addSubcommand((sub) =>
    sub
      .setName("user")
      .setDescription("Aplica un timeout a un miembro")
      .addUserOption((opt: SlashCommandUserOption) =>
        opt.setName("member").setDescription("Miembro al que aplicar timeout").setRequired(true)
      )
      .addStringOption((opt: SlashCommandStringOption) =>
        opt
          .setName("duracion")
          .setDescription("Duración del timeout (ej: 1d, 2h, 30m)")
          .setRequired(true)
      )
      .addStringOption((opt: SlashCommandStringOption) =>
        opt.setName("razon").setDescription("Razón del timeout").setRequired(false)
      )
  )
  // /timeout slowmode <segundos>
  .addSubcommand((sub) =>
    sub
      .setName("slowmode")
      .setDescription("Configura el slowmode del canal actual (0 para desactivar)")
      .addIntegerOption((opt: SlashCommandIntegerOption) =>
        opt
          .setName("segundos")
          .setDescription("Segundos de slowmode (0–21600)")
          .setMinValue(0)
          .setMaxValue(21600)
          .setRequired(true)
      )
  )
  // /timeout lockdown canal|servidor|unlock
  .addSubcommand((sub) =>
    sub
      .setName("lockdown")
      .setDescription("Bloquea o desbloquea canales de texto")
      .addStringOption((opt: SlashCommandStringOption) =>
        opt
          .setName("modo")
          .setDescription("Modo de lockdown")
          .setRequired(true)
          .addChoices(
            { name: "canal", value: "canal" },
            { name: "servidor", value: "servidor" },
            { name: "unlock", value: "unlock" }
          )
      )
  );

// ─── Execute ──────────────────────────────────────────────────────────────────

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guild) {
    await interaction.reply({ content: "Este comando solo funciona en un servidor.", ephemeral: true });
    return;
  }

  const sub = interaction.options.getSubcommand();

  if (sub === "user") {
    await handleTimeout(interaction);
  } else if (sub === "slowmode") {
    await handleSlowmode(interaction);
  } else if (sub === "lockdown") {
    await handleLockdown(interaction);
  }
}

// ─── /timeout user ────────────────────────────────────────────────────────────

async function handleTimeout(interaction: ChatInputCommandInteraction): Promise<void> {
  const target = interaction.options.getMember("member") as GuildMember | null;
  const durationStr = interaction.options.getString("duracion", true);
  const reason = interaction.options.getString("razon") ?? "Sin razón especificada";

  if (!target) {
    await interaction.reply({ content: "No se encontró al miembro.", ephemeral: true });
    return;
  }

  const moderator = interaction.member as GuildMember;

  // Hierarchy check
  if (target.roles.highest.position >= moderator.roles.highest.position) {
    await interaction.reply({
      embeds: [buildEmbed("error", {
        title: "❌ Sin permisos",
        description: `No puedes aplicar timeout a ${target.user.username} porque tiene un rol igual o superior al tuyo.`,
      })],
      ephemeral: true,
    });
    return;
  }

  if (!target.moderatable) {
    await interaction.reply({
      embeds: [buildEmbed("error", {
        title: "❌ Sin permisos",
        description: `No tengo permisos para aplicar timeout a ${target.user.username}.`,
      })],
      ephemeral: true,
    });
    return;
  }

  const durationMs = parseDuration(durationStr);
  if (durationMs === null) {
    await interaction.reply({
      embeds: [buildEmbed("error", {
        title: "❌ Formato inválido",
        description: "La duración debe tener el formato `1d`, `2h` o `30m`.",
      })],
      ephemeral: true,
    });
    return;
  }

  // Discord max timeout is 28 days
  const MAX_TIMEOUT_MS = 28 * 24 * 60 * 60 * 1000;
  if (durationMs > MAX_TIMEOUT_MS) {
    await interaction.reply({
      embeds: [buildEmbed("error", {
        title: "❌ Duración excesiva",
        description: "El timeout máximo permitido por Discord es de 28 días.",
      })],
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply();

  await target.timeout(durationMs, reason);

  await logAction(
    "timeout",
    `<@${target.id}> (${target.user.username})`,
    `<@${interaction.user.id}> (${interaction.user.username})`,
    new Date().toISOString(),
    interaction.guild!
  );

  await interaction.editReply({
    embeds: [buildEmbed("warn", {
      title: "⏱️ Timeout aplicado",
      fields: [
        { name: "Miembro", value: `${target.user.username} (<@${target.id}>)`, inline: true },
        { name: "Duración", value: durationStr, inline: true },
        { name: "Razón", value: reason, inline: true },
        { name: "Moderador", value: interaction.user.username, inline: true },
      ],
      footer: new Date().toLocaleString("es-ES"),
    })],
  });
}

// ─── /timeout slowmode ────────────────────────────────────────────────────────

async function handleSlowmode(interaction: ChatInputCommandInteraction): Promise<void> {
  const channel = interaction.channel;

  if (!channel || channel.type !== ChannelType.GuildText) {
    await interaction.reply({ content: "Este comando solo funciona en canales de texto.", ephemeral: true });
    return;
  }

  // Check ManageChannels permission
  const member = interaction.member as GuildMember;
  if (!member.permissions.has(PermissionFlagsBits.ManageChannels)) {
    await interaction.reply({
      embeds: [buildEmbed("error", {
        title: "❌ Sin permisos",
        description: "Necesitas el permiso **Gestionar Canales** para usar este comando.",
      })],
      ephemeral: true,
    });
    return;
  }

  const seconds = interaction.options.getInteger("segundos", true);

  await (channel as TextChannel).setRateLimitPerUser(seconds, `Slowmode configurado por ${interaction.user.username}`);

  const description = seconds === 0
    ? "El slowmode ha sido **desactivado** en este canal."
    : `El slowmode ha sido configurado a **${seconds} segundo(s)** en este canal.`;

  await interaction.reply({
    embeds: [buildEmbed("success", {
      title: "🐢 Slowmode actualizado",
      description,
      footer: new Date().toLocaleString("es-ES"),
    })],
  });
}

// ─── /timeout lockdown ────────────────────────────────────────────────────────

async function handleLockdown(interaction: ChatInputCommandInteraction): Promise<void> {
  const modo = interaction.options.getString("modo", true);
  const guild = interaction.guild!;

  // Check ManageChannels permission
  const member = interaction.member as GuildMember;
  if (!member.permissions.has(PermissionFlagsBits.ManageChannels)) {
    await interaction.reply({
      embeds: [buildEmbed("error", {
        title: "❌ Sin permisos",
        description: "Necesitas el permiso **Gestionar Canales** para usar este comando.",
      })],
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply();

  const everyoneRole = guild.roles.everyone;

  if (modo === "canal") {
    const channel = interaction.channel;
    if (!channel || channel.type !== ChannelType.GuildText) {
      await interaction.editReply({ content: "Este comando solo funciona en canales de texto." });
      return;
    }

    await (channel as TextChannel).permissionOverwrites.edit(everyoneRole, {
      SendMessages: false,
    });

    await logAction(
      "lockdown-canal",
      `<#${channel.id}>`,
      `<@${interaction.user.id}> (${interaction.user.username})`,
      new Date().toISOString(),
      guild
    );

    await interaction.editReply({
      embeds: [buildEmbed("warn", {
        title: "🔒 Canal bloqueado",
        description: `El canal <#${channel.id}> ha sido bloqueado. @everyone no puede enviar mensajes.`,
        footer: new Date().toLocaleString("es-ES"),
      })],
    });

  } else if (modo === "servidor") {
    const textChannels = guild.channels.cache.filter(
      (ch) => ch.type === ChannelType.GuildText
    );

    let locked = 0;
    for (const [, ch] of textChannels) {
      try {
        await (ch as TextChannel).permissionOverwrites.edit(everyoneRole, {
          SendMessages: false,
        });
        locked++;
      } catch {
        // Skip channels where bot lacks permissions
      }
    }

    await logAction(
      "lockdown-servidor",
      `${locked} canales bloqueados`,
      `<@${interaction.user.id}> (${interaction.user.username})`,
      new Date().toISOString(),
      guild
    );

    await interaction.editReply({
      embeds: [buildEmbed("warn", {
        title: "🔒 Servidor bloqueado",
        description: `Se han bloqueado **${locked}** canales de texto. @everyone no puede enviar mensajes.`,
        footer: new Date().toLocaleString("es-ES"),
      })],
    });

  } else if (modo === "unlock") {
    const channel = interaction.channel;
    if (!channel || channel.type !== ChannelType.GuildText) {
      await interaction.editReply({ content: "Este comando solo funciona en canales de texto." });
      return;
    }

    // Restore SendMessages to null (inherit from role) for @everyone
    await (channel as TextChannel).permissionOverwrites.edit(everyoneRole, {
      SendMessages: null,
    });

    await logAction(
      "lockdown-unlock",
      `<#${channel.id}>`,
      `<@${interaction.user.id}> (${interaction.user.username})`,
      new Date().toISOString(),
      guild
    );

    await interaction.editReply({
      embeds: [buildEmbed("success", {
        title: "🔓 Canal desbloqueado",
        description: `El canal <#${channel.id}> ha sido desbloqueado. Los permisos de @everyone han sido restaurados.`,
        footer: new Date().toLocaleString("es-ES"),
      })],
    });
  }
}
