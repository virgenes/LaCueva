import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import type { GuildConfig } from "../types/index.js";

const DATA_DIR = join(process.cwd(), "data");

function resolvedPath(filename: string): string {
  return join(DATA_DIR, filename);
}

export function readData<T>(filename: string, defaultValue: T): T {
  const filePath = resolvedPath(filename);
  try {
    const raw = readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

export function writeData<T>(filename: string, data: T): void {
  const filePath = resolvedPath(filename);
  try {
    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error(`[dataStore] Failed to write ${filename}:`, err);
  }
}

const DEFAULT_CONFIG: GuildConfig = {
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
};

export function loadConfig(guildId: string): GuildConfig {
  const configs = readData<Record<string, GuildConfig>>("config.json", {});
  return configs[guildId] ?? { ...DEFAULT_CONFIG, guildId };
}

export function saveConfig(config: GuildConfig): void {
  const configs = readData<Record<string, GuildConfig>>("config.json", {});
  configs[config.guildId] = config;
  writeData("config.json", configs);
}
