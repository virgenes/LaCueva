import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  TextChannel,
  EmbedBuilder,
  GuildScheduledEventEntityType,
  GuildScheduledEventPrivacyLevel,
  PermissionFlagsBits,
} from "discord.js";
import cron from "node-cron";
import { loadConfig } from "../../utils/dataStore.js";
import { buildEmbed, EMBED_COLORS } from "../../utils/embeds.js";
import { getMessage } from "../../utils/personality.js";
import { logAction } from "./auditLog.js";

// ─── Types ────────────────────────────────────────────────────────────────────

type RepetitionMode = "none" | "weekly" | "monthly";

interface GuildEvent {
  id: string;
  guildId: string;
  name: string;
  description: string;
  date: string; // ISO 8601
  creatorId: string;
  announcementChannelId: string | null;
  announcementMessageId: string | null;
  discordEventId: string | null;
  attendees: string[]; // member IDs
  reminded: boolean;
  cancelled: boolean;
  /** Repetition mode — none (default), weekly or monthly. Requirements: 18.5 */
  repetition: RepetitionMode;
  /** Optional role ID to mention in announcements and reminders. Requirements: 18.6 */
  notifyRoleId: string | null;
}

// ─── In-memory store (MVP — no DB required yet) ───────────────────────────────

const eventsStore = new Map<string, GuildEvent>();

// Active reminder timeouts keyed by event ID
const reminderTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

// Active cron jobs for recurring events keyed by event ID
const recurringCronJobs = new Map<string, cron.ScheduledTask>();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Formats milliseconds into "Xh Ym" countdown string.
 * Requirements: 21.12
 */
export function formatCountdown(ms: number): string {
  const totalMinutes = Math.max(0, Math.floor(ms / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

/**
 * Advances a date by the given repetition mode.
 * weekly → +7 days, monthly → +30 days.
 * Requirements: 18.5
 */
function advanceDate(date: Date, mode: RepetitionMode): Date {
  const next = new Date(date.getTime());
  if (mode === "weekly") {
    next.setDate(next.getDate() + 7);
  } else if (mode === "monthly") {
    next.setDate(next.getDate() + 30);
  }
  return next;
}

/**
 * Builds a cron expression that fires once at the given date.
 * Format: "minute hour day month *"
 */
function dateToCronExpression(date: Date): string {
  return `${date.getMinutes()} ${date.getHours()} ${date.getDate()} ${date.getMonth() + 1} *`;
}

// ─── Reminder scheduler ───────────────────────────────────────────────────────

/**
 * Schedules a reminder via setTimeout for 1 hour before the event.
 * Requirements: 18.2, 18.6, 21.12
 */
export function scheduleReminder(
  event: GuildEvent,
  getClient: () => import("discord.js").Client
): void {
  const ONE_HOUR = 60 * 60 * 1000;
  const eventTime = new Date(event.date).getTime();
  const reminderTime = eventTime - ONE_HOUR;
  const delay = reminderTime - Date.now();

  // Only schedule if the reminder is in the future
  if (delay <= 0) return;

  const timeout = setTimeout(async () => {
    reminderTimeouts.delete(event.id);

    const stored = eventsStore.get(event.id);
    if (!stored || stored.cancelled || stored.reminded) return;

    stored.reminded = true;

    const client = getClient();
    try {
      const guild = await client.guilds.fetch(stored.guildId);
      const config = loadConfig(stored.guildId);

      if (!config.announcementsChannelId) return;
      const ch = await guild.channels.fetch(config.announcementsChannelId);
      if (!ch || !ch.isTextBased()) return;

      // Countdown calculated at send time (moment of reminder dispatch)
      const countdown = formatCountdown(eventTime - Date.now());
      const attendeeMentions =
        stored.attendees.map((id) => `<@${id}>`).join(" ") || "";

      // Role mention for reminder (Req 18.6)
      const roleMention = stored.notifyRoleId
        ? `<@&${stored.notifyRoleId}>`
        : "";
      const mentionContent = [roleMention, attendeeMentions]
        .filter(Boolean)
        .join(" ");

      // GIF only in friki mode
      let imageUrl: string | undefined;
      if (config.personalityMode !== "formal" && config.gifUrls.event) {
        try {
          const res = await fetch(config.gifUrls.event, { method: "HEAD" });
          if (res.ok) imageUrl = config.gifUrls.event;
        } catch {
          // GIF not accessible — omit (Req 32.10)
        }
      }

      const embed = new EmbedBuilder()
        .setColor(EMBED_COLORS.info)
        .setTitle(`⏰ Recordatorio — ${stored.name}`)
        .setDescription(
          `El evento **${stored.name}** comienza en **${countdown}**.\n\n${stored.description}`
        )
        .addFields(
          {
            name: "Fecha",
            value: new Date(stored.date).toLocaleString("es-ES"),
            inline: true,
          },
          { name: "Cuenta regresiva", value: countdown, inline: true }
        )
        .setTimestamp();

      if (imageUrl) embed.setImage(imageUrl);

      await (ch as TextChannel).send({
        content: mentionContent || undefined,
        embeds: [embed],
      });
    } catch {
      // Guild or channel not accessible — skip
    }
  }, delay);

  reminderTimeouts.set(event.id, timeout);
}

/**
 * Cancels a pending reminder timeout for an event.
 */
function cancelReminder(eventId: string): void {
  const timeout = reminderTimeouts.get(eventId);
  if (timeout) {
    clearTimeout(timeout);
    reminderTimeouts.delete(eventId);
  }
}

// ─── Recurring event scheduler ────────────────────────────────────────────────

/**
 * Schedules a cron job that recreates the event after each occurrence.
 * Requirements: 18.5
 */
export function scheduleRecurring(
  event: GuildEvent,
  getClient: () => import("discord.js").Client
): void {
  if (event.repetition === "none") return;

  const eventDate = new Date(event.date);
  const cronExpr = dateToCronExpression(eventDate);

  // Validate cron expression before scheduling
  if (!cron.validate(cronExpr)) return;

  const task = cron.schedule(cronExpr, async () => {
    // Stop this one-shot cron after it fires
    task.stop();
    recurringCronJobs.delete(event.id);

    const stored = eventsStore.get(event.id);
    if (!stored || stored.cancelled) return;

    // Compute next occurrence date
    const nextDate = advanceDate(new Date(stored.date), stored.repetition);

    // Only recreate if next date is in the future
    if (nextDate.getTime() <= Date.now()) return;

    const client = getClient();
    try {
      const guild = await client.guilds.fetch(stored.guildId);
      const config = loadConfig(stored.guildId);

      // Build announcement embed for the new occurrence (Req 18.1, 18.6)
      let imageUrl: string | undefined;
      if (config.personalityMode !== "formal" && config.gifUrls.event) {
        try {
          const res = await fetch(config.gifUrls.event, { method: "HEAD" });
          if (res.ok) imageUrl = config.gifUrls.event;
        } catch {
          // GIF not accessible — omit
        }
      }

      // Role mention for announcement (Req 18.6)
      const roleMention = stored.notifyRoleId
        ? `<@&${stored.notifyRoleId}>`
        : undefined;

      const announcementEmbed = new EmbedBuilder()
        .setColor(EMBED_COLORS.info)
        .setTitle(`🎉 Nuevo evento — ${stored.name}`)
        .setDescription(stored.description)
        .addFields(
          {
            name: "Fecha",
            value: nextDate.toLocaleString("es-ES"),
            inline: true,
          },
          {
            name: "Organizador",
            value: `<@${stored.creatorId}>`,
            inline: true,
          },
          {
            name: "Repetición",
            value: stored.repetition === "weekly" ? "Semanal" : "Mensual",
            inline: true,
          }
        )
        .setTimestamp();

      if (imageUrl) announcementEmbed.setImage(imageUrl);

      // Publish announcement
      let announcementMessageId: string | null = null;
      let announcementChannelId: string | null = null;

      if (config.announcementsChannelId) {
        try {
          const ch = await guild.channels.fetch(config.announcementsChannelId);
          if (ch && ch.isTextBased()) {
            const msg = await (ch as TextChannel).send({
              content: roleMention,
              embeds: [announcementEmbed],
            });
            announcementMessageId = msg.id;
            announcementChannelId = ch.id;
          }
        } catch {
          // Channel not accessible — skip
        }
      }

      // Attempt to create a Discord Guild Scheduled Event for the new occurrence
      let discordEventId: string | null = null;
      try {
        const scheduledEvent = await guild.scheduledEvents.create({
          name: stored.name,
          scheduledStartTime: nextDate,
          privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
          entityType: GuildScheduledEventEntityType.External,
          entityMetadata: { location: guild.name },
          description: stored.description,
        });
        discordEventId = scheduledEvent.id;
      } catch {
        // Scheduled events may not be available — continue without it
      }

      // Create new event entry for the next occurrence
      const newEvent: GuildEvent = {
        id: generateId(),
        guildId: stored.guildId,
        name: stored.name,
        description: stored.description,
        date: nextDate.toISOString(),
        creatorId: stored.creatorId,
        announcementChannelId,
        announcementMessageId,
        discordEventId,
        attendees: [],
        reminded: false,
        cancelled: false,
        repetition: stored.repetition,
        notifyRoleId: stored.notifyRoleId,
      };

      eventsStore.set(newEvent.id, newEvent);

      // Schedule reminder and next recurrence for the new event
      scheduleReminder(newEvent, getClient);
      scheduleRecurring(newEvent, getClient);

      await logAction(
        "Evento recurrente recreado",
        stored.name,
        `Sistema (repetición ${stored.repetition})`,
        new Date().toISOString(),
        guild
      );
    } catch {
      // Guild not accessible — skip
    }
  });

  recurringCronJobs.set(event.id, task);
}

/**
 * Cancels a pending recurring cron job for an event.
 */
function cancelRecurring(eventId: string): void {
  const task = recurringCronJobs.get(eventId);
  if (task) {
    task.stop();
    recurringCronJobs.delete(eventId);
  }
}

// ─── Command definition ───────────────────────────────────────────────────────

export const data = new SlashCommandBuilder()
  .setName("evento")
  .setDescription("Gestiona eventos del servidor")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageEvents)
  .addSubcommand((sub) =>
    sub
      .setName("create")
      .setDescription("Crea un nuevo evento")
      .addStringOption((opt) =>
        opt.setName("nombre").setDescription("Nombre del evento").setRequired(true)
      )
      .addStringOption((opt) =>
        opt
          .setName("fecha_iso")
          .setDescription(
            "Fecha y hora en formato ISO 8601 (ej: 2025-12-31T20:00:00)"
          )
          .setRequired(true)
      )
      .addStringOption((opt) =>
        opt
          .setName("descripcion")
          .setDescription("Descripción del evento")
          .setRequired(true)
      )
      // Requirements: 18.5 — repetición semanal/mensual
      .addStringOption((opt) =>
        opt
          .setName("repeticion")
          .setDescription("Repetición automática del evento")
          .setRequired(false)
          .addChoices(
            { name: "Sin repetición", value: "none" },
            { name: "Semanal (cada 7 días)", value: "weekly" },
            { name: "Mensual (cada 30 días)", value: "monthly" }
          )
      )
      // Requirements: 18.6 — notificación a rol específico
      .addRoleOption((opt) =>
        opt
          .setName("rol")
          .setDescription("Rol a mencionar en el anuncio y recordatorio (opcional)")
          .setRequired(false)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("cancel")
      .setDescription("Cancela un evento existente")
      .addStringOption((opt) =>
        opt
          .setName("id")
          .setDescription("ID del evento a cancelar")
          .setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub.setName("list").setDescription("Lista los eventos activos")
  );

// ─── Execute ──────────────────────────────────────────────────────────────────

export async function execute(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  if (!interaction.guild) {
    await interaction.reply({
      content: "Este comando solo funciona en un servidor.",
      ephemeral: true,
    });
    return;
  }

  const sub = interaction.options.getSubcommand();

  if (sub === "create") {
    await handleCreate(interaction);
  } else if (sub === "cancel") {
    await handleCancel(interaction);
  } else if (sub === "list") {
    await handleList(interaction);
  }
}

// ─── /evento create ───────────────────────────────────────────────────────────

async function handleCreate(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const guild = interaction.guild!;
  const name = interaction.options.getString("nombre", true);
  const dateStr = interaction.options.getString("fecha_iso", true);
  const description = interaction.options.getString("descripcion", true);
  // New options (Req 18.5, 18.6)
  const repetition = (interaction.options.getString("repeticion") ?? "none") as RepetitionMode;
  const notifyRole = interaction.options.getRole("rol");
  const notifyRoleId = notifyRole?.id ?? null;

  // Validate date is in the future (Req 18.4)
  const eventDate = new Date(dateStr);
  if (isNaN(eventDate.getTime()) || eventDate.getTime() <= Date.now()) {
    await interaction.reply({
      embeds: [
        buildEmbed("error", {
          title: "❌ Fecha inválida",
          description:
            "La fecha debe ser válida y posterior al momento actual. Usa formato ISO 8601, por ejemplo: `2025-12-31T20:00:00`",
        }),
      ],
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply();

  const config = loadConfig(guild.id);
  const mode = config.personalityMode;

  // Attempt to create a Discord Guild Scheduled Event
  let discordEventId: string | null = null;
  try {
    const scheduledEvent = await guild.scheduledEvents.create({
      name,
      scheduledStartTime: eventDate,
      privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
      entityType: GuildScheduledEventEntityType.External,
      entityMetadata: { location: guild.name },
      description,
    });
    discordEventId = scheduledEvent.id;
  } catch {
    // Scheduled events may not be available — continue without it
  }

  // Build announcement embed (Req 18.1)
  let imageUrl: string | undefined;
  if (mode !== "formal" && config.gifUrls.event) {
    try {
      const res = await fetch(config.gifUrls.event, { method: "HEAD" });
      if (res.ok) imageUrl = config.gifUrls.event;
    } catch {
      // GIF not accessible — omit (Req 32.10)
    }
  }

  const embedFields: { name: string; value: string; inline?: boolean }[] = [
    {
      name: "Fecha",
      value: eventDate.toLocaleString("es-ES"),
      inline: true,
    },
    {
      name: "Organizador",
      value: `<@${interaction.user.id}>`,
      inline: true,
    },
  ];

  if (repetition !== "none") {
    embedFields.push({
      name: "Repetición",
      value: repetition === "weekly" ? "Semanal" : "Mensual",
      inline: true,
    });
  }

  if (notifyRoleId) {
    embedFields.push({
      name: "Rol notificado",
      value: `<@&${notifyRoleId}>`,
      inline: true,
    });
  }

  const announcementEmbed = new EmbedBuilder()
    .setColor(EMBED_COLORS.info)
    .setTitle(`🎉 Nuevo evento — ${name}`)
    .setDescription(description)
    .addFields(embedFields)
    .setTimestamp();

  if (imageUrl) announcementEmbed.setImage(imageUrl);

  // Role mention content for announcement (Req 18.6)
  const roleMention = notifyRoleId ? `<@&${notifyRoleId}>` : undefined;

  // Publish announcement to configured channel (Req 18.1)
  let announcementMessageId: string | null = null;
  let announcementChannelId: string | null = null;

  if (config.announcementsChannelId) {
    try {
      const ch = await guild.channels.fetch(config.announcementsChannelId);
      if (ch && ch.isTextBased()) {
        const msg = await (ch as TextChannel).send({
          content: roleMention,
          embeds: [announcementEmbed],
        });
        announcementMessageId = msg.id;
        announcementChannelId = ch.id;
      }
    } catch {
      // Channel not accessible — skip announcement
    }
  }

  // Persist event in memory
  const event: GuildEvent = {
    id: generateId(),
    guildId: guild.id,
    name,
    description,
    date: eventDate.toISOString(),
    creatorId: interaction.user.id,
    announcementChannelId,
    announcementMessageId,
    discordEventId,
    attendees: [],
    reminded: false,
    cancelled: false,
    repetition,
    notifyRoleId,
  };
  eventsStore.set(event.id, event);

  // Schedule reminder 1h before via setTimeout (Req 18.2)
  scheduleReminder(event, () => interaction.client);

  // Schedule recurring recreation if applicable (Req 18.5)
  scheduleRecurring(event, () => interaction.client);

  await logAction(
    "Evento creado",
    name,
    `<@${interaction.user.id}> (${interaction.user.username})`,
    new Date().toISOString(),
    guild
  );

  const msg = getMessage(
    "eventCreate",
    {
      member: interaction.user.username,
      title: name,
      date: eventDate.toLocaleString("es-ES"),
    },
    mode
  );

  const replyFields: { name: string; value: string; inline?: boolean }[] = [
    { name: "Nombre", value: name, inline: true },
    {
      name: "Fecha",
      value: eventDate.toLocaleString("es-ES"),
      inline: true,
    },
  ];

  if (repetition !== "none") {
    replyFields.push({
      name: "Repetición",
      value: repetition === "weekly" ? "Semanal (cada 7 días)" : "Mensual (cada 30 días)",
      inline: true,
    });
  }

  if (notifyRoleId) {
    replyFields.push({
      name: "Rol notificado",
      value: `<@&${notifyRoleId}>`,
      inline: true,
    });
  }

  await interaction.editReply({
    embeds: [
      buildEmbed("success", {
        title: "✅ Evento creado",
        description: `${msg}\n\n**ID del evento:** \`${event.id}\``,
        fields: replyFields,
      }),
    ],
  });
}

// ─── /evento cancel ───────────────────────────────────────────────────────────

async function handleCancel(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const guild = interaction.guild!;
  const eventId = interaction.options.getString("id", true);

  const event = eventsStore.get(eventId);

  if (!event || event.guildId !== guild.id || event.cancelled) {
    await interaction.reply({
      embeds: [
        buildEmbed("error", {
          title: "❌ Evento no encontrado",
          description: `No se encontró ningún evento activo con ID \`${eventId}\`.`,
        }),
      ],
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply();

  event.cancelled = true;

  // Cancel pending reminder timeout and recurring cron job
  cancelReminder(eventId);
  cancelRecurring(eventId);

  const config = loadConfig(guild.id);
  const mode = config.personalityMode;

  // Delete announcement message (Req 18.3)
  if (event.announcementChannelId && event.announcementMessageId) {
    try {
      const ch = await guild.channels.fetch(event.announcementChannelId);
      if (ch && ch.isTextBased()) {
        const msg = await (ch as TextChannel).messages.fetch(
          event.announcementMessageId
        );
        await msg.delete();
      }
    } catch {
      // Message already deleted or channel gone — skip
    }
  }

  // Cancel Discord scheduled event
  if (event.discordEventId) {
    try {
      const scheduledEvent = await guild.scheduledEvents.fetch(
        event.discordEventId
      );
      await scheduledEvent.delete();
    } catch {
      // Event already gone — skip
    }
  }

  // Notify attendees via DM (Req 18.3)
  for (const attendeeId of event.attendees) {
    try {
      const member = await guild.members.fetch(attendeeId);
      await member.send(
        `❌ El evento **${event.name}** programado para el ${new Date(event.date).toLocaleString("es-ES")} ha sido cancelado.`
      );
    } catch {
      // DM failed — skip
    }
  }

  await logAction(
    "Evento cancelado",
    event.name,
    `<@${interaction.user.id}> (${interaction.user.username})`,
    new Date().toISOString(),
    guild
  );

  const msg = getMessage(
    "eventCancel",
    { title: event.name, member: interaction.user.username },
    mode
  );

  await interaction.editReply({
    embeds: [
      buildEmbed("success", {
        title: "✅ Evento cancelado",
        description: msg,
      }),
    ],
  });
}

// ─── /evento list ─────────────────────────────────────────────────────────────

async function handleList(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const guild = interaction.guild!;
  const now = Date.now();

  const active = Array.from(eventsStore.values()).filter(
    (e) =>
      e.guildId === guild.id &&
      !e.cancelled &&
      new Date(e.date).getTime() > now
  );

  if (active.length === 0) {
    await interaction.reply({
      embeds: [
        buildEmbed("info", {
          title: "📅 Eventos activos",
          description: "No hay eventos programados actualmente.",
        }),
      ],
    });
    return;
  }

  const fields = active.map((e) => {
    const timeUntil = new Date(e.date).getTime() - now;
    const countdown = formatCountdown(timeUntil);
    const repetitionLabel =
      e.repetition !== "none"
        ? ` 🔁 ${e.repetition === "weekly" ? "Semanal" : "Mensual"}`
        : "";
    const roleLabel = e.notifyRoleId ? ` 🔔 <@&${e.notifyRoleId}>` : "";
    return {
      name: `${e.name} (ID: \`${e.id}\`)`,
      value: `📅 ${new Date(e.date).toLocaleString("es-ES")} — ⏳ ${countdown}${repetitionLabel}${roleLabel}`,
      inline: false,
    };
  });

  await interaction.reply({
    embeds: [
      buildEmbed("info", {
        title: "📅 Eventos activos",
        fields,
      }),
    ],
  });
}
