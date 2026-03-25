import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Guild,
  GuildMember,
  AttachmentBuilder,
  PermissionFlagsBits,
  type SlashCommandSubcommandBuilder,
  type SlashCommandUserOption,
  type SlashCommandStringOption,
} from "discord.js";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "../../utils/database.js";
import { loadConfig } from "../../utils/dataStore.js";
import { buildEmbed } from "../../utils/embeds.js";
import { getMessage } from "../../utils/personality.js";
import { logAction } from "../admin/auditLog.js";
import type { Warn } from "../../types/index.js";

// ─── SQLite helpers ───────────────────────────────────────────────────────────

function ensureTable(): void {
  const db = getDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS warns (
      id            TEXT PRIMARY KEY,
      member_id     TEXT NOT NULL,
      guild_id      TEXT NOT NULL,
      reason        TEXT NOT NULL,
      moderator_id  TEXT NOT NULL,
      timestamp     TEXT NOT NULL,
      active        INTEGER NOT NULL DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS mod_logs (
      id            TEXT PRIMARY KEY,
      member_id     TEXT NOT NULL,
      guild_id      TEXT NOT NULL,
      action        TEXT NOT NULL,
      reason        TEXT,
      moderator_id  TEXT NOT NULL,
      timestamp     TEXT NOT NULL,
      duration      INTEGER
    );
  `);
}

/** Returns all active warns for a member in a guild. */
export function getActiveWarns(memberId: string, guildId?: string): Warn[] {
  ensureTable();
  const db = getDb();
  if (guildId) {
    const rows = db
      .prepare(
        "SELECT * FROM warns WHERE member_id = ? AND guild_id = ? AND active = 1"
      )
      .all(memberId, guildId) as Array<Record<string, unknown>>;
    return rows.map(rowToWarn);
  }
  // Fallback: no guild filter (backward compat)
  const rows = db
    .prepare("SELECT * FROM warns WHERE member_id = ? AND active = 1")
    .all(memberId) as Array<Record<string, unknown>>;
  return rows.map(rowToWarn);
}

function rowToWarn(row: Record<string, unknown>): Warn {
  return {
    id: row.id as string,
    memberId: row.member_id as string,
    reason: row.reason as string,
    moderatorId: row.moderator_id as string,
    timestamp: row.timestamp as string,
    active: (row.active as number) === 1,
  };
}

interface ModLogRow {
  id: string;
  member_id: string;
  guild_id: string;
  action: string;
  reason: string | null;
  moderator_id: string;
  timestamp: string;
  duration: number | null;
}

function getModLogs(memberId: string, guildId: string): ModLogRow[] {
  ensureTable();
  const db = getDb();
  return db
    .prepare(
      "SELECT * FROM mod_logs WHERE member_id = ? AND guild_id = ? ORDER BY timestamp DESC"
    )
    .all(memberId, guildId) as ModLogRow[];
}

function insertModLog(
  memberId: string,
  guildId: string,
  action: string,
  reason: string | null,
  moderatorId: string,
  duration?: number
): void {
  ensureTable();
  const db = getDb();
  db.prepare(
    `INSERT INTO mod_logs (id, member_id, guild_id, action, reason, moderator_id, timestamp, duration)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    uuidv4(),
    memberId,
    guildId,
    action,
    reason ?? null,
    moderatorId,
    new Date().toISOString(),
    duration ?? null
  );
}

// ─── Core warn logic ──────────────────────────────────────────────────────────

/**
 * Adds a warn to a member, notifies them by DM, logs to AuditLog,
 * and triggers automatic actions based on warn level:
 *   1 warn  → DM de advertencia
 *   3 warns → mute de 1 hora (timeout nativo)
 *   5 warns → kick automático
 */
export async function addWarn(
  memberId: string,
  reason: string,
  moderatorId: string,
  guild: Guild
): Promise<Warn> {
  ensureTable();
  const db = getDb();

  const warn: Warn = {
    id: uuidv4(),
    memberId,
    reason,
    moderatorId,
    timestamp: new Date().toISOString(),
    active: true,
  };

  db.prepare(
    `INSERT INTO warns (id, member_id, guild_id, reason, moderator_id, timestamp, active)
     VALUES (?, ?, ?, ?, ?, ?, 1)`
  ).run(warn.id, memberId, guild.id, reason, moderatorId, warn.timestamp);

  // Insert mod_log entry
  insertModLog(memberId, guild.id, "warn", reason, moderatorId);

  const activeWarns = getActiveWarns(memberId, guild.id);
  const config = loadConfig(guild.id);
  const mode = config.personalityMode;

  // Level 1: DM de advertencia
  try {
    const member = await guild.members.fetch(memberId);
    const dmMsg = getMessage(
      "warn",
      {
        member: member.user.username,
        n: String(activeWarns.length),
        reason,
        moderator: `<@${moderatorId}>`,
      },
      mode
    );
    await member.send(dmMsg);
  } catch {
    // DM may be disabled — fail silently
  }

  // Log to AuditLog
  await logAction(
    "warn",
    `<@${memberId}>`,
    `<@${moderatorId}>`,
    warn.timestamp,
    guild
  );

  // Level 3: mute automático de 1 hora
  if (activeWarns.length === 3) {
    await triggerAutoMute(memberId, activeWarns.length, guild, mode);
  }

  // Level 5: kick automático
  if (activeWarns.length >= 5) {
    await triggerAutoKick(memberId, activeWarns.length, guild, mode);
  }

  return warn;
}

async function triggerAutoMute(
  memberId: string,
  warnCount: number,
  guild: Guild,
  mode: "friki" | "formal"
): Promise<void> {
  try {
    const member = await guild.members.fetch(memberId);
    if (!member.moderatable) return;

    const ONE_HOUR_MS = 60 * 60 * 1000;
    await member.timeout(ONE_HOUR_MS, `Auto-mute: acumuló ${warnCount} advertencias activas`);

    try {
      const msg =
        mode === "formal"
          ? `⏱️ Has recibido un silencio automático de 1 hora por acumular ${warnCount} advertencias.`
          : `⏱️ ¡Ojo! Llevas ${warnCount} warns y te han silenciado 1 hora automáticamente. ¡Cuidado!`;
      await member.send(msg);
    } catch {
      // DM disabled
    }

    insertModLog(memberId, guild.id, "mute", `Auto-mute por ${warnCount} warns`, "Sistema", ONE_HOUR_MS);
    await logAction(
      "automute",
      `<@${memberId}>`,
      "Sistema",
      new Date().toISOString(),
      guild
    );
  } catch {
    // Member may have left or bot lacks permissions
  }
}

async function triggerAutoKick(
  memberId: string,
  warnCount: number,
  guild: Guild,
  mode: "friki" | "formal"
): Promise<void> {
  try {
    const member = await guild.members.fetch(memberId);
    const msg = getMessage(
      "autokick",
      { member: member.user.username, n: String(warnCount) },
      mode
    );
    try {
      await member.send(msg);
    } catch {
      // DM disabled
    }
    await member.kick(`Auto-kick: acumuló ${warnCount} advertencias activas`);
    insertModLog(memberId, guild.id, "kick", `Auto-kick por ${warnCount} warns`, "Sistema");
    await logAction(
      "autokick",
      `<@${memberId}>`,
      "Sistema",
      new Date().toISOString(),
      guild
    );
  } catch {
    // Member may have already left
  }
}

// ─── Export helpers ───────────────────────────────────────────────────────────

function buildJsonExport(logs: ModLogRow[]): Buffer {
  return Buffer.from(JSON.stringify(logs, null, 2), "utf-8");
}

function buildCsvExport(logs: ModLogRow[]): Buffer {
  const header = "id,member_id,guild_id,action,reason,moderator_id,timestamp,duration";
  const rows = logs.map((l) =>
    [
      l.id,
      l.member_id,
      l.guild_id,
      l.action,
      (l.reason ?? "").replace(/,/g, ";"),
      l.moderator_id,
      l.timestamp,
      l.duration ?? "",
    ].join(",")
  );
  return Buffer.from([header, ...rows].join("\n"), "utf-8");
}

// ─── Slash Commands ───────────────────────────────────────────────────────────

export const data = new SlashCommandBuilder()
  .setName("warn")
  .setDescription("Gestión de advertencias")
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
  .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
    sub
      .setName("add")
      .setDescription("Añade una advertencia a un miembro")
      .addUserOption((opt: SlashCommandUserOption) =>
        opt.setName("member").setDescription("Miembro a advertir").setRequired(true)
      )
      .addStringOption((opt: SlashCommandStringOption) =>
        opt.setName("razon").setDescription("Razón de la advertencia").setRequired(true)
      )
  )
  .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
    sub
      .setName("list")
      .setDescription("Lista las advertencias activas de un miembro")
      .addUserOption((opt: SlashCommandUserOption) =>
        opt.setName("member").setDescription("Miembro a consultar").setRequired(true)
      )
  )
  .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
    sub
      .setName("remove")
      .setDescription("Elimina una advertencia por ID")
      .addUserOption((opt: SlashCommandUserOption) =>
        opt.setName("member").setDescription("Miembro").setRequired(true)
      )
      .addStringOption((opt: SlashCommandStringOption) =>
        opt.setName("id").setDescription("ID del warn a eliminar").setRequired(true)
      )
  )
  .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
    sub
      .setName("modlogs")
      .setDescription("Muestra el historial completo de moderación de un miembro")
      .addUserOption((opt: SlashCommandUserOption) =>
        opt.setName("member").setDescription("Miembro a consultar").setRequired(true)
      )
      .addStringOption((opt: SlashCommandStringOption) =>
        opt
          .setName("export")
          .setDescription("Exportar historial como archivo adjunto")
          .setRequired(false)
          .addChoices(
            { name: "json", value: "json" },
            { name: "csv", value: "csv" }
          )
      )
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guild) {
    await interaction.reply({ content: "Este comando solo funciona en un servidor.", ephemeral: true });
    return;
  }

  const sub = interaction.options.getSubcommand();

  // ── /warn add ──────────────────────────────────────────────────────────────
  if (sub === "add") {
    const target = interaction.options.getMember("member") as GuildMember | null;
    const reason = interaction.options.getString("razon", true);

    if (!target) {
      await interaction.reply({ content: "No se encontró al miembro.", ephemeral: true });
      return;
    }

    await interaction.deferReply();

    const warn = await addWarn(
      target.id,
      reason,
      interaction.user.id,
      interaction.guild
    );

    const activeWarns = getActiveWarns(target.id, interaction.guild.id);
    const embed = buildEmbed("warn", {
      title: "⚠️ Advertencia registrada",
      description: `Se ha advertido a ${target.user.username}`,
      fields: [
        { name: "Razón", value: reason, inline: false },
        { name: "ID del warn", value: warn.id, inline: true },
        { name: "Warns activos", value: String(activeWarns.length), inline: true },
      ],
      footer: `Moderador: ${interaction.user.username}`,
    });

    await interaction.editReply({ embeds: [embed] });
    return;
  }

  // ── /warn list ─────────────────────────────────────────────────────────────
  if (sub === "list") {
    const target = interaction.options.getMember("member") as GuildMember | null;
    if (!target) {
      await interaction.reply({ content: "No se encontró al miembro.", ephemeral: true });
      return;
    }

    const warns = getActiveWarns(target.id, interaction.guild.id);

    if (warns.length === 0) {
      await interaction.reply({
        embeds: [
          buildEmbed("success", {
            title: "✅ Sin advertencias",
            description: `${target.user.username} no tiene advertencias activas.`,
          }),
        ],
        ephemeral: true,
      });
      return;
    }

    const fields = warns.map((w, i) => ({
      name: `Warn #${i + 1} — ID: ${w.id}`,
      value: `**Razón:** ${w.reason}\n**Moderador:** <@${w.moderatorId}>\n**Fecha:** ${new Date(w.timestamp).toLocaleString("es-ES")}`,
      inline: false,
    }));

    const embed = buildEmbed("warn", {
      title: `⚠️ Advertencias de ${target.user.username}`,
      description: `Total activas: **${warns.length}**`,
      fields,
    });

    await interaction.reply({ embeds: [embed], ephemeral: true });
    return;
  }

  // ── /warn remove ───────────────────────────────────────────────────────────
  if (sub === "remove") {
    const target = interaction.options.getMember("member") as GuildMember | null;
    const warnId = interaction.options.getString("id", true);

    if (!target) {
      await interaction.reply({ content: "No se encontró al miembro.", ephemeral: true });
      return;
    }

    const db = getDb();
    ensureTable();

    const row = db
      .prepare("SELECT * FROM warns WHERE id = ? AND member_id = ? AND active = 1")
      .get(warnId, target.id);

    if (!row) {
      await interaction.reply({
        content: `No se encontró un warn activo con ID \`${warnId}\` para ese miembro.`,
        ephemeral: true,
      });
      return;
    }

    db.prepare("UPDATE warns SET active = 0 WHERE id = ?").run(warnId);

    await logAction(
      "unwarn",
      `<@${target.id}>`,
      `<@${interaction.user.id}>`,
      new Date().toISOString(),
      interaction.guild
    );

    await interaction.reply({
      embeds: [
        buildEmbed("success", {
          title: "✅ Advertencia eliminada",
          description: `Se eliminó el warn \`${warnId}\` de ${target.user.username}.`,
        }),
      ],
    });
    return;
  }

  // ── /warn modlogs ──────────────────────────────────────────────────────────
  if (sub === "modlogs") {
    const target = interaction.options.getMember("member") as GuildMember | null;
    const exportFormat = interaction.options.getString("export") as "json" | "csv" | null;

    if (!target) {
      await interaction.reply({ content: "No se encontró al miembro.", ephemeral: true });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    const logs = getModLogs(target.id, interaction.guild.id);

    if (logs.length === 0) {
      await interaction.editReply({
        embeds: [
          buildEmbed("success", {
            title: "📋 Sin registros",
            description: `${target.user.username} no tiene acciones de moderación registradas.`,
          }),
        ],
      });
      return;
    }

    // Build embed with up to 10 most recent entries
    const recent = logs.slice(0, 10);
    const fields = recent.map((l, i) => ({
      name: `#${i + 1} — ${l.action.toUpperCase()} · ${new Date(l.timestamp).toLocaleDateString("es-ES")}`,
      value: [
        `**Razón:** ${l.reason ?? "Sin razón"}`,
        `**Moderador:** <@${l.moderator_id}>`,
        `**Fecha:** ${new Date(l.timestamp).toLocaleString("es-ES")}`,
        l.duration ? `**Duración:** ${l.duration}ms` : "",
      ]
        .filter(Boolean)
        .join("\n"),
      inline: false,
    }));

    const embed = buildEmbed("info", {
      title: `📋 Historial de moderación — ${target.user.username}`,
      description: `Total de acciones: **${logs.length}**${logs.length > 10 ? " (mostrando las 10 más recientes)" : ""}`,
      fields,
      footer: `ID: ${target.id}`,
    });

    // If export requested, attach file
    if (exportFormat === "json" || exportFormat === "csv") {
      const fileBuffer =
        exportFormat === "json" ? buildJsonExport(logs) : buildCsvExport(logs);
      const fileName = `modlogs-${target.id}-${Date.now()}.${exportFormat}`;
      const attachment = new AttachmentBuilder(fileBuffer, { name: fileName });

      await interaction.editReply({ embeds: [embed], files: [attachment] });
    } else {
      await interaction.editReply({ embeds: [embed] });
    }
  }
}
