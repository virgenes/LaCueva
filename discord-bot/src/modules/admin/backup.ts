import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ChannelType,
  PermissionsBitField,
  TextChannel,
  type GuildChannel,
  type Role,
} from "discord.js";
import { loadConfig } from "../../utils/dataStore.js";
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
  color: number;
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

// ─── Command definition ───────────────────────────────────────────────────────

export const data = new SlashCommandBuilder()
  .setName("backup")
  .setDescription("Gestiona copias de seguridad del servidor")
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
  );

// ─── Execute ──────────────────────────────────────────────────────────────────

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guild) {
    await interaction.reply({ content: "Este comando solo funciona en un servidor.", ephemeral: true });
    return;
  }

  const sub = interaction.options.getSubcommand();

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

  // Stage 1 — channels
  await interaction.editReply({
    embeds: [
      buildEmbed("info", {
        title: "💾 Creando backup…",
        description: `**Etapa 1/3 — Exportando canales**\n${progressBar(1, STAGES)}`,
      }),
    ],
  });

  await guild.channels.fetch();
  const channelBackups: ChannelBackup[] = [];

  for (const [, ch] of guild.channels.cache) {
    const channel = ch as GuildChannel;
    const perms: ChannelPermission[] = [];

    for (const [, overwrite] of channel.permissionOverwrites.cache) {
      if (overwrite.type !== 0) continue; // only role overwrites
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

  // Stage 2 — roles
  await interaction.editReply({
    embeds: [
      buildEmbed("info", {
        title: "💾 Creando backup…",
        description: `**Etapa 2/3 — Exportando roles**\n${progressBar(2, STAGES)}`,
      }),
    ],
  });

  await guild.roles.fetch();
  const roleBackups: RoleBackup[] = [];

  for (const [, role] of guild.roles.cache) {
    if (role.managed || role.name === "@everyone") continue;
    roleBackups.push({
      name: role.name,
      color: role.color,
      hoist: role.hoist,
      mentionable: role.mentionable,
      permissions: role.permissions.bitfield.toString(),
      position: role.position,
    });
  }

  // Stage 3 — permissions (already collected per channel above)
  await interaction.editReply({
    embeds: [
      buildEmbed("info", {
        title: "💾 Creando backup…",
        description: `**Etapa 3/3 — Finalizando permisos**\n${progressBar(3, STAGES)}`,
      }),
    ],
  });

  const backup: BackupData = {
    version: 1,
    guildId: guild.id,
    guildName: guild.name,
    createdAt: new Date().toISOString(),
    channels: channelBackups,
    roles: roleBackups,
  };

  const json = JSON.stringify(backup, null, 2);
  const buffer = Buffer.from(json, "utf-8");

  // Send JSON by DM to the moderator
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

  // Fetch and parse JSON
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

  // Restore roles (skip @everyone and already-existing names)
  const existingRoleNames = new Set(guild.roles.cache.map((r: Role) => r.name.toLowerCase()));

  for (const roleData of backup.roles) {
    if (existingRoleNames.has(roleData.name.toLowerCase())) continue;
    try {
      await guild.roles.create({
        name: roleData.name,
        color: roleData.color,
        hoist: roleData.hoist,
        mentionable: roleData.mentionable,
        permissions: new PermissionsBitField(BigInt(roleData.permissions)),
      });
    } catch {
      // Skip roles that can't be created
    }
  }

  // Restore channels (skip already-existing names)
  const existingChannelNames = new Set(guild.channels.cache.map((c) => c.name.toLowerCase()));

  for (const chData of backup.channels) {
    if (existingChannelNames.has(chData.name.toLowerCase())) continue;
    try {
      if (chData.type === ChannelType.GuildCategory) {
        await guild.channels.create({
          name: chData.name,
          type: ChannelType.GuildCategory,
          position: chData.position,
        });
      } else if (chData.type === ChannelType.GuildText) {
        await guild.channels.create({
          name: chData.name,
          type: ChannelType.GuildText,
          topic: chData.topic ?? undefined,
          position: chData.position,
        });
      } else if (chData.type === ChannelType.GuildVoice) {
        await guild.channels.create({
          name: chData.name,
          type: ChannelType.GuildVoice,
          position: chData.position,
        });
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
  });
}
