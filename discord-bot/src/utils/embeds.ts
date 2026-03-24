import { EmbedBuilder } from "discord.js";

export const EMBED_COLORS = {
  ban: 0xff4444,
  kick: 0xff4444,
  warn: 0xffd700,
  success: 0x44ff88,
  info: 0x4488ff,
  entertainment: 0x9b59b6,
  economy: 0x9b59b6,
  error: 0xff4444,
} as const;

export interface EmbedOptions {
  title?: string;
  description?: string;
  fields?: { name: string; value: string; inline?: boolean }[];
  thumbnail?: string;
  image?: string;
  footer?: string;
}

/**
 * Builds a Discord EmbedBuilder with the contextual color for the given type.
 */
export function buildEmbed(
  type: keyof typeof EMBED_COLORS,
  options: EmbedOptions
): EmbedBuilder {
  const embed = new EmbedBuilder().setColor(EMBED_COLORS[type]);

  if (options.title) embed.setTitle(options.title);
  if (options.description) embed.setDescription(options.description);
  if (options.fields?.length) embed.addFields(options.fields);
  if (options.thumbnail) embed.setThumbnail(options.thumbnail);
  if (options.image) embed.setImage(options.image);
  if (options.footer) embed.setFooter({ text: options.footer });

  return embed;
}
