import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  GuildMember,
  VoiceBasedChannel,
  type SlashCommandStringOption,
} from "discord.js";
import {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
  getVoiceConnection,
  type VoiceConnection,
  type AudioPlayer,
} from "@discordjs/voice";
import ytdl from "@distube/ytdl-core";
// @ts-ignore — ytsr has no bundled types compatible with NodeNext
import ytsr from "ytsr";
import { buildEmbed } from "../../utils/embeds.js";
import { progressBar } from "../../utils/progressBar.js";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Track {
  title: string;
  url: string;
  durationSec: number; // 0 if unknown
  requestedBy: string;
}

interface GuildQueue {
  tracks: Track[];
  player: AudioPlayer;
  connection: VoiceConnection;
  currentStartedAt: number; // Date.now() when current track started
  inactivityTimer: ReturnType<typeof setTimeout> | null;
}

// ─── State ────────────────────────────────────────────────────────────────────

const queues = new Map<string, GuildQueue>();

const INACTIVITY_MS = 5 * 60 * 1000; // 5 minutes
const ENTERTAINMENT_COLOR = 0x9b59b6;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(sec: number): string {
  if (sec <= 0) return "?:??";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function clearInactivity(guildId: string): void {
  const q = queues.get(guildId);
  if (q?.inactivityTimer) {
    clearTimeout(q.inactivityTimer);
    q.inactivityTimer = null;
  }
}

function scheduleInactivity(guildId: string): void {
  clearInactivity(guildId);
  const q = queues.get(guildId);
  if (!q) return;
  q.inactivityTimer = setTimeout(() => {
    destroyQueue(guildId);
  }, INACTIVITY_MS);
}

function destroyQueue(guildId: string): void {
  const q = queues.get(guildId);
  if (!q) return;
  clearInactivity(guildId);
  try {
    q.player.stop(true);
    q.connection.destroy();
  } catch {
    // ignore
  }
  queues.delete(guildId);
}

async function searchYouTube(query: string): Promise<Track | null> {
  try {
    // If it looks like a URL, use directly
    if (query.startsWith("http://") || query.startsWith("https://")) {
      const info = await ytdl.getInfo(query);
      const details = info.videoDetails;
      return {
        title: details.title,
        url: details.video_url,
        durationSec: parseInt(details.lengthSeconds, 10) || 0,
        requestedBy: "",
      };
    }

    // Otherwise search with ytsr
    const results = await ytsr(query, { limit: 5 });
    const video = (results.items as Array<{ type: string; url?: string; title?: string; duration?: string }>)
      .find((item) => item.type === "video" && item.url);

    if (!video || !video.url) return null;

    // Parse duration string "M:SS" or "H:MM:SS"
    let durationSec = 0;
    if (video.duration) {
      const parts = video.duration.split(":").map(Number);
      if (parts.length === 2) {
        durationSec = (parts[0] ?? 0) * 60 + (parts[1] ?? 0);
      } else if (parts.length === 3) {
        durationSec = (parts[0] ?? 0) * 3600 + (parts[1] ?? 0) * 60 + (parts[2] ?? 0);
      }
    }

    return {
      title: video.title ?? "Sin título",
      url: video.url,
      durationSec,
      requestedBy: "",
    };
  } catch {
    return null;
  }
}

function playNext(guildId: string): void {
  const q = queues.get(guildId);
  if (!q) return;

  if (q.tracks.length === 0) {
    scheduleInactivity(guildId);
    return;
  }

  const track = q.tracks[0]!;
  q.currentStartedAt = Date.now();

  try {
    const stream = ytdl(track.url, {
      filter: "audioonly",
      quality: "lowestaudio",
      highWaterMark: 1 << 25,
    });
    const resource = createAudioResource(stream);
    q.player.play(resource);
  } catch {
    // Skip broken track
    q.tracks.shift();
    playNext(guildId);
  }
}

function getOrCreateQueue(
  guildId: string,
  voiceChannel: VoiceBasedChannel
): GuildQueue {
  const existing = queues.get(guildId);
  if (existing) return existing;

  const connection = joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    adapterCreator: voiceChannel.guild.voiceAdapterCreator as any,
  });

  const player = createAudioPlayer();
  connection.subscribe(player);

  const q: GuildQueue = {
    tracks: [],
    player,
    connection,
    currentStartedAt: 0,
    inactivityTimer: null,
  };

  queues.set(guildId, q);

  player.on(AudioPlayerStatus.Idle, () => {
    const queue = queues.get(guildId);
    if (!queue) return;
    queue.tracks.shift();
    if (queue.tracks.length > 0) {
      playNext(guildId);
    } else {
      scheduleInactivity(guildId);
    }
  });

  connection.on(VoiceConnectionStatus.Disconnected, async () => {
    try {
      await Promise.race([
        entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
        entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
      ]);
    } catch {
      destroyQueue(guildId);
    }
  });

  return q;
}

// ─── Command definition ───────────────────────────────────────────────────────

export const data = new SlashCommandBuilder()
  .setName("music")
  .setDescription("Comandos de música")
  .addSubcommand((sub) =>
    sub
      .setName("play")
      .setDescription("Reproduce una canción o la añade a la cola")
      .addStringOption((opt: SlashCommandStringOption) =>
        opt
          .setName("query")
          .setDescription("URL de YouTube o término de búsqueda")
          .setRequired(true)
      )
  )
  .addSubcommand((sub) => sub.setName("skip").setDescription("Salta la canción actual"))
  .addSubcommand((sub) => sub.setName("queue").setDescription("Muestra la cola de reproducción"))
  .addSubcommand((sub) => sub.setName("stop").setDescription("Detiene la música y vacía la cola"))
  .addSubcommand((sub) => sub.setName("pause").setDescription("Pausa la reproducción"))
  .addSubcommand((sub) => sub.setName("resume").setDescription("Reanuda la reproducción"));

// ─── Execute ──────────────────────────────────────────────────────────────────

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guild) {
    await interaction.reply({ content: "Este comando solo funciona en un servidor.", ephemeral: true });
    return;
  }

  const sub = interaction.options.getSubcommand();

  switch (sub) {
    case "play":   await handlePlay(interaction);   break;
    case "skip":   await handleSkip(interaction);   break;
    case "queue":  await handleQueue(interaction);  break;
    case "stop":   await handleStop(interaction);   break;
    case "pause":  await handlePause(interaction);  break;
    case "resume": await handleResume(interaction); break;
  }
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

async function handlePlay(interaction: ChatInputCommandInteraction): Promise<void> {
  const member = interaction.member as GuildMember | null;
  const voiceChannel = member?.voice?.channel as VoiceBasedChannel | null;

  if (!voiceChannel) {
    await interaction.reply({
      embeds: [
        buildEmbed("error", {
          title: "❌ No estás en un canal de voz",
          description: "Únete a un canal de voz antes de usar `/music play`.",
        }),
      ],
      ephemeral: true,
    });
    return;
  }

  const query = interaction.options.getString("query", true);

  await interaction.deferReply();

  // sendTyping while searching
  try {
    if (interaction.channel && "sendTyping" in interaction.channel) {
      await (interaction.channel as { sendTyping(): Promise<void> }).sendTyping();
    }
  } catch {
    // ignore
  }

  const track = await searchYouTube(query);

  if (!track) {
    await interaction.editReply({
      embeds: [
        buildEmbed("error", {
          title: "❌ No se encontró ningún resultado",
          description: `No se pudo encontrar nada para: \`${query}\``,
        }),
      ],
    });
    return;
  }

  track.requestedBy = interaction.user.username;

  const guildId = interaction.guildId!;
  const q = getOrCreateQueue(guildId, voiceChannel);

  const wasEmpty = q.tracks.length === 0;
  q.tracks.push(track);

  if (wasEmpty) {
    clearInactivity(guildId);
    playNext(guildId);
  }

  const bar = track.durationSec > 0
    ? progressBar(0, track.durationSec)
    : progressBar(0, 1);

  const embed = new EmbedBuilder()
    .setColor(ENTERTAINMENT_COLOR)
    .setTitle(wasEmpty ? "🎵 Reproduciendo ahora" : "➕ Añadido a la cola")
    .setDescription(`**${track.title}**`)
    .addFields(
      { name: "Duración", value: formatDuration(track.durationSec), inline: true },
      { name: "Solicitado por", value: track.requestedBy, inline: true },
      { name: "Posición en cola", value: wasEmpty ? "Ahora" : String(q.tracks.length), inline: true },
      { name: "Progreso", value: bar }
    )
    .setFooter({ text: "🎶 La Cueva Music" });

  await interaction.editReply({ embeds: [embed] });
}

async function handleSkip(interaction: ChatInputCommandInteraction): Promise<void> {
  const guildId = interaction.guildId!;
  const q = queues.get(guildId);

  if (!q || q.tracks.length === 0) {
    await interaction.reply({
      embeds: [buildEmbed("error", { title: "❌ No hay nada en la cola", description: "La cola está vacía." })],
      ephemeral: true,
    });
    return;
  }

  const skipped = q.tracks[0]!;
  q.player.stop(); // triggers Idle → playNext

  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(ENTERTAINMENT_COLOR)
        .setTitle("⏭️ Canción saltada")
        .setDescription(`Se saltó: **${skipped.title}**`),
    ],
  });
}

async function handleQueue(interaction: ChatInputCommandInteraction): Promise<void> {
  const guildId = interaction.guildId!;
  const q = queues.get(guildId);

  if (!q || q.tracks.length === 0) {
    await interaction.reply({
      embeds: [buildEmbed("info", { title: "📋 Cola vacía", description: "No hay canciones en la cola." })],
      ephemeral: true,
    });
    return;
  }

  const current = q.tracks[0]!;
  const elapsedSec = Math.floor((Date.now() - q.currentStartedAt) / 1000);
  const remainingSec = Math.max(0, current.durationSec - elapsedSec);

  const bar = current.durationSec > 0
    ? progressBar(elapsedSec, current.durationSec)
    : progressBar(0, 1);

  // Build queue list
  let accumulatedSec = remainingSec;
  const lines: string[] = [];

  lines.push(`**▶ ${current.title}** — ${formatDuration(current.durationSec)}`);
  lines.push(bar);

  for (let i = 1; i < Math.min(q.tracks.length, 10); i++) {
    const t = q.tracks[i]!;
    const eta = formatDuration(accumulatedSec);
    lines.push(`\`${i}.\` **${t.title}** — ${formatDuration(t.durationSec)} (en ~${eta})`);
    accumulatedSec += t.durationSec;
  }

  if (q.tracks.length > 10) {
    lines.push(`_...y ${q.tracks.length - 10} más_`);
  }

  const embed = new EmbedBuilder()
    .setColor(ENTERTAINMENT_COLOR)
    .setTitle(`📋 Cola de reproducción — ${q.tracks.length} pista(s)`)
    .setDescription(lines.join("\n"))
    .setFooter({ text: "🎶 La Cueva Music" });

  await interaction.reply({ embeds: [embed] });
}

async function handleStop(interaction: ChatInputCommandInteraction): Promise<void> {
  const guildId = interaction.guildId!;
  const q = queues.get(guildId);

  if (!q) {
    await interaction.reply({
      embeds: [buildEmbed("error", { title: "❌ No hay reproducción activa", description: "El bot no está reproduciendo música." })],
      ephemeral: true,
    });
    return;
  }

  destroyQueue(guildId);

  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(ENTERTAINMENT_COLOR)
        .setTitle("⏹️ Reproducción detenida")
        .setDescription("La cola ha sido vaciada y el bot ha abandonado el canal de voz."),
    ],
  });
}

async function handlePause(interaction: ChatInputCommandInteraction): Promise<void> {
  const guildId = interaction.guildId!;
  const q = queues.get(guildId);

  if (!q || q.player.state.status === AudioPlayerStatus.Idle) {
    await interaction.reply({
      embeds: [buildEmbed("error", { title: "❌ No hay reproducción activa" })],
      ephemeral: true,
    });
    return;
  }

  q.player.pause();

  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(ENTERTAINMENT_COLOR)
        .setTitle("⏸️ Pausado")
        .setDescription("La reproducción ha sido pausada. Usa `/music resume` para continuar."),
    ],
  });
}

async function handleResume(interaction: ChatInputCommandInteraction): Promise<void> {
  const guildId = interaction.guildId!;
  const q = queues.get(guildId);

  if (!q || q.player.state.status !== AudioPlayerStatus.Paused) {
    await interaction.reply({
      embeds: [buildEmbed("error", { title: "❌ La reproducción no está pausada" })],
      ephemeral: true,
    });
    return;
  }

  q.player.unpause();

  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(ENTERTAINMENT_COLOR)
        .setTitle("▶️ Reanudado")
        .setDescription("La reproducción ha sido reanudada."),
    ],
  });
}

// ─── Exported queue helpers (for property tests) ──────────────────────────────

export { queues, type Track, type GuildQueue };
