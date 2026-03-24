import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Message,
  TextChannel,
  PermissionFlagsBits,
  type SlashCommandSubcommandBuilder,
  type SlashCommandStringOption,
} from "discord.js";
import { readData, writeData } from "../../utils/dataStore.js";
import { buildEmbed } from "../../utils/embeds.js";
import { getMessage } from "../../utils/personality.js";
import type { GuildConfig } from "../../types/index.js";

const AUTO_REPLIES_FILE = "autoReplies.json";

type AutoRepliesStore = Record<string, string>;

function loadConfig(): GuildConfig {
  return readData<GuildConfig>("config.json", {
    guildId: "",
    logsChannelId: null,
    autoRoleId: null,
    autoRoleEnabled: false,
    chatBridgeChannelId: null,
    chatBridgeReadOnly: false,
    announcementsChannelId: null,
    personalityMode: "friki",
    gifUrls: { welcome: "", ban: "", ticket: "", event: "" },
    antiSpamExemptChannels: [],
    trustedBots: [],
  });
}

function loadReplies(): AutoRepliesStore {
  return readData<AutoRepliesStore>(AUTO_REPLIES_FILE, {});
}

function saveReplies(data: AutoRepliesStore): void {
  writeData(AUTO_REPLIES_FILE, data);
}

export const data = new SlashCommandBuilder()
  .setName("autorespuesta")
  .setDescription("Gestiona las respuestas automáticas del bot")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
  .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
    sub
      .setName("add")
      .setDescription("Añade una nueva respuesta automática")
      .addStringOption((opt: SlashCommandStringOption) =>
        opt.setName("trigger").setDescription("Palabra o frase que activa la respuesta").setRequired(true)
      )
      .addStringOption((opt: SlashCommandStringOption) =>
        opt.setName("respuesta").setDescription("Texto de respuesta automática").setRequired(true)
      )
  )
  .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
    sub
      .setName("remove")
      .setDescription("Elimina una respuesta automática existente")
      .addStringOption((opt: SlashCommandStringOption) =>
        opt.setName("trigger").setDescription("Trigger a eliminar").setRequired(true)
      )
  )
  .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
    sub
      .setName("list")
      .setDescription("Lista todas las respuestas automáticas configuradas")
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const subcommand = interaction.options.getSubcommand();

  if (subcommand === "add") {
    await handleAdd(interaction);
  } else if (subcommand === "remove") {
    await handleRemove(interaction);
  } else if (subcommand === "list") {
    await handleList(interaction);
  }
}

async function handleAdd(interaction: ChatInputCommandInteraction): Promise<void> {
  const trigger = interaction.options.getString("trigger", true).toLowerCase().trim();
  const response = interaction.options.getString("respuesta", true).trim();

  const replies = loadReplies();
  replies[trigger] = response;
  saveReplies(replies);

  const config = loadConfig();
  const mode = config.personalityMode;

  const confirmMsg = getMessage(
    "autoRespuestaAdd",
    {
      member: interaction.user.username,
      trigger,
      response,
    },
    mode
  );

  await interaction.reply({
    embeds: [
      buildEmbed("success", {
        title: "✅ Auto-respuesta añadida",
        description: confirmMsg,
        fields: [
          { name: "Trigger", value: `\`${trigger}\``, inline: true },
          { name: "Respuesta", value: response, inline: true },
        ],
      }),
    ],
    ephemeral: true,
  });
}

async function handleRemove(interaction: ChatInputCommandInteraction): Promise<void> {
  const trigger = interaction.options.getString("trigger", true).toLowerCase().trim();

  const replies = loadReplies();

  if (!(trigger in replies)) {
    await interaction.reply({
      embeds: [
        buildEmbed("error", {
          title: "❌ Trigger no encontrado",
          description: `No existe ninguna auto-respuesta con el trigger \`${trigger}\`.`,
        }),
      ],
      ephemeral: true,
    });
    return;
  }

  delete replies[trigger];
  saveReplies(replies);

  const config = loadConfig();
  const mode = config.personalityMode;

  const confirmMsg = getMessage(
    "autoRespuestaRemove",
    { member: interaction.user.username, trigger },
    mode
  );

  await interaction.reply({
    embeds: [
      buildEmbed("success", {
        title: "🗑️ Auto-respuesta eliminada",
        description: confirmMsg,
        fields: [{ name: "Trigger eliminado", value: `\`${trigger}\``, inline: true }],
      }),
    ],
    ephemeral: true,
  });
}

async function handleList(interaction: ChatInputCommandInteraction): Promise<void> {
  const replies = loadReplies();
  const entries = Object.entries(replies);

  if (entries.length === 0) {
    await interaction.reply({
      embeds: [
        buildEmbed("info", {
          title: "📋 Auto-respuestas",
          description: "No hay auto-respuestas configuradas.",
        }),
      ],
      ephemeral: true,
    });
    return;
  }

  const lines = entries.map(([trigger, response]) => `\`${trigger}\` → ${response}`);

  // Discord embed description limit is 4096 chars; chunk if needed
  const description = lines.join("\n").slice(0, 4000);

  await interaction.reply({
    embeds: [
      buildEmbed("info", {
        title: `📋 Auto-respuestas (${entries.length})`,
        description,
      }),
    ],
    ephemeral: true,
  });
}

/**
 * Evaluates incoming messages against configured auto-replies.
 * Case-insensitive matching. Called from the messageCreate event handler.
 */
export async function autoReply(message: Message): Promise<void> {
  if (message.author.bot) return;
  if (!message.guild) return;

  const replies = loadReplies();
  const content = message.content.toLowerCase();

  for (const [trigger, response] of Object.entries(replies)) {
    if (content.includes(trigger)) {
      try {
        if (message.channel.isTextBased() && "send" in message.channel) {
          await (message.channel as TextChannel).send(response);
        }
      } catch {
        // Channel may be unavailable — fail silently
      }
      return; // Only fire the first matching trigger
    }
  }
}
