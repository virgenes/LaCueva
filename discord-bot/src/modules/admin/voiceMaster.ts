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
  VoiceState,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  ComponentType,
  type ButtonInteraction,
  type ModalSubmitInteraction,
} from "discord.js";
import { join } from "node:path";

// ─── Constants ────────────────────────────────────────────────────────────────

const EDITOR_TEXT_CHANNEL_ID = "1486431632582905906";
const JTC_VOICE_CHANNEL_ID   = "1486431967619710977";
const BANNER_PATH = join(process.cwd(), "src", "assets", "canvas.png");

// userId → temp voice channel ID
const tempChannels = new Map<string, string>();

// ─── Control panel (used both in /setup and in the temp voice channel) ────────

function buildControlPanel(): {
  embed: EmbedBuilder;
  rows: ActionRowBuilder<ButtonBuilder>[];
  attachment: AttachmentBuilder;
} {
  const attachment = new AttachmentBuilder(BANNER_PATH, { name: "canvas.png" });

  const embed = new EmbedBuilder()
    .setColor(0xe91e8c)
    .setTitle("🔊 VOICE CUSTOM")
    .setDescription(
      "> ⚠️ No usar nombres de canal con palabras explícitas, referencias sexuales, discurso de odio o insultos — de lo contrario serás sancionado permanentemente. 🚫"
    )
    .setImage("attachment://canvas.png")
    .setFooter({ text: "Únete al canal de voz para crear tu propio canal temporal" })
    .setTimestamp();

  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId("vc:rename").setLabel("✏️ NOMBRE").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("vc:limit").setLabel("👥 LÍMITE").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("vc:privacy").setLabel("� PRIVACIDAD").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("vc:allow").setLabel("✅ PERMITIR").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("vc:deny").setLabel("❌ DES-PERMITIR").setStyle(ButtonStyle.Danger),
  );

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId("vc:invite").setLabel("� INVITAR").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("vc:kick").setLabel("👢 EXPULSAR").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("vc:block").setLabel("� BLOQUEAR").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("vc:unblock").setLabel("🔓 DES-BLOQUEAR").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("vc:transfer").setLabel("🔄 TRANSFERIR").setStyle(ButtonStyle.Primary),
  );

  const row3 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId("vc:delete").setLabel("🗑️ ELIMINAR").setStyle(ButtonStyle.Danger),
  );

  return { embed, rows: [row1, row2, row3], attachment };
}

// ─── Voice state handler (JTC) ────────────────────────────────────────────────

export async function handleVoiceStateUpdate(
  oldState: VoiceState,
  newState: VoiceState
): Promise<void> {
  const guild = newState.guild ?? oldState.guild;
  const member = newState.member ?? oldState.member;
  if (!member || member.user.bot) return;

  // Joined JTC → create temp voice channel
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
        rtcRegion: undefined, // auto region — Discord picks the best one
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

      // Generate an invite so the user joins naturally (avoids "Waiting for endpoint")
      const invite = await tempVoice.createInvite({ maxAge: 300, maxUses: 1, unique: true });

      // Send the invite via DM
      try {
        await member.send({
          content: `🎮 ¡Tu canal de voz está listo! Haz clic aquí para unirte:\n${invite.url}\n\n*El enlace expira en 5 minutos.*`,
        });
      } catch {
        // DMs disabled — send in the JTC channel as fallback (ephemeral not possible here)
        const jtcCh = guild.channels.cache.get(JTC_VOICE_CHANNEL_ID) as TextChannel | undefined;
        if (jtcCh) {
          const msg = await jtcCh.send({
            content: `<@${member.id}> tu canal está listo: ${invite.url}`,
          });
          // Auto-delete after 10s to keep the channel clean
          setTimeout(() => msg.delete().catch(() => null), 10_000);
        }
      }

      // Send control panel in the voice channel's text chat
      const { embed, rows, attachment } = buildControlPanel();
      embed.setFooter({ text: `Propietario: ${member.user.username}` });
      await tempVoice.send({ embeds: [embed], components: rows, files: [attachment] });
    } catch (err) {
      console.error("[voiceMaster] Error creating temp channel:", err);
    }
    return;
  }

  // Left a temp channel → delete if empty
  if (oldState.channelId && oldState.channelId !== JTC_VOICE_CHANNEL_ID) {
    for (const [uid, chId] of tempChannels.entries()) {
      if (chId === oldState.channelId) {
        const ch = guild.channels.cache.get(chId) as VoiceChannel | undefined;
        if (ch && ch.members.size === 0) {
          try {
            await ch.delete("Temp voice channel — empty");
            tempChannels.delete(uid);
          } catch { /* already deleted */ }
        }
        break;
      }
    }
  }
}

// ─── Helper: get owner's voice channel ───────────────────────────────────────

function getOwnerChannel(
  userId: string,
  guild: import("discord.js").Guild
): VoiceChannel | null {
  const chId = tempChannels.get(userId);
  if (!chId) return null;
  return (guild.channels.cache.get(chId) as VoiceChannel | undefined) ?? null;
}

// ─── Button handler ───────────────────────────────────────────────────────────

export async function handleVoiceMasterButton(interaction: ButtonInteraction): Promise<void> {
  if (!interaction.guild) return;

  const action = interaction.customId.slice(3); // strip "vc:"
  const voiceChannel = getOwnerChannel(interaction.user.id, interaction.guild);

  // For actions that don't need an active channel (setup panel in editor channel)
  // we still need to verify ownership
  if (!voiceChannel && action !== "privacy") {
    await interaction.reply({
      content: "❌ No tienes un canal de voz activo. Únete al canal JTC primero.",
      ephemeral: true,
    });
    return;
  }

  switch (action) {

    // ── NOMBRE — Modal ────────────────────────────────────────────────────────
    case "rename": {
      const modal = new ModalBuilder()
        .setCustomId("vcm:rename")
        .setTitle("✏️ Cambiar nombre del canal");
      modal.addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId("channel_name")
            .setLabel("Nuevo nombre del canal")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("Ej: 🎮 Gaming con amigos")
            .setMaxLength(100)
            .setRequired(true)
        )
      );
      await interaction.showModal(modal);
      break;
    }

    // ── LÍMITE — Modal ────────────────────────────────────────────────────────
    case "limit": {
      const modal = new ModalBuilder()
        .setCustomId("vcm:limit")
        .setTitle("👥 Límite de usuarios");
      modal.addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId("user_limit")
            .setLabel("Límite (0 = sin límite, máx 99)")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("Ej: 5")
            .setMaxLength(2)
            .setRequired(true)
        )
      );
      await interaction.showModal(modal);
      break;
    }

    // ── PRIVACIDAD — Toggle ───────────────────────────────────────────────────
    case "privacy": {
      if (!voiceChannel) {
        await interaction.reply({ content: "❌ No tienes un canal de voz activo.", ephemeral: true });
        return;
      }
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

    // ── PERMITIR — Modal ──────────────────────────────────────────────────────
    case "allow": {
      const modal = new ModalBuilder()
        .setCustomId("vcm:allow")
        .setTitle("✅ Permitir usuario");
      modal.addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId("user_id")
            .setLabel("ID del usuario a permitir")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("Ej: 123456789012345678")
            .setRequired(true)
        )
      );
      await interaction.showModal(modal);
      break;
    }

    // ── DES-PERMITIR — Modal ──────────────────────────────────────────────────
    case "deny": {
      const modal = new ModalBuilder()
        .setCustomId("vcm:deny")
        .setTitle("❌ Des-permitir usuario");
      modal.addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId("user_id")
            .setLabel("ID del usuario a des-permitir")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("Ej: 123456789012345678")
            .setRequired(true)
        )
      );
      await interaction.showModal(modal);
      break;
    }

    // ── EXPULSAR — Select menu con miembros del canal ─────────────────────────
    case "kick": {
      if (!voiceChannel || voiceChannel.members.size <= 1) {
        await interaction.reply({ content: "👢 No hay otros usuarios en tu canal.", ephemeral: true });
        return;
      }
      const options = voiceChannel.members
        .filter((m) => m.id !== interaction.user.id)
        .map((m) => ({ label: m.user.username, value: m.id }))
        .slice(0, 25);

      const select = new StringSelectMenuBuilder()
        .setCustomId("vcm:kick_select")
        .setPlaceholder("Selecciona al usuario a expulsar")
        .addOptions(options);

      await interaction.reply({
        content: "� Selecciona al usuario que quieres expulsar:",
        components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select)],
        ephemeral: true,
      });
      break;
    }

    // ── BLOQUEAR — Modal ──────────────────────────────────────────────────────
    case "block": {
      const modal = new ModalBuilder()
        .setCustomId("vcm:block")
        .setTitle("🚫 Bloquear usuario");
      modal.addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId("user_id")
            .setLabel("ID del usuario a bloquear")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("Ej: 123456789012345678")
            .setRequired(true)
        )
      );
      await interaction.showModal(modal);
      break;
    }

    // ── DES-BLOQUEAR — Modal ──────────────────────────────────────────────────
    case "unblock": {
      const modal = new ModalBuilder()
        .setCustomId("vcm:unblock")
        .setTitle("🔓 Des-bloquear usuario");
      modal.addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId("user_id")
            .setLabel("ID del usuario a des-bloquear")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("Ej: 123456789012345678")
            .setRequired(true)
        )
      );
      await interaction.showModal(modal);
      break;
    }

    // ── INVITAR — genera link ─────────────────────────────────────────────────
    case "invite": {
      if (!voiceChannel) {
        await interaction.reply({ content: "❌ No tienes un canal de voz activo.", ephemeral: true });
        return;
      }
      const invite = await voiceChannel.createInvite({ maxAge: 3600, maxUses: 5 });
      await interaction.reply({
        content: `� **Enlace de invitación** (válido 1h · máx 5 usos):\n${invite.url}`,
        ephemeral: true,
      });
      break;
    }

    // ── TRANSFERIR — Modal ────────────────────────────────────────────────────
    case "transfer": {
      const modal = new ModalBuilder()
        .setCustomId("vcm:transfer")
        .setTitle("� Transferir propiedad");
      modal.addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId("user_id")
            .setLabel("ID del nuevo propietario")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("Ej: 123456789012345678")
            .setRequired(true)
        )
      );
      await interaction.showModal(modal);
      break;
    }

    // ── ELIMINAR ──────────────────────────────────────────────────────────────
    case "delete": {
      if (!voiceChannel) {
        await interaction.reply({ content: "❌ No tienes un canal de voz activo.", ephemeral: true });
        return;
      }
      await interaction.reply({ content: "🗑️ Eliminando canal...", ephemeral: true });
      tempChannels.delete(interaction.user.id);
      await voiceChannel.delete("Eliminado por el propietario");
      break;
    }

    default:
      await interaction.reply({ content: "Acción desconocida.", ephemeral: true });
  }
}

// ─── Modal submit handler ─────────────────────────────────────────────────────

export async function handleVoiceMasterModal(interaction: ModalSubmitInteraction): Promise<void> {
  if (!interaction.guild) return;

  const action = interaction.customId.slice(4); // strip "vcm:"
  const voiceChannel = getOwnerChannel(interaction.user.id, interaction.guild);

  if (!voiceChannel) {
    await interaction.reply({ content: "❌ No tienes un canal de voz activo.", ephemeral: true });
    return;
  }

  switch (action) {
    case "rename": {
      const name = interaction.fields.getTextInputValue("channel_name").trim();
      await voiceChannel.setName(name);
      await interaction.reply({ content: `✅ Canal renombrado a **${name}**.`, ephemeral: true });
      break;
    }
    case "limit": {
      const raw = interaction.fields.getTextInputValue("user_limit");
      const limit = parseInt(raw, 10);
      if (isNaN(limit) || limit < 0 || limit > 99) {
        await interaction.reply({ content: "❌ Valor inválido. Usa un número entre 0 y 99.", ephemeral: true });
        return;
      }
      await voiceChannel.setUserLimit(limit);
      await interaction.reply({
        content: `✅ Límite establecido en **${limit === 0 ? "sin límite" : limit + " usuarios"}**.`,
        ephemeral: true,
      });
      break;
    }
    case "allow": {
      const userId = interaction.fields.getTextInputValue("user_id").trim();
      await voiceChannel.permissionOverwrites.edit(userId, { Connect: true });
      await interaction.reply({ content: `✅ <@${userId}> puede conectarse.`, ephemeral: true });
      break;
    }
    case "deny": {
      const userId = interaction.fields.getTextInputValue("user_id").trim();
      await voiceChannel.permissionOverwrites.edit(userId, { Connect: false });
      await interaction.reply({ content: `❌ <@${userId}> ya no puede conectarse.`, ephemeral: true });
      break;
    }
    case "block": {
      const userId = interaction.fields.getTextInputValue("user_id").trim();
      await voiceChannel.permissionOverwrites.edit(userId, { Connect: false, Speak: false });
      const target = interaction.guild.members.cache.get(userId);
      if (target?.voice.channelId === voiceChannel.id) await target.voice.disconnect();
      await interaction.reply({ content: `🚫 <@${userId}> bloqueado.`, ephemeral: true });
      break;
    }
    case "unblock": {
      const userId = interaction.fields.getTextInputValue("user_id").trim();
      await voiceChannel.permissionOverwrites.delete(userId);
      await interaction.reply({ content: `🔓 <@${userId}> desbloqueado.`, ephemeral: true });
      break;
    }
    case "transfer": {
      const userId = interaction.fields.getTextInputValue("user_id").trim();
      const ownerId = interaction.user.id;
      tempChannels.delete(ownerId);
      tempChannels.set(userId, voiceChannel.id);
      await voiceChannel.permissionOverwrites.edit(userId, {
        ManageChannels: true, Connect: true, Speak: true, MoveMembers: true,
      });
      await voiceChannel.permissionOverwrites.edit(ownerId, { ManageChannels: false });
      await interaction.reply({ content: `🔄 Propiedad transferida a <@${userId}>.`, ephemeral: true });
      break;
    }
    default:
      await interaction.reply({ content: "Acción desconocida.", ephemeral: true });
  }
}

// ─── Select menu handler (kick) ───────────────────────────────────────────────

export async function handleVoiceMasterSelect(interaction: StringSelectMenuInteraction): Promise<void> {
  if (!interaction.guild) return;

  if (interaction.customId === "vcm:kick_select") {
    const targetId = interaction.values[0]!;
    const voiceChannel = getOwnerChannel(interaction.user.id, interaction.guild);
    if (!voiceChannel) {
      await interaction.reply({ content: "❌ No tienes un canal de voz activo.", ephemeral: true });
      return;
    }
    const target = interaction.guild.members.cache.get(targetId);
    if (target?.voice.channelId === voiceChannel.id) {
      await target.voice.disconnect("Expulsado por el propietario del canal");
    }
    await interaction.reply({ content: `👢 <@${targetId}> fue expulsado del canal.`, ephemeral: true });
  }
}

// ─── /setup-editorvoice command ───────────────────────────────────────────────

export const data = new SlashCommandBuilder()
  .setName("setup-editorvoice")
  .setDescription("Publica el panel de Voice Custom en el canal editor")
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

    const { embed, rows, attachment } = buildControlPanel();
    await channel.send({ embeds: [embed], components: rows, files: [attachment] });
    await interaction.editReply({ content: `✅ Panel publicado en <#${EDITOR_TEXT_CHANNEL_ID}>.` });
  } catch (err) {
    await interaction.editReply({ content: `❌ Error: ${err instanceof Error ? err.message : "desconocido"}` });
  }
}

export { tempChannels };
