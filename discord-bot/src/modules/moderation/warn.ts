import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Guild,
  GuildMember,
  EmbedBuilder,
  type SlashCommandSubcommandBuilder,
  type SlashCommandUserOption,
  type SlashCommandStringOption,
} from "discord.js";
import { v4 as uuidv4 } from "uuid";
import { readData, writeData, loadConfig } from "../../utils/dataStore.js";
import { buildEmbed, EMBED_COLORS } from "../../utils/embeds.js";
import { getMessage } from "../../utils/personality.js";
import { logAction } from "../admin/auditLog.js";
import type { Warn } from "../../types/index.js";
type WarnsStore = Record<string, Warn[]>;

function loadWarns(): WarnsStore {
  return readData<WarnsStore>("warns.json", {});
}

function saveWarns(store: WarnsStore): void {
  writeData("warns.json", store);
}

/** Returns all active warns for a member. */
export function getActiveWarns(memberId: string): Warn[] {
  const store = loadWarns();
  return (store[memberId] ?? []).filter((w) => w.active);
}

/**
 * Adds a warn to a member, notifies them by DM, logs to AuditLog,
 * and triggers auto-kick (3 warns) or auto-ban (5 warns in 30 days).
 */
export async function addWarn(
  memberId: string,
  reason: string,
  moderatorId: string,
  guild: Guild
): Promise<Warn> {
  const store = loadWarns();
  if (!store[memberId]) store[memberId] = [];

  const warn: Warn = {
    id: uuidv4(),
    memberId,
    reason,
    moderatorId,
    timestamp: new Date().toISOString(),
    active: true,
  };

  store[memberId].push(warn);
  saveWarns(store);

  const activeWarns = store[memberId].filter((w) => w.active);
  const config = loadConfig(guild.id);
  const mode = config.personalityMode;
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

  // Auto-kick at 3 active warns
  if (activeWarns.length >= 3) {
    await triggerAutoKick(memberId, activeWarns.length, guild, mode);
  }

  // Auto-ban at 5 warns in last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentWarns = store[memberId].filter(
    (w) => w.active && new Date(w.timestamp) >= thirtyDaysAgo
  );
  if (recentWarns.length >= 5) {
    await triggerAutoBan(memberId, recentWarns.length, guild, mode);
  }

  return warn;
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

async function triggerAutoBan(
  memberId: string,
  warnCount: number,
  guild: Guild,
  mode: "friki" | "formal"
): Promise<void> {
  try {
    const member = await guild.members.fetch(memberId);
    const msg = getMessage(
      "autoban",
      { member: member.user.username, n: String(warnCount) },
      mode
    );
    try {
      await member.send(msg);
    } catch {
      // DM disabled
    }
    await guild.bans.create(memberId, {
      reason: `Auto-ban: acumuló ${warnCount} warns en los últimos 30 días`,
    });
    await logAction(
      "autoban",
      `<@${memberId}>`,
      "Sistema",
      new Date().toISOString(),
      guild
    );
  } catch {
    // Member may have already left or been banned
  }
}

// ─── Slash Commands ───────────────────────────────────────────────────────────

export const data = new SlashCommandBuilder()
  .setName("warn")
  .setDescription("Gestión de advertencias")
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
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guild) {
    await interaction.reply({ content: "Este comando solo funciona en un servidor.", ephemeral: true });
    return;
  }

  const sub = interaction.options.getSubcommand();

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

    const activeWarns = getActiveWarns(target.id);
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

  if (sub === "list") {
    const target = interaction.options.getMember("member") as GuildMember | null;
    if (!target) {
      await interaction.reply({ content: "No se encontró al miembro.", ephemeral: true });
      return;
    }

    const warns = getActiveWarns(target.id);

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

  if (sub === "remove") {
    const target = interaction.options.getMember("member") as GuildMember | null;
    const warnId = interaction.options.getString("id", true);

    if (!target) {
      await interaction.reply({ content: "No se encontró al miembro.", ephemeral: true });
      return;
    }

    const store = loadWarns();
    const memberWarns = store[target.id] ?? [];
    const warnIndex = memberWarns.findIndex((w) => w.id === warnId && w.active);

    if (warnIndex === -1) {
      await interaction.reply({
        content: `No se encontró un warn activo con ID \`${warnId}\` para ese miembro.`,
        ephemeral: true,
      });
      return;
    }

    memberWarns[warnIndex].active = false;
    store[target.id] = memberWarns;
    saveWarns(store);

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
  }
}
