import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
  ModalSubmitInteraction,
  PermissionFlagsBits,
  TextChannel,
} from "discord.js";

// /embed command — shows a modal to build a custom embed
const embedCommand = new SlashCommandBuilder()
  .setName("embed")
  .setDescription("Crea un embed personalizado en este canal")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

// /say command — bot posts a message (optionally as embed) and deletes the original
const sayCommand = new SlashCommandBuilder()
  .setName("say")
  .setDescription("El bot publica un mensaje en el canal actual")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
  .addStringOption((opt) =>
    opt
      .setName("mensaje")
      .setDescription("Mensaje a publicar")
      .setRequired(true)
  )
  .addBooleanOption((opt) =>
    opt
      .setName("embed")
      .setDescription("Publicar dentro de un embed")
      .setRequired(false)
  );

export const commands = [
  { data: embedCommand, execute },
  { data: sayCommand, execute },
];

export async function execute(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  if (interaction.commandName === "embed") {
    await handleEmbed(interaction);
  } else if (interaction.commandName === "say") {
    await handleSay(interaction);
  }
}

async function handleEmbed(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const modal = new ModalBuilder()
    .setCustomId("embed_modal")
    .setTitle("Crear Embed Personalizado");

  const titleInput = new TextInputBuilder()
    .setCustomId("embed_title")
    .setLabel("Título")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(256);

  const descriptionInput = new TextInputBuilder()
    .setCustomId("embed_description")
    .setLabel("Descripción")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setMaxLength(4000);

  const colorInput = new TextInputBuilder()
    .setCustomId("embed_color")
    .setLabel("Color (hex, ej: #FF5733)")
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setPlaceholder("#5865F2");

  const imageInput = new TextInputBuilder()
    .setCustomId("embed_image")
    .setLabel("URL de imagen (opcional)")
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setPlaceholder("https://ejemplo.com/imagen.png");

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(titleInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(descriptionInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(colorInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(imageInput)
  );

  await interaction.showModal(modal);

  // Wait for modal submission (up to 5 minutes)
  let modalInteraction: ModalSubmitInteraction;
  try {
    modalInteraction = await interaction.awaitModalSubmit({
      filter: (i) =>
        i.customId === "embed_modal" && i.user.id === interaction.user.id,
      time: 300_000,
    });
  } catch {
    // Timed out — no action needed
    return;
  }

  const title = modalInteraction.fields.getTextInputValue("embed_title");
  const description = modalInteraction.fields.getTextInputValue(
    "embed_description"
  );
  const colorRaw = modalInteraction.fields
    .getTextInputValue("embed_color")
    .trim();
  const imageUrl = modalInteraction.fields
    .getTextInputValue("embed_image")
    .trim();

  // Parse hex color
  let color: number = 0x5865f2;
  if (colorRaw) {
    const hex = colorRaw.replace(/^#/, "");
    const parsed = parseInt(hex, 16);
    if (!isNaN(parsed) && hex.length === 6) {
      color = parsed;
    }
  }

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color)
    .setTimestamp();

  if (imageUrl) {
    try {
      new URL(imageUrl); // validate URL
      embed.setImage(imageUrl);
    } catch {
      // Invalid URL — skip image
    }
  }

  const channel = interaction.channel as TextChannel;
  await channel.send({ embeds: [embed] });

  await modalInteraction.reply({
    content: "✅ Embed publicado correctamente.",
    ephemeral: true,
  });
}

async function handleSay(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const message = interaction.options.getString("mensaje", true);
  const useEmbed = interaction.options.getBoolean("embed") ?? false;

  const channel = interaction.channel as TextChannel;

  if (useEmbed) {
    const embed = new EmbedBuilder()
      .setDescription(message)
      .setColor(0x5865f2)
      .setTimestamp();

    await channel.send({ embeds: [embed] });
  } else {
    await channel.send({ content: message });
  }

  // Delete the original slash command interaction (ephemeral reply then delete)
  await interaction.reply({ content: "✅", ephemeral: true });
  await interaction.deleteReply();
}
