import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  ChannelType,
} from "discord.js";
import { loadConfig, saveConfig } from "../../utils/dataStore.js";
import { buildEmbed } from "../../utils/embeds.js";

// ─── Slash command definition ─────────────────────────────────────────────────

const configCommand = new SlashCommandBuilder()
  .setName("config")
  .setDescription("Gestiona la configuración del bot para este servidor")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addSubcommand((sub) =>
    sub
      .setName("prefix")
      .setDescription("Actualiza el prefijo de comandos de texto para la guild")
      .addStringOption((opt) =>
        opt
          .setName("prefijo")
          .setDescription("Nuevo prefijo (ej: !, ?, $)")
          .setRequired(true)
          .setMaxLength(5)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("modrole")
      .setDescription("Registra el rol de moderación")
      .addRoleOption((opt) =>
        opt
          .setName("rol")
          .setDescription("Rol que tendrá permisos de moderación")
          .setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("adminrole")
      .setDescription("Registra el rol de administración")
      .addRoleOption((opt) =>
        opt
          .setName("rol")
          .setDescription("Rol que tendrá permisos de administración")
          .setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("logchannel")
      .setDescription("Configura el canal de logs del AuditLog")
      .addChannelOption((opt) =>
        opt
          .setName("canal")
          .setDescription("Canal de texto donde se enviarán los logs")
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("mute_role")
      .setDescription("Registra el rol de mute")
      .addRoleOption((opt) =>
        opt
          .setName("rol")
          .setDescription("Rol que se asignará al silenciar a un miembro")
          .setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("show")
      .setDescription("Muestra la configuración actual de la guild")
  );

/** Single-command export for commandHandler compatibility (data + execute pattern). */
export const data = configCommand;

/** Array export for dynamic command loading. */
export const commands = [configCommand];

// ─── Command handler ──────────────────────────────────────────────────────────

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guild) {
    await interaction.reply({
      content: "Este comando solo funciona en un servidor.",
      ephemeral: true,
    });
    return;
  }

  const sub = interaction.options.getSubcommand();
  const config = loadConfig(interaction.guild.id);
  const timestamp = new Date().toLocaleString("es-ES");

  switch (sub) {
    case "prefix": {
      const prefix = interaction.options.getString("prefijo", true);
      config.prefix = prefix;
      saveConfig(config);

      await interaction.reply({
        embeds: [
          buildEmbed("success", {
            title: "✅ Prefijo actualizado",
            description: `El prefijo de comandos de texto ha sido actualizado.`,
            fields: [
              { name: "Nuevo prefijo", value: `\`${prefix}\``, inline: true },
              { name: "Configurado por", value: `<@${interaction.user.id}>`, inline: true },
            ],
            footer: timestamp,
          }),
        ],
      });
      break;
    }

    case "modrole": {
      const role = interaction.options.getRole("rol", true);
      config.modRoleId = role.id;
      saveConfig(config);

      await interaction.reply({
        embeds: [
          buildEmbed("success", {
            title: "✅ Rol de moderación registrado",
            description: `El rol de moderación ha sido configurado correctamente.`,
            fields: [
              { name: "Rol", value: `<@&${role.id}>`, inline: true },
              { name: "Configurado por", value: `<@${interaction.user.id}>`, inline: true },
            ],
            footer: timestamp,
          }),
        ],
      });
      break;
    }

    case "adminrole": {
      const role = interaction.options.getRole("rol", true);
      config.adminRoleId = role.id;
      saveConfig(config);

      await interaction.reply({
        embeds: [
          buildEmbed("success", {
            title: "✅ Rol de administración registrado",
            description: `El rol de administración ha sido configurado correctamente.`,
            fields: [
              { name: "Rol", value: `<@&${role.id}>`, inline: true },
              { name: "Configurado por", value: `<@${interaction.user.id}>`, inline: true },
            ],
            footer: timestamp,
          }),
        ],
      });
      break;
    }

    case "logchannel": {
      const channel = interaction.options.getChannel("canal", true);
      config.logsChannelId = channel.id;
      saveConfig(config);

      await interaction.reply({
        embeds: [
          buildEmbed("success", {
            title: "✅ Canal de logs configurado",
            description: `El canal de logs del AuditLog ha sido actualizado.`,
            fields: [
              { name: "Canal", value: `<#${channel.id}>`, inline: true },
              { name: "Configurado por", value: `<@${interaction.user.id}>`, inline: true },
            ],
            footer: timestamp,
          }),
        ],
      });
      break;
    }

    case "mute_role": {
      const role = interaction.options.getRole("rol", true);
      config.muteRoleId = role.id;
      saveConfig(config);

      await interaction.reply({
        embeds: [
          buildEmbed("success", {
            title: "✅ Rol de mute registrado",
            description: `El rol de mute ha sido configurado correctamente.`,
            fields: [
              { name: "Rol", value: `<@&${role.id}>`, inline: true },
              { name: "Configurado por", value: `<@${interaction.user.id}>`, inline: true },
            ],
            footer: timestamp,
          }),
        ],
      });
      break;
    }

    case "show": {
      const fields = [
        {
          name: "Prefijo",
          value: config.prefix ? `\`${config.prefix}\`` : "_No configurado_",
          inline: true,
        },
        {
          name: "Rol de moderación",
          value: config.modRoleId ? `<@&${config.modRoleId}>` : "_No configurado_",
          inline: true,
        },
        {
          name: "Rol de administración",
          value: config.adminRoleId ? `<@&${config.adminRoleId}>` : "_No configurado_",
          inline: true,
        },
        {
          name: "Canal de logs",
          value: config.logsChannelId ? `<#${config.logsChannelId}>` : "_No configurado_",
          inline: true,
        },
        {
          name: "Rol de mute",
          value: config.muteRoleId ? `<@&${config.muteRoleId}>` : "_No configurado_",
          inline: true,
        },
        {
          name: "AutoRole",
          value: config.autoRoleId
            ? `<@&${config.autoRoleId}> (${config.autoRoleEnabled ? "activo" : "inactivo"})`
            : "_No configurado_",
          inline: true,
        },
        {
          name: "Personalidad",
          value: config.personalityMode === "friki" ? "🎮 Friki" : "💼 Formal",
          inline: true,
        },
      ];

      await interaction.reply({
        embeds: [
          buildEmbed("info", {
            title: `⚙️ Configuración de ${interaction.guild.name}`,
            description: "Configuración actual del bot para este servidor.",
            fields,
            footer: timestamp,
          }),
        ],
        ephemeral: true,
      });
      break;
    }
  }
}
