import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  GuildMember,
  TextChannel,
  PermissionFlagsBits,
  Client,
  type SlashCommandRoleOption,
  type SlashCommandUserOption,
  type SlashCommandStringOption,
} from "discord.js";
import { randomUUID } from "node:crypto";
import { loadConfig, saveConfig } from "../../utils/dataStore.js";
import { buildEmbed } from "../../utils/embeds.js";
import { getMessage } from "../../utils/personality.js";
import { logAction } from "./auditLog.js";
import { parseDuration } from "../moderation/timeout.js";
import { getDb } from "../../utils/database.js";

// ─── Slash commands ───────────────────────────────────────────────────────────

const autoroleCommand = new SlashCommandBuilder()
  .setName("autorole")
  .setDescription("Configura los roles automáticos para nuevos miembros")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
  .addSubcommand((sub) =>
    sub
      .setName("set")
      .setDescription("Añade un rol a la lista de autoroles")
      .addRoleOption((opt: SlashCommandRoleOption) =>
        opt
          .setName("rol")
          .setDescription("Rol a añadir a la lista de autoroles")
          .setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("remove")
      .setDescription("Quita un rol de la lista de autoroles")
      .addRoleOption((opt: SlashCommandRoleOption) =>
        opt
          .setName("rol")
          .setDescription("Rol a quitar de la lista de autoroles")
          .setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub.setName("list").setDescription("Muestra los roles automáticos configurados")
  )
  .addSubcommand((sub) =>
    sub.setName("disable").setDescription("Desactiva todos los roles automáticos")
  );

const temproleCommand = new SlashCommandBuilder()
  .setName("temprole")
  .setDescription("Asigna un rol temporal a un miembro")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
  .addUserOption((opt: SlashCommandUserOption) =>
    opt.setName("usuario").setDescription("Miembro al que asignar el rol temporal").setRequired(true)
  )
  .addRoleOption((opt: SlashCommandRoleOption) =>
    opt.setName("rol").setDescription("Rol temporal a asignar").setRequired(true)
  )
  .addStringOption((opt: SlashCommandStringOption) =>
    opt
      .setName("duracion")
      .setDescription("Duración del rol temporal (ej: 1d, 2h, 30m)")
      .setRequired(true)
  );

/** Single-command export for commandHandler compatibility (data + execute pattern). */
export const data = autoroleCommand;

// ─── /autorole handler ────────────────────────────────────────────────────────

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guild) {
    await interaction.reply({ content: "Este comando solo funciona en un servidor.", ephemeral: true });
    return;
  }

  const sub = interaction.options.getSubcommand();
  const config = loadConfig(interaction.guild.id);
  const mode = config.personalityMode;

  // Ensure autoRoleIds array exists (migration from old single-role config)
  if (!config.autoRoleIds) config.autoRoleIds = [];

  if (sub === "set") {
    const role = interaction.options.getRole("rol", true);

    if (!config.autoRoleIds.includes(role.id)) {
      config.autoRoleIds.push(role.id);
    }
    // Keep legacy field in sync for backwards compatibility
    config.autoRoleId = role.id;
    config.autoRoleEnabled = true;
    saveConfig(config);

    await logAction(
      "AutoRole añadido",
      `Rol: ${role.name} (<@&${role.id}>)`,
      `<@${interaction.user.id}> (${interaction.user.username})`,
      new Date().toISOString(),
      interaction.guild
    );

    const msg = getMessage("autoRoleSet", { role: role.name }, mode);

    await interaction.reply({
      embeds: [
        buildEmbed("success", {
          title: "✅ AutoRole añadido",
          description: msg,
          fields: [
            { name: "Rol", value: `<@&${role.id}>`, inline: true },
            { name: "Total roles", value: String(config.autoRoleIds.length), inline: true },
            { name: "Configurado por", value: `<@${interaction.user.id}>`, inline: true },
          ],
          footer: new Date().toLocaleString("es-ES"),
        }),
      ],
    });

  } else if (sub === "remove") {
    const role = interaction.options.getRole("rol", true);
    const idx = config.autoRoleIds.indexOf(role.id);

    if (idx === -1) {
      await interaction.reply({
        embeds: [
          buildEmbed("error", {
            title: "❌ Rol no encontrado",
            description: `El rol <@&${role.id}> no está en la lista de autoroles.`,
            footer: new Date().toLocaleString("es-ES"),
          }),
        ],
        ephemeral: true,
      });
      return;
    }

    config.autoRoleIds.splice(idx, 1);
    if (config.autoRoleIds.length === 0) config.autoRoleEnabled = false;
    saveConfig(config);

    await logAction(
      "AutoRole eliminado",
      `Rol: ${role.name} (<@&${role.id}>)`,
      `<@${interaction.user.id}> (${interaction.user.username})`,
      new Date().toISOString(),
      interaction.guild
    );

    await interaction.reply({
      embeds: [
        buildEmbed("info", {
          title: "🗑️ AutoRole eliminado",
          description: `El rol <@&${role.id}> ha sido eliminado de la lista de autoroles.`,
          fields: [
            { name: "Roles restantes", value: String(config.autoRoleIds.length), inline: true },
          ],
          footer: new Date().toLocaleString("es-ES"),
        }),
      ],
    });

  } else if (sub === "list") {
    const roleList =
      config.autoRoleIds.length > 0
        ? config.autoRoleIds.map((id) => `<@&${id}>`).join("\n")
        : "No hay roles automáticos configurados.";

    await interaction.reply({
      embeds: [
        buildEmbed("info", {
          title: "📋 AutoRoles configurados",
          description: roleList,
          fields: [
            { name: "Estado", value: config.autoRoleEnabled ? "✅ Activo" : "🔕 Inactivo", inline: true },
          ],
          footer: new Date().toLocaleString("es-ES"),
        }),
      ],
    });

  } else if (sub === "disable") {
    config.autoRoleEnabled = false;
    saveConfig(config);

    await logAction(
      "AutoRole desactivado",
      "—",
      `<@${interaction.user.id}> (${interaction.user.username})`,
      new Date().toISOString(),
      interaction.guild
    );

    await interaction.reply({
      embeds: [
        buildEmbed("info", {
          title: "🔕 AutoRole desactivado",
          description:
            "El rol automático ha sido desactivado. Los nuevos miembros no recibirán ningún rol al unirse.",
          footer: new Date().toLocaleString("es-ES"),
        }),
      ],
    });
  }
}

// ─── /temprole handler ────────────────────────────────────────────────────────

export async function executeTempRole(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guild) {
    await interaction.reply({ content: "Este comando solo funciona en un servidor.", ephemeral: true });
    return;
  }

  const target = interaction.options.getMember("usuario") as GuildMember | null;
  const role = interaction.options.getRole("rol", true);
  const durationStr = interaction.options.getString("duracion", true);

  if (!target) {
    await interaction.reply({ content: "No se encontró al miembro.", ephemeral: true });
    return;
  }

  const durationMs = parseDuration(durationStr);
  if (durationMs === null) {
    await interaction.reply({
      embeds: [
        buildEmbed("error", {
          title: "❌ Formato inválido",
          description: "La duración debe tener el formato `1d`, `2h` o `30m`.",
        }),
      ],
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply();

  try {
    await target.roles.add(role.id, `TempRole por ${interaction.user.username} — ${durationStr}`);
  } catch {
    await interaction.editReply({
      embeds: [
        buildEmbed("error", {
          title: "❌ Sin permisos",
          description: `No tengo permisos para asignar el rol <@&${role.id}> a ${target.user.username}.`,
        }),
      ],
    });
    return;
  }

  const expiresAt = new Date(Date.now() + durationMs).toISOString();
  const id = randomUUID();

  // Persist in SQLite
  const db = getDb();
  db.prepare(
    `INSERT INTO temp_roles (id, member_id, guild_id, role_id, expires_at, active)
     VALUES (?, ?, ?, ?, ?, 1)`
  ).run(id, target.id, interaction.guild.id, role.id, expiresAt);

  // Schedule revocation
  scheduleTempRoleRevocation(
    id,
    target.id,
    interaction.guild.id,
    role.id,
    durationMs,
    interaction.guild.client
  );

  await logAction(
    "TempRole asignado",
    `<@${target.id}> (${target.user.username}) — <@&${role.id}> por ${durationStr}`,
    `<@${interaction.user.id}> (${interaction.user.username})`,
    new Date().toISOString(),
    interaction.guild
  );

  await interaction.editReply({
    embeds: [
      buildEmbed("success", {
        title: "⏳ Rol temporal asignado",
        fields: [
          { name: "Miembro", value: `<@${target.id}>`, inline: true },
          { name: "Rol", value: `<@&${role.id}>`, inline: true },
          { name: "Duración", value: durationStr, inline: true },
          { name: "Expira", value: new Date(expiresAt).toLocaleString("es-ES"), inline: true },
          { name: "Asignado por", value: `<@${interaction.user.id}>`, inline: true },
        ],
        footer: new Date().toLocaleString("es-ES"),
      }),
    ],
  });
}

// ─── TempRole revocation ──────────────────────────────────────────────────────

/**
 * Schedules automatic revocation of a temporary role after `delayMs` milliseconds.
 */
function scheduleTempRoleRevocation(
  id: string,
  memberId: string,
  guildId: string,
  roleId: string,
  delayMs: number,
  client: Client
): void {
  setTimeout(async () => {
    await revokeTempRole(id, memberId, guildId, roleId, client);
  }, delayMs);
}

async function revokeTempRole(
  id: string,
  memberId: string,
  guildId: string,
  roleId: string,
  client: Client
): Promise<void> {
  const db = getDb();

  // Mark as inactive in DB
  db.prepare(`UPDATE temp_roles SET active = 0 WHERE id = ?`).run(id);

  try {
    const guild = await client.guilds.fetch(guildId);
    const member = await guild.members.fetch(memberId).catch(() => null);

    if (member) {
      await member.roles.remove(roleId, "TempRole expirado");
    }

    await logAction(
      "TempRole revocado",
      `<@${memberId}> — <@&${roleId}>`,
      "Sistema (expiración automática)",
      new Date().toISOString(),
      guild
    );
  } catch {
    // Guild/member may no longer be accessible — fail silently
  }
}

// ─── initTempRoleScheduler ────────────────────────────────────────────────────

/**
 * On bot startup, loads all active temp_roles from SQLite and schedules
 * their revocation with setTimeout. Roles already expired are revoked immediately.
 * Requirements: 15.5, 15.6
 */
export function initTempRoleScheduler(client: Client): void {
  const db = getDb();
  const rows = db
    .prepare(`SELECT id, member_id, guild_id, role_id, expires_at FROM temp_roles WHERE active = 1`)
    .all() as { id: string; member_id: string; guild_id: string; role_id: string; expires_at: string }[];

  const now = Date.now();

  for (const row of rows) {
    const expiresAt = new Date(row.expires_at).getTime();
    const delay = Math.max(0, expiresAt - now);

    scheduleTempRoleRevocation(
      row.id,
      row.member_id,
      row.guild_id,
      row.role_id,
      delay,
      client
    );
  }
}

// ─── guildMemberAdd handler ───────────────────────────────────────────────────

/**
 * Assigns all configured AutoRoles to a new guild member.
 * Must complete within 5 seconds of the member joining (Requirement 15.1).
 * If the bot lacks permissions, notifies the configured logs channel (Requirement 15.4).
 *
 * Called from eventHandler on guildMemberAdd.
 */
export async function handleGuildMemberAdd(member: GuildMember): Promise<void> {
  const config = loadConfig(member.guild.id);

  if (!config.autoRoleEnabled) return;

  // Build list of role IDs to assign (support both legacy single-role and new multi-role)
  const roleIds: string[] = [];
  if (config.autoRoleIds && config.autoRoleIds.length > 0) {
    roleIds.push(...config.autoRoleIds);
  } else if (config.autoRoleId) {
    roleIds.push(config.autoRoleId);
  }

  if (roleIds.length === 0) return;

  for (const roleId of roleIds) {
    try {
      const assignRole = member.roles.add(roleId);
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("AutoRole assignment timed out")), 4500)
      );
      await Promise.race([assignRole, timeout]);
    } catch {
      // Bot lacks permissions or timed out — notify logs channel (Requirement 15.4)
      if (!config.logsChannelId) continue;
      try {
        const channel = await member.guild.channels.fetch(config.logsChannelId);
        if (channel && channel.isTextBased()) {
          await (channel as TextChannel).send({
            embeds: [
              buildEmbed("error", {
                title: "⚠️ AutoRole — Sin permisos",
                description: `No tengo permisos para asignar el rol <@&${roleId}> a ${member.user.username} (${member.user.id}). Verifica que el rol del bot esté por encima del AutoRole en la jerarquía de roles.`,
                footer: new Date().toLocaleString("es-ES"),
              }),
            ],
          });
        }
      } catch {
        // Logs channel also inaccessible — fail silently
      }
    }
  }
}

/**
 * Alias for handleGuildMemberAdd — used by eventHandler.ts which imports `autoRole`.
 */
export const autoRole = handleGuildMemberAdd;

/**
 * Array of commands exported for dynamic command loading.
 * Supports both /autorole and /temprole from this module.
 */
export const commands = [
  { data: autoroleCommand, execute },
  { data: temproleCommand, execute: executeTempRole },
];
