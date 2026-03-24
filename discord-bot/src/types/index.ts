import type { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";

export interface SlashCommand {
  data: SlashCommandBuilder;
  execute(interaction: ChatInputCommandInteraction): Promise<void>;
}

export interface Warn {
  id: string;           // UUID v4
  memberId: string;
  reason: string;
  moderatorId: string;
  timestamp: string;    // ISO 8601
  active: boolean;
}

export interface EconomyEntry {
  memberId: string;
  balance: number;
  lastDaily: string | null;  // ISO 8601
}

export interface BridgeMessage {
  id: string;
  author: string;
  content: string;
  source: "discord" | "web";
  timestamp: string;    // ISO 8601
  avatarUrl?: string;
}

export interface GuildConfig {
  guildId: string;
  logsChannelId: string | null;
  autoRoleId: string | null;
  autoRoleEnabled: boolean;
  chatBridgeChannelId: string | null;
  chatBridgeReadOnly: boolean;
  announcementsChannelId: string | null;
  personalityMode: "friki" | "formal";
  gifUrls: {
    welcome: string;
    ban: string;
    ticket: string;
    event: string;
  };
  antiSpamExemptChannels: string[];
  trustedBots: string[];
}
