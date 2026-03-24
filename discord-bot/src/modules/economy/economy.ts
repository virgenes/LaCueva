import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { readData, writeData } from "../../utils/dataStore.js";
import { buildEmbed } from "../../utils/embeds.js";
import { progressBar } from "../../utils/progressBar.js";
import { getMessage } from "../../utils/personality.js";
import type { EconomyEntry, GuildConfig } from "../../types/index.js";

const ECONOMY_FILE = "economy.json";
const DAILY_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

// ─── Data helpers ─────────────────────────────────────────────────────────────

type EconomyStore = Record<string, EconomyEntry>;

function loadStore(): EconomyStore {
  return readData<EconomyStore>(ECONOMY_FILE, {});
}

function saveStore(store: EconomyStore): void {
  writeData(ECONOMY_FILE, store);
}

function getEntry(memberId: string): EconomyEntry {
  const store = loadStore();
  return store[memberId] ?? { memberId, balance: 0, lastDaily: null };
}

function saveEntry(entry: EconomyEntry): void {
  const store = loadStore();
  store[entry.memberId] = entry;
  saveStore(store);
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function getBalance(memberId: string): number {
  return getEntry(memberId).balance;
}

export function addBalance(memberId: string, amount: number): void {
  const entry = getEntry(memberId);
  entry.balance += amount;
  saveEntry(entry);
}

/**
 * Deducts `amount` from `memberId`. Returns false if insufficient balance.
 */
export function deductBalance(memberId: string, amount: number): boolean {
  const entry = getEntry(memberId);
  if (entry.balance < amount) return false;
  entry.balance -= amount;
  saveEntry(entry);
  return true;
}

// ─── Personality mode helper ──────────────────────────────────────────────────

function getPersonalityMode(): "friki" | "formal" {
  const config = readData<GuildConfig>("config.json", {
    guildId: "",
    logsChannelId: null,
    autoRoleId: null,
    autoRoleEnabled: false,
    chatBridgeChannelId: null,
    chatBridgeReadOnly: false,
    announcementsChannelId: null,
    personalityMode: "friki",
    gifUrls: { welcome: "", ban: "", ticket: "", event: "" },
    antiSpamExemptChannels: [],
    trustedBots: [],
  });
  return config.personalityMode;
}

// ─── Command definition ───────────────────────────────────────────────────────

export const data = new SlashCommandBuilder()
  .setName("economia")
  .setDescription("Sistema de economía virtual")
  .addSubcommand((sub) =>
    sub.setName("daily").setDescription("Reclama tu recompensa diaria de monedas")
  )
  .addSubcommand((sub) =>
    sub.setName("balance").setDescription("Consulta tu saldo actual de monedas")
  )
  .addSubcommand((sub) =>
    sub
      .setName("transfer")
      .setDescription("Transfiere monedas a otro miembro")
      .addUserOption((opt) =>
        opt.setName("member").setDescription("Miembro destinatario").setRequired(true)
      )
      .addIntegerOption((opt) =>
        opt
          .setName("cantidad")
          .setDescription("Cantidad de monedas a transferir")
          .setMinValue(1)
          .setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub.setName("ranking").setDescription("Muestra el top 10 de miembros con más monedas")
  );

// ─── Execute ──────────────────────────────────────────────────────────────────

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const sub = interaction.options.getSubcommand();

  switch (sub) {
    case "daily":    await handleDaily(interaction);    break;
    case "balance":  await handleBalance(interaction);  break;
    case "transfer": await handleTransfer(interaction); break;
    case "ranking":  await handleRanking(interaction);  break;
  }
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

async function handleDaily(interaction: ChatInputCommandInteraction): Promise<void> {
  const memberId = interaction.user.id;
  const entry = getEntry(memberId);
  const now = Date.now();

  if (entry.lastDaily !== null) {
    const elapsed = now - new Date(entry.lastDaily).getTime();

    if (elapsed < DAILY_COOLDOWN_MS) {
      const remaining = DAILY_COOLDOWN_MS - elapsed;
      const totalSeconds = Math.floor(remaining / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      const remainingStr = `${hours}h ${minutes}m ${seconds}s`;

      // Progress bar: percentage of 24h elapsed
      const bar = progressBar(elapsed, DAILY_COOLDOWN_MS);

      const mode = getPersonalityMode();
      const msg = getMessage("dailyCooldown", {
        member: interaction.user.username,
        remaining: remainingStr,
      }, mode);

      const embed = buildEmbed("economy", {
        title: "⏳ Recompensa no disponible",
        description: `${msg}\n\n**Progreso del cooldown:**\n${bar}`,
      });

      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }
  }

  // Grant between 100 and 200 coins
  const amount = Math.floor(Math.random() * 101) + 100;
  entry.balance += amount;
  entry.lastDaily = new Date(now).toISOString();
  saveEntry(entry);

  const mode = getPersonalityMode();
  const msg = getMessage("daily", {
    member: interaction.user.username,
    amount: String(amount),
    balance: String(entry.balance),
  }, mode);

  const embed = buildEmbed("economy", {
    title: "💰 Recompensa diaria",
    description: msg,
    fields: [
      { name: "Monedas obtenidas", value: `+${amount} 🪙`, inline: true },
      { name: "Saldo actual", value: `${entry.balance} 🪙`, inline: true },
    ],
  });

  await interaction.reply({ embeds: [embed] });
}

async function handleBalance(interaction: ChatInputCommandInteraction): Promise<void> {
  const memberId = interaction.user.id;
  const balance = getBalance(memberId);

  const mode = getPersonalityMode();
  const msg = getMessage("balance", {
    member: interaction.user.username,
    balance: String(balance),
  }, mode);

  const embed = buildEmbed("economy", {
    title: "🪙 Saldo",
    description: msg,
    fields: [{ name: "Balance", value: `${balance} monedas`, inline: true }],
  });

  await interaction.reply({ embeds: [embed] });
}

async function handleTransfer(interaction: ChatInputCommandInteraction): Promise<void> {
  const sender = interaction.user;
  const receiver = interaction.options.getUser("member", true);
  const amount = interaction.options.getInteger("cantidad", true);

  // Cannot transfer to yourself
  if (sender.id === receiver.id) {
    await interaction.reply({
      embeds: [
        buildEmbed("error", {
          title: "❌ Transferencia inválida",
          description: "No puedes transferirte monedas a ti mismo.",
        }),
      ],
      ephemeral: true,
    });
    return;
  }

  const senderBalance = getBalance(sender.id);
  const success = deductBalance(sender.id, amount);

  if (!success) {
    const embed = buildEmbed("error", {
      title: "❌ Saldo insuficiente",
      description: `No tienes suficientes monedas para esta transferencia.\n\n**Saldo actual:** ${senderBalance} 🪙\n**Cantidad requerida:** ${amount} 🪙`,
    });
    await interaction.reply({ embeds: [embed], ephemeral: true });
    return;
  }

  addBalance(receiver.id, amount);
  const newSenderBalance = getBalance(sender.id);

  const mode = getPersonalityMode();
  const msg = getMessage("transfer", {
    sender: sender.username,
    receiver: receiver.username,
    amount: String(amount),
    balance: String(newSenderBalance),
  }, mode);

  const embed = buildEmbed("economy", {
    title: "💸 Transferencia completada",
    description: msg,
    fields: [
      { name: "Enviado", value: `${amount} 🪙`, inline: true },
      { name: "Destinatario", value: receiver.username, inline: true },
      { name: "Tu nuevo saldo", value: `${newSenderBalance} 🪙`, inline: true },
    ],
  });

  await interaction.reply({ embeds: [embed] });
}

async function handleRanking(interaction: ChatInputCommandInteraction): Promise<void> {
  const store = loadStore();
  const entries = Object.values(store)
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 10);

  if (entries.length === 0) {
    await interaction.reply({
      embeds: [
        buildEmbed("economy", {
          title: "🏆 Ranking de economía",
          description: "Aún no hay datos de economía en este servidor.",
        }),
      ],
    });
    return;
  }

  const maxBalance = entries[0]!.balance;
  const medals = ["🥇", "🥈", "🥉"];

  const lines = entries.map((entry, i) => {
    const medal = medals[i] ?? `**${i + 1}.**`;
    const bar = progressBar(entry.balance, maxBalance);
    return `${medal} <@${entry.memberId}> — ${entry.balance} 🪙\n${bar}`;
  });

  const embed = buildEmbed("economy", {
    title: "🏆 Ranking de economía — Top 10",
    description: lines.join("\n\n"),
  });

  await interaction.reply({ embeds: [embed] });
}
