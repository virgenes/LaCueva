import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  TextChannel,
  VoiceChannel,
  ChannelType,
  PermissionsBitField,
  AttachmentBuilder,
  Client,
  VoiceState,
  type ButtonInteraction,
} from "discord.js";
import { join } from "node:path";

// ─── Constants ────────────────────────────────────────────────────────────────

const EDITOR_TEXT_CHANNEL_ID  = "1486431632582905906";
const JTC_VOICE_CHANNEL_ID    = "1486431967619710977";

const BANNER_PATH = join(process.cwd(), "src", "assets", "canvas.png");

// Map: userId → their temporary voice channel ID
const tempChannels = new Map<string, string>();

// ─── Build the control panel embed + rows ─────────────────────────────────────

function buildControlPanel(userId: string): {
  embed: EmbedBuilder;
  rows: ActionRowBuilder<ButtonBuilder>[];
  attachment: AttachmentBuilder;
} {
  const attachment = new AttachmentBuilder(BANNER_PATH, { name: "canvas.png" });

  const embed = new EmbedBuilder()
    .setColor(0xe91e8c)
    .setTitle("🔊 VOICE CUSTOM")
    .setDescription("> ⚠️ No usar nombres de canal con palabras explícitas, referencias sexuales, discurso de odio o insultos — de lo contrario serás sancionado permanentemente. 🚫")
    .setImage("attachment://canvas.png")
    .setFooter({ text: `Propietario: ${userId}` })
    .setTimestamp();

  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(`vc:rename:${userId}`).setLabel("✏️ NOMBRE").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`vc:limit:${userId}`).setLabel("👥 LÍMITE").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`vc:privacy:${userId}`).setLabel("🔒 PRIVACIDAD").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`vc:allow:${userId}`).setLabel("✅ PERMITIR").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`vc:deny:${userId}`).setLabel("❌ DES-PERMITIR").setStyle(ButtonStyle.Danger),
  );

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(`vc:invite:${userId}`).setLabel("📨 INVITAR").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`vc:kick:${userId}`).setLabel("👢 EXPULSAR").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`vc:block:${userId}`).setLabel("🚫 BLOQUEAR").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`vc:unblock:${userId}`).setLabel("🔓 DES-BLOQUEAR").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`vc:transfer:${userId}`).setLabel("🔄 TRANSFERIR").setStyle(ButtonStyle.Primary),
  );

  const row3 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(`vc:delete:${userId}`).setLabel("🗑️ ELIMINAR").setStyle(ButtonStyle.Danger),
  );

  return { embed, rows: [row1, row2, row3], attachment };
}

// ─── Voice state handler (JTC logic) ─────────────────────────────────────────

export async function handleVoiceStateUpdate(
  oldState: VoiceState,
  newState: VoiceState
): Promise<void> {
  const guild = newState.guild ?? oldState.guild;
  const member = newState.member ?? oldState.member;
  if (!member || member.user.bot) return;

  // User joined the JTC channel → create their temp channel
  if (newState.channelId === JTC_VOICE_CHANNEL_ID) {
    try {
      const jtcChannel = guild.channels.cache.get(JTC_VOICE_CHANNEL_ID);
      const category = jtcChannel?.type === ChannelType.GuildVoice
        ? (jtcChannel as VoiceChannel).parent
        : null;

      const tempVoice = await guild.channels.create({
        name: `🎮 ${member.user.username}`,
        type: ChannelType.GuildVoice,
        parent: category ?? undefined,
        permissionOverwrites: [
          {
            id: member.id,
            allow: [
              PermissionsBitField.Flags.ManageChannels,
              PermissionsBitField.Flags.Connect,
              PermissionsBitField.Flags.Speak,
              PermissionsBitField.Flags.MoveMembers,
            ],
          },
          {
            id: guild.roles.everyone.id,
            allow: [PermissionsBitField.Flags.Connect],
          },
        ],
      }) as VoiceChannel;

      tempChannels.set(member.id, tempVoice.id);

      // Move member to their new channel
      await member.voice.setChannel(tempVoice);

      // Notify the member by DM (private, no noise in chat)
      try {
        await member.send({
          content: `🎮 ¡Tu canal de voz **${tempVoice.name}** está listo! Dirígete al canal <#${EDITOR_TEXT_CHANNEL_ID}> para personalizarlo con los botones del panel.`,
        });
      } catch {
        // DMs disabled — fail silently
      }

      // Send control panel to the editor text channel (no mention, general for everyone)
      const textChannel = guild.channels.cache.get(EDITOR_TEXT_CHANNEL_ID) as TextChannel | undefined;
      if (textChannel) {
        const { embed, rows, attachment } = buildControlPanel(member.id);
        await textChannel.send({
          embeds: [embed],
          components: rows,
          files: [attachment],
        });
      }
    } catch (err) {
      console.error("[voiceMaster] Error creating temp channel:", err);
    }
    return;
  }

  // User left their temp channel → delete it if empty
  if (oldState.channelId && oldState.channelId !== JTC_VOICE_CHANNEL_ID) {
    const ownedChannelId = tempChannels.get(member.id);
    if (ownedChannelId && oldState.channelId === ownedChannelId) {
      const ch = guild.channels.cache.get(ownedChannelId) as VoiceChannel | undefined;
      if (ch && ch.members.size === 0) {
        try {
          await ch.delete("Temp voice channel — owner left and channel is empty");
          tempChannels.delete(member.id);
        } catch {
          // already deleted
        }
      }
    }

    // Also clean up any empty temp channel (in case owner transferred)
    for (const [uid, chId] of tempChannels.entries()) {
      if (chId === oldState.channelId) {
        const ch = guild.channels.cache.get(chId) as VoiceChannel | undefined;
        if (ch && ch.members.size === 0) {
          try {
            await ch.delete("Temp voice channel — empty");
            tempChannels.delete(uid);
          } catch {
            // already deleted
          }
        }
      }
    }
  }
}

// ─── Button handler ───────────────────────────────────────────────────────────

export async function handleVoiceMasterButton(interaction: ButtonInteraction): Promise<void> {
  if (!interaction.guild) return;

  const parts = interaction.customId.split(":");
  const action = parts[1]!;
  const ownerId = parts[2]!;

  // Only the owner can use the panel
  if (interaction.user.id !== ownerId) {
    await interaction.reply({ content: "❌ Solo el propietario del canal puede usar este panel.", ephemeral: true });
    return;
  }

  const channelId = tempChannels.get(ownerId);
  if (!channelId) {
    await interaction.reply({ content: "❌ No tienes un canal de voz activo.", ephemeral: true });
    return;
  }

  const voiceChannel = interaction.guild.channels.cache.get(channelId) as VoiceChannel | undefined;
  if (!voiceChannel) {
    await interaction.reply({ content: "❌ Tu canal de voz ya no existe.", ephemeral: true });
    tempChannels.delete(ownerId);
    return;
  }

  switch (action) {
    case "rename": {
      await interaction.reply({ content: "✏️ Escribe el nuevo nombre del canal en el chat (tienes 30 segundos):", ephemeral: true });
      const ch1 = interaction.channel as TextChannel | null;
      const collected = await ch1?.awaitMessages({
        filter: (m: import("discord.js").Message) => m.author.id === ownerId,
        max: 1,
        time: 30_000,
      }).catch(() => null);
      const newName = collected?.first()?.content?.slice(0, 100);
      if (newName) {
        await voiceChannel.setName(newName);
        await collected?.first()?.delete().catch(() => null);
        await interaction.followUp({ content: `✅ Canal renombrado a **${newName}**.`, ephemeral: true });
      }
      break;
    }
    case "limit": {
      await interaction.reply({ content: "👥 Escribe el límite de usuarios (0 = sin límite, máx 99):", ephemeral: true });
      const ch2 = interaction.channel as TextChannel | null;
      const collected = await ch2?.awaitMessages({
        filter: (m: import("discord.js").Message) => m.author.id === ownerId,
        max: 1,
        time: 30_000,
      }).catch(() => null);
      const limit = parseInt(collected?.first()?.content ?? "0", 10);
      if (!isNaN(limit) && limit >= 0 && limit <= 99) {
        await voiceChannel.setUserLimit(limit);
        await collected?.first()?.delete().catch(() => null);
        await interaction.followUp({ content: `✅ Límite establecido en **${limit === 0 ? "sin límite" : limit}**.`, ephemeral: true });
      }
      break;
    }
    case "privacy": {
      const isPrivate = voiceChannel.permissionOverwrites.cache
        .get(interaction.guild.roles.everyone.id)
        ?.deny.has(PermissionsBitField.Flags.Connect) ?? false;

      if (isPrivate) {
        await voiceChannel.permissionOverwrites.edit(interaction.guild.roles.everyone, { Connect: true });
        await interaction.reply({ content: "🔓 Canal ahora **público**.", ephemeral: true });
      } else {
        await voiceChannel.permissionOverwrites.edit(interaction.guild.roles.everyone, { Connect: false });
        await interaction.reply({ content: "🔒 Canal ahora **privado**.", ephemeral: true });
      }
      break;
    }
    case "allow": {
      await interaction.reply({ content: "✅ Menciona al usuario que quieres permitir:", ephemeral: true });
      const ch3 = interaction.channel as TextChannel | null;
      const collected = await ch3?.awaitMessages({
        filter: (m: import("discord.js").Message) => m.author.id === ownerId && m.mentions.users.size > 0,
        max: 1, time: 30_000,
      }).catch(() => null);
      const target = collected?.first()?.mentions.users.first();
      if (target) {
        await voiceChannel.permissionOverwrites.edit(target.id, { Connect: true });
        await collected?.first()?.delete().catch(() => null);
        await interaction.followUp({ content: `✅ <@${target.id}> puede conectarse.`, ephemeral: true });
      }
      break;
    }
    case "deny": {
      await interaction.reply({ content: "❌ Menciona al usuario que quieres des-permitir:", ephemeral: true });
      const ch4 = interaction.channel as TextChannel | null;
      const collected = await ch4?.awaitMessages({
        filter: (m: import("discord.js").Message) => m.author.id === ownerId && m.mentions.users.size > 0,
        max: 1, time: 30_000,
      }).catch(() => null);
      const target = collected?.first()?.mentions.users.first();
      if (target) {
        await voiceChannel.permissionOverwrites.edit(target.id, { Connect: false });
        await collected?.first()?.delete().catch(() => null);
        await interaction.followUp({ content: `❌ <@${target.id}> ya no puede conectarse.`, ephemeral: true });
      }
      break;
    }
    case "kick": {
      await interaction.reply({ content: "👢 Menciona al usuario que quieres expulsar del canal:", ephemeral: true });
      const ch5 = interaction.channel as TextChannel | null;
      const collected = await ch5?.awaitMessages({
        filter: (m: import("discord.js").Message) => m.author.id === ownerId && m.mentions.users.size > 0,
        max: 1, time: 30_000,
      }).catch(() => null);
      const target = collected?.first()?.mentions.users.first();
      if (target) {
        const targetMember = interaction.guild.members.cache.get(target.id);
        if (targetMember?.voice.channelId === channelId) {
          await targetMember.voice.disconnect("Expulsado del canal temporal");
        }
        await collected?.first()?.delete().catch(() => null);
        await interaction.followUp({ content: `👢 <@${target.id}> fue expulsado.`, ephemeral: true });
      }
      break;
    }
    case "block": {
      await interaction.reply({ content: "🚫 Menciona al usuario que quieres bloquear:", ephemeral: true });
      const ch6 = interaction.channel as TextChannel | null;
      const collected = await ch6?.awaitMessages({
        filter: (m: import("discord.js").Message) => m.author.id === ownerId && m.mentions.users.size > 0,
        max: 1, time: 30_000,
      }).catch(() => null);
      const target = collected?.first()?.mentions.users.first();
      if (target) {
        await voiceChannel.permissionOverwrites.edit(target.id, { Connect: false, Speak: false });
        const targetMember = interaction.guild.members.cache.get(target.id);
        if (targetMember?.voice.channelId === channelId) {
          await targetMember.voice.disconnect();
        }
        await collected?.first()?.delete().catch(() => null);
        await interaction.followUp({ content: `🚫 <@${target.id}> bloqueado.`, ephemeral: true });
      }
      break;
    }
    case "unblock": {
      await interaction.reply({ content: "🔓 Menciona al usuario que quieres desbloquear:", ephemeral: true });
      const ch7 = interaction.channel as TextChannel | null;
      const collected = await ch7?.awaitMessages({
        filter: (m: import("discord.js").Message) => m.author.id === ownerId && m.mentions.users.size > 0,
        max: 1, time: 30_000,
      }).catch(() => null);
      const target = collected?.first()?.mentions.users.first();
      if (target) {
        await voiceChannel.permissionOverwrites.delete(target.id);
        await collected?.first()?.delete().catch(() => null);
        await interaction.followUp({ content: `🔓 <@${target.id}> desbloqueado.`, ephemeral: true });
      }
      break;
    }
    case "invite": {
      const invite = await voiceChannel.createInvite({ maxAge: 3600, maxUses: 5 });
      await interaction.reply({ content: `📨 Enlace de invitación (válido 1h, máx 5 usos): ${invite.url}`, ephemeral: true });
      break;
    }
    case "transfer": {
      await interaction.reply({ content: "🔄 Menciona al usuario al que quieres transferir la propiedad:", ephemeral: true });
      const ch8 = interaction.channel as TextChannel | null;
      const collected = await ch8?.awaitMessages({
        filter: (m: import("discord.js").Message) => m.author.id === ownerId && m.mentions.users.size > 0,
        max: 1, time: 30_000,
      }).catch(() => null);
      const target = collected?.first()?.mentions.users.first();
      if (target) {
        tempChannels.delete(ownerId);
        tempChannels.set(target.id, channelId);
        await voiceChannel.permissionOverwrites.edit(target.id, {
          ManageChannels: true, Connect: true, Speak: true, MoveMembers: true,
        });
        await voiceChannel.permissionOverwrites.edit(ownerId, { ManageChannels: false });
        await collected?.first()?.delete().catch(() => null);
        await interaction.followUp({ content: `🔄 Propiedad transferida a <@${target.id}>.`, ephemeral: true });
      }
      break;
    }
    case "delete": {
      await voiceChannel.delete("Eliminado por el propietario");
      tempChannels.delete(ownerId);
      await interaction.reply({ content: "🗑️ Canal eliminado.", ephemeral: true });
      break;
    }
    default:
      await interaction.reply({ content: "Acción desconocida.", ephemeral: true });
  }
}

// ─── /setup-editorvoice command ───────────────────────────────────────────────

export const data = new SlashCommandBuilder()
  .setName("setup-editorvoice")
  .setDescription("Publica el panel maestro de Voice Custom en el canal editor")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guild) {
    await interaction.reply({ content: "Solo funciona en un servidor.", ephemeral: true });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    const channel = interaction.guild.channels.cache.get(EDITOR_TEXT_CHANNEL_ID) as TextChannel | undefined;
    if (!channel) {
      await interaction.editReply({ content: `❌ No encontré el canal <#${EDITOR_TEXT_CHANNEL_ID}>.` });
      return;
    }

    const attachment = new AttachmentBuilder(BANNER_PATH, { name: "canvas.png" });

    const embed = new EmbedBuilder()
      .setColor(0xe91e8c)
      .setTitle("🔊 VOICE CUSTOM")
      .setDescription("> ⚠️ No usar nombres de canal con palabras explícitas, referencias sexuales, discurso de odio o insultos — de lo contrario serás sancionado permanentemente. 🚫")
      .setImage("attachment://canvas.png")
      .setFooter({ text: "Únete al canal de voz para crear tu propio canal temporal" })
      .setTimestamp();

    await channel.send({
      embeds: [embed],
      files: [attachment],
    });

    await interaction.editReply({ content: `✅ Panel maestro publicado en <#${EDITOR_TEXT_CHANNEL_ID}>.` });
  } catch (err) {
    await interaction.editReply({ content: `❌ Error: ${err instanceof Error ? err.message : "desconocido"}` });
  }
}

// ─── Init: restore temp channels on restart (optional) ───────────────────────
export { tempChannels };
