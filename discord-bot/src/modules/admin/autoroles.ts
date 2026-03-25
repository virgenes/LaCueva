import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  TextChannel,
  type ButtonInteraction,
} from "discord.js";

// ─── Constants ────────────────────────────────────────────────────────────────

const AUTOROLES_CHANNEL_ID = "1486244953817350166";

// ─── Role definitions ─────────────────────────────────────────────────────────

const SECTIONS = [
  {
    id: "identidad",
    embed: new EmbedBuilder()
      .setColor(0x9b59b6)
      .setTitle("🎭 Sobre Ti — Identidad básica")
      .setDescription(
        "Esta sección ayuda a que los miembros interactúen con mayor comodidad.\n\n" +
        "**Pronombres**\n" +
        "🟢 Él / Lo\n🟡 Ella / La\n🟣 Cualquier pronombre\n\n" +
        "**Edad**\n" +
        "🔞 Mayor de 18\n🎒 Menor de 18"
      )
      .setFooter({ text: "Haz clic en los botones para obtener o quitar el rol" }),
    rows: [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId("ar:1486246325698957402").setLabel("🟢 Él / Lo").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("ar:1486247419497938944").setLabel("🟡 Ella / La").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("ar:1486247590264836117").setLabel("🟣 Cualquier pronombre").setStyle(ButtonStyle.Secondary),
      ),
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId("ar:1486247696284127373").setLabel("🔞 +18").setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId("ar:1486247733630079096").setLabel("🎒 -18").setStyle(ButtonStyle.Primary),
      ),
    ],
  },
  {
    id: "tecnico",
    embed: new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle("💻 Habilidades e Intereses Técnicos")
      .setDescription(
        "Ideal para que los miembros encuentren a otros con quienes colaborar en proyectos o hablar de tecnología.\n\n" +
        "⌨️ **Programador / Web Dev** — TypeScript, React, etc.\n" +
        "🎨 **Diseñador / Pixel Artist** — Creativos visuales\n" +
        "🕹️ **Game Dev** — Motores, diseño de niveles\n" +
        "⚙️ **PC Master Race** — Hardware, setups, GPUs\n" +
        "🧠 **Tech & IA** — Modelos locales, automatización"
      )
      .setFooter({ text: "Haz clic en los botones para obtener o quitar el rol" }),
    rows: [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId("ar:1486247903608442951").setLabel("⌨️ Programador / Web Dev").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("ar:1486248195981053962").setLabel("🎨 Diseñador / Pixel Artist").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("ar:1486248295574671400").setLabel("🕹️ Game Dev").setStyle(ButtonStyle.Primary),
      ),
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId("ar:1486248595865866241").setLabel("⚙️ PC Master Race").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("ar:1486248749494833223").setLabel("🧠 Tech & IA").setStyle(ButtonStyle.Primary),
      ),
    ],
  },
  {
    id: "gaming",
    embed: new EmbedBuilder()
      .setColor(0x57f287)
      .setTitle("🎮 Gaming")
      .setDescription(
        "Para que los usuarios puedan agruparse fácilmente según el tipo de juegos que prefieren.\n\n" +
        "⚔️ **RPG & Aventura**\n" +
        "👾 **Retro & Indie** — Estética 16-bit, SNES\n" +
        "🧱 **Roblox / Sandbox**\n" +
        "🔫 **Shooters / Competitivo**"
      )
      .setFooter({ text: "Haz clic en los botones para obtener o quitar el rol" }),
    rows: [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId("ar:1486249068345823292").setLabel("⚔️ RPG & Aventura").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("ar:1486249236012994654").setLabel("👾 Retro & Indie").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("ar:1486249383786840114").setLabel("🧱 Roblox / Sandbox").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("ar:1486249473209270282").setLabel("🔫 Shooters / Competitivo").setStyle(ButtonStyle.Success),
      ),
    ],
  },
  {
    id: "entretenimiento",
    embed: new EmbedBuilder()
      .setColor(0xe74c3c)
      .setTitle("🎌 Entretenimiento y Cultura")
      .setDescription(
        "Para abrir canales de conversación sobre los gustos de la comunidad.\n\n" +
        "📖 **Manga & Anime** — Berserk, Vagabond, One-Punch Man...\n" +
        "🎬 **Cinéfilo / Series**\n" +
        "🎥 **Creador de Contenido** — YouTubers, streamers, podcasters"
      )
      .setFooter({ text: "Haz clic en los botones para obtener o quitar el rol" }),
    rows: [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId("ar:1486249609847242762").setLabel("📖 Manga & Anime").setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId("ar:1486249725832204450").setLabel("🎬 Cinéfilo / Series").setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId("ar:1486249917285531648").setLabel("🎥 Creador de Contenido").setStyle(ButtonStyle.Danger),
      ),
    ],
  },
  {
    id: "colores",
    embed: new EmbedBuilder()
      .setColor(0xf1c40f)
      .setTitle("🔔 Colores")
      .setDescription(
        "¡La sección más decorativa! Elige tu color de nombre.\n\n" +
        "🔴 Rojo · 🔵 Azul · 🟢 Verde · 🟡 Amarillo · 🟣 Morado · ⚫ Negro"
      )
      .setFooter({ text: "Solo puedes tener un color activo a la vez — el nuevo reemplaza al anterior" }),
    rows: [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId("arc:1486250368869597288").setLabel("🔴 ROJO").setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId("arc:1486250505834598410").setLabel("🔵 AZUL").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("arc:1486250646008102982").setLabel("🟢 VERDE").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("arc:1486250734570962967").setLabel("🟡 AMARILLO").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("arc:1486250798965854318").setLabel("🟣 MORADO").setStyle(ButtonStyle.Secondary),
      ),
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId("arc:1486250885309927444").setLabel("⚫ NEGRO").setStyle(ButtonStyle.Secondary),
      ),
    ],
  },
];

// All color role IDs for mutual exclusion
const COLOR_ROLE_IDS = [
  "1486250368869597288",
  "1486250505834598410",
  "1486250646008102982",
  "1486250734570962967",
  "1486250798965854318",
  "1486250885309927444",
];

// ─── Button handler ───────────────────────────────────────────────────────────

export async function handleAutoRoleButton(interaction: ButtonInteraction): Promise<void> {
  if (!interaction.guild) return;

  const { customId } = interaction;
  const isColor = customId.startsWith("arc:");
  const roleId = customId.slice(customId.indexOf(":") + 1);

  const member = interaction.guild.members.cache.get(interaction.user.id)
    ?? await interaction.guild.members.fetch(interaction.user.id).catch(() => null);

  if (!member) {
    await interaction.reply({ content: "No se pudo encontrar tu perfil en el servidor.", ephemeral: true });
    return;
  }

  try {
    if (isColor) {
      // Remove all other color roles first, then toggle the selected one
      const hasRole = member.roles.cache.has(roleId);
      const toRemove = COLOR_ROLE_IDS.filter((id) => id !== roleId && member.roles.cache.has(id));
      if (toRemove.length > 0) await member.roles.remove(toRemove);

      if (hasRole) {
        await member.roles.remove(roleId);
        await interaction.reply({ content: `Color eliminado.`, ephemeral: true });
      } else {
        await member.roles.add(roleId);
        const roleName = interaction.guild.roles.cache.get(roleId)?.name ?? roleId;
        await interaction.reply({ content: `✅ Color **${roleName}** asignado.`, ephemeral: true });
      }
    } else {
      // Toggle normal role
      if (member.roles.cache.has(roleId)) {
        await member.roles.remove(roleId);
        const roleName = interaction.guild.roles.cache.get(roleId)?.name ?? roleId;
        await interaction.reply({ content: `❌ Rol **${roleName}** eliminado.`, ephemeral: true });
      } else {
        await member.roles.add(roleId);
        const roleName = interaction.guild.roles.cache.get(roleId)?.name ?? roleId;
        await interaction.reply({ content: `✅ Rol **${roleName}** asignado.`, ephemeral: true });
      }
    }
  } catch {
    await interaction.reply({ content: "No pude modificar tu rol. Verifica que el bot tenga permisos.", ephemeral: true });
  }
}

// ─── /setup-autoroles command ─────────────────────────────────────────────────

export const data = new SlashCommandBuilder()
  .setName("setup-autoroles")
  .setDescription("Publica todos los paneles de autoroles en el canal configurado")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guild) {
    await interaction.reply({ content: "Solo funciona en un servidor.", ephemeral: true });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    const channel = await interaction.guild.channels.fetch(AUTOROLES_CHANNEL_ID);
    if (!channel || !channel.isTextBased()) {
      await interaction.editReply({ content: `❌ No encontré el canal <#${AUTOROLES_CHANNEL_ID}>.` });
      return;
    }

    const textChannel = channel as TextChannel;

    for (const section of SECTIONS) {
      await textChannel.send({
        embeds: [section.embed],
        components: section.rows,
      });
      // Small delay to preserve order
      await new Promise((r) => setTimeout(r, 500));
    }

    await interaction.editReply({ content: `✅ Los 5 paneles de autoroles han sido publicados en <#${AUTOROLES_CHANNEL_ID}>.` });
  } catch (err) {
    await interaction.editReply({ content: `❌ Error: ${err instanceof Error ? err.message : "desconocido"}` });
  }
}
