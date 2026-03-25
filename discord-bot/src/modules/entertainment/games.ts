import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  type SlashCommandStringOption,
  type ButtonInteraction,
} from "discord.js";
import { buildEmbed } from "../../utils/embeds.js";
import { getDb } from "../../utils/database.js";
import { getBalance, deductBalance, addBalance } from "../economy/economy.js";

const ENTERTAINMENT_COLOR = 0x9b59b6;

// ─── 8-Ball responses ─────────────────────────────────────────────────────────

export const EIGHTBALL_RESPONSES: readonly string[] = [
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
  "🟡 Respuesta confusa, intenta de nuevo.",
  "🟡 Pregunta de nuevo más tarde.",
  "🟡 Mejor no decirte ahora.",
  "🟡 No puedo predecirlo ahora.",
  "🟡 Concéntrate y pregunta de nuevo.",
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

// ─── Blackjack helpers ────────────────────────────────────────────────────────

const SUITS = ["♠", "♥", "♦", "♣"] as const;
const RANKS = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"] as const;

type Card = { rank: typeof RANKS[number]; suit: typeof SUITS[number] };

function buildDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ rank, suit });
    }
  }
  return deck;
}

function shuffleDeck(deck: Card[]): Card[] {
  const d = [...deck];
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j]!, d[i]!];
  }
  return d;
}

function cardValue(rank: typeof RANKS[number]): number {
  if (["J", "Q", "K"].includes(rank)) return 10;
  if (rank === "A") return 11;
  return parseInt(rank, 10);
}

function handValue(hand: Card[]): number {
  let total = hand.reduce((sum, c) => sum + cardValue(c.rank), 0);
  let aces = hand.filter((c) => c.rank === "A").length;
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
}

function formatHand(hand: Card[]): string {
  return hand.map((c) => `${c.rank}${c.suit}`).join("  ");
}

interface BlackjackSession {
  deck: Card[];
  playerHand: Card[];
  dealerHand: Card[];
  bet: number;
  guildId: string;
}

const activeBlackjackGames = new Map<string, BlackjackSession>();

// ─── TicTacToe helpers ────────────────────────────────────────────────────────

type TTTCell = "X" | "O" | null;

interface TicTacToeSession {
  board: TTTCell[];
  currentTurn: string; // userId
  playerX: string;
  playerO: string;
  guildId: string;
}

const activeTTTGames = new Map<string, TicTacToeSession>();

function checkTTTWinner(board: TTTCell[]): TTTCell {
  const lines = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6],
  ];
  for (const [a,b,c] of lines) {
    if (board[a!] && board[a!] === board[b!] && board[a!] === board[c!]) {
      return board[a!]!;
    }
  }
  return null;
}

function buildTTTRows(board: TTTCell[], gameId: string, disabled = false): ActionRowBuilder<ButtonBuilder>[] {
  const rows: ActionRowBuilder<ButtonBuilder>[] = [];
  for (let r = 0; r < 3; r++) {
    const row = new ActionRowBuilder<ButtonBuilder>();
    for (let c = 0; c < 3; c++) {
      const idx = r * 3 + c;
      const cell = board[idx];
      const btn = new ButtonBuilder()
        .setCustomId(`ttt_${gameId}_${idx}`)
        .setLabel(cell ?? "·")
        .setStyle(cell === "X" ? ButtonStyle.Danger : cell === "O" ? ButtonStyle.Primary : ButtonStyle.Secondary)
        .setDisabled(disabled || cell !== null);
      row.addComponents(btn);
    }
    rows.push(row);
  }
  return rows;
}

// ─── Hangman helpers ──────────────────────────────────────────────────────────

const HANGMAN_WORDS = [
  "mariposa","elefante","computadora","programacion","javascript",
  "videojuego","aventura","misterio","galaxia","universo",
  "chocolate","biblioteca","dinosaurio","fotografia","musica",
  "arquitectura","matematicas","filosofia","tecnologia","naturaleza",
  "fantasia","laberinto","personaje","estrategia","creatividad",
] as const;

const HANGMAN_STAGES = [
  "```\n  +---+\n  |   |\n      |\n      |\n      |\n      |\n=========```",
  "```\n  +---+\n  |   |\n  O   |\n      |\n      |\n      |\n=========```",
  "```\n  +---+\n  |   |\n  O   |\n  |   |\n      |\n      |\n=========```",
  "```\n  +---+\n  |   |\n  O   |\n /|   |\n      |\n      |\n=========```",
  "```\n  +---+\n  |   |\n  O   |\n /|\\  |\n      |\n      |\n=========```",
  "```\n  +---+\n  |   |\n  O   |\n /|\\  |\n /    |\n      |\n=========```",
  "```\n  +---+\n  |   |\n  O   |\n /|\\  |\n / \\  |\n      |\n=========```",
];

interface HangmanSession {
  word: string;
  guessed: Set<string>;
  wrongGuesses: number;
  maxWrong: number;
}

const activeHangmanGames = new Map<string, HangmanSession>();

function buildHangmanEmbed(session: HangmanSession, userId: string): EmbedBuilder {
  const { word, guessed, wrongGuesses, maxWrong } = session;
  const display = word.split("").map((l) => (guessed.has(l) ? l : "_")).join(" ");
  const wrongLetters = [...guessed].filter((l) => !word.includes(l));
  const remaining = maxWrong - wrongGuesses;

  return new EmbedBuilder()
    .setColor(remaining <= 2 ? 0xff4444 : ENTERTAINMENT_COLOR)
    .setTitle("🪢 Ahorcado")
    .setDescription(
      `${HANGMAN_STAGES[wrongGuesses] ?? HANGMAN_STAGES[6]}\n\n` +
      `**Palabra:** \`${display}\`\n` +
      `**Intentos restantes:** ${remaining}/${maxWrong}\n` +
      `**Letras incorrectas:** ${wrongLetters.length ? wrongLetters.join(", ") : "ninguna"}`
    )
    .setFooter({ text: `Jugador: <@${userId}> • Escribe una letra para adivinar` });
}

function buildHangmanLetterRows(session: HangmanSession, gameId: string): ActionRowBuilder<ButtonBuilder>[] {
  const alphabet = "abcdefghijklmnopqrstuvwxyz".split("");
  const rows: ActionRowBuilder<ButtonBuilder>[] = [];
  // 5 rows of 5 buttons + 1 row of 1 (26 letters)
  const chunks: string[][] = [];
  for (let i = 0; i < alphabet.length; i += 5) {
    chunks.push(alphabet.slice(i, i + 5));
  }
  for (const chunk of chunks) {
    const row = new ActionRowBuilder<ButtonBuilder>();
    for (const letter of chunk) {
      const used = session.guessed.has(letter);
      const isWrong = used && !session.word.includes(letter);
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`hangman_${gameId}_${letter}`)
          .setLabel(letter.toUpperCase())
          .setStyle(used ? (isWrong ? ButtonStyle.Danger : ButtonStyle.Success) : ButtonStyle.Secondary)
          .setDisabled(used || session.wrongGuesses >= session.maxWrong)
      );
    }
    rows.push(row);
  }
  return rows;
}

// ─── Trivia score helpers ─────────────────────────────────────────────────────

function incrementTriviaScore(memberId: string, guildId: string): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO trivia_scores (member_id, guild_id, correct_answers)
    VALUES (?, ?, 1)
    ON CONFLICT(member_id, guild_id) DO UPDATE SET
      correct_answers = correct_answers + 1
  `).run(memberId, guildId);
}

interface TriviaScoreRow {
  member_id: string;
  guild_id: string;
  correct_answers: number;
}

// ─── Command definition ───────────────────────────────────────────────────────

export const data = new SlashCommandBuilder()
  .setName("games")
  .setDescription("Juegos de entretenimiento")
  .addSubcommand((sub) =>
    sub.setName("trivia").setDescription("Responde una pregunta de trivia con 4 opciones")
  )
  .addSubcommand((sub) =>
    sub.setName("trivia-leaderboard").setDescription("Top 10 de trivia con más respuestas correctas")
  )
  .addSubcommand((sub) =>
    sub.setName("ruleta").setDescription("Juega a la ruleta rusa (probabilidad 1/6)")
  )
  .addSubcommand((sub) =>
    sub
      .setName("8ball")
      .setDescription("Consulta la bola mágica 8")
      .addStringOption((opt: SlashCommandStringOption) =>
        opt.setName("pregunta").setDescription("Tu pregunta para la bola mágica").setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("blackjack")
      .setDescription("Juega al blackjack apostando monedas virtuales")
      .addIntegerOption((opt) =>
        opt.setName("apuesta").setDescription("Cantidad de monedas a apostar").setMinValue(1).setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("tictactoe")
      .setDescription("Tres en raya contra otro jugador")
      .addUserOption((opt) =>
        opt.setName("rival").setDescription("Jugador rival").setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub.setName("hangman").setDescription("Juega al ahorcado con una palabra aleatoria en español")
  );

// ─── Execute ──────────────────────────────────────────────────────────────────

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const sub = interaction.options.getSubcommand();

  switch (sub) {
    case "trivia":             await handleTrivia(interaction);            break;
    case "trivia-leaderboard": await handleTriviaLeaderboard(interaction); break;
    case "ruleta":             await handleRuleta(interaction);            break;
    case "8ball":              await handle8Ball(interaction);             break;
    case "blackjack":          await handleBlackjack(interaction);         break;
    case "tictactoe":          await handleTicTacToe(interaction);         break;
    case "hangman":            await handleHangman(interaction);           break;
  }
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

async function handleTrivia(interaction: ChatInputCommandInteraction): Promise<void> {
  const memberId = interaction.user.id;
  const guildId = interaction.guildId ?? "global";

  if (activeTriviaGames.has(memberId)) {
    await interaction.reply({
      embeds: [buildEmbed("error", { title: "⚠️ Ya tienes una partida en curso", description: "Responde tu pregunta actual antes de iniciar una nueva." })],
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply();

  try {
    if (interaction.channel && "sendTyping" in interaction.channel) {
      await (interaction.channel as { sendTyping(): Promise<void> }).sendTyping();
    }
  } catch { /* ignore */ }

  try {
    const res = await fetch("https://opentdb.com/api.php?amount=1&type=multiple");
    if (!res.ok) throw new Error(`OpenTDB respondió con ${res.status}`);

    const json = (await res.json()) as OpenTDBResponse;
    if (json.response_code !== 0 || !json.results.length) throw new Error("No se obtuvieron preguntas de la API");

    const q = json.results[0]!;
    const decode = (s: string) =>
      s.replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">")
       .replace(/&quot;/g,'"').replace(/&#039;/g,"'")
       .replace(/&ldquo;/g,"\u201C").replace(/&rdquo;/g,"\u201D");

    const question = decode(q.question);
    const correct = decode(q.correct_answer);
    const incorrect = q.incorrect_answers.map(decode);
    const allAnswers = [correct, ...incorrect].sort(() => Math.random() - 0.5);

    activeTriviaGames.set(memberId, { correctAnswer: correct, allAnswers });

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

      if (isCorrect) incrementTriviaScore(memberId, guildId);

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
        activeTriviaGames.delete(memberId);
        try {
          const timeoutEmbed = new EmbedBuilder()
            .setColor(0xff4444)
            .setTitle("⏰ Tiempo agotado")
            .setDescription(`Se acabó el tiempo. La respuesta correcta era **${correct}**.`);
          await interaction.editReply({ embeds: [timeoutEmbed], components: [] });
        } catch { /* ignore */ }
      }
    });
  } catch (err) {
    activeTriviaGames.delete(memberId);
    const message = err instanceof Error ? err.message : "Error desconocido";
    await interaction.editReply({
      embeds: [buildEmbed("error", { title: "❌ Error al obtener la pregunta", description: `No se pudo conectar con Open Trivia DB: ${message}` })],
    });
  }
}

async function handleTriviaLeaderboard(interaction: ChatInputCommandInteraction): Promise<void> {
  const guildId = interaction.guildId ?? "global";
  const rows = getDb()
    .prepare("SELECT * FROM trivia_scores WHERE guild_id = ? ORDER BY correct_answers DESC LIMIT 10")
    .all(guildId) as TriviaScoreRow[];

  if (rows.length === 0) {
    await interaction.reply({
      embeds: [buildEmbed("info", { title: "🏆 Clasificación de Trivia", description: "Aún no hay puntuaciones registradas en este servidor." })],
    });
    return;
  }

  const medals = ["🥇","🥈","🥉"];
  const lines = rows.map((row, i) => {
    const medal = medals[i] ?? `**${i + 1}.**`;
    return `${medal} <@${row.member_id}> — **${row.correct_answers}** respuestas correctas`;
  });

  const embed = new EmbedBuilder()
    .setColor(ENTERTAINMENT_COLOR)
    .setTitle("🏆 Clasificación de Trivia — Top 10")
    .setDescription(lines.join("\n"))
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

async function handleRuleta(interaction: ChatInputCommandInteraction): Promise<void> {
  const shot = Math.random() < 1 / 6;
  const embed = new EmbedBuilder().setColor(ENTERTAINMENT_COLOR);

  if (shot) {
    embed
      .setTitle("💀 ¡BANG! Game Over")
      .setDescription(
        `**${interaction.user.username}** apretó el gatillo y... 💥\n\n` +
        "El servidor ha hablado. Tu run termina aquí.\n_Respawn en 3... 2... 1..._"
      )
      .setFooter({ text: "Probabilidad: 1/6 • Suerte la próxima vez" });
  } else {
    embed
      .setTitle("😅 *click* — Salvado")
      .setDescription(
        `**${interaction.user.username}** apretó el gatillo y... 🍀\n\n` +
        "El revólver estaba vacío. ¡Has sobrevivido esta vez!\n_La suerte del novato sigue contigo._"
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

async function handleBlackjack(interaction: ChatInputCommandInteraction): Promise<void> {
  const memberId = interaction.user.id;
  const guildId = interaction.guildId ?? "global";
  const bet = interaction.options.getInteger("apuesta", true);

  if (activeBlackjackGames.has(memberId)) {
    await interaction.reply({
      embeds: [buildEmbed("error", { title: "⚠️ Partida en curso", description: "Ya tienes una partida de blackjack activa." })],
      ephemeral: true,
    });
    return;
  }

  const balance = getBalance(memberId, guildId);
  if (balance < bet) {
    await interaction.reply({
      embeds: [buildEmbed("error", {
        title: "❌ Saldo insuficiente",
        description: `No tienes suficientes monedas.\n**Saldo:** ${balance} 🪙\n**Apuesta:** ${bet} 🪙`,
      })],
      ephemeral: true,
    });
    return;
  }

  deductBalance(memberId, guildId, bet);

  const deck = shuffleDeck(buildDeck());
  const playerHand: Card[] = [deck.pop()!, deck.pop()!];
  const dealerHand: Card[] = [deck.pop()!, deck.pop()!];

  activeBlackjackGames.set(memberId, { deck, playerHand, dealerHand, bet, guildId });

  const playerVal = handValue(playerHand);

  // Natural blackjack
  if (playerVal === 21) {
    activeBlackjackGames.delete(memberId);
    const winnings = Math.floor(bet * 2.5);
    addBalance(memberId, guildId, winnings);
    await interaction.reply({
      embeds: [new EmbedBuilder()
        .setColor(0x44ff88)
        .setTitle("🃏 ¡Blackjack Natural!")
        .setDescription(
          `**Tus cartas:** ${formatHand(playerHand)} (${playerVal})\n` +
          `**Cartas del dealer:** ${formatHand(dealerHand)} (${handValue(dealerHand)})\n\n` +
          `🎉 ¡Blackjack! Ganas **${winnings} 🪙** (x2.5)\n**Saldo:** ${getBalance(memberId, guildId)} 🪙`
        )],
    });
    return;
  }

  const hitBtn = new ButtonBuilder().setCustomId(`bj_hit_${memberId}`).setLabel("🃏 Pedir").setStyle(ButtonStyle.Primary);
  const standBtn = new ButtonBuilder().setCustomId(`bj_stand_${memberId}`).setLabel("✋ Plantarse").setStyle(ButtonStyle.Secondary);
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(hitBtn, standBtn);

  const embed = new EmbedBuilder()
    .setColor(ENTERTAINMENT_COLOR)
    .setTitle("🃏 Blackjack")
    .setDescription(
      `**Tus cartas:** ${formatHand(playerHand)} **(${playerVal})**\n` +
      `**Dealer:** ${dealerHand[0]!.rank}${dealerHand[0]!.suit}  🂠\n\n` +
      `**Apuesta:** ${bet} 🪙`
    )
    .setFooter({ text: "Tienes 60 segundos para decidir" });

  await interaction.reply({ embeds: [embed], components: [row] });
  const message = await interaction.fetchReply();

  const collector = message.createMessageComponentCollector({
    componentType: ComponentType.Button,
    filter: (btn) => btn.user.id === memberId && (btn.customId === `bj_hit_${memberId}` || btn.customId === `bj_stand_${memberId}`),
    time: 60_000,
  });

  collector.on("collect", async (btn: ButtonInteraction) => {
    const session = activeBlackjackGames.get(memberId);
    if (!session) return;

    if (btn.customId === `bj_hit_${memberId}`) {
      session.playerHand.push(session.deck.pop()!);
      const val = handValue(session.playerHand);

      if (val > 21) {
        // Bust
        activeBlackjackGames.delete(memberId);
        collector.stop("bust");
        await btn.update({
          embeds: [new EmbedBuilder()
            .setColor(0xff4444)
            .setTitle("💥 ¡Te pasaste!")
            .setDescription(
              `**Tus cartas:** ${formatHand(session.playerHand)} **(${val})**\n` +
              `**Dealer:** ${formatHand(session.dealerHand)} **(${handValue(session.dealerHand)})**\n\n` +
              `Perdiste **${session.bet} 🪙**\n**Saldo:** ${getBalance(memberId, guildId)} 🪙`
            )],
          components: [],
        });
        return;
      }

      if (val === 21) {
        // Auto-stand at 21
        await resolveBlackjack(btn, session, memberId);
        collector.stop("stand");
        return;
      }

      const updatedEmbed = new EmbedBuilder()
        .setColor(ENTERTAINMENT_COLOR)
        .setTitle("🃏 Blackjack")
        .setDescription(
          `**Tus cartas:** ${formatHand(session.playerHand)} **(${val})**\n` +
          `**Dealer:** ${session.dealerHand[0]!.rank}${session.dealerHand[0]!.suit}  🂠\n\n` +
          `**Apuesta:** ${session.bet} 🪙`
        )
        .setFooter({ text: "Tienes 60 segundos para decidir" });

      await btn.update({ embeds: [updatedEmbed], components: [row] });
    } else {
      // Stand
      await resolveBlackjack(btn, session, memberId);
      collector.stop("stand");
    }
  });

  collector.on("end", async (_, reason) => {
    if (reason === "time") {
      const session = activeBlackjackGames.get(memberId);
      if (!session) return;
      activeBlackjackGames.delete(memberId);
      try {
        await interaction.editReply({
          embeds: [buildEmbed("error", { title: "⏰ Tiempo agotado", description: `Se acabó el tiempo. Perdiste **${session.bet} 🪙**.` })],
          components: [],
        });
      } catch { /* ignore */ }
    }
  });
}

async function resolveBlackjack(btn: ButtonInteraction, session: BlackjackSession, memberId: string): Promise<void> {
  activeBlackjackGames.delete(memberId);

  // Dealer draws until 17+
  while (handValue(session.dealerHand) < 17) {
    session.dealerHand.push(session.deck.pop()!);
  }

  const playerVal = handValue(session.playerHand);
  const dealerVal = handValue(session.dealerHand);

  let resultTitle: string;
  let resultColor: number;
  let resultDesc: string;

  if (dealerVal > 21 || playerVal > dealerVal) {
    addBalance(memberId, session.guildId, session.bet * 2);
    resultTitle = "🏆 ¡Ganaste!";
    resultColor = 0x44ff88;
    resultDesc = `Ganas **${session.bet} 🪙**\n**Saldo:** ${getBalance(memberId, session.guildId)} 🪙`;
  } else if (playerVal === dealerVal) {
    addBalance(memberId, session.guildId, session.bet);
    resultTitle = "🤝 Empate";
    resultColor = 0xffd700;
    resultDesc = `Recuperas tu apuesta de **${session.bet} 🪙**\n**Saldo:** ${getBalance(memberId, session.guildId)} 🪙`;
  } else {
    resultTitle = "😔 Perdiste";
    resultColor = 0xff4444;
    resultDesc = `Perdiste **${session.bet} 🪙**\n**Saldo:** ${getBalance(memberId, session.guildId)} 🪙`;
  }

  await btn.update({
    embeds: [new EmbedBuilder()
      .setColor(resultColor)
      .setTitle(resultTitle)
      .setDescription(
        `**Tus cartas:** ${formatHand(session.playerHand)} **(${playerVal})**\n` +
        `**Dealer:** ${formatHand(session.dealerHand)} **(${dealerVal})**\n\n` +
        resultDesc
      )],
    components: [],
  });
}

async function handleTicTacToe(interaction: ChatInputCommandInteraction): Promise<void> {
  const playerX = interaction.user;
  const playerO = interaction.options.getUser("rival", true);
  const guildId = interaction.guildId ?? "global";

  if (playerX.id === playerO.id) {
    await interaction.reply({
      embeds: [buildEmbed("error", { title: "❌ Inválido", description: "No puedes jugar contra ti mismo." })],
      ephemeral: true,
    });
    return;
  }

  if (playerO.bot) {
    await interaction.reply({
      embeds: [buildEmbed("error", { title: "❌ Inválido", description: "No puedes jugar contra un bot." })],
      ephemeral: true,
    });
    return;
  }

  const gameId = `${playerX.id}_${playerO.id}_${Date.now()}`;
  const session: TicTacToeSession = {
    board: Array(9).fill(null) as TTTCell[],
    currentTurn: playerX.id,
    playerX: playerX.id,
    playerO: playerO.id,
    guildId,
  };
  activeTTTGames.set(gameId, session);

  const embed = new EmbedBuilder()
    .setColor(ENTERTAINMENT_COLOR)
    .setTitle("❌⭕ Tres en Raya")
    .setDescription(`**${playerX.username}** (X) vs **${playerO.username}** (O)\n\nTurno de: <@${session.currentTurn}>`)
    .setFooter({ text: "60 segundos por turno" });

  const rows = buildTTTRows(session.board, gameId);
  await interaction.reply({ embeds: [embed], components: rows });
  const message = await interaction.fetchReply();

  const collector = message.createMessageComponentCollector({
    componentType: ComponentType.Button,
    filter: (btn) =>
      (btn.user.id === session.playerX || btn.user.id === session.playerO) &&
      btn.customId.startsWith(`ttt_${gameId}_`),
    time: 60_000,
  });

  collector.on("collect", async (btn: ButtonInteraction) => {
    const s = activeTTTGames.get(gameId);
    if (!s) return;

    if (btn.user.id !== s.currentTurn) {
      await btn.reply({ content: "No es tu turno.", ephemeral: true });
      return;
    }

    const idxStr = btn.customId.split("_").pop();
    const idx = idxStr !== undefined ? parseInt(idxStr, 10) : -1;
    if (idx < 0 || s.board[idx] !== null) {
      await btn.reply({ content: "Casilla inválida.", ephemeral: true });
      return;
    }

    s.board[idx] = s.currentTurn === s.playerX ? "X" : "O";
    const winner = checkTTTWinner(s.board);
    const isDraw = !winner && s.board.every((c) => c !== null);

    if (winner || isDraw) {
      activeTTTGames.delete(gameId);
      collector.stop("done");

      const resultEmbed = new EmbedBuilder()
        .setColor(winner ? 0x44ff88 : 0xffd700)
        .setTitle(winner ? `🏆 ¡${winner === "X" ? playerX.username : playerO.username} gana!` : "🤝 ¡Empate!")
        .setDescription(
          winner
            ? `**${winner === "X" ? playerX.username : playerO.username}** ha ganado la partida.`
            : "Nadie gana esta vez. ¡Revancha!"
        );

      await btn.update({ embeds: [resultEmbed], components: buildTTTRows(s.board, gameId, true) });
      return;
    }

    // Switch turn
    s.currentTurn = s.currentTurn === s.playerX ? s.playerO : s.playerX;
    collector.resetTimer();

    const updatedEmbed = new EmbedBuilder()
      .setColor(ENTERTAINMENT_COLOR)
      .setTitle("❌⭕ Tres en Raya")
      .setDescription(`**${playerX.username}** (X) vs **${playerO.username}** (O)\n\nTurno de: <@${s.currentTurn}>`)
      .setFooter({ text: "60 segundos por turno" });

    await btn.update({ embeds: [updatedEmbed], components: buildTTTRows(s.board, gameId) });
  });

  collector.on("end", async (_, reason) => {
    if (reason === "time") {
      const s = activeTTTGames.get(gameId);
      if (!s) return;
      activeTTTGames.delete(gameId);
      try {
        const timeoutEmbed = new EmbedBuilder()
          .setColor(0xff4444)
          .setTitle("⏰ Tiempo agotado")
          .setDescription(`<@${s.currentTurn}> tardó demasiado. Partida cancelada.`);
        await interaction.editReply({ embeds: [timeoutEmbed], components: [] });
      } catch { /* ignore */ }
    }
  });
}

async function handleHangman(interaction: ChatInputCommandInteraction): Promise<void> {
  const memberId = interaction.user.id;

  if (activeHangmanGames.has(memberId)) {
    await interaction.reply({
      embeds: [buildEmbed("error", { title: "⚠️ Partida en curso", description: "Ya tienes una partida de ahorcado activa." })],
      ephemeral: true,
    });
    return;
  }

  const word = HANGMAN_WORDS[Math.floor(Math.random() * HANGMAN_WORDS.length)]!;
  const session: HangmanSession = { word, guessed: new Set(), wrongGuesses: 0, maxWrong: 6 };
  activeHangmanGames.set(memberId, session);

  const gameId = `${memberId}_${Date.now()}`;
  const embed = buildHangmanEmbed(session, memberId);
  const letterRows = buildHangmanLetterRows(session, gameId);

  await interaction.reply({ embeds: [embed], components: letterRows });
  const message = await interaction.fetchReply();

  const collector = message.createMessageComponentCollector({
    componentType: ComponentType.Button,
    filter: (btn) => btn.user.id === memberId && btn.customId.startsWith(`hangman_${gameId}_`),
    time: 300_000, // 5 minutes total
  });

  collector.on("collect", async (btn: ButtonInteraction) => {
    const s = activeHangmanGames.get(memberId);
    if (!s) return;

    const letter = btn.customId.split("_").pop()!;
    if (s.guessed.has(letter)) {
      await btn.reply({ content: "Ya usaste esa letra.", ephemeral: true });
      return;
    }

    s.guessed.add(letter);
    if (!s.word.includes(letter)) {
      s.wrongGuesses++;
    }

    const allRevealed = s.word.split("").every((l) => s.guessed.has(l));
    const lost = s.wrongGuesses >= s.maxWrong;

    if (allRevealed || lost) {
      activeHangmanGames.delete(memberId);
      collector.stop("done");

      const finalEmbed = new EmbedBuilder()
        .setColor(allRevealed ? 0x44ff88 : 0xff4444)
        .setTitle(allRevealed ? "🎉 ¡Ganaste!" : "💀 ¡Perdiste!")
        .setDescription(
          `${HANGMAN_STAGES[s.wrongGuesses] ?? HANGMAN_STAGES[6]}\n\n` +
          `**Palabra:** \`${s.word}\`\n` +
          (allRevealed
            ? `¡Adivinaste la palabra con ${s.wrongGuesses} errores!`
            : `Se te acabaron los intentos. La palabra era **${s.word}**.`)
        );

      await btn.update({ embeds: [finalEmbed], components: buildHangmanLetterRows(s, gameId) });
      return;
    }

    const updatedEmbed = buildHangmanEmbed(s, memberId);
    await btn.update({ embeds: [updatedEmbed], components: buildHangmanLetterRows(s, gameId) });
  });

  collector.on("end", async (_, reason) => {
    if (reason === "time") {
      const s = activeHangmanGames.get(memberId);
      if (!s) return;
      activeHangmanGames.delete(memberId);
      try {
        const timeoutEmbed = new EmbedBuilder()
          .setColor(0xff4444)
          .setTitle("⏰ Tiempo agotado")
          .setDescription(`Se acabó el tiempo. La palabra era **${s.word}**.`);
        await interaction.editReply({ embeds: [timeoutEmbed], components: [] });
      } catch { /* ignore */ }
    }
  });
}

// Export for testing
export { activeTriviaGames, activeBlackjackGames, activeTTTGames, activeHangmanGames };
