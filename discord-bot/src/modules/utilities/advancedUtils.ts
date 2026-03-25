import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  AttachmentBuilder,
} from "discord.js";
import QRCode from "qrcode";
import { buildEmbed } from "../../utils/embeds.js";

const UTIL_COLOR = 0x3498db;

// ─── /translate ──────────────────────────────────────────────────────────────

export const translateCommand = new SlashCommandBuilder()
  .setName("translate")
  .setDescription("Traduce un texto usando LibreTranslate")
  .addStringOption((opt) =>
    opt.setName("texto").setDescription("Texto a traducir").setRequired(true)
  )
  .addStringOption((opt) =>
    opt
      .setName("idioma")
      .setDescription("Idioma destino (código ISO, ej: en, fr, de). Por defecto: es")
      .setRequired(false)
  );

async function handleTranslate(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const text = interaction.options.getString("texto", true);
  const target = interaction.options.getString("idioma") ?? "es";
  const apiKey = process.env["TRANSLATE_API_KEY"] ?? "";

  try {
    const res = await fetch("https://libretranslate.com/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: text, source: "auto", target, api_key: apiKey }),
    });

    if (!res.ok) {
      throw new Error(`LibreTranslate respondió con ${res.status}`);
    }

    const json = (await res.json()) as { translatedText?: string; error?: string };

    if (json.error) throw new Error(json.error);
    if (!json.translatedText) throw new Error("Respuesta vacía de la API");

    const embed = new EmbedBuilder()
      .setColor(UTIL_COLOR)
      .setTitle("🌐 Traducción")
      .addFields(
        { name: "Original", value: text.slice(0, 1024) },
        { name: `Traducción (→ ${target})`, value: json.translatedText.slice(0, 1024) }
      )
      .setFooter({ text: "Powered by LibreTranslate" })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    await interaction.editReply({
      embeds: [buildEmbed("error", { title: "❌ Error al traducir", description: message })],
    });
  }
}

// ─── /weather ────────────────────────────────────────────────────────────────

export const weatherCommand = new SlashCommandBuilder()
  .setName("weather")
  .setDescription("Muestra el clima actual de una ciudad")
  .addStringOption((opt) =>
    opt.setName("ciudad").setDescription("Nombre de la ciudad").setRequired(true)
  );

interface WeatherResponse {
  name: string;
  sys: { country: string };
  weather: Array<{ description: string; icon: string }>;
  main: { temp: number; feels_like: number; humidity: number };
  wind: { speed: number };
}

async function handleWeather(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const city = interaction.options.getString("ciudad", true);
  const apiKey = process.env["WEATHER_API_KEY"];

  if (!apiKey) {
    await interaction.editReply({
      embeds: [
        buildEmbed("error", {
          title: "❌ API no configurada",
          description: "Falta la variable de entorno `WEATHER_API_KEY`.",
        }),
      ],
    });
    return;
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=es`;
    const res = await fetch(url);

    if (!res.ok) {
      const body = (await res.json()) as { message?: string };
      throw new Error(body.message ?? `OpenWeatherMap respondió con ${res.status}`);
    }

    const data = (await res.json()) as WeatherResponse;
    const weather = data.weather[0];
    const iconUrl = weather
      ? `https://openweathermap.org/img/wn/${weather.icon}@2x.png`
      : undefined;

    const embed = new EmbedBuilder()
      .setColor(UTIL_COLOR)
      .setTitle(`🌤️ Clima en ${data.name}, ${data.sys.country}`)
      .setThumbnail(iconUrl ?? null)
      .addFields(
        {
          name: "🌡️ Temperatura",
          value: `${data.main.temp.toFixed(1)}°C (sensación ${data.main.feels_like.toFixed(1)}°C)`,
          inline: true,
        },
        {
          name: "☁️ Descripción",
          value: weather ? capitalize(weather.description) : "N/A",
          inline: true,
        },
        { name: "💧 Humedad", value: `${data.main.humidity}%`, inline: true },
        { name: "💨 Viento", value: `${data.wind.speed} m/s`, inline: true }
      )
      .setFooter({ text: "Powered by OpenWeatherMap" })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    await interaction.editReply({
      embeds: [buildEmbed("error", { title: "❌ Error al obtener el clima", description: message })],
    });
  }
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ─── /urban ──────────────────────────────────────────────────────────────────

export const urbanCommand = new SlashCommandBuilder()
  .setName("urban")
  .setDescription("Busca un término en Urban Dictionary")
  .addStringOption((opt) =>
    opt.setName("termino").setDescription("Término a buscar").setRequired(true)
  );

interface UrbanEntry {
  word: string;
  definition: string;
  example: string;
  author: string;
  thumbs_up: number;
  thumbs_down: number;
  permalink: string;
}

interface UrbanResponse {
  list: UrbanEntry[];
}

async function handleUrban(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const term = interaction.options.getString("termino", true);

  try {
    const url = `https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(term)}`;
    const res = await fetch(url);

    if (!res.ok) throw new Error(`Urban Dictionary respondió con ${res.status}`);

    const data = (await res.json()) as UrbanResponse;

    if (!data.list || data.list.length === 0) {
      await interaction.editReply({
        embeds: [
          buildEmbed("info", {
            title: "🔍 Sin resultados",
            description: `No se encontró ninguna definición para **${term}**.`,
          }),
        ],
      });
      return;
    }

    const entry = data.list[0]!;
    const definition = entry.definition.replace(/\[|\]/g, "").slice(0, 1024);
    const example = entry.example.replace(/\[|\]/g, "").slice(0, 512);

    const embed = new EmbedBuilder()
      .setColor(UTIL_COLOR)
      .setTitle(`📖 ${entry.word}`)
      .setURL(entry.permalink)
      .setDescription(definition)
      .addFields(
        { name: "Ejemplo", value: example || "*(sin ejemplo)*" },
        {
          name: "Votos",
          value: `👍 ${entry.thumbs_up}  👎 ${entry.thumbs_down}`,
          inline: true,
        },
        { name: "Autor", value: entry.author || "Anónimo", inline: true }
      )
      .setFooter({ text: "Powered by Urban Dictionary" })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    await interaction.editReply({
      embeds: [buildEmbed("error", { title: "❌ Error al buscar en Urban Dictionary", description: message })],
    });
  }
}

// ─── /qr ─────────────────────────────────────────────────────────────────────

export const qrCommand = new SlashCommandBuilder()
  .setName("qr")
  .setDescription("Genera un código QR como imagen PNG")
  .addStringOption((opt) =>
    opt.setName("texto").setDescription("Texto o URL para codificar").setRequired(true)
  );

async function handleQr(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const text = interaction.options.getString("texto", true);

  try {
    const buffer = await QRCode.toBuffer(text, { type: "png", width: 300, margin: 2 });
    const attachment = new AttachmentBuilder(buffer, { name: "qr.png" });

    const embed = new EmbedBuilder()
      .setColor(UTIL_COLOR)
      .setTitle("📱 Código QR generado")
      .setDescription(`Contenido: \`${text.slice(0, 200)}\``)
      .setImage("attachment://qr.png")
      .setTimestamp();

    await interaction.editReply({ embeds: [embed], files: [attachment] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    await interaction.editReply({
      embeds: [buildEmbed("error", { title: "❌ Error al generar el QR", description: message })],
    });
  }
}

// ─── /shorten ────────────────────────────────────────────────────────────────

export const shortenCommand = new SlashCommandBuilder()
  .setName("shorten")
  .setDescription("Acorta una URL usando TinyURL")
  .addStringOption((opt) =>
    opt.setName("url").setDescription("URL a acortar").setRequired(true)
  );

async function handleShorten(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const url = interaction.options.getString("url", true);

  try {
    const apiUrl = `https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`;
    const res = await fetch(apiUrl);

    if (!res.ok) throw new Error(`TinyURL respondió con ${res.status}`);

    const shortened = await res.text();

    if (!shortened.startsWith("http")) {
      throw new Error("La respuesta de TinyURL no es una URL válida");
    }

    const embed = new EmbedBuilder()
      .setColor(UTIL_COLOR)
      .setTitle("🔗 URL acortada")
      .addFields(
        { name: "Original", value: url.slice(0, 1024) },
        { name: "Acortada", value: shortened }
      )
      .setFooter({ text: "Powered by TinyURL" })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    await interaction.editReply({
      embeds: [buildEmbed("error", { title: "❌ Error al acortar la URL", description: message })],
    });
  }
}

// ─── Exports ─────────────────────────────────────────────────────────────────

export const commands = [
  translateCommand,
  weatherCommand,
  urbanCommand,
  qrCommand,
  shortenCommand,
];

const handlers: Record<string, (i: ChatInputCommandInteraction) => Promise<void>> = {
  translate: handleTranslate,
  weather: handleWeather,
  urban: handleUrban,
  qr: handleQr,
  shorten: handleShorten,
};

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const handler = handlers[interaction.commandName];
  if (handler) await handler(interaction);
}
