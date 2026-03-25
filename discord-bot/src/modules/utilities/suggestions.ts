import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  TextChannel,
  type SlashCommandSubcommandBuilder,
  type SlashCommandStringOption,
  type SlashCommandUserOption,
} from "discord.js";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "../../utils/database.js";
import { loadConfig } from "../../utils/dataStore.js";
import { EMBED_COLORS } from "../../utils/embeds.js";

// ─── DB helpers ───────────────────────────────────────────────────────────────

interface SuggestionRow {
  id: string;
  guild_id: string;
  author_id: string;
  content: string;
  message_id: string | null;
  channel_id: string | null;
  status: "pending" | "approved" | "denied";
  timestamp: string;
}

function getSuggestion(id: string, guildId: string): SuggestionRow | undefined {
  const db = getDb();
  return db
    .prepare("SELECT * FROM suggestions WHERE id = ? AND guild_id = ?")
    .get(id, guildId) as SuggestionRow | undefined;
}

function insertSuggestion(row: SuggestionRow): void {
  const db = getDb();
  db.prepare(
    `INSERT INTO suggestions (id, guild_id, author_id, content, message_id, channel_id, status, timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    row.id,
    row.guild_id,
    row.author_id,
    row.content,
    row.message_id,
    row.channel_id,
    row.status,
    row.timestamp
  );
}

function updateSuggestionStatus(
  id: string,
  guildId: string,
  status: "approved" | "denied"
): void {
  const db = getDb();
  db.prepare(
    "UPDATE suggestions SET status = ? WHERE id = ? AND guild_id = ?"
  ).run(status, id, guildId);
}

// ─── Embed builders ───────────────────────────────────────────────────────────

function buildSuggestionEmbed(
  content: string,
  authorTag: string,
  id: string,
  status: "pending" | "approved" | "denied"
): EmbedBuilder {
  const statusLabel =
    status === "approved"
      ? "✅ Aprobada"
      : status === "denied"
      ? "❌ Denegada"
      : "⏳ Pendiente";

  const color =
    status === "approved"
      ? EMBED_COLORS.success
      : status === "denied"
      ? EMBED_COLORS.error
      : EMBED_COLORS.info;

  return new EmbedBuilder()
    .setColor(color)
    .setTitle("💡 Sugerencia")
    .setDescription(content)
    .addFields(
      { name: "Estado", value: statusLabel, inline: true },
      { name: "ID", value: `\`${id}\``, inline: true },
      { name: "Enviada por", value: authorTag, inline: true }
    )
    .setTimestamp();
}

// ─── Command definition ───────────────────────────────────────────────────────

export const data = new SlashCommandBuilder()
  .setName("suggest")
  .setDescription("Sistema de sugerencias del servidor")
  .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
    sub
      .setName("new")
      .setDescription("Envía una sugerencia al canal de sugerencias")
      .addStringOption((opt: SlashCommandStringOption) =>
        opt
          .setName("texto")
          .setDescription("Texto de la sugerencia")
          .setRequired(true)
          .setMaxLength(1000)
      )
  )
  .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
    sub
      .setName("approve")
      .setDescription("Aprueba una sugerencia (solo moderadores)")
      .addStringOption((opt: SlashCommandStringOption) =>
        opt
          .setName("id")
          .setDescription("ID de la sugerencia")
          .setRequired(true)
      )
  )
  .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
    sub
      .setName("deny")
      .setDescription("Deniega una sugerencia (solo moderadores)")
      .addStringOption((opt: SlashCommandStringOption) =>
        opt
          .setName("id")
          .setDescription("ID de la sugerencia")
          .setRequired(true)
      )
  );

// ─── Execute ──────────────────────────────────────────────────────────────────

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guild) {
    await interaction.reply({
      content: "Este comando solo funciona en un servidor.",
      ephemeral: true,
    });
    return;
  }

  const sub = interaction.options.getSubcommand();

  if (sub === "new") {
    await handleNew(interaction);
  } else if (sub === "approve") {
    await handleReview(interaction, "approved");
  } else if (sub === "deny") {
    await handleReview(interaction, "denied");
  }
}

// ─── /suggest new ─────────────────────────────────────────────────────────────

async function handleNew(interaction: ChatInputCommandInteraction): Promise<void> {
  const content = interaction.options.getString("texto", true);
  const config = loadConfig(interaction.guild!.id);

  if (!config.suggestionsChannelId) {
    await interaction.reply({
      content:
        "❌ No hay un canal de sugerencias configurado. Pide a un administrador que configure `suggestionsChannelId`.",
      ephemeral: true,
    });
    return;
  }

  let suggestionsChannel: TextChannel;
  try {
    const ch = await interaction.guild!.channels.fetch(config.suggestionsChannelId);
    if (!ch || ch.type !== 0 /* GuildText */) throw new Error("not a text channel");
    suggestionsChannel = ch as TextChannel;
  } catch {
    await interaction.reply({
      content: "❌ No se pudo acceder al canal de sugerencias.",
      ephemeral: true,
    });
    return;
  }

  const id = uuidv4().split("-")[0]!; // short 8-char id for readability
  const timestamp = new Date().toISOString();
  const authorTag = interaction.user.tag ?? interaction.user.username;

  const embed = buildSuggestionEmbed(content, authorTag, id, "pending");

  await interaction.deferReply({ ephemeral: true });

  let postedMessage;
  try {
    postedMessage = await suggestionsChannel.send({ embeds: [embed] });
    await postedMessage.react("👍");
    await postedMessage.react("👎");
  } catch {
    await interaction.editReply({
      content: "❌ No se pudo publicar la sugerencia en el canal configurado.",
    });
    return;
  }

  insertSuggestion({
    id,
    guild_id: interaction.guild!.id,
    author_id: interaction.user.id,
    content,
    message_id: postedMessage.id,
    channel_id: suggestionsChannel.id,
    status: "pending",
    timestamp,
  });

  await interaction.editReply({
    content: `✅ Tu sugerencia ha sido enviada al canal <#${suggestionsChannel.id}>. ID: \`${id}\``,
  });
}

// ─── /suggest approve | deny ──────────────────────────────────────────────────

async function handleReview(
  interaction: ChatInputCommandInteraction,
  newStatus: "approved" | "denied"
): Promise<void> {
  // Moderator-only check
  const member = interaction.guild!.members.cache.get(interaction.user.id);
  if (!member?.permissions.has(PermissionFlagsBits.ModerateMembers)) {
    await interaction.reply({
      content: "❌ Solo los moderadores pueden aprobar o denegar sugerencias.",
      ephemeral: true,
    });
    return;
  }

  const id = interaction.options.getString("id", true).trim();
  const suggestion = getSuggestion(id, interaction.guild!.id);

  if (!suggestion) {
    await interaction.reply({
      content: `❌ No se encontró ninguna sugerencia con ID \`${id}\` en este servidor.`,
      ephemeral: true,
    });
    return;
  }

  if (suggestion.status !== "pending") {
    await interaction.reply({
      content: `❌ Esta sugerencia ya fue **${suggestion.status === "approved" ? "aprobada" : "denegada"}**.`,
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  // Update DB
  updateSuggestionStatus(id, interaction.guild!.id, newStatus);

  // Edit the original embed in the suggestions channel
  if (suggestion.channel_id && suggestion.message_id) {
    try {
      const ch = await interaction.guild!.channels.fetch(suggestion.channel_id);
      if (ch && ch.type === 0) {
        const textCh = ch as TextChannel;
        const msg = await textCh.messages.fetch(suggestion.message_id);
        const updatedEmbed = buildSuggestionEmbed(
          suggestion.content,
          `<@${suggestion.author_id}>`,
          id,
          newStatus
        );
        await msg.edit({ embeds: [updatedEmbed] });
      }
    } catch {
      // Message may have been deleted — continue
    }
  }

  // Notify author by DM
  try {
    const author = await interaction.guild!.members.fetch(suggestion.author_id);
    const statusText = newStatus === "approved" ? "✅ aprobada" : "❌ denegada";
    const dmEmbed = new EmbedBuilder()
      .setColor(newStatus === "approved" ? EMBED_COLORS.success : EMBED_COLORS.error)
      .setTitle(`Tu sugerencia ha sido ${statusText}`)
      .setDescription(suggestion.content)
      .addFields({ name: "ID", value: `\`${id}\``, inline: true })
      .setTimestamp();

    await author.send({ embeds: [dmEmbed] });
  } catch {
    // DM disabled — fail silently
  }

  const label = newStatus === "approved" ? "aprobada ✅" : "denegada ❌";
  await interaction.editReply({
    content: `✅ Sugerencia \`${id}\` ${label} correctamente.`,
  });
}

// ─── /report command ──────────────────────────────────────────────────────────

export const reportData = new SlashCommandBuilder()
  .setName("report")
  .setDescription("Reporta a un usuario de forma anónima al staff")
  .addUserOption((opt: SlashCommandUserOption) =>
    opt
      .setName("usuario")
      .setDescription("Usuario a reportar")
      .setRequired(true)
  )
  .addStringOption((opt: SlashCommandStringOption) =>
    opt
      .setName("razon")
      .setDescription("Razón del reporte")
      .setRequired(true)
      .setMaxLength(1000)
  );

export async function reportExecute(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  if (!interaction.guild) {
    await interaction.reply({
      content: "Este comando solo funciona en un servidor.",
      ephemeral: true,
    });
    return;
  }

  const config = loadConfig(interaction.guild.id);

  if (!config.staffChannelId) {
    await interaction.reply({
      content:
        "❌ No hay un canal de staff configurado. Pide a un administrador que configure `staffChannelId`.",
      ephemeral: true,
    });
    return;
  }

  let staffChannel: TextChannel;
  try {
    const ch = await interaction.guild.channels.fetch(config.staffChannelId);
    if (!ch || ch.type !== 0) throw new Error("not a text channel");
    staffChannel = ch as TextChannel;
  } catch {
    await interaction.reply({
      content: "❌ No se pudo acceder al canal de staff.",
      ephemeral: true,
    });
    return;
  }

  const reportedUser = interaction.options.getUser("usuario", true);
  const reason = interaction.options.getString("razon", true);

  // Anonymous embed — does NOT include reporter identity
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.warn)
    .setTitle("🚨 Nuevo reporte anónimo")
    .addFields(
      { name: "Usuario reportado", value: `<@${reportedUser.id}> (${reportedUser.tag ?? reportedUser.username})`, inline: false },
      { name: "Razón", value: reason, inline: false }
    )
    .setTimestamp();

  await interaction.deferReply({ ephemeral: true });

  try {
    await staffChannel.send({ embeds: [embed] });
  } catch {
    await interaction.editReply({
      content: "❌ No se pudo enviar el reporte al canal de staff.",
    });
    return;
  }

  await interaction.editReply({
    content: "✅ Tu reporte ha sido enviado al staff de forma anónima.",
  });
}
