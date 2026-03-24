import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  Message,
  TextChannel,
  PermissionFlagsBits,
  type SlashCommandSubcommandBuilder,
  type SlashCommandStringOption,
} from "discord.js";
import { readData } from "../../utils/dataStore.js";
import { buildEmbed, EMBED_COLORS } from "../../utils/embeds.js";
import { getMessage } from "../../utils/personality.js";
import type { GuildConfig } from "../../types/index.js";

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

// Numeric emoji reactions for up to 5 options
const NUMBER_EMOJIS = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣"];

// Track active polls: messageId → Set of userIds who voted
const activePolls = new Map<string, { options: string[]; votes: Map<string, number> }>();

export const data = new SlashCommandBuilder()
  .setName("poll")
  .setDescription("Gestiona encuestas en el servidor")
  .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
  .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
    sub
      .setName("create")
      .setDescription("Crea una nueva encuesta")
      .addStringOption((opt: SlashCommandStringOption) =>
        opt.setName("pregunta").setDescription("Pregunta de la encuesta").setRequired(true)
      )
      .addStringOption((opt: SlashCommandStringOption) =>
        opt.setName("opcion1").setDescription("Opción 1").setRequired(true)
      )
      .addStringOption((opt: SlashCommandStringOption) =>
        opt.setName("opcion2").setDescription("Opción 2").setRequired(true)
      )
      .addStringOption((opt: SlashCommandStringOption) =>
        opt.setName("opcion3").setDescription("Opción 3 (opcional)").setRequired(false)
      )
      .addStringOption((opt: SlashCommandStringOption) =>
        opt.setName("opcion4").setDescription("Opción 4 (opcional)").setRequired(false)
      )
      .addStringOption((opt: SlashCommandStringOption) =>
        opt.setName("opcion5").setDescription("Opción 5 (opcional)").setRequired(false)
      )
  )
  .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
    sub
      .setName("close")
      .setDescription("Cierra una encuesta y muestra los resultados")
      .addStringOption((opt: SlashCommandStringOption) =>
        opt.setName("message_id").setDescription("ID del mensaje de la encuesta").setRequired(true)
      )
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guild || !interaction.channel) {
    await interaction.reply({ content: "Este comando solo funciona en un servidor.", ephemeral: true });
    return;
  }

  const subcommand = interaction.options.getSubcommand();

  if (subcommand === "create") {
    await handleCreate(interaction);
  } else if (subcommand === "close") {
    await handleClose(interaction);
  }
}

async function handleCreate(interaction: ChatInputCommandInteraction): Promise<void> {
  const question = interaction.options.getString("pregunta", true);
  const options: string[] = [];

  for (let i = 1; i <= 5; i++) {
    const opt = interaction.options.getString(`opcion${i}`);
    if (opt) options.push(opt);
  }

  // Must have between 2 and 5 options
  if (options.length < 2) {
    await interaction.reply({
      embeds: [
        buildEmbed("error", {
          title: "❌ Opciones insuficientes",
          description: "Debes proporcionar al menos **2 opciones** para la encuesta.",
        }),
      ],
      ephemeral: true,
    });
    return;
  }

  const config = loadConfig();
  const mode = config.personalityMode;

  const optionLines = options
    .map((opt, i) => `${NUMBER_EMOJIS[i]} ${opt}`)
    .join("\n");

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.info)
    .setTitle(`📊 ${question}`)
    .setDescription(optionLines)
    .setFooter({ text: `Encuesta creada por ${interaction.user.username} • Reacciona para votar` })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });

  const pollMessage = await interaction.fetchReply() as Message;

  // Add numeric reactions
  for (let i = 0; i < options.length; i++) {
    await pollMessage.react(NUMBER_EMOJIS[i]!);
  }

  // Register poll as active
  activePolls.set(pollMessage.id, {
    options,
    votes: new Map<string, number>(),
  });

  // Set up reaction collector to enforce one vote per member
  const collector = pollMessage.createReactionCollector({
    filter: (reaction, user) => {
      if (user.bot) return false;
      const emoji = reaction.emoji.name;
      return emoji !== null && NUMBER_EMOJIS.slice(0, options.length).includes(emoji);
    },
  });

  collector.on("collect", async (reaction, user) => {
    const poll = activePolls.get(pollMessage.id);
    if (!poll) return;

    const emojiIndex = NUMBER_EMOJIS.indexOf(reaction.emoji.name ?? "");
    if (emojiIndex === -1) return;

    const previousVote = poll.votes.get(user.id);

    // Remove previous vote if exists
    if (previousVote !== undefined && previousVote !== emojiIndex) {
      const prevEmoji = NUMBER_EMOJIS[previousVote];
      if (prevEmoji) {
        const prevReaction = pollMessage.reactions.cache.find(
          (r) => r.emoji.name === prevEmoji
        );
        if (prevReaction) {
          try {
            await prevReaction.users.remove(user.id);
          } catch {
            // May fail if message was deleted
          }
        }
      }
    }

    poll.votes.set(user.id, emojiIndex);
  });

  const confirmMsg = getMessage(
    "pollCreate",
    { member: interaction.user.username, title: question },
    mode
  );

  // Send ephemeral confirmation
  try {
    await interaction.followUp({ content: confirmMsg, ephemeral: true });
  } catch {
    // Ignore if followUp fails
  }
}

async function handleClose(interaction: ChatInputCommandInteraction): Promise<void> {
  const messageId = interaction.options.getString("message_id", true);
  const channel = interaction.channel as TextChannel;

  await interaction.deferReply({ ephemeral: true });

  let pollMessage: Message;
  try {
    pollMessage = await channel.messages.fetch(messageId);
  } catch {
    await interaction.editReply({
      embeds: [
        buildEmbed("error", {
          title: "❌ Mensaje no encontrado",
          description: `No se encontró el mensaje con ID \`${messageId}\` en este canal.`,
        }),
      ],
    });
    return;
  }

  // Gather reaction counts from the message
  const reactions = pollMessage.reactions.cache;
  const optionResults: { emoji: string; count: number }[] = [];

  for (let i = 0; i < NUMBER_EMOJIS.length; i++) {
    const emoji = NUMBER_EMOJIS[i]!;
    const reaction = reactions.find((r) => r.emoji.name === emoji);
    if (!reaction) break;
    // Subtract 1 for the bot's own reaction
    const count = Math.max(0, reaction.count - 1);
    optionResults.push({ emoji, count });
  }

  if (optionResults.length === 0) {
    await interaction.editReply({
      embeds: [
        buildEmbed("error", {
          title: "❌ No es una encuesta válida",
          description: "El mensaje especificado no parece ser una encuesta activa.",
        }),
      ],
    });
    return;
  }

  const totalVotes = optionResults.reduce((sum, r) => sum + r.count, 0);

  // Get original question from embed title
  const originalEmbed = pollMessage.embeds[0];
  const question = originalEmbed?.title?.replace("📊 ", "") ?? "Encuesta";

  // Get options from the poll store or from embed description
  const pollData = activePolls.get(messageId);
  const optionNames: string[] = pollData?.options ?? [];

  // Build results description
  const resultLines = optionResults.map((r, i) => {
    const name = optionNames[i] ?? `Opción ${i + 1}`;
    const pct = totalVotes > 0 ? Math.round((r.count / totalVotes) * 100) : 0;
    const bar = buildProgressBar(pct);
    return `${r.emoji} **${name}**\n${bar} ${pct}% (${r.count} votos)`;
  });

  const resultsEmbed = new EmbedBuilder()
    .setColor(EMBED_COLORS.success)
    .setTitle(`📊 Resultados: ${question}`)
    .setDescription(resultLines.join("\n\n"))
    .addFields({ name: "Total de votos", value: String(totalVotes), inline: true })
    .setFooter({ text: `Encuesta cerrada por ${interaction.user.username}` })
    .setTimestamp();

  // Edit the original poll message with results
  try {
    await pollMessage.edit({ embeds: [resultsEmbed] });
    // Remove all reactions
    await pollMessage.reactions.removeAll();
  } catch {
    // May fail if bot lacks permissions
  }

  // Remove from active polls
  activePolls.delete(messageId);

  const config = loadConfig();
  const mode = config.personalityMode;

  const confirmMsg = getMessage(
    "pollClose",
    { title: question, member: interaction.user.username },
    mode
  );

  await interaction.editReply({ content: confirmMsg });
}

function buildProgressBar(pct: number, length = 10): string {
  const filled = Math.round((pct / 100) * length);
  return "█".repeat(filled) + "░".repeat(length - filled);
}
