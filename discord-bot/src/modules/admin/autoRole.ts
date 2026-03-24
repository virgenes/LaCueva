import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  GuildMember,
  TextChannel,
  type SlashCommandRoleOption,
} from "discord.js";
import { loadConfig, saveConfig } from "../../utils/dataStore.js";import { buildEmbed } from "../../utils/embeds.js";
import { getMessage } from "../../utils/personality.js";
import { logAction } from "./auditLog.js";

/**
 * Assigns the configured AutoRole to a new guild member.
 * Called from eventHandler on guildMemberAdd.
 */
export async function autoRole(member: GuildMember): Promise<void> {
  const config = loadConfig(member.guild.id);

  if (!config.autoRoleEnabled || !config.autoRoleId) return;

  try {
    await member.roles.add(config.autoRoleId);
  } catch {
    // Bot lacks permissions — notify logs channel
    if (!config.logsChannelId) return;
    try {
      const channel = await member.guild.channels.fetch(config.logsChannelId);
      if (channel && channel.isTextBased()) {
        await (channel as TextChannel).send({
          embeds: [
            buildEmbed("error", {
              title: "⚠️ AutoRole — Sin permisos",
              description: `No tengo permisos para asignar el rol <@&${config.autoRoleId}> a ${member.user.username}. Verifica que el rol del bot esté por encima del AutoRole.`,
            }),
          ],
        });
      }
    } catch {
      // Logs channel also inaccessible — fail silently
    }
  }
}

export const data = new SlashCommandBuilder()
  .setName("autorole")
  .setDescription("Configura el rol automático para nuevos miembros")
  .addSubcommand((sub) =>
    sub
      .setName("set")
      .setDescription("Establece el rol automático")
      .addRoleOption((opt: SlashCommandRoleOption) =>
        opt.setName("rol").setDescription("Rol a asignar automáticamente").setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub.setName("disable").setDescription("Desactiva el rol automático")
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guild) {
    await interaction.reply({ content: "Este comando solo funciona en un servidor.", ephemeral: true });
    return;
  }

  const sub = interaction.options.getSubcommand();
  const config = loadConfig(interaction.guild.id);
  const mode = config.personalityMode;

  if (sub === "set") {
    const role = interaction.options.getRole("rol", true);
    config.autoRoleId = role.id;
    config.autoRoleEnabled = true;
    saveConfig(config);

    await logAction(
      "AutoRole configurado",
      `Rol: ${role.name} (<@&${role.id}>)`,
      `<@${interaction.user.id}> (${interaction.user.username})`,
      new Date().toISOString(),
      interaction.guild
    );

    const msg = getMessage("autoRoleSet", { role: role.name }, mode);
    await interaction.reply({
      embeds: [
        buildEmbed("success", {
          title: "✅ AutoRole configurado",
          description: msg,
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
          description: "El rol automático ha sido desactivado. Los nuevos miembros no recibirán ningún rol al unirse.",
        }),
      ],
    });
  }
}
