import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Client,
  TextChannel,
  type SlashCommandStringOption,
} from "discord.js";
import { randomUUID } from "node:crypto";
import { getDb } from "../../utils/database.js";
import { buildEmbed } from "../../utils/embeds.js";
import { parseDuration } from "../moderation/timeout.js";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReminderRow {
  id: string;
  member_id: string;
  guild_id: string;
  channel_id: string;
  message: string;
  fire_at: string;
  repeat: string | null;
  active: number;
}

// ─── Slash command definition ─────────────────────────────────────────────────

export const data = new SlashCommandBuilder()
  .setName("remindme")
  .setDescription("Programa un recordatorio personal")
  .addStringOption((opt: SlashCommandStringOption) =>
    opt
      .setName("tiempo")
      .setDescription("Cuándo recordarte (ej: 1d, 2h, 30m)")
      .setRequired(true)
  )
  .addStringOption((opt: SlashCommandStringOption) =>
    opt
      .setName("mensaje")
      .setDescription("Mensaje del recordatorio")
      .setRequired(true)
  )
  .addStringOption((opt: SlashCommandStringOption) =>
    opt
      .setName("repetir")
      .setDescription("Repetición del recordatorio")
      .setRequired(false)
      .addChoices(
        { name: "Sin repetición", value: "none" },
        { name: "Diario", value: "daily" },
        { name: "Semanal", value: "weekly" }
      )
  );

// ─── Execute ──────────────────────────────────────────────────────────────────

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guild || !interaction.channel) {
    await interaction.reply({ content: "Este comando solo funciona en un servidor.", ephemeral: true });
    return;
  }

  const tiempoStr = interaction.options.getString("tiempo", true);
  const mensaje = interaction.options.getString("mensaje", true);
  const repetir = interaction.options.getString("repetir") ?? "none";

  const durationMs = parseDuration(tiempoStr);
  if (durationMs === null) {
    await interaction.reply({
      embeds: [buildEmbed("error", {
        title: "❌ Formato inválido",
        description: "La duración debe tener el formato `1d`, `2h` o `30m`.",
      })],
      ephemeral: true,
    });
    return;
  }

  const fireAt = new Date(Date.now() + durationMs).toISOString();
  const id = randomUUID();
  const repeat = repetir === "none" ? null : repetir;

  const db = getDb();
  db.prepare(`
    INSERT INTO reminders (id, member_id, guild_id, channel_id, message, fire_at, repeat, active)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
  `).run(id, interaction.user.id, interaction.guild.id, interaction.channel.id, mensaje, fireAt, repeat);

  // Schedule in memory
  scheduleReminder(
    { id, member_id: interaction.user.id, guild_id: interaction.guild.id, channel_id: interaction.channel.id, message: mensaje, fire_at: fireAt, repeat, active: 1 },
    interaction.client
  );

  const repeatLabel = repeat === "daily" ? "diariamente" : repeat === "weekly" ? "semanalmente" : "sin repetición";

  await interaction.reply({
    embeds: [buildEmbed("success", {
      title: "⏰ Recordatorio programado",
      fields: [
        { name: "Mensaje", value: mensaje, inline: false },
        { name: "En", value: tiempoStr, inline: true },
        { name: "Repetición", value: repeatLabel, inline: true },
      ],
      footer: `Se te mencionará en este canal el ${new Date(fireAt).toLocaleString("es-ES")}`,
    })],
    ephemeral: true,
  });
}

// ─── Scheduler ────────────────────────────────────────────────────────────────

function scheduleReminder(reminder: ReminderRow, client: Client): void {
  const delay = Math.max(0, new Date(reminder.fire_at).getTime() - Date.now());

  setTimeout(async () => {
    await fireReminder(reminder, client);
  }, delay);
}

async function fireReminder(reminder: ReminderRow, client: Client): Promise<void> {
  try {
    const channel = await client.channels.fetch(reminder.channel_id);
    if (channel && channel.isTextBased()) {
      await (channel as TextChannel).send({
        content: `<@${reminder.member_id}>`,
        embeds: [buildEmbed("info", {
          title: "⏰ Recordatorio",
          description: reminder.message,
          footer: new Date().toLocaleString("es-ES"),
        })],
      });
    }
  } catch {
    // Channel may no longer exist or bot lacks access
  }

  const db = getDb();

  if (reminder.repeat === "daily" || reminder.repeat === "weekly") {
    const intervalMs = reminder.repeat === "daily"
      ? 24 * 60 * 60 * 1000
      : 7 * 24 * 60 * 60 * 1000;

    const nextFireAt = new Date(new Date(reminder.fire_at).getTime() + intervalMs).toISOString();

    db.prepare(`UPDATE reminders SET fire_at = ? WHERE id = ?`).run(nextFireAt, reminder.id);

    const updated: ReminderRow = { ...reminder, fire_at: nextFireAt };
    scheduleReminder(updated, client);
  } else {
    db.prepare(`UPDATE reminders SET active = 0 WHERE id = ?`).run(reminder.id);
  }
}

// ─── Init scheduler ───────────────────────────────────────────────────────────

/**
 * Loads all active reminders from the DB and schedules them with setTimeout.
 * Call this once when the bot starts.
 */
export function initReminderScheduler(client: Client): void {
  const db = getDb();
  const reminders = db.prepare(`SELECT * FROM reminders WHERE active = 1`).all() as ReminderRow[];

  for (const reminder of reminders) {
    scheduleReminder(reminder, client);
  }
}
