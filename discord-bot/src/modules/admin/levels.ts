import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Client,
  TextChannel,
  GuildMember,
  ComponentType,
  MessageFlags,
} from "discord.js";
import { getDb } from "../../utils/database.js";
import { progressBar } from "../../utils/progressBar.js";
import { buildPaginationRow } from "../../utils/pagination.js";
import { buildEmbed } from "../../utils/embeds.js";
import { loadConfig } from "../../utils/dataStore.js";

// ─── Constants ────────────────────────────────────────────────────────────────

const XP_COOLDOWN_MS = 60_000; // 60 seconds anti-spam cooldown
const XP_MIN = 15;
const XP_MAX = 25;
const LEADERBOARD_PAGE_SIZE = 10;
const PAGINATION_TIMEOUT_MS = 60_000;

// ─── Level formula ────────────────────────────────────────────────────────────

function xpToLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100));
}

function levelToXp(level: number): number {
  return level * level * 100;
}

// ─── DB helpers ───────────────────────────────────────────────────────────────

interface LevelRow {
  member_id: string;
  guild_id: string;
  xp: number;
  level: number;
  last_xp_grant: string | null;
}

function getRow(memberId: string, guildId: string): LevelRow {
  const db = getDb();
  const row = db
    .prepare(
      "SELECT member_id, guild_id, xp, level, last_xp_grant FROM levels WHERE member_id = ? AND guild_id = ?"
    )
    .get(memberId, guildId) as LevelRow | undefined;

  return (
    row ?? {
      member_id: memberId,
      guild_id: guildId,
      xp: 0,
      level: 0,
      last_xp_grant: null,
    }
  );
}

function upsertRow(row: LevelRow): void {
  getDb()
    .prepare(
      `INSERT INTO levels (member_id, guild_id, xp, level, last_xp_grant)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(member_id, guild_id) DO UPDATE SET
         xp            = excluded.xp,
         level         = excluded.level,
         last_xp_grant = excluded.last_xp_grant`
    )
    .run(row.member_id, row.guild_id, row.xp, row.level, row.last_xp_grant);
}

// ─── grantXp ─────────────────────────────────────────────────────────────────

/**
 * Grants XP to a guild member on each message, respecting a 60-second cooldown.
 * Notifies the channel on level-up and assigns reward roles if configured.
 *
 * Requirement 20.1, 20.2, 20.5, 20.6
 */
export async function grantXp(
  memberId: string,
  guildId: string,
  client: Client,
  channelId?: string
): Promise<void> {
  const row = getRow(memberId, guildId);
  const now = Date.now();

  // Cooldown check (Requirement 20.1)
  if (row.last_xp_grant !== null) {
    const elapsed = now - new Date(row.last_xp_grant).getTime();
    if (elapsed < XP_COOLDOWN_MS) return;
  }

  const xpGain = Math.floor(Math.random() * (XP_MAX - XP_MIN + 1)) + XP_MIN;
  const oldLevel = row.level;
  const newXp = row.xp + xpGain;
  const newLevel = xpToLevel(newXp);

  row.xp = newXp;
  row.level = newLevel;
  row.last_xp_grant = new Date(now).toISOString();
  upsertRow(row);

  // Level-up notification (Requirement 20.2)
  if (newLevel > oldLevel && channelId) {
    try {
      const channel = await client.channels.fetch(channelId);
      if (channel && channel.isTextBased()) {
        const xpForNext = levelToXp(newLevel + 1);
        await (channel as TextChannel).send({
          embeds: [
            buildEmbed("success", {
              title: "🎉 ¡Subiste de nivel!",
              description: `<@${memberId}> ha alcanzado el **nivel ${newLevel}**!`,
              fields: [
                { name: "XP acumulado", value: `${newXp}`, inline: true },
                { name: "XP para nivel ${newLevel + 1}", value: `${xpForNext}`, inline: true },
              ],
            }),
          ],
        });
      }
    } catch {
      // Channel inaccessible — fail silently
    }
  }

  // Reward role assignment (Requirement 20.5)
  if (newLevel > oldLevel) {
    try {
      const guild = await client.guilds.fetch(guildId);
      const member = await guild.members.fetch(memberId) as GuildMember;
      const config = loadConfig(guildId);

      // Config stores level reward roles as levelRoles: Record<number, string>
      const levelRoles = (config as unknown as Record<string, unknown>)["levelRoles"] as
        | Record<number, string>
        | undefined;

      if (levelRoles) {
        for (let lvl = oldLevel + 1; lvl <= newLevel; lvl++) {
          const roleId = levelRoles[lvl];
          if (roleId) {
            await member.roles.add(roleId).catch(() => undefined);
          }
        }
      }
    } catch {
      // Guild/member fetch failed — fail silently
    }
  }
}

// ─── Command definition ───────────────────────────────────────────────────────

export const data = new SlashCommandBuilder()
  .setName("level")
  .setDescription("Sistema de niveles y XP")
  .addSubcommand((sub) =>
    sub.setName("ver").setDescription("Muestra tu nivel actual, XP y progreso")
  )
  .addSubcommand((sub) =>
    sub.setName("leaderboard").setDescription("Top 10 miembros con más XP en el servidor")
  );

// ─── Execute ──────────────────────────────────────────────────────────────────

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const sub = interaction.options.getSubcommand();

  if (sub === "ver") {
    await handleLevel(interaction);
  } else if (sub === "leaderboard") {
    await handleLeaderboard(interaction);
  }
}

// ─── /level ver ───────────────────────────────────────────────────────────────

async function handleLevel(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guild) {
    await interaction.reply({ content: "Este comando solo funciona en un servidor.", flags: MessageFlags.Ephemeral });
    return;
  }

  const row = getRow(interaction.user.id, interaction.guild.id);
  const currentLevel = xpToLevel(row.xp);
  const xpForCurrent = levelToXp(currentLevel);
  const xpForNext = levelToXp(currentLevel + 1);
  const xpInLevel = row.xp - xpForCurrent;
  const xpNeeded = xpForNext - xpForCurrent;
  const bar = progressBar(xpInLevel, xpNeeded);

  const embed = buildEmbed("info", {
    title: `📊 Nivel de ${interaction.user.username}`,
    fields: [
      { name: "Nivel actual", value: `${currentLevel}`, inline: true },
      { name: "XP total", value: `${row.xp}`, inline: true },
      { name: "XP para nivel ${currentLevel + 1}", value: `${xpForNext}`, inline: true },
      { name: "Progreso", value: bar, inline: false },
    ],
  });

  await interaction.reply({ embeds: [embed] });
}

// ─── /level leaderboard ───────────────────────────────────────────────────────

async function handleLeaderboard(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guild) {
    await interaction.reply({ content: "Este comando solo funciona en un servidor.", flags: MessageFlags.Ephemeral });
    return;
  }

  const guildId = interaction.guild.id;
  const totalCount = (
    getDb()
      .prepare("SELECT COUNT(*) as cnt FROM levels WHERE guild_id = ?")
      .get(guildId) as { cnt: number }
  ).cnt;

  if (totalCount === 0) {
    await interaction.reply({
      embeds: [
        buildEmbed("info", {
          title: "🏆 Leaderboard de XP",
          description: "Aún no hay datos de XP en este servidor.",
        }),
      ],
    });
    return;
  }

  const totalPages = Math.ceil(totalCount / LEADERBOARD_PAGE_SIZE);
  let currentPage = 1;

  const buildEmbed_ = (page: number) => {
    const offset = (page - 1) * LEADERBOARD_PAGE_SIZE;
    const rows = getDb()
      .prepare(
        "SELECT member_id, xp, level FROM levels WHERE guild_id = ? ORDER BY xp DESC LIMIT ? OFFSET ?"
      )
      .all(guildId, LEADERBOARD_PAGE_SIZE, offset) as { member_id: string; xp: number; level: number }[];

    const maxXp = rows[0]?.xp ?? 1;
    const medals = ["🥇", "🥈", "🥉"];

    const lines = rows.map((r, i) => {
      const rank = offset + i + 1;
      const medal = medals[i] ?? `**${rank}.**`;
      const bar = progressBar(r.xp, maxXp);
      return `${medal} <@${r.member_id}> — Nivel ${r.level} · ${r.xp} XP\n${bar}`;
    });

    return buildEmbed("info", {
      title: `🏆 Leaderboard de XP — Página ${page}/${totalPages}`,
      description: lines.join("\n\n"),
      footer: `Página ${page} de ${totalPages}`,
    });
  };

  const row = buildPaginationRow(currentPage, totalPages);
  const reply = await interaction.reply({
    embeds: [buildEmbed_(currentPage)],
    components: totalPages > 1 ? [row] : [],
    fetchReply: true,
  });

  if (totalPages <= 1) return;

  const collector = reply.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: PAGINATION_TIMEOUT_MS,
  });

  collector.on("collect", async (btn) => {
    if (btn.user.id !== interaction.user.id) {
      await btn.reply({ content: "Solo quien ejecutó el comando puede navegar.", flags: MessageFlags.Ephemeral });
      return;
    }

    if (btn.customId === "pagination_prev" && currentPage > 1) currentPage--;
    else if (btn.customId === "pagination_next" && currentPage < totalPages) currentPage++;

    await btn.update({
      embeds: [buildEmbed_(currentPage)],
      components: [buildPaginationRow(currentPage, totalPages)],
    });
  });

  collector.on("end", async () => {
    await interaction.editReply({ components: [] }).catch(() => undefined);
  });
}
