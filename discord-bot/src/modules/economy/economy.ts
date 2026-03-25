import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
} from "discord.js";
import { getDb } from "../../utils/database.js";
import { buildEmbed } from "../../utils/embeds.js";
import { progressBar } from "../../utils/progressBar.js";
import { getMessage } from "../../utils/personality.js";
import { CooldownManager } from "../../utils/cooldown.js";
import { readData } from "../../utils/dataStore.js";
import type { GuildConfig } from "../../types/index.js";

const DAILY_COOLDOWN_MS = 24 * 60 * 60 * 1000;       // 24 hours
const DAILY_STREAK_BREAK_MS = 48 * 60 * 60 * 1000;   // 48 hours — racha se rompe
const WORK_COOLDOWN_MS = 4 * 60 * 60 * 1000;          // 4 hours
const ROB_COOLDOWN_MS = 2 * 60 * 60 * 1000;           // 2 hours

const cooldowns = new CooldownManager();

// ─── SQLite helpers ───────────────────────────────────────────────────────────

interface EconomyRow {
  member_id: string;
  guild_id: string;
  balance: number;
  last_daily: string | null;
  daily_streak: number;
  last_work: string | null;
}

function getRow(memberId: string, guildId: string): EconomyRow {
  const db = getDb();
  const row = db
    .prepare(
      "SELECT * FROM economy WHERE member_id = ? AND guild_id = ?"
    )
    .get(memberId, guildId) as EconomyRow | undefined;

  if (!row) {
    db.prepare(
      `INSERT OR IGNORE INTO economy (member_id, guild_id, balance, last_daily, daily_streak, last_work)
       VALUES (?, ?, 0, NULL, 0, NULL)`
    ).run(memberId, guildId);
    return { member_id: memberId, guild_id: guildId, balance: 0, last_daily: null, daily_streak: 0, last_work: null };
  }
  return row;
}

function updateRow(row: EconomyRow): void {
  getDb()
    .prepare(
      `INSERT INTO economy (member_id, guild_id, balance, last_daily, daily_streak, last_work)
       VALUES (@member_id, @guild_id, @balance, @last_daily, @daily_streak, @last_work)
       ON CONFLICT(member_id, guild_id) DO UPDATE SET
         balance      = excluded.balance,
         last_daily   = excluded.last_daily,
         daily_streak = excluded.daily_streak,
         last_work    = excluded.last_work`
    )
    .run(row);
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function getBalance(memberId: string, guildId: string): number {
  return getRow(memberId, guildId).balance;
}

export function addBalance(memberId: string, guildId: string, amount: number): void {
  const row = getRow(memberId, guildId);
  row.balance += amount;
  updateRow(row);
}

export function deductBalance(memberId: string, guildId: string, amount: number): boolean {
  const row = getRow(memberId, guildId);
  if (row.balance < amount) return false;
  row.balance -= amount;
  updateRow(row);
  return true;
}

// ─── Config helpers ───────────────────────────────────────────────────────────

interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  roleId?: string;
}

function getPersonalityMode(guildId?: string): "friki" | "formal" {
  const config = readData<Record<string, GuildConfig>>("config.json", {});
  const guildConfig = guildId ? config[guildId] : undefined;
  return guildConfig?.personalityMode ?? "friki";
}

function getShopItems(guildId: string): ShopItem[] {
  const config = readData<Record<string, GuildConfig & { shopItems?: ShopItem[] }>>("config.json", {});
  return config[guildId]?.shopItems ?? [];
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
  )
  .addSubcommand((sub) =>
    sub.setName("shop").setDescription("Muestra la tienda del servidor")
  )
  .addSubcommand((sub) =>
    sub.setName("work").setDescription("Trabaja para ganar monedas (cooldown 4h)")
  )
  .addSubcommand((sub) =>
    sub
      .setName("rob")
      .setDescription("Intenta robar monedas a otro miembro (cooldown 2h)")
      .addUserOption((opt) =>
        opt.setName("target").setDescription("Miembro al que intentas robar").setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("bet")
      .setDescription("Apuesta monedas en un 50/50")
      .addIntegerOption((opt) =>
        opt
          .setName("cantidad")
          .setDescription("Cantidad de monedas a apostar")
          .setMinValue(1)
          .setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub.setName("top").setDescription("Ranking de los 10 miembros con más monedas")
  )
  .addSubcommand((sub) =>
    sub.setName("richest").setDescription("Ranking de los 10 miembros más ricos")
  );

// ─── Execute ──────────────────────────────────────────────────────────────────

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const sub = interaction.options.getSubcommand();

  switch (sub) {
    case "daily":    await handleDaily(interaction);    break;
    case "balance":  await handleBalance(interaction);  break;
    case "transfer": await handleTransfer(interaction); break;
    case "ranking":  await handleRanking(interaction);  break;
    case "shop":     await handleShop(interaction);     break;
    case "work":     await handleWork(interaction);     break;
    case "rob":      await handleRob(interaction);      break;
    case "bet":      await handleBet(interaction);      break;
    case "top":
    case "richest":  await handleTop(interaction);      break;
  }
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

async function handleDaily(interaction: ChatInputCommandInteraction): Promise<void> {
  const memberId = interaction.user.id;
  const guildId = interaction.guildId ?? "global";
  const row = getRow(memberId, guildId);
  const now = Date.now();

  if (row.last_daily !== null) {
    const elapsed = now - new Date(row.last_daily).getTime();

    if (elapsed < DAILY_COOLDOWN_MS) {
      const remaining = DAILY_COOLDOWN_MS - elapsed;
      const totalSeconds = Math.floor(remaining / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      const remainingStr = `${hours}h ${minutes}m ${seconds}s`;
      const bar = progressBar(elapsed, DAILY_COOLDOWN_MS);

      const mode = getPersonalityMode(guildId);
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

    // Calcular racha
    if (elapsed > DAILY_STREAK_BREAK_MS) {
      row.daily_streak = 0; // racha rota
    } else {
      row.daily_streak += 1;
    }
  }

  // Base: 100-200 monedas + bonus de racha
  const base = Math.floor(Math.random() * 101) + 100;
  const streakBonus = row.daily_streak * 10;
  const amount = base + streakBonus;

  row.balance += amount;
  row.last_daily = new Date(now).toISOString();
  updateRow(row);

  const mode = getPersonalityMode(guildId);
  const msg = getMessage("daily", {
    member: interaction.user.username,
    amount: String(amount),
    balance: String(row.balance),
  }, mode);

  const fields = [
    { name: "Monedas base", value: `+${base} 🪙`, inline: true },
    { name: "Bonus de racha", value: `+${streakBonus} 🪙`, inline: true },
    { name: "Racha actual", value: `${row.daily_streak} días 🔥`, inline: true },
    { name: "Saldo actual", value: `${row.balance} 🪙`, inline: true },
  ];

  const embed = buildEmbed("economy", {
    title: "💰 Recompensa diaria",
    description: msg,
    fields,
  });

  await interaction.reply({ embeds: [embed] });
}

async function handleBalance(interaction: ChatInputCommandInteraction): Promise<void> {
  const memberId = interaction.user.id;
  const guildId = interaction.guildId ?? "global";
  const balance = getBalance(memberId, guildId);

  const mode = getPersonalityMode(guildId);
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
  const guildId = interaction.guildId ?? "global";

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

  const senderBalance = getBalance(sender.id, guildId);
  const success = deductBalance(sender.id, guildId, amount);

  if (!success) {
    const embed = buildEmbed("error", {
      title: "❌ Saldo insuficiente",
      description: `No tienes suficientes monedas para esta transferencia.\n\n**Saldo actual:** ${senderBalance} 🪙\n**Cantidad requerida:** ${amount} 🪙`,
    });
    await interaction.reply({ embeds: [embed], ephemeral: true });
    return;
  }

  addBalance(receiver.id, guildId, amount);
  const newSenderBalance = getBalance(sender.id, guildId);

  const mode = getPersonalityMode(guildId);
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
  await handleTop(interaction);
}

async function handleShop(interaction: ChatInputCommandInteraction): Promise<void> {
  const guildId = interaction.guildId ?? "global";
  const items = getShopItems(guildId);

  if (items.length === 0) {
    await interaction.reply({
      embeds: [
        buildEmbed("economy", {
          title: "🛒 Tienda del servidor",
          description: "La tienda está vacía. Un administrador puede añadir items configurando `shopItems` en `config.json`.",
        }),
      ],
    });
    return;
  }

  const lines = items.map((item) => {
    const roleTag = item.roleId ? ` → <@&${item.roleId}>` : "";
    return `**${item.name}** — ${item.price} 🪙\n${item.description}${roleTag}`;
  });

  const embed = buildEmbed("economy", {
    title: "🛒 Tienda del servidor",
    description: lines.join("\n\n"),
  });

  await interaction.reply({ embeds: [embed] });
}

async function handleWork(interaction: ChatInputCommandInteraction): Promise<void> {
  const memberId = interaction.user.id;
  const guildId = interaction.guildId ?? "global";

  const remaining = cooldowns.check(memberId, "work");
  if (remaining > 0) {
    const totalSeconds = Math.floor(remaining / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    await interaction.reply({
      embeds: [
        buildEmbed("economy", {
          title: "⏳ Aún estás trabajando",
          description: `Debes esperar **${hours}h ${minutes}m ${seconds}s** antes de volver a trabajar.`,
        }),
      ],
      ephemeral: true,
    });
    return;
  }

  const jobs = [
    "programador freelance", "repartidor de pizza", "streamer", "diseñador gráfico",
    "moderador de Discord", "vendedor de pociones", "minero de cripto", "escritor de fanfics",
  ];
  const job = jobs[Math.floor(Math.random() * jobs.length)]!;
  const earned = Math.floor(Math.random() * 101) + 50; // 50-150

  addBalance(memberId, guildId, earned);
  cooldowns.set(memberId, "work", WORK_COOLDOWN_MS);

  const newBalance = getBalance(memberId, guildId);

  await interaction.reply({
    embeds: [
      buildEmbed("economy", {
        title: "💼 Trabajo completado",
        description: `Trabajaste como **${job}** y ganaste **${earned} 🪙**.`,
        fields: [
          { name: "Ganado", value: `+${earned} 🪙`, inline: true },
          { name: "Saldo actual", value: `${newBalance} 🪙`, inline: true },
          { name: "Próximo trabajo", value: "En 4 horas", inline: true },
        ],
      }),
    ],
  });
}

async function handleRob(interaction: ChatInputCommandInteraction): Promise<void> {
  const robber = interaction.user;
  const target = interaction.options.getUser("target", true);
  const guildId = interaction.guildId ?? "global";

  if (robber.id === target.id) {
    await interaction.reply({
      embeds: [buildEmbed("error", { title: "❌ Inválido", description: "No puedes robarte a ti mismo." })],
      ephemeral: true,
    });
    return;
  }

  const remaining = cooldowns.check(robber.id, "rob");
  if (remaining > 0) {
    const totalSeconds = Math.floor(remaining / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    await interaction.reply({
      embeds: [
        buildEmbed("economy", {
          title: "⏳ Cooldown de robo",
          description: `Debes esperar **${hours}h ${minutes}m ${seconds}s** antes de intentar otro robo.`,
        }),
      ],
      ephemeral: true,
    });
    return;
  }

  const targetBalance = getBalance(target.id, guildId);

  if (targetBalance <= 0) {
    await interaction.reply({
      embeds: [
        buildEmbed("economy", {
          title: "💸 Sin monedas",
          description: `${target.username} no tiene monedas que robar.`,
        }),
      ],
      ephemeral: true,
    });
    return;
  }

  cooldowns.set(robber.id, "rob", ROB_COOLDOWN_MS);

  const success = Math.random() < 0.4; // 40% éxito

  if (success) {
    // Roba entre 10-30% del saldo del objetivo
    const pct = (Math.random() * 0.2 + 0.1); // 0.10 – 0.30
    const stolen = Math.max(1, Math.floor(targetBalance * pct));
    deductBalance(target.id, guildId, stolen);
    addBalance(robber.id, guildId, stolen);

    await interaction.reply({
      embeds: [
        buildEmbed("economy", {
          title: "🦹 ¡Robo exitoso!",
          description: `Le robaste **${stolen} 🪙** a ${target.username}.`,
          fields: [
            { name: "Robado", value: `+${stolen} 🪙`, inline: true },
            { name: "Tu saldo", value: `${getBalance(robber.id, guildId)} 🪙`, inline: true },
          ],
        }),
      ],
    });
  } else {
    // Fallo: pierde 50 monedas propias
    const penalty = 50;
    deductBalance(robber.id, guildId, penalty);

    await interaction.reply({
      embeds: [
        buildEmbed("error", {
          title: "🚨 ¡Te pillaron!",
          description: `Intentaste robar a ${target.username} pero te atraparon. Perdiste **${penalty} 🪙** como multa.`,
          fields: [
            { name: "Multa", value: `-${penalty} 🪙`, inline: true },
            { name: "Tu saldo", value: `${getBalance(robber.id, guildId)} 🪙`, inline: true },
          ],
        }),
      ],
    });
  }
}

async function handleBet(interaction: ChatInputCommandInteraction): Promise<void> {
  const memberId = interaction.user.id;
  const guildId = interaction.guildId ?? "global";
  const amount = interaction.options.getInteger("cantidad", true);

  const balance = getBalance(memberId, guildId);
  if (balance < amount) {
    await interaction.reply({
      embeds: [
        buildEmbed("error", {
          title: "❌ Saldo insuficiente",
          description: `No tienes suficientes monedas. Saldo: **${balance} 🪙**, apuesta: **${amount} 🪙**.`,
        }),
      ],
      ephemeral: true,
    });
    return;
  }

  const win = Math.random() < 0.5;

  if (win) {
    addBalance(memberId, guildId, amount);
    await interaction.reply({
      embeds: [
        buildEmbed("economy", {
          title: "🎰 ¡Ganaste!",
          description: `Apostaste **${amount} 🪙** y ganaste. ¡Tu apuesta se duplicó!`,
          fields: [
            { name: "Ganado", value: `+${amount} 🪙`, inline: true },
            { name: "Saldo actual", value: `${getBalance(memberId, guildId)} 🪙`, inline: true },
          ],
        }),
      ],
    });
  } else {
    deductBalance(memberId, guildId, amount);
    await interaction.reply({
      embeds: [
        buildEmbed("error", {
          title: "🎰 Perdiste",
          description: `Apostaste **${amount} 🪙** y perdiste. Más suerte la próxima vez.`,
          fields: [
            { name: "Perdido", value: `-${amount} 🪙`, inline: true },
            { name: "Saldo actual", value: `${getBalance(memberId, guildId)} 🪙`, inline: true },
          ],
        }),
      ],
    });
  }
}

async function handleTop(interaction: ChatInputCommandInteraction): Promise<void> {
  const guildId = interaction.guildId ?? "global";

  const rows = getDb()
    .prepare(
      "SELECT * FROM economy WHERE guild_id = ? ORDER BY balance DESC LIMIT 10"
    )
    .all(guildId) as EconomyRow[];

  if (rows.length === 0) {
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

  const maxBalance = rows[0]!.balance;
  const medals = ["🥇", "🥈", "🥉"];

  const lines = rows.map((row, i) => {
    const medal = medals[i] ?? `**${i + 1}.**`;
    const bar = progressBar(row.balance, maxBalance);
    return `${medal} <@${row.member_id}> — ${row.balance} 🪙\n${bar}`;
  });

  const embed = buildEmbed("economy", {
    title: "🏆 Ranking de economía — Top 10",
    description: lines.join("\n\n"),
  });

  await interaction.reply({ embeds: [embed] });
}
