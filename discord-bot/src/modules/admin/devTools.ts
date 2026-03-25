import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  Client,
} from "discord.js";
import { EMBED_COLORS } from "../../utils/embeds.js";

const OWNER_ID = process.env["OWNER_ID"];

// ─── /eval ────────────────────────────────────────────────────────────────────

const evalCommand = new SlashCommandBuilder()
  .setName("eval")
  .setDescription("Ejecuta código JavaScript (solo owner)")
  .addStringOption((opt) =>
    opt
      .setName("codigo")
      .setDescription("Código JavaScript a ejecutar")
      .setRequired(true)
  );

// ─── /ping ────────────────────────────────────────────────────────────────────

const pingCommand = new SlashCommandBuilder()
  .setName("ping")
  .setDescription("Muestra la latencia del bot y de la API de Discord");

// ─── /invite ──────────────────────────────────────────────────────────────────

const inviteCommand = new SlashCommandBuilder()
  .setName("invite")
  .setDescription("Muestra el enlace de invitación del bot");

export const commands = [
  { data: evalCommand, execute },
  { data: pingCommand, execute },
  { data: inviteCommand, execute },
];

// ─── execute ──────────────────────────────────────────────────────────────────

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const { commandName } = interaction;

  if (commandName === "eval") {
    await handleEval(interaction);
  } else if (commandName === "ping") {
    await handlePing(interaction);
  } else if (commandName === "invite") {
    await handleInvite(interaction);
  }
}

// ─── handlers ─────────────────────────────────────────────────────────────────

/**
 * /eval — ejecuta código JS en el contexto del bot.
 * Solo disponible para el owner (OWNER_ID).
 * Requirements: 25.1
 */
async function handleEval(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!OWNER_ID || interaction.user.id !== OWNER_ID) {
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(EMBED_COLORS.error)
          .setTitle("❌ Sin permisos")
          .setDescription("Este comando solo puede ser usado por el propietario del bot."),
      ],
      ephemeral: true,
    });
    return;
  }

  const code = interaction.options.getString("codigo", true);
  await interaction.deferReply({ ephemeral: true });

  let output: string;
  let isError = false;

  try {
    // eslint-disable-next-line no-eval
    let result = eval(code);
    if (result instanceof Promise) result = await result;
    output = typeof result === "string" ? result : JSON.stringify(result, null, 2) ?? "undefined";
  } catch (err) {
    isError = true;
    output = err instanceof Error ? err.message : String(err);
  }

  const MAX_LENGTH = 1900;
  if (output.length > MAX_LENGTH) {
    output = output.slice(0, MAX_LENGTH) + "\n…(truncado)";
  }

  await interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setColor(isError ? EMBED_COLORS.error : EMBED_COLORS.success)
        .setTitle(isError ? "❌ Error de evaluación" : "✅ Resultado")
        .setDescription(`\`\`\`js\n${output}\n\`\`\``)
        .setFooter({ text: `Ejecutado por ${interaction.user.username}` })
        .setTimestamp(),
    ],
  });
}

/**
 * /ping — muestra latencia del bot y de la API de Discord.
 * Requirements: 25.2
 */
async function handlePing(interaction: ChatInputCommandInteraction): Promise<void> {
  const sent = await interaction.deferReply({ fetchReply: true });
  const botLatency = sent.createdTimestamp - interaction.createdTimestamp;
  const apiLatency = Math.round((interaction.client as Client).ws.ping);

  await interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setColor(EMBED_COLORS.info)
        .setTitle("🏓 Pong!")
        .addFields(
          { name: "Latencia del bot", value: `${botLatency}ms`, inline: true },
          { name: "Latencia de la API", value: `${apiLatency}ms`, inline: true }
        )
        .setTimestamp(),
    ],
  });
}

/**
 * /invite — muestra el enlace de invitación del bot con permisos necesarios.
 * Requirements: 25.3
 */
async function handleInvite(interaction: ChatInputCommandInteraction): Promise<void> {
  const clientId = interaction.client.user?.id;

  if (!clientId) {
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(EMBED_COLORS.error)
          .setTitle("❌ Error")
          .setDescription("No se pudo obtener el ID del bot."),
      ],
      ephemeral: true,
    });
    return;
  }

  // Permissions: Administrator (8) covers all needed permissions
  const permissions = "8";
  const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=${permissions}&scope=bot%20applications.commands`;

  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(EMBED_COLORS.info)
        .setTitle("🔗 Invitar al bot")
        .setDescription(`[Haz clic aquí para invitar al bot](${inviteUrl})`)
        .addFields({ name: "Enlace directo", value: inviteUrl })
        .setTimestamp(),
    ],
    ephemeral: true,
  });
}
