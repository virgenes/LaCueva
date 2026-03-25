import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  EmbedBuilder,
  ComponentType,
  PermissionFlagsBits,
  Client,
  TextChannel,
  type ButtonInteraction,
} from "discord.js";
import { getDb } from "../../utils/database.js";
import { parseDuration } from "../moderation/timeout.js";
import { EMBED_COLORS } from "../../utils/embeds.js";

// ─── Types ────────────────────────────────────────────────────────────────────

interface GiveawayRow {
  id: string;
  guild_id: string;
  channel_id: string;
  message_id: string | null;
  prize: string;
  winners_count: number;
  ends_at: string;
  ended: number;
  creator_id: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatTimeLeft(ms: number): string {
  if (ms <= 0) return "0m";
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes}m`);
  return parts.join(" ");
}

function buildGiveawayEmbed(
  prize: string,
  endsAt: Date,
  participantCount: number,
  winnersCount: number
): EmbedBuilder {
  const timeLeft = formatTimeLeft(endsAt.getTime() - Date.now());
  return new EmbedBuilder()
    .setColor(EMBED_COLORS.entertainment)
    .setTitle("🎉 GIVEAWAY 🎉")
    .setDescription(
      `**Premio:** ${prize}\n\n` +
      `Haz clic en el botón para participar.\n` +
      `Ganadores: **${winnersCount}**`
    )
    .addFields(
      { name: "⏳ Tiempo restante", value: timeLeft, inline: true },
      { name: "👥 Participantes", value: String(participantCount), inline: true },
      { name: "🏆 Ganadores", value: String(winnersCount), inline: true }
    )
    .setFooter({ text: `Finaliza: ${endsAt.toLocaleString("es-ES")}` })
    .setTimestamp();
}

function buildParticipateRow(giveawayId: string): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`giveaway_join:${giveawayId}`)
      .setLabel("🎉 Participar")
      .setStyle(ButtonStyle.Primary)
  );
}

// ─── End giveaway logic ───────────────────────────────────────────────────────

async function endGiveaway(giveawayId: string, client: Client): Promise<void> {
  const db = getDb();

  const giveaway = db
    .prepare("SELECT * FROM giveaways WHERE id = ? AND ended = 0")
    .get(giveawayId) as GiveawayRow | undefined;

  if (!giveaway) return;

  // Mark as ended
  db.prepare("UPDATE giveaways SET ended = 1 WHERE id = ?").run(giveawayId);

  // Fetch participants
  const participants = db
    .prepare("SELECT member_id FROM giveaway_participants WHERE giveaway_id = ?")
    .all(giveawayId) as { member_id: string }[];

  let winnersText = "No hubo participantes.";
  const winnerMentions: string[] = [];

  if (participants.length > 0) {
    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    const count = Math.min(giveaway.winners_count, shuffled.length);
    const winners = shuffled.slice(0, count);
    winnerMentions.push(...winners.map((w) => `<@${w.member_id}>`));
    winnersText = winnerMentions.join(", ");
  }

  // Update the original message
  try {
    const guild = await client.guilds.fetch(giveaway.guild_id);
    const channel = await guild.channels.fetch(giveaway.channel_id) as TextChannel | null;
    if (channel && giveaway.message_id) {
      const msg = await channel.messages.fetch(giveaway.message_id);
      const endedEmbed = new EmbedBuilder()
        .setColor(EMBED_COLORS.info)
        .setTitle("🎉 GIVEAWAY FINALIZADO 🎉")
        .setDescription(`**Premio:** ${giveaway.prize}\n\n🏆 **Ganadores:** ${winnersText}`)
        .addFields({ name: "👥 Participantes totales", value: String(participants.length), inline: true })
        .setFooter({ text: `Finalizado: ${new Date().toLocaleString("es-ES")}` })
        .setTimestamp();

      await msg.edit({ embeds: [endedEmbed], components: [] });

      if (winnerMentions.length > 0) {
        await channel.send(
          `🎉 ¡Felicidades ${winnersText}! Ganaron **${giveaway.prize}**.`
        );
      } else {
        await channel.send("😔 El giveaway terminó sin participantes.");
      }
    }
  } catch {
    // Channel or message may be gone — fail silently
  }
}

// ─── Scheduler ────────────────────────────────────────────────────────────────

const activeTimers = new Map<string, ReturnType<typeof setTimeout>>();

function scheduleGiveaway(giveawayId: string, endsAt: Date, client: Client): void {
  const delay = endsAt.getTime() - Date.now();
  if (delay <= 0) {
    // Already expired — end immediately
    endGiveaway(giveawayId, client).catch(() => {});
    return;
  }

  const timer = setTimeout(async () => {
    activeTimers.delete(giveawayId);
    await endGiveaway(giveawayId, client);
  }, delay);

  activeTimers.set(giveawayId, timer);
}

/**
 * Loads active giveaways from DB and schedules their endings.
 * Requirements: 19.5
 */
export function initGiveawayScheduler(client: Client): void {
  const db = getDb();
  const active = db
    .prepare("SELECT * FROM giveaways WHERE ended = 0")
    .all() as GiveawayRow[];

  for (const giveaway of active) {
    scheduleGiveaway(giveaway.id, new Date(giveaway.ends_at), client);
  }

  // Listen for button interactions
  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;
    const { customId } = interaction;
    if (!customId.startsWith("giveaway_join:")) return;

    const giveawayId = customId.slice("giveaway_join:".length);
    await handleJoin(interaction as ButtonInteraction, giveawayId);
  });
}

// ─── Button handler ───────────────────────────────────────────────────────────

async function handleJoin(interaction: ButtonInteraction, giveawayId: string): Promise<void> {
  const db = getDb();

  const giveaway = db
    .prepare("SELECT * FROM giveaways WHERE id = ? AND ended = 0")
    .get(giveawayId) as GiveawayRow | undefined;

  if (!giveaway) {
    await interaction.reply({ content: "Este giveaway ya ha finalizado.", ephemeral: true });
    return;
  }

  const existing = db
    .prepare("SELECT 1 FROM giveaway_participants WHERE giveaway_id = ? AND member_id = ?")
    .get(giveawayId, interaction.user.id);

  if (existing) {
    await interaction.reply({ content: "Ya estás participando en este giveaway. 🎉", ephemeral: true });
    return;
  }

  db.prepare("INSERT INTO giveaway_participants (giveaway_id, member_id) VALUES (?, ?)").run(
    giveawayId,
    interaction.user.id
  );

  const count = (
    db
      .prepare("SELECT COUNT(*) as cnt FROM giveaway_participants WHERE giveaway_id = ?")
      .get(giveawayId) as { cnt: number }
  ).cnt;

  // Update embed participant count
  try {
    const endsAt = new Date(giveaway.ends_at);
    const updatedEmbed = buildGiveawayEmbed(giveaway.prize, endsAt, count, giveaway.winners_count);
    await interaction.update({ embeds: [updatedEmbed], components: [buildParticipateRow(giveawayId)] });
  } catch {
    await interaction.reply({ content: "✅ ¡Te has unido al giveaway!", ephemeral: true });
  }
}

// ─── Slash command definition ─────────────────────────────────────────────────

export const data = new SlashCommandBuilder()
  .setName("g")
  .setDescription("Gestión de giveaways")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addSubcommand((sub) =>
    sub
      .setName("start")
      .setDescription("Crea un nuevo giveaway")
      .addStringOption((opt) =>
        opt.setName("duracion").setDescription("Duración (ej: 1d, 2h, 30m)").setRequired(true)
      )
      .addStringOption((opt) =>
        opt.setName("premio").setDescription("Premio del giveaway").setRequired(true)
      )
      .addIntegerOption((opt) =>
        opt
          .setName("ganadores")
          .setDescription("Número de ganadores (por defecto: 1)")
          .setMinValue(1)
          .setMaxValue(20)
          .setRequired(false)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("end")
      .setDescription("Finaliza un giveaway inmediatamente")
      .addStringOption((opt) =>
        opt.setName("id").setDescription("ID del giveaway").setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub.setName("list").setDescription("Lista los giveaways activos")
  );

// ─── Execute ──────────────────────────────────────────────────────────────────

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guild) {
    await interaction.reply({ content: "Este comando solo funciona en un servidor.", ephemeral: true });
    return;
  }

  const sub = interaction.options.getSubcommand();

  if (sub === "start") {
    await handleGstart(interaction);
  } else if (sub === "end") {
    await handleGend(interaction);
  } else if (sub === "list") {
    await handleGlist(interaction);
  }
}

// ─── /g start ─────────────────────────────────────────────────────────────────

async function handleGstart(interaction: ChatInputCommandInteraction): Promise<void> {
  const durationStr = interaction.options.getString("duracion", true);
  const prize = interaction.options.getString("premio", true);
  const winnersCount = interaction.options.getInteger("ganadores") ?? 1;

  const durationMs = parseDuration(durationStr);
  if (durationMs === null) {
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(EMBED_COLORS.error)
          .setTitle("❌ Formato inválido")
          .setDescription("La duración debe tener el formato `1d`, `2h` o `30m`."),
      ],
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply();

  const db = getDb();
  const id = generateId();
  const endsAt = new Date(Date.now() + durationMs);

  db.prepare(
    `INSERT INTO giveaways (id, guild_id, channel_id, message_id, prize, winners_count, ends_at, ended, creator_id)
     VALUES (?, ?, ?, NULL, ?, ?, ?, 0, ?)`
  ).run(id, interaction.guild!.id, interaction.channelId, prize, winnersCount, endsAt.toISOString(), interaction.user.id);

  const embed = buildGiveawayEmbed(prize, endsAt, 0, winnersCount);
  const row = buildParticipateRow(id);

  const reply = await interaction.editReply({ embeds: [embed], components: [row] });

  // Store message_id for later editing
  db.prepare("UPDATE giveaways SET message_id = ? WHERE id = ?").run(reply.id, id);

  // Schedule end
  scheduleGiveaway(id, endsAt, interaction.client);
}

// ─── /g end ───────────────────────────────────────────────────────────────────

async function handleGend(interaction: ChatInputCommandInteraction): Promise<void> {
  const id = interaction.options.getString("id", true);
  const db = getDb();

  const giveaway = db
    .prepare("SELECT * FROM giveaways WHERE id = ? AND guild_id = ? AND ended = 0")
    .get(id, interaction.guild!.id) as GiveawayRow | undefined;

  if (!giveaway) {
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(EMBED_COLORS.error)
          .setTitle("❌ Giveaway no encontrado")
          .setDescription(`No se encontró ningún giveaway activo con ID \`${id}\`.`),
      ],
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  // Cancel scheduled timer if any
  const timer = activeTimers.get(id);
  if (timer) {
    clearTimeout(timer);
    activeTimers.delete(id);
  }

  await endGiveaway(id, interaction.client);

  await interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setColor(EMBED_COLORS.success)
        .setTitle("✅ Giveaway finalizado")
        .setDescription(`El giveaway \`${id}\` ha sido finalizado y los ganadores han sido seleccionados.`),
    ],
  });
}

// ─── /g list ──────────────────────────────────────────────────────────────────

async function handleGlist(interaction: ChatInputCommandInteraction): Promise<void> {
  const db = getDb();
  const active = db
    .prepare("SELECT * FROM giveaways WHERE guild_id = ? AND ended = 0 ORDER BY ends_at ASC")
    .all(interaction.guild!.id) as GiveawayRow[];

  if (active.length === 0) {
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(EMBED_COLORS.info)
          .setTitle("🎉 Giveaways activos")
          .setDescription("No hay giveaways activos en este servidor."),
      ],
    });
    return;
  }

  const fields = active.map((g) => {
    const timeLeft = formatTimeLeft(new Date(g.ends_at).getTime() - Date.now());
    return {
      name: `🎁 ${g.prize}`,
      value: `ID: \`${g.id}\`\n⏳ Tiempo restante: **${timeLeft}**\n🏆 Ganadores: ${g.winners_count}`,
      inline: false,
    };
  });

  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(EMBED_COLORS.info)
        .setTitle("🎉 Giveaways activos")
        .addFields(fields)
        .setFooter({ text: `${active.length} giveaway(s) activo(s)` }),
    ],
  });
}
