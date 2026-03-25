import { Collection, REST, Routes, type Interaction } from "discord.js";
import { readdir, stat } from "node:fs/promises";
import { join, extname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { config } from "../config.js";
import type { SlashCommand } from "../types/index.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

async function collectFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir);
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const info = await stat(fullPath);
    if (info.isDirectory()) {
      const nested = await collectFiles(fullPath);
      files.push(...nested);
    } else {
      const ext = extname(entry);
      if (ext === ".ts" || ext === ".js") {
        files.push(fullPath);
      }
    }
  }

  return files;
}

export async function loadCommands(): Promise<Collection<string, SlashCommand>> {
  const commands = new Collection<string, SlashCommand>();
  const modulesDir = join(__dirname, "..", "modules");

  let files: string[];
  try {
    files = await collectFiles(modulesDir);
  } catch {
    return commands;
  }

  for (const file of files) {
    try {
      const mod = await import(pathToFileURL(file).href);
      // Support modules that export a `commands` array of {data, execute} pairs
      if (Array.isArray(mod.commands)) {
        for (const cmd of mod.commands as SlashCommand[]) {
          if (cmd.data != null && cmd.execute != null) {
            commands.set(cmd.data.name as string, cmd);
          }
        }
      } else if (mod.data != null && mod.execute != null) {
        const command: SlashCommand = { data: mod.data, execute: mod.execute };
        commands.set(mod.data.name as string, command);
      }
    } catch (err) {
      console.error(`[commandHandler] Failed to load ${file}:`, err);
    }
  }

  console.log(`[commandHandler] Loaded ${commands.size} command(s): ${[...commands.keys()].join(", ")}`);

  return commands;
}

export async function registerCommands(
  commands: Collection<string, SlashCommand>
): Promise<void> {
  const { CLIENT_ID, GUILD_ID, DISCORD_TOKEN } = config;

  if (!CLIENT_ID || !GUILD_ID) {
    console.warn("[commandHandler] CLIENT_ID or GUILD_ID not set — skipping command registration.");
    return;
  }

  const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);
  const body = commands.map((cmd: SlashCommand) => cmd.data.toJSON());

  await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body });
  console.log(`[commandHandler] Registered ${body.length} slash command(s).`);
}

export async function handleInteraction(
  interaction: Interaction,
  commands: Collection<string, SlashCommand>
): Promise<void> {
  if (!interaction.isChatInputCommand()) return;

  const command = commands.get(interaction.commandName);
  if (!command) {
    await interaction.reply({ content: "Comando no encontrado.", ephemeral: true });
    return;
  }

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(`[commandHandler] Error executing /${interaction.commandName}:`, err);
    const payload = { content: "Ocurrió un error al ejecutar el comando.", ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(payload);
    } else {
      await interaction.reply(payload);
    }
  }
}
