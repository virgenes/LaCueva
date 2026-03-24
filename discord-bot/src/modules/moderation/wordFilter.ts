import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Message,
  type SlashCommandSubcommandBuilder,
  type SlashCommandStringOption,
} from "discord.js";
import { readData, writeData, loadConfig } from "../../utils/dataStore.js";
import { buildEmbed } from "../../utils/embeds.js";
import { getMessage } from "../../utils/personality.js";

interface WordFilterStore {
  words: string[];
}

function loadStore(): WordFilterStore {
  return readData<WordFilterStore>("wordFilter.json", { words: [] });
}

function saveStore(store: WordFilterStore): void {
  writeData("wordFilter.json", store);
}

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/@/g, "a")
    .replace(/3/g, "e")
    .replace(/0/g, "o")
    .replace(/1/g, "i")
    .replace(/\$/g, "s")
    .replace(/5/g, "s")
    .replace(/4/g, "a")
    .replace(/7/g, "t")
    .replace(/!/g, "i")
    .replace(/\+/g, "t")
    .replace(/\|/g, "i");
}

export function containsFilteredWord(content: string, words: string[]): boolean {
  const normalized = normalizeText(content);
  return words.some((word) => normalized.includes(normalizeText(word)));
}

export async function wordFilter(message: Message): Promise<void> {
  if (message.author.bot) return;
  if (!message.guild) return;

  const store = loadStore();
  if (store.words.length === 0) return;
  if (!containsFilteredWord(message.content, store.words)) return;

  try { await message.delete(); } catch { /* already deleted */ }

  const config = loadConfig(message.guild.id);
  const mode = config.personalityMode;

  try {
    const notif = mode === "friki"
      ? `🚫 ¡Ey, ${message.author.username}! Tu mensaje fue eliminado porque contenía una palabra prohibida. 🛡️`
      : `Tu mensaje ha sido eliminado porque contenía contenido no permitido, ${message.author.username}.`;
    await message.author.send(notif);
  } catch { /* DM disabled */ }
}

export const data = new SlashCommandBuilder()
  .setName("filtro")
  .setDescription("Gestión del filtro de palabras")
  .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
    sub.setName("add").setDescription("Añade una palabra al filtro")
      .addStringOption((opt: SlashCommandStringOption) =>
        opt.setName("palabra").setDescription("Palabra a filtrar").setRequired(true))
  )
  .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
    sub.setName("remove").setDescription("Elimina una palabra del filtro")
      .addStringOption((opt: SlashCommandStringOption) =>
        opt.setName("palabra").setDescription("Palabra a eliminar").setRequired(true))
  )
  .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
    sub.setName("list").setDescription("Lista todas las palabras filtradas")
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const sub = interaction.options.getSubcommand();
  const store = loadStore();
  const guildId = interaction.guild?.id ?? "";
  const config = loadConfig(guildId);
  const mode = config.personalityMode;

  if (sub === "add") {
    const word = interaction.options.getString("palabra", true).toLowerCase().trim();
    if (store.words.includes(word)) {
      await interaction.reply({ content: `La palabra \`${word}\` ya está en el filtro.`, ephemeral: true });
      return;
    }
    store.words.push(word);
    saveStore(store);
    await interaction.reply({
      embeds: [buildEmbed("success", { title: "✅ Palabra añadida", description: getMessage("filtroAdd", { member: interaction.user.username, word }, mode) })],
    });
    return;
  }

  if (sub === "remove") {
    const word = interaction.options.getString("palabra", true).toLowerCase().trim();
    const idx = store.words.indexOf(word);
    if (idx === -1) {
      await interaction.reply({ content: `La palabra \`${word}\` no está en el filtro.`, ephemeral: true });
      return;
    }
    store.words.splice(idx, 1);
    saveStore(store);
    await interaction.reply({
      embeds: [buildEmbed("success", { title: "✅ Palabra eliminada", description: getMessage("filtroRemove", { member: interaction.user.username, word }, mode) })],
    });
    return;
  }

  if (sub === "list") {
    if (store.words.length === 0) {
      await interaction.reply({ embeds: [buildEmbed("info", { title: "📋 Filtro de palabras", description: "No hay palabras en el filtro actualmente." })], ephemeral: true });
      return;
    }
    const wordList = store.words.map((w, i) => `${i + 1}. \`${w}\``).join("\n");
    await interaction.reply({ embeds: [buildEmbed("info", { title: "📋 Palabras filtradas", description: wordList, footer: `Total: ${store.words.length} palabras` })], ephemeral: true });
  }
}
