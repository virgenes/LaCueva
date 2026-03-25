import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  GuildMember,
  time,
  TimestampStyles,
} from "discord.js";
import { getDb } from "../../utils/database.js";
import { buildEmbed } from "../../utils/embeds.js";

// ─── DB helpers ───────────────────────────────────────────────────────────────

function getActiveWarnCount(memberId: string, guildId: string): number {
  const db = getDb();
  const row = db
    .prepare(
      "SELECT COUNT(*) as cnt FROM warns WHERE member_id = ? AND guild_id = ? AND active = 1"
    )
    .get(memberId, guildId) as { cnt: number } | undefined;
  return row?.cnt ?? 0;
}

function getLevelData(
  memberId: string,
  guildId: string
): { xp: number; level: number } {
  const db = getDb();
  const row = db
    .prepare(
      "SELECT xp, level FROM levels WHERE member_id = ? AND guild_id = ?"
    )
    .get(memberId, guildId) as { xp: number; level: number } | undefined;
  return row ?? { xp: 0, level: 0 };
}

// ─── Slash command definition ─────────────────────────────────────────────────

export const data = new SlashCommandBuilder()
  .setName("userinfo")
  .setDescription("Muestra información de un miembro o del servidor")
  .addSubcommand((sub) =>
    sub
      .setName("user")
      .setDescription("Muestra información de un miembro")
      .addUserOption((opt) =>
        opt
          .setName("member")
          .setDescription("Miembro a consultar (por defecto: tú mismo)")
          .setRequired(false)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("server")
      .setDescription("Muestra información del servidor")
  );

// ─── Execute ──────────────────────────────────────────────────────────────────

export async function execute(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  if (!interaction.guild) {
    await interaction.reply({
      content: "Este comando solo funciona en un servidor.",
      ephemeral: true,
    });
    return;
  }

  const sub = interaction.options.getSubcommand();

  // ── /userinfo user ─────────────────────────────────────────────────────────
  if (sub === "user") {
    await interaction.deferReply();

    const targetUser =
      interaction.options.getUser("member") ?? interaction.user;

    let member: GuildMember | null = null;
    try {
      member = await interaction.guild.members.fetch(targetUser.id);
    } catch {
      // User not in guild — show partial info
    }

    const warnCount = getActiveWarnCount(targetUser.id, interaction.guild.id);
    const { xp, level } = getLevelData(targetUser.id, interaction.guild.id);

    const accountCreated = time(
      targetUser.createdAt,
      TimestampStyles.LongDateTime
    );

    const fields: { name: string; value: string; inline?: boolean }[] = [
      {
        name: "🆔 ID",
        value: targetUser.id,
        inline: true,
      },
      {
        name: "📅 Cuenta creada",
        value: accountCreated,
        inline: true,
      },
    ];

    if (member) {
      const joinedAt = member.joinedAt
        ? time(member.joinedAt, TimestampStyles.LongDateTime)
        : "Desconocido";

      const roles = member.roles.cache
        .filter((r) => r.id !== interaction.guild!.id) // exclude @everyone
        .sort((a, b) => b.position - a.position)
        .map((r) => `<@&${r.id}>`)
        .join(", ") || "Sin roles";

      fields.push(
        { name: "📥 Ingresó al servidor", value: joinedAt, inline: true },
        { name: "🎭 Roles", value: roles, inline: false }
      );
    }

    fields.push(
      { name: "⚠️ Warns activos", value: String(warnCount), inline: true },
      { name: "⭐ Nivel", value: String(level), inline: true },
      { name: "✨ XP", value: String(xp), inline: true }
    );

    const avatarUrl =
      targetUser.displayAvatarURL({ size: 256 }) ?? undefined;

    const embed = buildEmbed("info", {
      title: `👤 ${member?.displayName ?? targetUser.username}`,
      fields,
      thumbnail: avatarUrl,
      footer: `Solicitado por ${interaction.user.username}`,
    });

    await interaction.editReply({ embeds: [embed] });
    return;
  }

  // ── /userinfo server ───────────────────────────────────────────────────────
  if (sub === "server") {
    await interaction.deferReply();

    const guild = interaction.guild;
    await guild.fetch(); // ensure fresh data

    const owner = await guild.fetchOwner().catch(() => null);
    const createdAt = time(guild.createdAt, TimestampStyles.LongDateTime);

    const boostTier = `Nivel ${guild.premiumTier}`;
    const boostCount = guild.premiumSubscriptionCount ?? 0;

    const embed = buildEmbed("info", {
      title: `🏠 ${guild.name}`,
      fields: [
        { name: "🆔 ID", value: guild.id, inline: true },
        { name: "📅 Creado", value: createdAt, inline: true },
        {
          name: "👑 Propietario",
          value: owner ? `<@${owner.id}>` : "Desconocido",
          inline: true,
        },
        {
          name: "👥 Miembros",
          value: String(guild.memberCount),
          inline: true,
        },
        {
          name: "📢 Canales",
          value: String(guild.channels.cache.size),
          inline: true,
        },
        {
          name: "🎭 Roles",
          value: String(guild.roles.cache.size),
          inline: true,
        },
        { name: "🚀 Nivel de boost", value: boostTier, inline: true },
        {
          name: "💎 Boosts",
          value: String(boostCount),
          inline: true,
        },
      ],
      thumbnail: guild.iconURL({ size: 256 }) ?? undefined,
      footer: `Solicitado por ${interaction.user.username}`,
    });

    await interaction.editReply({ embeds: [embed] });
  }
}
