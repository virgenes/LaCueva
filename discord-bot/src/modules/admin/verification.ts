import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  Client,
  GuildMember,
  type ButtonInteraction,
} from "discord.js";
import { getDb } from "../../utils/database.js";

// ─── Constants ────────────────────────────────────────────────────────────────

const VERIFY_CHANNEL_ID = "1082764965330563122";
const ROLE_INADAPTADO   = "1083129671174078566";   // assigned on verify
const ROLE_USUARIO_COMUN = "1084414849141977190";  // assigned after 7 days
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const BUTTON_ID = "verify_button";

// ─── DB helpers ───────────────────────────────────────────────────────────────

function ensureTable(): void {
  getDb().exec(`
    CREATE TABLE IF NOT EXISTS verified_members (
      member_id   TEXT NOT NULL,
      guild_id    TEXT NOT NULL,
      verified_at TEXT NOT NULL,
      promoted    INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (member_id, guild_id)
    )
  `);
}

function saveVerified(memberId: string, guildId: string): void {
  ensureTable();
  getDb()
    .prepare(
      `INSERT OR IGNORE INTO verified_members (member_id, guild_id, verified_at, promoted)
       VALUES (?, ?, ?, 0)`
    )
    .run(memberId, guildId, new Date().toISOString());
}

interface VerifiedRow {
  member_id: string;
  guild_id: string;
  verified_at: string;
  promoted: number;
}

function getPendingPromotions(guildId: string): VerifiedRow[] {
  ensureTable();
  const cutoff = new Date(Date.now() - ONE_WEEK_MS).toISOString();
  return getDb()
    .prepare(
      `SELECT * FROM verified_members
       WHERE guild_id = ? AND promoted = 0 AND verified_at <= ?`
    )
    .all(guildId, cutoff) as VerifiedRow[];
}

function markPromoted(memberId: string, guildId: string): void {
  getDb()
    .prepare(`UPDATE verified_members SET promoted = 1 WHERE member_id = ? AND guild_id = ?`)
    .run(memberId, guildId);
}

// ─── Verification embed ───────────────────────────────────────────────────────

function buildVerifyEmbed(): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle("📡 ¡Transmisión de bienvenida recibida!")
    .setDescription(
      "¡Hola, ser de cultura digital! Me alegra que hayas aterrizado por aquí. " +
      "Soy el bot que cuida la puerta, y te doy la bienvenida a **🎮 La Cueva**.\n\n" +
      "Este rincón del multiverso está hecho para dos cosas:\n" +
      "• **Entretenimiento** sin dramas (o con los justos y bien narrados).\n" +
      "• **Videojuegos** de todas las épocas, plataformas y niveles de habilidad " +
      "(sí, incluso ese juego al que le echaste 2000 horas y del que no hablas en público).\n\n" +
      "**¿Por qué esta verificación?**\n" +
      "Muy sencillo: queremos que la experiencia sea tan fluida como un buen framerate. " +
      "Esto nos ayuda a mantener alejados a los spam bots (nada personales, pero hay que ser selectivos) " +
      "y a asegurarnos de que quien entra es alguien con ganas de compartir, reírse y echar partidas tranquilamente. " +
      "Es un pequeño paso para ti, pero un gran paso para que el caos siga siendo el divertido y no el molesto.\n\n" +
      "Cuando le des al botón de abajo, se abrirán las puertas del lobby. Sin presión, pero con ganas."
    )
    .setFooter({ text: "🎮 La Cueva · Sistema de verificación" })
    .setTimestamp();
}

function buildVerifyRow(): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(BUTTON_ID)
      .setLabel("✅ Entrar al lobby")
      .setStyle(ButtonStyle.Success)
  );
}

// ─── Button handler ───────────────────────────────────────────────────────────

export async function handleVerifyButton(interaction: ButtonInteraction): Promise<void> {
  if (!interaction.guild) return;

  const member = interaction.member as GuildMember;

  // Already has the role
  if (member.roles.cache.has(ROLE_INADAPTADO)) {
    await interaction.reply({
      content: "✅ Ya estás verificado. ¡Bienvenido de vuelta al lobby!",
      ephemeral: true,
    });
    return;
  }

  try {
    await member.roles.add(ROLE_INADAPTADO, "Verificación completada");
    saveVerified(member.id, interaction.guild.id);

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x57f287)
          .setTitle("🎮 ¡Acceso concedido!")
          .setDescription(
            `Bienvenido al lobby, <@${member.id}>. Las puertas están abiertas.\n\n` +
            "Explora los canales, preséntate si quieres, y sobre todo... disfruta."
          )
          .setFooter({ text: "Permanece una semana y desbloquearás el rango de Usuario Común 🏆" })
          .setTimestamp(),
      ],
      ephemeral: true,
    });
  } catch {
    await interaction.reply({
      content: "❌ No pude asignarte el rol. Contacta a un administrador.",
      ephemeral: true,
    });
  }
}

// ─── Weekly promotion scheduler ──────────────────────────────────────────────

export function initVerificationScheduler(client: Client): void {
  // Check every hour for members who have been verified for 7+ days
  setInterval(async () => {
    for (const [guildId, guild] of client.guilds.cache) {
      const pending = getPendingPromotions(guildId);
      for (const row of pending) {
        try {
          const member = await guild.members.fetch(row.member_id).catch(() => null);
          if (!member) {
            markPromoted(row.member_id, guildId); // member left, skip
            continue;
          }
          await member.roles.add(ROLE_USUARIO_COMUN, "7 días en el servidor");
          markPromoted(row.member_id, guildId);
          console.log(`[verify] Promoted ${member.user.username} to Usuario Común`);
        } catch (err) {
          console.error(`[verify] Failed to promote ${row.member_id}:`, err);
        }
      }
    }
  }, 60 * 60 * 1000); // every hour
}

// ─── /setup-verify command ────────────────────────────────────────────────────

export const data = new SlashCommandBuilder()
  .setName("setup-verify")
  .setDescription("Publica el mensaje de verificación en el canal de verificación")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guild) {
    await interaction.reply({ content: "Solo funciona en un servidor.", ephemeral: true });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    const channel = await interaction.guild.channels.fetch(VERIFY_CHANNEL_ID);
    if (!channel || !channel.isTextBased()) {
      await interaction.editReply({ content: `❌ No encontré el canal <#${VERIFY_CHANNEL_ID}>.` });
      return;
    }

    await channel.send({
      embeds: [buildVerifyEmbed()],
      components: [buildVerifyRow()],
    });

    await interaction.editReply({ content: `✅ Mensaje de verificación publicado en <#${VERIFY_CHANNEL_ID}>.` });
  } catch (err) {
    await interaction.editReply({ content: `❌ Error: ${err instanceof Error ? err.message : "desconocido"}` });
  }
}
