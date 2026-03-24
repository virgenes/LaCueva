import type { Client, Collection, Interaction, Message, GuildMember, DMChannel, NonThreadGuildBasedChannel } from "discord.js";
import type { SlashCommand } from "../types/index.js";
import { handleInteraction } from "./commandHandler.js";

export function registerEvents(
  client: Client,
  commands: Collection<string, SlashCommand>
): void {
  // ready
  client.once("clientReady", (c: Client<true>) => {
    console.log(`[bot] Online como ${c.user.tag}`);
  });

  // interactionCreate
  client.on("interactionCreate", async (interaction: Interaction) => {
    await handleInteraction(interaction, commands);
  });

  // messageCreate
  client.on("messageCreate", async (message: Message) => {
    if (message.author.bot) return;

    const [
      { wordFilter },
      { antiSpam },
      { autoReply },
      { chatbridge },
    ] = await Promise.all([
      import("../modules/moderation/wordFilter.js"),
      import("../modules/moderation/antiSpam.js"),
      import("../modules/utilities/autoReply.js"),
      import("../modules/chatbridge/chatbridge.js"),
    ]);

    await wordFilter(message);
    await antiSpam(message);
    await autoReply(message);
    await chatbridge(message);
  });

  // guildMemberAdd
  client.on("guildMemberAdd", async (member: GuildMember) => {
    const [{ autoRole }, { welcomeMessage }] = await Promise.all([
      import("../modules/admin/autoRole.js"),
      import("../modules/admin/welcome.js"),
    ]);

    await autoRole(member);
    await welcomeMessage(member);
  });

  // channelDelete
  client.on("channelDelete", async (channel: DMChannel | NonThreadGuildBasedChannel) => {
    const { onChannelDelete } = await import("../modules/admin/auditLog.js");
    await onChannelDelete(channel);
  });
}
