import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ChannelType,
  PermissionsBitField,
  PermissionFlagsBits,
  TextChannel,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  ComponentType,
  Client,
  type GuildChannel,
  type Role,
} from "discord.js";
import { loadConfig, saveConfig } from "../../utils/dataStore.js";
import { buildEmbed } from "../../utils/embeds.js";
import { getMessage } from "../../utils/personality.js";
import { logAction } from "./auditLog.js";
import { progressBar } from "../../utils/progressBar.js";

interface ChannelPermission {
  roleId: string;
  roleName: string;
  allow: string;
  deny: string;
}

interface ChannelBackup {
  name: string;
  type: number;
  position: number;
  topic: string | null;
  parentId: string | null;
  permissions: ChannelPermission[];
}

interface RoleBackup {
  name: string;
  hexColor: string;
  hoist: boolean;
  mentionable: boolean;
  permissions: string;
  position: number;
}

export interface BackupData {
  version: 1;
  guildId: string;
  guildName: string;
  createdAt: string;
  channels: ChannelBackup[];
  roles: RoleBackup[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isValidBackup(data: unknown): data is BackupData {
  if (typeof data !== "object" || data === null) return false;
  const d = data as Record<string, unknown>;
  return (
    d["version"] === 1 &&
    typeof d["guildId"] === "string" &&
    typeof d["guildName"] === "string" &&
    typeof d["createdAt"] === "string" &&
    Array.isArray(d["channels"]) &&
    Array.isArray(d["roles"])
  );
}

async function buildBackupData(guild: import("discord.js").Guild): Promise<BackupData> {
  await guild.channels.fetch();
  const channelBackups: ChannelBackup[] = [];

  for (const [, ch] of guild.channels.cache) {
    const channel = ch as GuildChannel;
    const perms: ChannelPermission[] = [];

    for (const [, overwrite] of channel.permissionOverwrites.cache) {
      if (overwrite.type !== 0) continue;
      const role = guild.roles.cache.get(overwrite.id);
      perms.push({
        roleId: overwrite.id,
        roleName: role?.name ?? overwrite.id,
        allow: overwrite.allow.bitfield.toString(),
        deny: overwrite.deny.bitfield.toString(),
      });
    }

    channelBackups.push({
      name: channel.name,
      type: channel.type,
      position: channel.position,
      topic: (channel as TextChannel).topic ?? null,
      parentId: channel.parentId,
      permissions: perms,
    });
  }

  await guild.roles.fetch();
  const roleBackups: RoleBackup[] = [];

  for (const [, role] of guild.roles.cache) {
    if (role.managed || role.name === "@everyone") continue;
    roleBackups.push({
      name: role.name,
      hexColor: role.hexColor,
      hoist: role.hoist,
      mentionable: role.mentionable,
      permissions: role.permissions.bitfield.toString(),
      position: role.position,
    });
  }

  return {
    version: 1,
    guildId: guild.id,
    guildName: guild.name,
    createdAt: new Date().toISOString(),
    channels: channelBackups,
    roles: roleBackups,
  };
}

// ─── Command definition ───────────────────────────────────────────────────────

export const data = new SlashCommandBuilder()
  .setName("backup")
  .setDescription("Gestiona copias de seguridad del servidor")
  .setDefaultMemberPermissions(
    PermissionFlagsBits.ManageChannels | PermissionFlagsBits.ManageRoles
  )
  .addSubcommand((sub) =>
    sub.setName("create").setDescription("Exporta la estructura del servidor a un archivo JSON")
  )
  .addSubcommand((sub) =>
    sub
      .setName("restore")
      .setDescription("Restaura la estructura del servidor desde un archivo JSON adjunto")
      .addAttachmentOption((opt) =>
        opt.setName("archivo").setDescription("Archivo JSON de backup").setRequired(true)
      )
      .addBooleanOption((opt) =>
        opt
          .setName("selectivo")
          .setDescription("Mostrar menú para elegir qué canales y roles restaurar")
          .setRequired(false)
      )
  )
  .addSubcommandGroup((group) =>
    group
      .setName("schedule")
      .setDescription("Configura el backup automático programado")
      .addSubcommand((sub) =>
        sub
          .setName("set")
          .setDescription("Activa el backup automático con un intervalo y canal")
          .addIntegerOption((opt) =>
            opt
              .setName("horas")
              .setDescription("Intervalo en horas entre backups (mínimo 1)")
              .setMinValue(1)
              .setRequired(true)
          )
          .addChannelOption((opt) =>
            opt
              .setName("canal")
              .setDescription("Canal privado donde se enviarán los backups")
              .addChannelTypes(ChannelType.GuildText)
              .setRequired(true)
          )
      )
      .addSubcommand((sub) =>
        sub.setName("disable").setDescription("Desactiva el backup automático programado")
      )
  );

// ─── Execute ──────────────────────────────────────────────────────────────────

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guild) {
    await interaction.reply({ content: "Este comando solo funciona en un servidor.", ephemeral: true });
    return;
  }

  const sub = interaction.options.getSubcommand();
  const group = interaction.options.getSubcommandGroup(false);

  if (group === "schedule") {
    if (sub === "set") {
      await handleScheduleSet(interaction);
    } else if (sub === "disable") {
      await handleScheduleDisable(interaction);
    }
    return;
  }

  if (sub === "create") {
    await handleCreate(interaction);
  } else if (sub === "restore") {
    await handleRestore(interaction);
  }
}

// ─── /backup create ───────────────────────────────────────────────────────────

async function handleCreate(interaction: ChatInputCommandInteraction): Promise<void> {
  const guild = interaction.guild!;
  await interaction.deferReply({ ephemeral: true });

  const STAGES = 3;

  await interaction.editReply({
    embeds: [
      buildEmbed("info", {
        title: "💾 Creando backup…",
        description: `**Etapa 1/3 — Exportando canales**\n${progressBar(1, STAGES)}`,
      }),
    ],
  });

  await interaction.editReply({
    embeds: [
      buildEmbed("info", {
        title: "💾 Creando backup…",
        description: `**Etapa 2/3 — Exportando roles**\n${progressBar(2, STAGES)}`,
      }),
    ],
  });

  await interaction.editReply({
    embeds: [
      buildEmbed("info", {
        title: "💾 Creando backup…",
        description: `**Etapa 3/3 — Finalizando permisos**\n${progressBar(3, STAGES)}`,
      }),
    ],
  });

  const backup = await buildBackupData(guild);
  const json = JSON.stringify(backup, null, 2);
  const buffer = Buffer.from(json, "utf-8");

  try {
    await interaction.user.send({
      content: `📦 Backup de **${guild.name}** creado el ${new Date().toLocaleString("es-ES")}`,
      files: [{ attachment: buffer, name: `backup-${guild.id}-${Date.now()}.json` }],
    });
  } catch {
    await interaction.editReply({
      embeds: [
        buildEmbed("error", {
          title: "❌ No se pudo enviar el backup",
          description: "No pude enviarte el archivo por DM. Asegúrate de tener los mensajes directos habilitados.",
        }),
      ],
    });
    return;
  }

  const config = loadConfig(guild.id);
  const mode = config.personalityMode;
  const msg = getMessage("backupCreate", { member: interaction.user.username }, mode);

  await logAction(
    "Backup creado",
    guild.name,
    `<@${interaction.user.id}> (${interaction.user.username})`,
    new Date().toISOString(),
    guild
  );

  await interaction.editReply({
    embeds: [
      buildEmbed("success", {
        title: "✅ Backup completado",
        description: `${msg}\n\nEl archivo JSON ha sido enviado a tu DM.`,
      }),
    ],
  });
}

// ─── /backup restore ──────────────────────────────────────────────────────────

async function handleRestore(interaction: ChatInputCommandInteraction): Promise<void> {
  const guild = interaction.guild!;
  await interaction.deferReply({ ephemeral: true });

  const attachment = interaction.options.getAttachment("archivo", true);
  const selectivo = interaction.options.getBoolean("selectivo") ?? false;

  let backup: BackupData;
  try {
    const res = await fetch(attachment.url);
    const raw = await res.text();
    const parsed: unknown = JSON.parse(raw);
    if (!isValidBackup(parsed)) throw new Error("Schema inválido");
    backup = parsed;
  } catch {
    await interaction.editReply({
      embeds: [
        buildEmbed("error", {
          title: "❌ Archivo inválido",
          description: "El archivo proporcionado no es un JSON válido generado por este bot. Verifica que sea un backup creado con `/backup create`.",
        }),
      ],
    });
    return;
  }

  // ── Modo selectivo: mostrar menú de selección ──────────────────────────────
  if (selectivo) {
    const channelOptions = backup.channels.slice(0, 25).map((ch) => ({
      label: `#${ch.name}`,
      value: `channel:${ch.name}`,
      description: ch.type === ChannelType.GuildCategory ? "Categoría" : "Canal",
    }));

    const roleOptions = backup.roles.slice(0, 25).map((r) => ({
      label: `@${r.name}`,
      value: `role:${r.name}`,
    }));

    const allOptions = [...channelOptions, ...roleOptions].slice(0, 25);

    if (allOptions.length === 0) {
      await interaction.editReply({
        embeds: [buildEmbed("error", { title: "❌ Backup vacío", description: "El backup no contiene canales ni roles para restaurar." })],
      });
      return;
    }

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("backup_selective")
      .setPlaceholder("Selecciona los elementos a restaurar")
      .setMinValues(1)
      .setMaxValues(allOptions.length)
      .addOptions(allOptions);

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

    await interaction.editReply({
      embeds: [
        buildEmbed("info", {
          title: "🔍 Restauración selectiva",
          description: "Selecciona los canales y roles que deseas restaurar del backup.",
        }),
      ],
      components: [row],
    });

    let menuInteraction: StringSelectMenuInteraction;
    try {
      menuInteraction = await interaction.channel!.awaitMessageComponent({
        componentType: ComponentType.StringSelect,
        filter: (i) => i.customId === "backup_selective" && i.user.id === interaction.user.id,
        time: 60_000,
      });
    } catch {
      await interaction.editReply({
        embeds: [buildEmbed("error", { title: "⏰ Tiempo agotado", description: "No se recibió selección en 60 segundos." })],
        components: [],
      });
      return;
    }

    await menuInteraction.deferUpdate();

    const selected = menuInteraction.values;
    const selectedChannelNames = new Set(
      selected.filter((v) => v.startsWith("channel:")).map((v) => v.slice(8))
    );
    const selectedRoleNames = new Set(
      selected.filter((v) => v.startsWith("role:")).map((v) => v.slice(5))
    );

    backup = {
      ...backup,
      channels: backup.channels.filter((ch) => selectedChannelNames.has(ch.name)),
      roles: backup.roles.filter((r) => selectedRoleNames.has(r.name)),
    };
  }

  // ── Restaurar roles ────────────────────────────────────────────────────────
  const existingRoleNames = new Set(guild.roles.cache.map((r: Role) => r.name.toLowerCase()));

  for (const roleData of backup.roles) {
    if (existingRoleNames.has(roleData.name.toLowerCase())) continue;
    try {
      await guild.roles.create({
        name: roleData.name,
        color: roleData.hexColor as `#${string}`,
        hoist: roleData.hoist,
        mentionable: roleData.mentionable,
        permissions: new PermissionsBitField(BigInt(roleData.permissions)),
      });
    } catch {
      // Skip roles that can't be created
    }
  }

  // ── Restaurar canales ──────────────────────────────────────────────────────
  const existingChannelNames = new Set(guild.channels.cache.map((c) => c.name.toLowerCase()));

  for (const chData of backup.channels) {
    if (existingChannelNames.has(chData.name.toLowerCase())) continue;
    try {
      if (chData.type === ChannelType.GuildCategory) {
        await guild.channels.create({ name: chData.name, type: ChannelType.GuildCategory, position: chData.position });
      } else if (chData.type === ChannelType.GuildText) {
        await guild.channels.create({ name: chData.name, type: ChannelType.GuildText, topic: chData.topic ?? undefined, position: chData.position });
      } else if (chData.type === ChannelType.GuildVoice) {
        await guild.channels.create({ name: chData.name, type: ChannelType.GuildVoice, position: chData.position });
      }
    } catch {
      // Skip channels that can't be created
    }
  }

  const config = loadConfig(guild.id);
  const mode = config.personalityMode;
  const msg = getMessage("backupRestore", { member: interaction.user.username }, mode);

  await logAction(
    "Backup restaurado",
    backup.guildName,
    `<@${interaction.user.id}> (${interaction.user.username})`,
    new Date().toISOString(),
    guild
  );

  await interaction.editReply({
    embeds: [
      buildEmbed("success", {
        title: "✅ Restauración completada",
        description: msg,
      }),
    ],
    components: [],
  });
}

// ─── /backup schedule set ─────────────────────────────────────────────────────

async function handleScheduleSet(interaction: ChatInputCommandInteraction): Promise<void> {
  const guild = interaction.guild!;
  await interaction.deferReply({ ephemeral: true });

  const hours = interaction.options.getInteger("horas", true);
  const channel = interaction.options.getChannel("canal", true);

  const config = loadConfig(guild.id);
  config.backupSchedule = { enabled: true, intervalHours: hours, channelId: channel.id };
  saveConfig(config);

  // Restart scheduler for this guild
  restartScheduler(guild.id, hours, channel.id, interaction.client);

  await interaction.editReply({
    embeds: [
      buildEmbed("success", {
        title: "✅ Backup automático configurado",
        description: `Se realizará un backup cada **${hours} hora(s)** y se enviará a <#${channel.id}>.`,
      }),
    ],
  });
}

// ─── /backup schedule disable ─────────────────────────────────────────────────

async function handleScheduleDisable(interaction: ChatInputCommandInteraction): Promise<void> {
  const guild = interaction.guild!;
  await interaction.deferReply({ ephemeral: true });

  const config = loadConfig(guild.id);
  config.backupSchedule = { enabled: false, intervalHours: 0, channelId: "" };
  saveConfig(config);

  clearScheduler(guild.id);

  await interaction.editReply({
    embeds: [
      buildEmbed("success", {
        title: "✅ Backup automático desactivado",
        description: "El backup automático ha sido desactivado.",
      }),
    ],
  });
}

// ─── Scheduler ────────────────────────────────────────────────────────────────

const schedulerTimers = new Map<string, ReturnType<typeof setInterval>>();

function clearScheduler(guildId: string): void {
  const existing = schedulerTimers.get(guildId);
  if (existing) {
    clearInterval(existing);
    schedulerTimers.delete(guildId);
  }
}

function restartScheduler(guildId: string, intervalHours: number, channelId: string, client: Client): void {
  clearScheduler(guildId);

  const ms = intervalHours * 60 * 60 * 1000;

  const timer = setInterval(async () => {
    try {
      const guild = await client.guilds.fetch(guildId);
      const backup = await buildBackupData(guild);
      const json = JSON.stringify(backup, null, 2);
      const buffer = Buffer.from(json, "utf-8");

      const channel = await client.channels.fetch(channelId);
      if (!channel || !channel.isTextBased()) return;

      await (channel as TextChannel).send({
        content: `📦 Backup automático de **${guild.name}** — ${new Date().toLocaleString("es-ES")}`,
        files: [{ attachment: buffer, name: `backup-${guildId}-${Date.now()}.json` }],
      });
    } catch (err) {
      console.error(`[backup] Error en backup automático para guild ${guildId}:`, err);
    }
  }, ms);

  schedulerTimers.set(guildId, timer);
}

/**
 * Inicializa los schedulers de backup automático para todos los guilds configurados.
 * Debe llamarse al arrancar el bot.
 */
export function initBackupScheduler(client: Client): void {
  client.once("ready", async () => {
    for (const [guildId, guild] of client.guilds.cache) {
      try {
        const config = loadConfig(guildId);
        const schedule = config.backupSchedule;
        if (schedule?.enabled && schedule.intervalHours > 0 && schedule.channelId) {
          restartScheduler(guildId, schedule.intervalHours, schedule.channelId, client);
          console.log(`[backup] Scheduler iniciado para guild ${guild.name} cada ${schedule.intervalHours}h`);
        }
      } catch (err) {
        console.error(`[backup] Error al iniciar scheduler para guild ${guildId}:`, err);
      }
    }
  });
}
