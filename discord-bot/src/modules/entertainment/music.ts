import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  GuildMember,
  VoiceBasedChannel,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ButtonInteraction,
  ComponentType,
  type SlashCommandStringOption,
} from "discord.js";
import {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
  StreamType,
  type VoiceConnection,
  type AudioPlayer,
} from "@discordjs/voice";
import ytdl from "@distube/ytdl-core";
// @ts-ignore — ytsr has no bundled types compatible with NodeNext
import ytsr from "ytsr";
import { Client as GeniusClient } from "genius-lyrics";
import { buildEmbed } from "../../utils/embeds.js";
import { progressBar } from "../../utils/progressBar.js";
import { getDb } from "../../utils/database.js";
import { randomUUID } from "node:crypto";

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
  filter: AudioFilter | null;
}

type AudioFilter = "bassboost" | "nightcore";

// ─── State ────────────────────────────────────────────────────────────────────

const queues = new Map<string, GuildQueue>();

const INACTIVITY_MS = 5 * 60 * 1000; // 5 minutes
const ENTERTAINMENT_COLOR = 0x9b59b6;

// FFmpeg filter args per filter type
const FILTER_ARGS: Record<AudioFilter, string[]> = {
  bassboost: ["-af", "bass=g=10"],
  nightcore: ["-af", "asetrate=44100*1.25,aresample=44100"],
};

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

    const results = await ytsr(query, { limit: 5 });
    const video = (results.items as Array<{ type: string; url?: string; title?: string; duration?: string }>)
      .find((item) => item.type === "video" && item.url);

    if (!video || !video.url) return null;

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

    let resource;
    if (q.filter && FILTER_ARGS[q.filter]) {
      resource = createAudioResource(stream, {
        inputType: StreamType.Arbitrary,
        inlineVolume: false,
        // @ts-ignore — ffmpegArgs is supported at runtime
        ffmpegArgs: FILTER_ARGS[q.filter],
      });
    } else {
      resource = createAudioResource(stream);
    }

    q.player.play(resource);
  } catch {
    q.tracks.shift();
    playNext(guildId);
  }
}

function getOrCreateQueue(guildId: string, voiceChannel: VoiceBasedChannel): GuildQueue {
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
    filter: null,
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

/** Build the player control buttons row */
function buildControlRow(): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("music_pause")
      .setEmoji("⏸️")
      .setLabel("Pausa")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("music_skip")
      .setEmoji("⏭️")
      .setLabel("Skip")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("music_stop")
      .setEmoji("⏹️")
      .setLabel("Parar")
      .setStyle(ButtonStyle.Danger),
  );
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
  .addSubcommand((sub) => sub.setName("resume").setDescription("Reanuda la reproducción"))
  .addSubcommand((sub) =>
    sub
      .setName("filter")
      .setDescription("Aplica un filtro de audio a la reproducción actual")
      .addStringOption((opt) =>
        opt
          .setName("nombre")
          .setDescription("Filtro a aplicar")
          .setRequired(true)
          .addChoices(
            { name: "Bassboost", value: "bassboost" },
            { name: "Nightcore", value: "nightcore" },
          )
      )
  )
  .addSubcommand((sub) => sub.setName("lyrics").setDescription("Muestra la letra de la canción actual"))
  .addSubcommandGroup((group) =>
    group
      .setName("playlist")
      .setDescription("Gestión de playlists personalizadas")
      .addSubcommand((sub) =>
        sub
          .setName("create")
          .setDescription("Crea una nueva playlist")
          .addStringOption((opt) =>
            opt.setName("nombre").setDescription("Nombre de la playlist").setRequired(true)
          )
      )
      .addSubcommand((sub) =>
        sub
          .setName("load")
          .setDescription("Carga una playlist en la cola")
          .addStringOption((opt) =>
            opt.setName("nombre").setDescription("Nombre de la playlist").setRequired(true)
          )
      )
  );

// ─── Execute ──────────────────────────────────────────────────────────────────

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guild) {
    await interaction.reply({ content: "Este comando solo funciona en un servidor.", ephemeral: true });
    return;
  }

  const group = interaction.options.getSubcommandGroup(false);
  const sub = interaction.options.getSubcommand();

  if (group === "playlist") {
    if (sub === "create") await handlePlaylistCreate(interaction);
    else if (sub === "load") await handlePlaylistLoad(interaction);
    return;
  }

  switch (sub) {
    case "play":    await handlePlay(interaction);   break;
    case "skip":    await handleSkip(interaction);   break;
    case "queue":   await handleQueue(interaction);  break;
    case "stop":    await handleStop(interaction);   break;
    case "pause":   await handlePause(interaction);  break;
    case "resume":  await handleResume(interaction); break;
    case "filter":  await handleFilter(interaction); break;
    case "lyrics":  await handleLyrics(interaction); break;
  }
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

async function handlePlay(interaction: ChatInputCommandInteraction): Promise<void> {
  const member = interaction.member as GuildMember | null;
  const voiceChannel = member?.voice?.channel as VoiceBasedChannel | null;

  if (!voiceChannel) {
    await interaction.reply({
      embeds: [buildEmbed("error", { title: "❌ No estás en un canal de voz", description: "Únete a un canal de voz antes de usar `/music play`." })],
      ephemeral: true,
    });
    return;
  }

  const query = interaction.options.getString("query", true);
  await interaction.deferReply();

  const track = await searchYouTube(query);

  if (!track) {
    await interaction.editReply({
      embeds: [buildEmbed("error", { title: "❌ No se encontró ningún resultado", description: `No se pudo encontrar nada para: \`${query}\`` })],
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

  const bar = track.durationSec > 0 ? progressBar(0, track.durationSec) : progressBar(0, 1);

  const embed = new EmbedBuilder()
    .setColor(ENTERTAINMENT_COLOR)
    .setTitle(wasEmpty ? "🎵 Reproduciendo ahora" : "➕ Añadido a la cola")
    .setDescription(`**${track.title}**`)
    .addFields(
      { name: "Duración", value: formatDuration(track.durationSec), inline: true },
      { name: "Solicitado por", value: track.requestedBy, inline: true },
      { name: "Posición en cola", value: wasEmpty ? "Ahora" : String(q.tracks.length), inline: true },
      { name: "Progreso", value: bar },
    )
    .setFooter({ text: "🎶 La Cueva Music" });

  const row = buildControlRow();
  const reply = await interaction.editReply({ embeds: [embed], components: [row] });

  // Collect button interactions for this player message
  const collector = reply.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 10 * 60 * 1000, // 10 minutes
  });

  collector.on("collect", async (btn: ButtonInteraction) => {
    const gId = btn.guildId;
    if (!gId) return;
    const queue = queues.get(gId);

    if (btn.customId === "music_pause") {
      if (queue && queue.player.state.status === AudioPlayerStatus.Playing) {
        queue.player.pause();
        await btn.reply({ content: "⏸️ Pausado.", ephemeral: true });
      } else if (queue && queue.player.state.status === AudioPlayerStatus.Paused) {
        queue.player.unpause();
        await btn.reply({ content: "▶️ Reanudado.", ephemeral: true });
      } else {
        await btn.reply({ content: "No hay reproducción activa.", ephemeral: true });
      }
    } else if (btn.customId === "music_skip") {
      if (queue && queue.tracks.length > 0) {
        const skipped = queue.tracks[0]!.title;
        queue.player.stop();
        await btn.reply({ content: `⏭️ Saltado: **${skipped}**`, ephemeral: true });
      } else {
        await btn.reply({ content: "No hay nada en la cola.", ephemeral: true });
      }
    } else if (btn.customId === "music_stop") {
      if (queue) {
        destroyQueue(gId);
        await btn.reply({ content: "⏹️ Reproducción detenida.", ephemeral: true });
        collector.stop();
      } else {
        await btn.reply({ content: "No hay reproducción activa.", ephemeral: true });
      }
    }
  });

  collector.on("end", async () => {
    try {
      await interaction.editReply({ components: [] });
    } catch {
      // message may have been deleted
    }
  });
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
  q.player.stop();

  await interaction.reply({
    embeds: [new EmbedBuilder().setColor(ENTERTAINMENT_COLOR).setTitle("⏭️ Canción saltada").setDescription(`Se saltó: **${skipped.title}**`)],
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
  const bar = current.durationSec > 0 ? progressBar(elapsedSec, current.durationSec) : progressBar(0, 1);

  let accumulatedSec = Math.max(0, current.durationSec - elapsedSec);
  const lines: string[] = [];
  lines.push(`**▶ ${current.title}** — ${formatDuration(current.durationSec)}`);
  lines.push(bar);
  if (q.filter) lines.push(`🎛️ Filtro activo: **${q.filter}**`);

  for (let i = 1; i < Math.min(q.tracks.length, 10); i++) {
    const t = q.tracks[i]!;
    lines.push(`\`${i}.\` **${t.title}** — ${formatDuration(t.durationSec)} (en ~${formatDuration(accumulatedSec)})`);
    accumulatedSec += t.durationSec;
  }

  if (q.tracks.length > 10) lines.push(`_...y ${q.tracks.length - 10} más_`);

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
    embeds: [new EmbedBuilder().setColor(ENTERTAINMENT_COLOR).setTitle("⏹️ Reproducción detenida").setDescription("La cola ha sido vaciada y el bot ha abandonado el canal de voz.")],
  });
}

async function handlePause(interaction: ChatInputCommandInteraction): Promise<void> {
  const guildId = interaction.guildId!;
  const q = queues.get(guildId);

  if (!q || q.player.state.status === AudioPlayerStatus.Idle) {
    await interaction.reply({ embeds: [buildEmbed("error", { title: "❌ No hay reproducción activa" })], ephemeral: true });
    return;
  }

  q.player.pause();
  await interaction.reply({
    embeds: [new EmbedBuilder().setColor(ENTERTAINMENT_COLOR).setTitle("⏸️ Pausado").setDescription("Usa `/music resume` para continuar.")],
  });
}

async function handleResume(interaction: ChatInputCommandInteraction): Promise<void> {
  const guildId = interaction.guildId!;
  const q = queues.get(guildId);

  if (!q || q.player.state.status !== AudioPlayerStatus.Paused) {
    await interaction.reply({ embeds: [buildEmbed("error", { title: "❌ La reproducción no está pausada" })], ephemeral: true });
    return;
  }

  q.player.unpause();
  await interaction.reply({
    embeds: [new EmbedBuilder().setColor(ENTERTAINMENT_COLOR).setTitle("▶️ Reanudado").setDescription("La reproducción ha sido reanudada.")],
  });
}

async function handleFilter(interaction: ChatInputCommandInteraction): Promise<void> {
  const guildId = interaction.guildId!;
  const q = queues.get(guildId);

  if (!q || q.tracks.length === 0) {
    await interaction.reply({
      embeds: [buildEmbed("error", { title: "❌ No hay reproducción activa", description: "Reproduce algo primero con `/music play`." })],
      ephemeral: true,
    });
    return;
  }

  const filterName = interaction.options.getString("nombre", true) as AudioFilter;
  q.filter = filterName;

  // Restart current track with the new filter applied
  const current = q.tracks[0]!;
  q.player.stop(); // triggers Idle → playNext which will use the new filter

  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(ENTERTAINMENT_COLOR)
        .setTitle("🎛️ Filtro aplicado")
        .setDescription(`Filtro **${filterName}** activado. Reiniciando pista: **${current.title}**`)
        .setFooter({ text: "🎶 La Cueva Music" }),
    ],
  });
}

async function handleLyrics(interaction: ChatInputCommandInteraction): Promise<void> {
  const guildId = interaction.guildId!;
  const q = queues.get(guildId);

  if (!q || q.tracks.length === 0) {
    await interaction.reply({
      embeds: [buildEmbed("error", { title: "❌ No hay reproducción activa", description: "Reproduce algo primero con `/music play`." })],
      ephemeral: true,
    });
    return;
  }

  const current = q.tracks[0]!;
  await interaction.deferReply();

  try {
    const genius = new GeniusClient(process.env["GENIUS_API_KEY"]);
    const searches = await genius.songs.search(current.title);
    const song = searches[0];

    if (!song) {
      await interaction.editReply({
        embeds: [buildEmbed("error", { title: "❌ Letra no encontrada", description: `No se encontró letra para: **${current.title}**` })],
      });
      return;
    }

    const lyrics = await song.lyrics();

    if (!lyrics) {
      await interaction.editReply({
        embeds: [buildEmbed("error", { title: "❌ Letra no disponible", description: `No se pudo obtener la letra de: **${current.title}**` })],
      });
      return;
    }

    // Truncate if too long for Discord embed (max 4096 chars)
    const MAX_LEN = 3900;
    const displayLyrics = lyrics.length > MAX_LEN
      ? lyrics.slice(0, MAX_LEN) + "\n\n_...letra truncada_"
      : lyrics;

    const embed = new EmbedBuilder()
      .setColor(ENTERTAINMENT_COLOR)
      .setTitle(`🎤 ${song.title}`)
      .setDescription(displayLyrics)
      .setFooter({ text: `Artista: ${song.artist.name} • Fuente: Genius` });

    await interaction.editReply({ embeds: [embed] });
  } catch {
    await interaction.editReply({
      embeds: [buildEmbed("error", { title: "❌ Error al buscar letra", description: "No se pudo conectar con Genius. Inténtalo más tarde." })],
    });
  }
}

async function handlePlaylistCreate(interaction: ChatInputCommandInteraction): Promise<void> {
  const name = interaction.options.getString("nombre", true).trim();
  const memberId = interaction.user.id;
  const guildId = interaction.guildId!;

  if (!name || name.length > 50) {
    await interaction.reply({
      embeds: [buildEmbed("error", { title: "❌ Nombre inválido", description: "El nombre debe tener entre 1 y 50 caracteres." })],
      ephemeral: true,
    });
    return;
  }

  try {
    const db = getDb();

    // Check if playlist with same name already exists for this user/guild
    const existing = db.prepare(
      "SELECT id FROM playlists WHERE member_id = ? AND guild_id = ? AND name = ?"
    ).get(memberId, guildId, name);

    if (existing) {
      await interaction.reply({
        embeds: [buildEmbed("error", { title: "❌ Playlist ya existe", description: `Ya tienes una playlist llamada **${name}**.` })],
        ephemeral: true,
      });
      return;
    }

    const id = randomUUID();
    db.prepare("INSERT INTO playlists (id, member_id, guild_id, name) VALUES (?, ?, ?, ?)").run(id, memberId, guildId, name);

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(ENTERTAINMENT_COLOR)
          .setTitle("✅ Playlist creada")
          .setDescription(`Playlist **${name}** creada correctamente.\nUsa \`/music play\` para añadir canciones y luego guárdalas con el ID: \`${id}\``)
          .setFooter({ text: "🎶 La Cueva Music" }),
      ],
    });
  } catch {
    await interaction.reply({
      embeds: [buildEmbed("error", { title: "❌ Error al crear playlist", description: "No se pudo guardar la playlist. Inténtalo más tarde." })],
      ephemeral: true,
    });
  }
}

async function handlePlaylistLoad(interaction: ChatInputCommandInteraction): Promise<void> {
  const name = interaction.options.getString("nombre", true).trim();
  const memberId = interaction.user.id;
  const guildId = interaction.guildId!;

  const member = interaction.member as GuildMember | null;
  const voiceChannel = member?.voice?.channel as VoiceBasedChannel | null;

  if (!voiceChannel) {
    await interaction.reply({
      embeds: [buildEmbed("error", { title: "❌ No estás en un canal de voz", description: "Únete a un canal de voz antes de cargar una playlist." })],
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply();

  try {
    const db = getDb();

    const playlist = db.prepare(
      "SELECT id FROM playlists WHERE member_id = ? AND guild_id = ? AND name = ?"
    ).get(memberId, guildId, name) as { id: string } | undefined;

    if (!playlist) {
      await interaction.editReply({
        embeds: [buildEmbed("error", { title: "❌ Playlist no encontrada", description: `No tienes ninguna playlist llamada **${name}**.` })],
      });
      return;
    }

    const tracks = db.prepare(
      "SELECT url, title, duration FROM playlist_tracks WHERE playlist_id = ? ORDER BY position ASC"
    ).all(playlist.id) as Array<{ url: string; title: string; duration: number }>;

    if (tracks.length === 0) {
      await interaction.editReply({
        embeds: [buildEmbed("info", { title: "📋 Playlist vacía", description: `La playlist **${name}** no tiene pistas.` })],
      });
      return;
    }

    const q = getOrCreateQueue(guildId, voiceChannel);
    const wasEmpty = q.tracks.length === 0;

    for (const t of tracks) {
      q.tracks.push({
        title: t.title,
        url: t.url,
        durationSec: t.duration,
        requestedBy: interaction.user.username,
      });
    }

    if (wasEmpty) {
      clearInactivity(guildId);
      playNext(guildId);
    }

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(ENTERTAINMENT_COLOR)
          .setTitle("📂 Playlist cargada")
          .setDescription(`Se añadieron **${tracks.length}** pistas de la playlist **${name}** a la cola.`)
          .setFooter({ text: "🎶 La Cueva Music" }),
      ],
    });
  } catch {
    await interaction.editReply({
      embeds: [buildEmbed("error", { title: "❌ Error al cargar playlist", description: "No se pudo cargar la playlist. Inténtalo más tarde." })],
    });
  }
}

// ─── Exported queue helpers (for property tests) ──────────────────────────────

export { queues, type Track, type GuildQueue, type AudioFilter };
