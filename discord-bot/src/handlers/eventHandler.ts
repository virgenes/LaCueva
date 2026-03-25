import type {
  Client,
  Collection,
  Interaction,
  Message,
  GuildMember,
  DMChannel,
  NonThreadGuildBasedChannel,
  PartialMessage,
  PartialGuildMember,
  GuildBasedChannel,
} from "discord.js";
import type { SlashCommand } from "../types/index.js";
import { handleInteraction } from "./commandHandler.js";

export function registerEvents(
  client: Client,
  commands: Collection<string, SlashCommand>
): void {
  // ── clientReady ────────────────────────────────────────────────────────────
  client.once("clientReady", (c: Client<true>) => {
    console.log(`[bot] Online como ${c.user.tag}`);

    // Temp-role revocation scheduler
    import("../modules/admin/autoRole.js")
      .then(({ initTempRoleScheduler }) => initTempRoleScheduler(c))
      .catch((err) => console.error("[bot] initTempRoleScheduler failed:", err));

    // Reminder scheduler (Requirement 31.1)
    import("../modules/utilities/reminders.js")
      .then(({ initReminderScheduler }) => initReminderScheduler(c))
      .catch((err) => console.error("[bot] initReminderScheduler failed:", err));

    // Giveaway scheduler
    import("../modules/admin/giveaways.js")
      .then(({ initGiveawayScheduler }) => initGiveawayScheduler(c))
      .catch((err) => console.error("[bot] initGiveawayScheduler failed:", err));

    // Integrations polling (Twitch / YouTube)
    import("../modules/admin/integrations.js")
      .then(({ initIntegrations }) => initIntegrations(c))
      .catch((err) => console.error("[bot] initIntegrations failed:", err));

    // Verification — weekly promotion scheduler
    import("../modules/admin/verification.js")
      .then(({ initVerificationScheduler }) => initVerificationScheduler(c))
      .catch((err) => console.error("[bot] initVerificationScheduler failed:", err));
  });

  // ── interactionCreate ──────────────────────────────────────────────────────
  client.on("interactionCreate", async (interaction: Interaction) => {
    // Verification button
    if (interaction.isButton() && interaction.customId === "verify_button") {
      const { handleVerifyButton } = await import("../modules/admin/verification.js");
      await handleVerifyButton(interaction);
      return;
    }

    // AutoRole buttons (ar: normal roles, arc: color roles)
    if (interaction.isButton() && (interaction.customId.startsWith("ar:") || interaction.customId.startsWith("arc:"))) {
      const { handleAutoRoleButton } = await import("../modules/admin/autoroles.js");
      await handleAutoRoleButton(interaction);
      return;
    }

    // Voice Master buttons
    if (interaction.isButton() && interaction.customId.startsWith("vc:")) {
      const { handleVoiceMasterButton } = await import("../modules/admin/voiceMaster.js");
      await handleVoiceMasterButton(interaction);
      return;
    }

    await handleInteraction(interaction, commands);
  });

  // ── messageCreate ──────────────────────────────────────────────────────────
  client.on("messageCreate", async (message: Message) => {
    // chatbridge handles bots internally (trusted bots), run it always
    const { chatbridge } = await import("../modules/chatbridge/chatbridge.js");
    await chatbridge(message);

    // Skip moderation/autoReply/XP for bots
    if (message.author.bot) return;

    const [
      { wordFilter },
      { antiSpam },
      { autoReply },
      { grantXp },
    ] = await Promise.all([
      import("../modules/moderation/wordFilter.js"),
      import("../modules/moderation/antiSpam.js"),
      import("../modules/utilities/autoReply.js"),
      import("../modules/admin/levels.js"),
    ]);

    await wordFilter(message);
    await antiSpam(message);
    await autoReply(message);

    // Grant XP for every non-bot message (Requirement 20.1)
    if (message.guild) {
      await grantXp(
        message.author.id,
        message.guild.id,
        client,
        message.channelId
      );
    }
  });

  // ── messageUpdate ──────────────────────────────────────────────────────────
  // Requirement 16.1
  client.on(
    "messageUpdate",
    async (oldMessage: Message | PartialMessage, newMessage: Message | PartialMessage) => {
      if (!newMessage.guild) return;
      if (newMessage.author?.bot) return;

      const { logAction } = await import("../modules/admin/auditLog.js");

      const channel = `<#${newMessage.channelId}>`;
      const before = (oldMessage.content ?? "").slice(0, 200);
      const after = (newMessage.content ?? "").slice(0, 200);
      const affected = `Canal: ${channel}\nAntes: ${before || "(vacío)"}\nDespués: ${after || "(vacío)"}`;
      const moderator = newMessage.author
        ? `<@${newMessage.author.id}> (${newMessage.author.username})`
        : "Desconocido";

      await logAction(
        "messageUpdate",
        affected,
        moderator,
        new Date().toISOString(),
        newMessage.guild
      );
    }
  );

  // ── messageDelete ──────────────────────────────────────────────────────────
  // Requirement 16.1
  client.on("messageDelete", async (message: Message | PartialMessage) => {
    if (!message.guild) return;
    if (message.author?.bot) return;

    const { logAction } = await import("../modules/admin/auditLog.js");

    const channel = `<#${message.channelId}>`;
    const content = (message.content ?? "(sin contenido)").slice(0, 200);
    const affected = `Canal: ${channel}\nContenido: ${content}`;
    const moderator = message.author
      ? `<@${message.author.id}> (${message.author.username})`
      : "Desconocido";

    await logAction(
      "messageDelete",
      affected,
      moderator,
      new Date().toISOString(),
      message.guild
    );
  });

  // ── guildMemberUpdate ──────────────────────────────────────────────────────
  // Requirement 16.1
  client.on(
    "guildMemberUpdate",
    async (oldMember: GuildMember | PartialGuildMember, newMember: GuildMember) => {
      const oldRoles = oldMember.roles.cache;
      const newRoles = newMember.roles.cache;

      const added = newRoles
        .filter((r) => !oldRoles.has(r.id))
        .map((r) => `<@&${r.id}>`)
        .join(", ");

      const removed = oldRoles
        .filter((r) => !newRoles.has(r.id))
        .map((r) => `<@&${r.id}>`)
        .join(", ");

      if (!added && !removed) return; // No role changes

      const { logAction } = await import("../modules/admin/auditLog.js");

      const affected = [
        `Miembro: <@${newMember.id}> (${newMember.user.username})`,
        added ? `Roles añadidos: ${added}` : null,
        removed ? `Roles removidos: ${removed}` : null,
      ]
        .filter(Boolean)
        .join("\n");

      await logAction(
        "guildMemberUpdate",
        affected,
        "Sistema",
        new Date().toISOString(),
        newMember.guild
      );
    }
  );

  // ── channelCreate ──────────────────────────────────────────────────────────
  // Requirement 16.1
  client.on("channelCreate", async (channel: GuildBasedChannel) => {
    if (!channel.guild) return;

    const { logAction } = await import("../modules/admin/auditLog.js");

    await logAction(
      "channelCreate",
      `Canal: <#${channel.id}> (${channel.name})`,
      "Sistema",
      new Date().toISOString(),
      channel.guild
    );
  });

  // ── guildMemberRemove ──────────────────────────────────────────────────────
  // Requirement 16.1
  client.on(
    "guildMemberRemove",
    async (member: GuildMember | PartialGuildMember) => {
      const { logAction } = await import("../modules/admin/auditLog.js");
      const { goodbyeMessage } = await import("../modules/admin/welcome.js");

      const username = "user" in member ? member.user.username : "Desconocido";

      await logAction(
        "guildMemberRemove",
        `Miembro: <@${member.id}> (${username})`,
        "Sistema",
        new Date().toISOString(),
        member.guild
      );

      // Send goodbye message — only if we have a full GuildMember
      if ("user" in member && member.guild) {
        await goodbyeMessage(member as GuildMember);
      }
    }
  );

  // ── guildMemberAdd ─────────────────────────────────────────────────────────
  client.on("guildMemberAdd", async (member: GuildMember) => {
    const [{ autoRole }, { welcomeMessage }] = await Promise.all([
      import("../modules/admin/autoRole.js"),
      import("../modules/admin/welcome.js"),
    ]);

    await autoRole(member);
    await welcomeMessage(member);
  });

  // ── channelDelete ──────────────────────────────────────────────────────────
  client.on("channelDelete", async (channel: DMChannel | NonThreadGuildBasedChannel) => {
    const { onChannelDelete } = await import("../modules/admin/auditLog.js");
    await onChannelDelete(channel);
  });

  // ── voiceStateUpdate — Voice Master JTC ───────────────────────────────────
  client.on("voiceStateUpdate", async (oldState, newState) => {
    const { handleVoiceStateUpdate } = await import("../modules/admin/voiceMaster.js");
    await handleVoiceStateUpdate(oldState, newState);
  });
}
