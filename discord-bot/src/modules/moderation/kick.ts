import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  GuildMember,
  type SlashCommandUserOption,
  type SlashCommandStringOption,
} from "discord.js";
import { readData } from "../../utils/dataStore.js";
import { buildEmbed } from "../../utils/embeds.js";
import { getMessage } from "../../utils/personality.js";
import { logAction } from "../admin/auditLog.js";
import { loadConfig } from "../../utils/dataStore.js";

export const data = new SlashCommandBuilder()
  .setName("kick")
  .setDescription("Expulsa a un miembro del servidor")
  .addUserOption((opt: SlashCommandUserOption) =>
    opt.setName("member").setDescription("Miembro a expulsar").setRequired(true)
  )
  .addStringOption((opt: SlashCommandStringOption) =>
    opt.setName("razon").setDescription("Razón de la expulsión").setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guild) {
    await interaction.reply({ content: "Este comando solo funciona en un servidor.", ephemeral: true });
    return;
  }

  const target = interaction.options.getMember("member") as GuildMember | null;
  const reason = interaction.options.getString("razon", true);

  if (!target) {
    await interaction.reply({ content: "No se encontró al miembro.", ephemeral: true });
    return;
  }

  // Hierarchy check
  const moderator = interaction.member as GuildMember;
  if (target.roles.highest.position >= moderator.roles.highest.position) {
    await interaction.reply({
      embeds: [
        buildEmbed("error", {
          title: "❌ Sin permisos",
          description: `No puedes expulsar a ${target.user.username} porque tiene un rol igual o superior al tuyo.`,
        }),
      ],
      ephemeral: true,
    });
    return;
  }

  // Check if target is kickable
  if (!target.kickable) {
    await interaction.reply({
      embeds: [
        buildEmbed("error", {
          title: "❌ Sin permisos",
          description: `No tengo permisos para expulsar a ${target.user.username}.`,
        }),
      ],
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply();

  const config = loadConfig(interaction.guild.id);
  const mode = config.personalityMode;

  // Notify member by DM before kicking
  const dmMsg = getMessage(
    "kick",
    {
      member: target.user.username,
      reason,
      moderator: interaction.user.username,
    },
    mode
  );

  try {
    await target.send(dmMsg);
  } catch {
    // DM may be disabled — continue with kick
  }

  // Execute kick
  await target.kick(reason);

  // Log to AuditLog
  await logAction(
    "kick",
    `<@${target.id}> (${target.user.username})`,
    `<@${interaction.user.id}> (${interaction.user.username})`,
    new Date().toISOString(),
    interaction.guild
  );

  const embed = buildEmbed("kick", {
    title: "🔌 Miembro expulsado",
    description: dmMsg,
    fields: [
      { name: "Miembro", value: `${target.user.username} (<@${target.id}>)`, inline: true },
      { name: "Razón", value: reason, inline: true },
      { name: "Moderador", value: interaction.user.username, inline: true },
    ],
    footer: new Date().toLocaleString("es-ES"),
  });

  await interaction.editReply({ embeds: [embed] });
}
