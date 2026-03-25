import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

export const PAGINATION_PREV_ID = "pagination_prev";
export const PAGINATION_NEXT_ID = "pagination_next";

/**
 * Builds an ActionRow with ◀️ / ▶️ pagination buttons.
 * The corresponding button is disabled when at the first or last page.
 */
export function buildPaginationRow(
  currentPage: number,
  totalPages: number
): ActionRowBuilder<ButtonBuilder> {
  const prev = new ButtonBuilder()
    .setCustomId(PAGINATION_PREV_ID)
    .setEmoji("◀️")
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(currentPage <= 1);

  const next = new ButtonBuilder()
    .setCustomId(PAGINATION_NEXT_ID)
    .setEmoji("▶️")
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(currentPage >= totalPages);

  return new ActionRowBuilder<ButtonBuilder>().addComponents(prev, next);
}
