import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  type SlashCommandChannelOption,
  ChannelType,
} from "discord.js";
import { loadConfig, saveConfig } from "../../utils/dataStore.js";
import { buildEmbed } from "../../utils/embeds.js";
import { getMessage } from "../../utils/personality.js";
import { logAction } from "./auditLog.js";

export const data = new SlashCommandBuilder()
  .setName("logs")
  .setDescription("Configura el canal de logs del bot")
  .addSubcommand((sub) =>
    sub
      .setName("set")
      .setDescription("Establece el canal de logs")
      .addChannelOption((opt: SlashCommandChannelOption) =>
        opt
          .setName("canal")
          .setDescription("Canal de texto donde se registrarán las acciones")
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(true)
      )
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guild) {
    await interaction.reply({ content: "Este comando solo funciona en un servidor.", ephemeral: true });
    return;
  }

  const sub = interaction.options.getSubcommand();

  if (sub === "set") {
    const channel = interaction.options.getChannel("canal", true);
    const config = loadConfig(interaction.guild.id);
    config.logsChannelId = channel.id;
    saveConfig(config);

    const mode = config.personalityMode;    const msg = getMessage(
      "logsSet",
      { channel: `<#${channel.id}>`, member: interaction.user.username },
      mode
    );

    await logAction(
      "Canal de logs configurado",
      `<#${channel.id}>`,
      `<@${interaction.user.id}> (${interaction.user.username})`,
      new Date().toISOString(),
      interaction.guild
    );

    await interaction.reply({
      embeds: [
        buildEmbed("success", {
          title: "✅ Canal de logs configurado",
          description: msg,
        }),
      ],
    });
  }
}
