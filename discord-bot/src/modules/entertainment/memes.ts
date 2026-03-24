import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  type SlashCommandStringOption,
} from "discord.js";
import { config } from "../../config.js";
import { buildEmbed } from "../../utils/embeds.js";

const ENTERTAINMENT_COLOR = 0x9b59b6;

// Reddit subreddits to pick from randomly
const MEME_SUBREDDITS = ["memes", "dankmemes"];

interface RedditPost {
  data: {
    title: string;
    url: string;
    author: string;
    subreddit: string;
    permalink: string;
    is_video: boolean;
    post_hint?: string;
  };
}

interface RedditResponse {
  data: {
    children: RedditPost[];
  };
}

interface TenorResult {
  results: Array<{
    title: string;
    media_formats: {
      gif?: { url: string };
      tinygif?: { url: string };
    };
  }>;
}

export const data = new SlashCommandBuilder()
  .setName("memes")
  .setDescription("Memes y GIFs")
  .addSubcommand((sub) =>
    sub.setName("meme").setDescription("Obtén un meme aleatorio de Reddit")
  )
  .addSubcommand((sub) =>
    sub
      .setName("gif")
      .setDescription("Busca un GIF en Tenor")
      .addStringOption((opt: SlashCommandStringOption) =>
        opt
          .setName("busqueda")
          .setDescription("Término de búsqueda para el GIF")
          .setRequired(true)
      )
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const sub = interaction.options.getSubcommand();

  if (sub === "meme") {
    await handleMeme(interaction);
  } else if (sub === "gif") {
    await handleGif(interaction);
  }
}

async function handleMeme(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const subreddit = MEME_SUBREDDITS[Math.floor(Math.random() * MEME_SUBREDDITS.length)]!;
  const url = `https://www.reddit.com/r/${subreddit}/random.json`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "LaCueva-DiscordBot/1.0" },
    });

    if (!res.ok) {
      throw new Error(`Reddit respondió con ${res.status}`);
    }

    const json = (await res.json()) as RedditResponse[] | RedditResponse;

    // Reddit /random.json returns an array with [listing, comments]
    const listing = Array.isArray(json) ? json[0] : json;
    const post = listing?.data?.children?.[0]?.data;

    if (!post || post.is_video || !post.url) {
      await interaction.editReply({
        embeds: [
          buildEmbed("error", {
            title: "😅 No se pudo obtener un meme",
            description: "Reddit no devolvió un post de imagen válido. Intenta de nuevo.",
          }),
        ],
      });
      return;
    }

    // Only show image posts
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    const isImage =
      imageExtensions.some((ext) => post.url.toLowerCase().endsWith(ext)) ||
      post.post_hint === "image";

    if (!isImage) {
      await interaction.editReply({
        embeds: [
          buildEmbed("error", {
            title: "😅 No se pudo obtener un meme",
            description: "El post obtenido no es una imagen. Intenta de nuevo.",
          }),
        ],
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(ENTERTAINMENT_COLOR)
      .setTitle(post.title.slice(0, 256))
      .setImage(post.url)
      .setFooter({ text: `r/${post.subreddit} • u/${post.author}` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    await interaction.editReply({
      embeds: [
        buildEmbed("error", {
          title: "❌ Error al obtener el meme",
          description: `No se pudo conectar con Reddit: ${message}`,
        }),
      ],
    });
  }
}

async function handleGif(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const query = interaction.options.getString("busqueda", true);
  const apiKey = config.TENOR_API_KEY;

  if (!apiKey) {
    await interaction.editReply({
      embeds: [
        buildEmbed("error", {
          title: "❌ API de Tenor no configurada",
          description: "El bot no tiene configurada la clave de Tenor API (`TENOR_API_KEY`).",
        }),
      ],
    });
    return;
  }

  try {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://tenor.googleapis.com/v2/search?q=${encodedQuery}&key=${apiKey}&limit=20&media_filter=gif`;

    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`Tenor respondió con ${res.status}`);
    }

    const json = (await res.json()) as TenorResult;

    if (!json.results || json.results.length === 0) {
      await interaction.editReply({
        embeds: [
          buildEmbed("error", {
            title: "😅 No se encontraron GIFs",
            description: `No hay resultados para: \`${query}\``,
          }),
        ],
      });
      return;
    }

    // Pick a random result from the top 20
    const result = json.results[Math.floor(Math.random() * json.results.length)]!;
    const gifUrl =
      result.media_formats?.gif?.url ??
      result.media_formats?.tinygif?.url;

    if (!gifUrl) {
      await interaction.editReply({
        embeds: [
          buildEmbed("error", {
            title: "😅 No se pudo obtener el GIF",
            description: "El resultado de Tenor no contiene una URL de GIF válida.",
          }),
        ],
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(ENTERTAINMENT_COLOR)
      .setTitle(`🎬 ${result.title || query}`)
      .setImage(gifUrl)
      .setFooter({ text: `Búsqueda: ${query} • Powered by Tenor` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    await interaction.editReply({
      embeds: [
        buildEmbed("error", {
          title: "❌ Error al obtener el GIF",
          description: `No se pudo conectar con Tenor: ${message}`,
        }),
      ],
    });
  }
}
