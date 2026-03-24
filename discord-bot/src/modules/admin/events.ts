import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  TextChannel,
  EmbedBuilder,
  GuildScheduledEventEntityType,
  GuildScheduledEventPrivacyLevel,
} from "discord.js";
import { readData, writeData } from "../../utils/dataStore.js";
import { buildEmbed, EMBED_COLORS } from "../../utils/embeds.js";
import { getMessage } from "../../utils/personality.js";
import { logAction } from "./auditLog.js";
import type { GuildConfig } from "../../types/index.js";

// ─── Types ────────────────────────────────────────────────────────────────────

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
}

interface EventsStore {
  events: GuildEvent[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function loadEvents(): EventsStore {
  return readData<EventsStore>("events.json", { events: [] });
}

function saveEvents(store: EventsStore): void {
  writeData("events.json", store);
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Formats milliseconds into "Xh Ym" countdown string.
 */
export function formatCountdown(ms: number): string {
  const totalMinutes = Math.max(0, Math.floor(ms / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

// ─── Reminder scheduler ───────────────────────────────────────────────────────

let reminderInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Starts the reminder loop. Should be called once at bot startup.
 * Checks every minute for events starting within the next hour.
 */
export function startReminderScheduler(
  getClient: () => import("discord.js").Client
): void {
  if (reminderInterval) return;

  reminderInterval = setInterval(async () => {
    const store = loadEvents();
    const now = Date.now();
    const ONE_HOUR = 60 * 60 * 1000;

    for (const event of store.events) {
      if (event.cancelled || event.reminded) continue;

      const eventTime = new Date(event.date).getTime();
      const timeUntil = eventTime - now;

      if (timeUntil > 0 && timeUntil <= ONE_HOUR) {
        event.reminded = true;
        saveEvents(store);

        const client = getClient();
        try {
          const guild = await client.guilds.fetch(event.guildId);
          const config = loadConfig();

          if (!config.announcementsChannelId) continue;
          const ch = await guild.channels.fetch(config.announcementsChannelId);
          if (!ch || !ch.isTextBased()) continue;

          const countdown = formatCountdown(timeUntil);
          const mentions = event.attendees.map((id) => `<@${id}>`).join(" ") || "";

          // Build GIF URL if configured
          let imageUrl: string | undefined;
          if (config.personalityMode !== "formal" && config.gifUrls.event) {
            try {
              const res = await fetch(config.gifUrls.event, { method: "HEAD" });
              if (res.ok) imageUrl = config.gifUrls.event;
            } catch {
              // GIF not accessible — omit
            }
          }

          const embed = new EmbedBuilder()
            .setColor(EMBED_COLORS.info)
            .setTitle(`⏰ Recordatorio — ${event.name}`)
            .setDescription(
              `El evento **${event.name}** comienza en **${countdown}**.\n\n${event.description}`
            )
            .addFields(
              { name: "Fecha", value: new Date(event.date).toLocaleString("es-ES"), inline: true },
              { name: "Cuenta regresiva", value: countdown, inline: true }
            )
            .setTimestamp();

          if (imageUrl) embed.setImage(imageUrl);

          await (ch as TextChannel).send({
            content: mentions || undefined,
            embeds: [embed],
          });
        } catch {
          // Guild or channel not accessible — skip
        }
      }
    }
  }, 60_000);
}

export function stopReminderScheduler(): void {
  if (reminderInterval) {
    clearInterval(reminderInterval);
    reminderInterval = null;
  }
}

// ─── Command definition ───────────────────────────────────────────────────────

export const data = new SlashCommandBuilder()
  .setName("evento")
  .setDescription("Gestiona eventos del servidor")
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
          .setDescription("Fecha y hora en formato ISO 8601 (ej: 2025-12-31T20:00:00)")
          .setRequired(true)
      )
      .addStringOption((opt) =>
        opt.setName("descripcion").setDescription("Descripción del evento").setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("cancel")
      .setDescription("Cancela un evento existente")
      .addStringOption((opt) =>
        opt.setName("id").setDescription("ID del evento a cancelar").setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub.setName("list").setDescription("Lista los eventos activos")
  );

// ─── Execute ──────────────────────────────────────────────────────────────────

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guild) {
    await interaction.reply({ content: "Este comando solo funciona en un servidor.", ephemeral: true });
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

async function handleCreate(interaction: ChatInputCommandInteraction): Promise<void> {
  const guild = interaction.guild!;
  const name = interaction.options.getString("nombre", true);
  const dateStr = interaction.options.getString("fecha_iso", true);
  const description = interaction.options.getString("descripcion", true);

  // Validate date is in the future
  const eventDate = new Date(dateStr);
  if (isNaN(eventDate.getTime()) || eventDate.getTime() <= Date.now()) {
    await interaction.reply({
      embeds: [
        buildEmbed("error", {
          title: "❌ Fecha inválida",
          description: "La fecha debe ser válida y posterior al momento actual. Usa formato ISO 8601, por ejemplo: `2025-12-31T20:00:00`",
        }),
      ],
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply();

  const config = loadConfig();
  const mode = config.personalityMode;

  // Create Discord Guild Scheduled Event
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

  // Build announcement embed
  let imageUrl: string | undefined;
  if (mode !== "formal" && config.gifUrls.event) {
    try {
      const res = await fetch(config.gifUrls.event, { method: "HEAD" });
      if (res.ok) imageUrl = config.gifUrls.event;
    } catch {
      // GIF not accessible — omit
    }
  }

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.info)
    .setTitle(`🎉 Nuevo evento — ${name}`)
    .setDescription(description)
    .addFields(
      { name: "Fecha", value: eventDate.toLocaleString("es-ES"), inline: true },
      { name: "Organizador", value: `<@${interaction.user.id}>`, inline: true }
    )
    .setTimestamp();

  if (imageUrl) embed.setImage(imageUrl);

  // Publish announcement
  let announcementMessageId: string | null = null;
  let announcementChannelId: string | null = null;

  if (config.announcementsChannelId) {
    try {
      const ch = await guild.channels.fetch(config.announcementsChannelId);
      if (ch && ch.isTextBased()) {
        const msg = await (ch as TextChannel).send({ embeds: [embed] });
        announcementMessageId = msg.id;
        announcementChannelId = ch.id;
      }
    } catch {
      // Channel not accessible — skip announcement
    }
  }

  // Persist event
  const store = loadEvents();
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
  };
  store.events.push(event);
  saveEvents(store);

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

  await interaction.editReply({
    embeds: [
      buildEmbed("success", {
        title: "✅ Evento creado",
        description: `${msg}\n\n**ID del evento:** \`${event.id}\``,
        fields: [
          { name: "Nombre", value: name, inline: true },
          { name: "Fecha", value: eventDate.toLocaleString("es-ES"), inline: true },
        ],
      }),
    ],
  });
}

// ─── /evento cancel ───────────────────────────────────────────────────────────

async function handleCancel(interaction: ChatInputCommandInteraction): Promise<void> {
  const guild = interaction.guild!;
  const eventId = interaction.options.getString("id", true);

  const store = loadEvents();
  const event = store.events.find((e) => e.id === eventId && e.guildId === guild.id);

  if (!event || event.cancelled) {
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
  saveEvents(store);

  const config = loadConfig();
  const mode = config.personalityMode;

  // Delete announcement message
  if (event.announcementChannelId && event.announcementMessageId) {
    try {
      const ch = await guild.channels.fetch(event.announcementChannelId);
      if (ch && ch.isTextBased()) {
        const msg = await (ch as TextChannel).messages.fetch(event.announcementMessageId);
        await msg.delete();
      }
    } catch {
      // Message already deleted or channel gone — skip
    }
  }

  // Cancel Discord scheduled event
  if (event.discordEventId) {
    try {
      const scheduledEvent = await guild.scheduledEvents.fetch(event.discordEventId);
      await scheduledEvent.delete();
    } catch {
      // Event already gone — skip
    }
  }

  // Notify attendees
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

async function handleList(interaction: ChatInputCommandInteraction): Promise<void> {
  const guild = interaction.guild!;
  const store = loadEvents();
  const now = Date.now();

  const active = store.events.filter(
    (e) => e.guildId === guild.id && !e.cancelled && new Date(e.date).getTime() > now
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
    return {
      name: `${e.name} (ID: \`${e.id}\`)`,
      value: `📅 ${new Date(e.date).toLocaleString("es-ES")} — ⏳ ${countdown}`,
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
