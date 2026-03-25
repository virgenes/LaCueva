import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  Client,
  TextChannel,
  ComponentType,
} from "discord.js";
import { loadConfig } from "../../utils/dataStore.js";
import { buildPaginationRow, PAGINATION_PREV_ID, PAGINATION_NEXT_ID } from "../../utils/pagination.js";
import { buildEmbed } from "../../utils/embeds.js";
import { logger } from "../../utils/logger.js";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TwitchTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface TwitchStream {
  id: string;
  user_id: string;
  user_login: string;
  user_name: string;
  game_name: string;
  title: string;
  viewer_count: number;
  thumbnail_url: string;
}

interface TwitchStreamsResponse {
  data: TwitchStream[];
}

interface IntegrationsConfig {
  twitchChannels?: string[];          // Twitch login names to monitor
  twitchNotifyChannelId?: string;     // Discord channel to post Twitch notifications
  youtubeChannelIds?: string[];       // YouTube channel IDs to monitor
  youtubeNotifyChannelId?: string;    // Discord channel to post YouTube notifications
}

interface RedditPost {
  data: {
    id: string;
    title: string;
    author: string;
    subreddit: string;
    url: string;
    permalink: string;
    score: number;
    num_comments: number;
    is_video: boolean;
    selftext: string;
  };
}

interface RedditListingResponse {
  data: {
    children: RedditPost[];
  };
}

// ─── State ────────────────────────────────────────────────────────────────────

/** Twitch stream IDs already notified — prevents duplicate notifications */
const notifiedStreams = new Set<string>();

/** YouTube video IDs already notified — prevents duplicate notifications */
const notifiedVideos = new Set<string>();

let twitchAccessToken: string | null = null;
let twitchTokenExpiry = 0;

// ─── Twitch helpers ───────────────────────────────────────────────────────────

async function getTwitchToken(): Promise<string | null> {
  const clientId = process.env["TWITCH_CLIENT_ID"];
  const clientSecret = process.env["TWITCH_CLIENT_SECRET"];

  if (!clientId || !clientSecret) return null;

  if (twitchAccessToken && Date.now() < twitchTokenExpiry) {
    return twitchAccessToken;
  }

  try {
    const res = await fetch(
      `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`,
      { method: "POST" }
    );

    if (!res.ok) throw new Error(`Twitch token request failed: ${res.status}`);

    const json = (await res.json()) as TwitchTokenResponse;
    twitchAccessToken = json.access_token;
    // Refresh 60 seconds before expiry
    twitchTokenExpiry = Date.now() + (json.expires_in - 60) * 1000;
    return twitchAccessToken;
  } catch (err) {
    logger.error("[integrations] Failed to get Twitch token:", err);
    return null;
  }
}

async function checkTwitchStreams(client: Client): Promise<void> {
  const clientId = process.env["TWITCH_CLIENT_ID"];
  if (!clientId) return;

  const token = await getTwitchToken();
  if (!token) return;

  // Gather all guilds' Twitch config
  const guilds = client.guilds.cache;

  for (const [, guild] of guilds) {
    const guildConfig = loadConfig(guild.id) as ReturnType<typeof loadConfig> & IntegrationsConfig;
    const channels = guildConfig.twitchChannels;
    const notifyChannelId = guildConfig.twitchNotifyChannelId;

    if (!channels?.length || !notifyChannelId) continue;

    try {
      const loginParams = channels.map((ch) => `user_login=${encodeURIComponent(ch)}`).join("&");
      const res = await fetch(`https://api.twitch.tv/helix/streams?${loginParams}`, {
        headers: {
          "Client-ID": clientId,
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error(`Twitch streams API responded with ${res.status}`);

      const json = (await res.json()) as TwitchStreamsResponse;
      const liveStreams = json.data;

      for (const stream of liveStreams) {
        if (notifiedStreams.has(stream.id)) continue;

        notifiedStreams.add(stream.id);

        try {
          const notifyChannel = await guild.channels.fetch(notifyChannelId) as TextChannel | null;
          if (!notifyChannel) continue;

          const thumbnailUrl = stream.thumbnail_url
            .replace("{width}", "320")
            .replace("{height}", "180");

          const embed = new EmbedBuilder()
            .setColor(0x9146ff) // Twitch purple
            .setTitle(`🔴 ${stream.user_name} está en vivo!`)
            .setDescription(stream.title)
            .addFields(
              { name: "🎮 Juego", value: stream.game_name || "Sin categoría", inline: true },
              { name: "👥 Espectadores", value: stream.viewer_count.toLocaleString("es-ES"), inline: true }
            )
            .setThumbnail(thumbnailUrl)
            .setURL(`https://twitch.tv/${stream.user_login}`)
            .setFooter({ text: "Twitch" })
            .setTimestamp();

          await notifyChannel.send({ embeds: [embed] });
        } catch (sendErr) {
          logger.error(`[integrations] Failed to send Twitch notification for ${stream.user_login}:`, sendErr);
        }
      }
    } catch (err) {
      logger.error(`[integrations] Twitch check failed for guild ${guild.id}:`, err);
    }
  }
}

// ─── YouTube helpers ──────────────────────────────────────────────────────────

interface YouTubeFeedEntry {
  id: string;
  title: string;
  link: string;
  channelTitle: string;
  published: string;
}

function parseYouTubeFeed(xml: string): YouTubeFeedEntry[] {
  const entries: YouTubeFeedEntry[] = [];

  // Simple regex-based XML parsing for RSS feed
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match: RegExpExecArray | null;

  while ((match = entryRegex.exec(xml)) !== null) {
    const entryXml = match[1]!;

    const videoIdMatch = /<yt:videoId>(.*?)<\/yt:videoId>/.exec(entryXml);
    const titleMatch = /<title>(.*?)<\/title>/.exec(entryXml);
    const linkMatch = /<link rel="alternate" href="(.*?)"/.exec(entryXml);
    const channelMatch = /<name>(.*?)<\/name>/.exec(entryXml);
    const publishedMatch = /<published>(.*?)<\/published>/.exec(entryXml);

    if (videoIdMatch && titleMatch) {
      entries.push({
        id: videoIdMatch[1]!,
        title: titleMatch[1]!,
        link: linkMatch?.[1] ?? `https://www.youtube.com/watch?v=${videoIdMatch[1]}`,
        channelTitle: channelMatch?.[1] ?? "YouTube",
        published: publishedMatch?.[1] ?? new Date().toISOString(),
      });
    }
  }

  return entries;
}

async function checkYouTubeFeeds(client: Client): Promise<void> {
  const guilds = client.guilds.cache;

  for (const [, guild] of guilds) {
    const guildConfig = loadConfig(guild.id) as ReturnType<typeof loadConfig> & IntegrationsConfig;
    const channelIds = guildConfig.youtubeChannelIds;
    const notifyChannelId = guildConfig.youtubeNotifyChannelId;

    if (!channelIds?.length || !notifyChannelId) continue;

    for (const ytChannelId of channelIds) {
      try {
        const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${ytChannelId}`;
        const res = await fetch(feedUrl, {
          headers: { "User-Agent": "LaCueva-DiscordBot/1.0" },
        });

        if (!res.ok) throw new Error(`YouTube RSS responded with ${res.status}`);

        const xml = await res.text();
        const entries = parseYouTubeFeed(xml);

        // Only check the latest 5 entries
        for (const entry of entries.slice(0, 5)) {
          if (notifiedVideos.has(entry.id)) continue;

          notifiedVideos.add(entry.id);

          try {
            const notifyChannel = await guild.channels.fetch(notifyChannelId) as TextChannel | null;
            if (!notifyChannel) continue;

            const embed = new EmbedBuilder()
              .setColor(0xff0000) // YouTube red
              .setTitle(`📺 Nuevo video de ${entry.channelTitle}`)
              .setDescription(entry.title)
              .setURL(entry.link)
              .addFields({
                name: "📅 Publicado",
                value: new Date(entry.published).toLocaleString("es-ES"),
                inline: true,
              })
              .setFooter({ text: "YouTube" })
              .setTimestamp();

            await notifyChannel.send({ embeds: [embed] });
          } catch (sendErr) {
            logger.error(`[integrations] Failed to send YouTube notification for ${ytChannelId}:`, sendErr);
          }
        }
      } catch (err) {
        logger.error(`[integrations] YouTube feed check failed for channel ${ytChannelId}:`, err);
      }
    }
  }
}

// ─── Init polling ─────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Starts polling Twitch and YouTube every 5 minutes.
 * Errors are logged without interrupting the bot.
 * Requirements: 24.1, 24.2, 24.4
 */
export function initIntegrations(client: Client): void {
  const poll = (): void => {
    checkTwitchStreams(client).catch((err) => {
      logger.error("[integrations] Unhandled error in Twitch poll:", err);
    });
    checkYouTubeFeeds(client).catch((err) => {
      logger.error("[integrations] Unhandled error in YouTube poll:", err);
    });
  };

  // Initial poll after a short delay to let the client settle
  setTimeout(poll, 10_000);
  setInterval(poll, POLL_INTERVAL_MS);
}

// ─── /reddit command ──────────────────────────────────────────────────────────

const POSTS_PER_PAGE = 5;

export const data = new SlashCommandBuilder()
  .setName("reddit")
  .setDescription("Obtiene los posts más recientes de un subreddit")
  .addStringOption((opt) =>
    opt
      .setName("subreddit")
      .setDescription("Nombre del subreddit (sin r/)")
      .setRequired(true)
  );

/**
 * Handles /reddit <subreddit> — fetches 5 newest posts with pagination.
 * Requirements: 24.3
 */
export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const subreddit = interaction.options.getString("subreddit", true).trim().replace(/^r\//i, "");

  await interaction.deferReply();

  try {
    const url = `https://www.reddit.com/r/${encodeURIComponent(subreddit)}/new.json?limit=25`;
    const res = await fetch(url, {
      headers: { "User-Agent": "LaCueva-DiscordBot/1.0" },
    });

    if (res.status === 404) {
      await interaction.editReply({
        embeds: [
          buildEmbed("error", {
            title: "❌ Subreddit no encontrado",
            description: `No existe el subreddit \`r/${subreddit}\`.`,
          }),
        ],
      });
      return;
    }

    if (!res.ok) throw new Error(`Reddit respondió con ${res.status}`);

    const json = (await res.json()) as RedditListingResponse;
    const posts = json.data.children.slice(0, 25);

    if (posts.length === 0) {
      await interaction.editReply({
        embeds: [
          buildEmbed("info", {
            title: `📋 r/${subreddit}`,
            description: "No hay posts recientes en este subreddit.",
          }),
        ],
      });
      return;
    }

    const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);
    let currentPage = 1;

    const buildPageEmbed = (page: number): EmbedBuilder => {
      const start = (page - 1) * POSTS_PER_PAGE;
      const pagePosts = posts.slice(start, start + POSTS_PER_PAGE);

      const fields = pagePosts.map((p, i) => ({
        name: `${start + i + 1}. ${p.data.title.slice(0, 100)}`,
        value: [
          `👤 u/${p.data.author}`,
          `⬆️ ${p.data.score.toLocaleString("es-ES")}`,
          `💬 ${p.data.num_comments} comentarios`,
          `🔗 [Ver post](https://reddit.com${p.data.permalink})`,
        ].join(" · "),
        inline: false,
      }));

      return new EmbedBuilder()
        .setColor(0xff4500) // Reddit orange
        .setTitle(`📋 r/${subreddit} — Posts recientes`)
        .addFields(fields)
        .setFooter({ text: `Página ${page}/${totalPages} · ${posts.length} posts` })
        .setTimestamp();
    };

    const row = buildPaginationRow(currentPage, totalPages);
    const reply = await interaction.editReply({
      embeds: [buildPageEmbed(currentPage)],
      components: totalPages > 1 ? [row] : [],
    });

    if (totalPages <= 1) return;

    const collector = reply.createMessageComponentCollector({
      componentType: ComponentType.Button,
      filter: (btn) => btn.user.id === interaction.user.id,
      time: 120_000,
    });

    collector.on("collect", async (btn) => {
      if (btn.customId === PAGINATION_PREV_ID) {
        currentPage = Math.max(1, currentPage - 1);
      } else if (btn.customId === PAGINATION_NEXT_ID) {
        currentPage = Math.min(totalPages, currentPage + 1);
      }

      await btn.update({
        embeds: [buildPageEmbed(currentPage)],
        components: [buildPaginationRow(currentPage, totalPages)],
      });
    });

    collector.on("end", async () => {
      try {
        await interaction.editReply({ components: [] });
      } catch {
        // Message may have been deleted
      }
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    logger.error("[integrations] /reddit error:", err);

    const replyMethod = interaction.deferred ? interaction.editReply.bind(interaction) : interaction.reply.bind(interaction);
    await replyMethod({
      embeds: [
        buildEmbed("error", {
          title: "❌ Error al consultar Reddit",
          description: `No se pudo obtener los posts de \`r/${subreddit}\`: ${message}`,
        }),
      ],
    });
  }
}
