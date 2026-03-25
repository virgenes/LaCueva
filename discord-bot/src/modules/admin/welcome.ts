import { GuildMember, TextChannel, EmbedBuilder } from "discord.js";

const WELCOME_CHANNEL_ID = "1083140335271690240";
const GOODBYE_CHANNEL_ID = "1084401299900071968";

// ─── Welcome ──────────────────────────────────────────────────────────────────

export async function welcomeMessage(member: GuildMember): Promise<void> {
  try {
    const channel = await member.guild.channels.fetch(WELCOME_CHANNEL_ID).catch(() => null);
    if (!channel || !channel.isTextBased()) return;

    const memberCount = member.guild.memberCount;
    const joinedAt = member.joinedAt
      ? `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:R>`
      : "ahora mismo";

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setAuthor({
        name: `¡Un nuevo jugador ha entrado en la partida!`,
        iconURL: member.user.displayAvatarURL({ size: 64 }),
      })
      .setTitle(`🎮 Bienvenido/a, ${member.user.username}`)
      .setDescription(
        `> Es un gusto tenerte por aquí, <@${member.id}>. Acabas de aterrizar en este servidor con olor a pescado y axilas sudadas, espero la pases bien.\n\n` +
        `Pero te aconsejamos que primero revises los canales que te indicamos para que tengas la mejor experiencia:\n\n` +
        `🛡️ **Si buscas ayuda** te tenemos buenas noticias, ¡No hay miembros del staff! Solo yo y un tal Maximo que ese es rolo de perdedor así que no te preocupes, pero si aún así buscas algo... <#1083131170834890893>\n\n` +
        `🎭 **Sección decorativa:** Pásate por <#1486244953817350166> y selecciona tus intereses para conocerte y conocernos mejor.\n\n` +
        `📝 **Preséntate:** No seas un maldito NPC, cuéntanos un poco de ti en <#1083137376072765521>.\n\n` +
        `✨ ¡Que comiencen tus travesías por esta cloaca llamada **Cueva de los Vírgenes**!`
      )
      .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: "📅 Se unió", value: joinedAt, inline: true },
        { name: "👥 Miembro #", value: `${memberCount}`, inline: true },
        { name: "🆔 Cuenta creada", value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
      )
      .setFooter({ text: "La Cueva de los Vírgenes · ¡Bienvenido al caos!" })
      .setTimestamp();

    await (channel as TextChannel).send({ content: `<@${member.id}>`, embeds: [embed] });
  } catch {
    // fail silently
  }
}

// ─── Goodbye ──────────────────────────────────────────────────────────────────

export async function goodbyeMessage(member: GuildMember): Promise<void> {
  try {
    const channel = await member.guild.channels.fetch(GOODBYE_CHANNEL_ID).catch(() => null);
    if (!channel || !channel.isTextBased()) return;

    const embed = new EmbedBuilder()
      .setColor(0x2c2f33)
      .setAuthor({
        name: `Partida guardada`,
        iconURL: member.user.displayAvatarURL({ size: 64 }),
      })
      .setTitle(`💾 ${member.user.username} ha abandonado la sesión`)
      .setDescription(
        `> El equipo ha perdido a un integrante.\n\n` +
        `Los datos de sesión de **${member.user.username}** se han archivado.\n\n` +
        `Esperamos que su camino por el servidor haya sido grato y que, si decide volver a esta tortura, las puertas de esta comunidad sigan abiertas siempre para ese fracasado.\n\n` +
        `*Gracias por haber formado parte de nuestra historia.*`
      )
      .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: "👥 Miembros restantes", value: `${member.guild.memberCount}`, inline: true },
        { name: "📅 Salió", value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true },
      )
      .setFooter({ text: "La Cueva de los Vírgenes · Hasta la próxima, si es que hay una." })
      .setTimestamp();

    await (channel as TextChannel).send({ embeds: [embed] });
  } catch {
    // fail silently
  }
}
