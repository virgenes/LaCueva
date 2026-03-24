import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  type SlashCommandStringOption,
} from "discord.js";
import { buildEmbed } from "../../utils/embeds.js";

const ENTERTAINMENT_COLOR = 0x9b59b6;

// ─── 8-Ball responses ─────────────────────────────────────────────────────────

export const EIGHTBALL_RESPONSES: readonly string[] = [
  // Positive
  "🟢 Sí, definitivamente.",
  "🟢 Es cierto.",
  "🟢 Sin duda alguna.",
  "🟢 Puedes contar con ello.",
  "🟢 En mi opinión, sí.",
  "🟢 Las señales apuntan a que sí.",
  "🟢 Sí.",
  "🟢 Los presagios son buenos.",
  "🟢 Muy probable.",
  "🟢 Las perspectivas son buenas.",
  // Neutral
  "🟡 Respuesta confusa, intenta de nuevo.",
  "🟡 Pregunta de nuevo más tarde.",
  "🟡 Mejor no decirte ahora.",
  "🟡 No puedo predecirlo ahora.",
  "🟡 Concéntrate y pregunta de nuevo.",
  // Negative
  "🔴 No cuentes con ello.",
  "🔴 Mi respuesta es no.",
  "🔴 Mis fuentes dicen que no.",
  "🔴 Las perspectivas no son buenas.",
  "🔴 Muy dudoso.",
] as const;

// ─── Trivia state ─────────────────────────────────────────────────────────────

interface TriviaSession {
  correctAnswer: string;
  allAnswers: string[];
}

// memberId → active session
const activeTriviaGames = new Map<string, TriviaSession>();

interface OpenTDBResponse {
  response_code: number;
  results: Array<{
    question: string;
    correct_answer: string;
    incorrect_answers: string[];
    category: string;
    difficulty: string;
  }>;
}

// ─── Command definition ───────────────────────────────────────────────────────

export const data = new SlashCommandBuilder()
  .setName("games")
  .setDescription("Juegos de entretenimiento")
  .addSubcommand((sub) =>
    sub.setName("trivia").setDescription("Responde una pregunta de trivia con 4 opciones")
  )
  .addSubcommand((sub) =>
    sub.setName("ruleta").setDescription("Juega a la ruleta rusa (probabilidad 1/6)")
  )
  .addSubcommand((sub) =>
    sub
      .setName("8ball")
      .setDescription("Consulta la bola mágica 8")
      .addStringOption((opt: SlashCommandStringOption) =>
        opt
          .setName("pregunta")
          .setDescription("Tu pregunta para la bola mágica")
          .setRequired(true)
      )
  );

// ─── Execute ──────────────────────────────────────────────────────────────────

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const sub = interaction.options.getSubcommand();

  switch (sub) {
    case "trivia":  await handleTrivia(interaction);  break;
    case "ruleta":  await handleRuleta(interaction);  break;
    case "8ball":   await handle8Ball(interaction);   break;
  }
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

async function handleTrivia(interaction: ChatInputCommandInteraction): Promise<void> {
  const memberId = interaction.user.id;

  // One game per member at a time
  if (activeTriviaGames.has(memberId)) {
    await interaction.reply({
      embeds: [
        buildEmbed("error", {
          title: "⚠️ Ya tienes una partida en curso",
          description: "Responde tu pregunta actual antes de iniciar una nueva.",
        }),
      ],
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply();

  // sendTyping while fetching
  try {
    if (interaction.channel && "sendTyping" in interaction.channel) {
      await (interaction.channel as { sendTyping(): Promise<void> }).sendTyping();
    }
  } catch {
    // ignore
  }

  try {
    const res = await fetch("https://opentdb.com/api.php?amount=1&type=multiple");

    if (!res.ok) {
      throw new Error(`OpenTDB respondió con ${res.status}`);
    }

    const json = (await res.json()) as OpenTDBResponse;

    if (json.response_code !== 0 || !json.results.length) {
      throw new Error("No se obtuvieron preguntas de la API");
    }

    const q = json.results[0]!;

    // Decode HTML entities
    const decode = (s: string) =>
      s
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&ldquo;/g, "\u201C")
        .replace(/&rdquo;/g, "\u201D");

    const question = decode(q.question);
    const correct = decode(q.correct_answer);
    const incorrect = q.incorrect_answers.map(decode);

    // Shuffle answers
    const allAnswers = [correct, ...incorrect].sort(() => Math.random() - 0.5);

    // Register session
    activeTriviaGames.set(memberId, { correctAnswer: correct, allAnswers });

    // Build buttons (max 4)
    const buttons = allAnswers.slice(0, 4).map((answer, i) =>
      new ButtonBuilder()
        .setCustomId(`trivia_${memberId}_${i}`)
        .setLabel(answer.slice(0, 80))
        .setStyle(ButtonStyle.Primary)
    );

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(buttons);

    const embed = new EmbedBuilder()
      .setColor(ENTERTAINMENT_COLOR)
      .setTitle("🧠 Trivia")
      .setDescription(`**${question}**`)
      .addFields(
        { name: "Categoría", value: decode(q.category), inline: true },
        { name: "Dificultad", value: decode(q.difficulty), inline: true }
      )
      .setFooter({ text: "Tienes 30 segundos para responder" });

    await interaction.editReply({ embeds: [embed], components: [row] });

    const message = await interaction.fetchReply();

    // Collect button interaction
    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      filter: (btn) => btn.user.id === memberId && btn.customId.startsWith(`trivia_${memberId}_`),
      time: 30_000,
      max: 1,
    });

    collector.on("collect", async (btn) => {
      activeTriviaGames.delete(memberId);

      const indexStr = btn.customId.split("_").pop();
      const index = indexStr !== undefined ? parseInt(indexStr, 10) : -1;
      const chosen = allAnswers[index] ?? "";
      const isCorrect = chosen === correct;

      const resultEmbed = new EmbedBuilder()
        .setColor(isCorrect ? 0x44ff88 : 0xff4444)
        .setTitle(isCorrect ? "✅ ¡Correcto!" : "❌ Incorrecto")
        .setDescription(
          isCorrect
            ? `¡Bien hecho, ${btn.user.username}! La respuesta era **${correct}**.`
            : `La respuesta correcta era **${correct}**, ${btn.user.username}. ¡Mejor suerte la próxima vez!`
        );

      await btn.update({ embeds: [resultEmbed], components: [] });
    });

    collector.on("end", async (collected) => {
      if (collected.size === 0) {
        // Timeout — remove session
        activeTriviaGames.delete(memberId);
        try {
          const timeoutEmbed = new EmbedBuilder()
            .setColor(0xff4444)
            .setTitle("⏰ Tiempo agotado")
            .setDescription(`Se acabó el tiempo. La respuesta correcta era **${correct}**.`);
          await interaction.editReply({ embeds: [timeoutEmbed], components: [] });
        } catch {
          // ignore
        }
      }
    });
  } catch (err) {
    activeTriviaGames.delete(memberId);
    const message = err instanceof Error ? err.message : "Error desconocido";
    await interaction.editReply({
      embeds: [
        buildEmbed("error", {
          title: "❌ Error al obtener la pregunta",
          description: `No se pudo conectar con Open Trivia DB: ${message}`,
        }),
      ],
    });
  }
}

async function handleRuleta(interaction: ChatInputCommandInteraction): Promise<void> {
  // 1/6 probability of "shot"
  const shot = Math.random() < 1 / 6;

  const embed = new EmbedBuilder().setColor(ENTERTAINMENT_COLOR);

  if (shot) {
    embed
      .setTitle("💀 ¡BANG! Game Over")
      .setDescription(
        `**${interaction.user.username}** apretó el gatillo y... 💥\n\n` +
          "El servidor ha hablado. Tu run termina aquí.\n" +
          "_Respawn en 3... 2... 1..._"
      )
      .setFooter({ text: "Probabilidad: 1/6 • Suerte la próxima vez" });
  } else {
    embed
      .setTitle("😅 *click* — Salvado")
      .setDescription(
        `**${interaction.user.username}** apretó el gatillo y... 🍀\n\n` +
          "El revólver estaba vacío. ¡Has sobrevivido esta vez!\n" +
          "_La suerte del novato sigue contigo._"
      )
      .setFooter({ text: "Probabilidad: 5/6 • ¿Te atreves de nuevo?" });
  }

  await interaction.reply({ embeds: [embed] });
}

async function handle8Ball(interaction: ChatInputCommandInteraction): Promise<void> {
  const question = interaction.options.getString("pregunta", true);
  const response = EIGHTBALL_RESPONSES[Math.floor(Math.random() * EIGHTBALL_RESPONSES.length)]!;

  const embed = new EmbedBuilder()
    .setColor(ENTERTAINMENT_COLOR)
    .setTitle("🎱 La Bola Mágica 8")
    .addFields(
      { name: "❓ Pregunta", value: question.slice(0, 1024) },
      { name: "🔮 Respuesta", value: response }
    )
    .setFooter({ text: `Consultado por ${interaction.user.username}` })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

// Export for testing
export { activeTriviaGames };
