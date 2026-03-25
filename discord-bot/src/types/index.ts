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

export interface BackupSchedule {
  enabled: boolean;
  intervalHours: number;
  channelId: string;
}

export interface ModLog {
  id: string;
  memberId: string;
  guildId: string;
  action: "ban" | "kick" | "warn" | "timeout" | "mute" | "unwarn";
  reason: string;
  moderatorId: string;
  timestamp: string;
  duration?: string;
}

export interface Giveaway {
  id: string;
  guildId: string;
  channelId: string;
  messageId: string;
  prize: string;
  winnersCount: number;
  participants: string[];
  endsAt: string;
  ended: boolean;
  winners: string[];
  creatorId: string;
}

export interface LevelEntry {
  memberId: string;
  guildId: string;
  xp: number;
  level: number;
  lastXpGrant: string | null;
}

export interface LevelReward {
  guildId: string;
  level: number;
  roleId: string;
}

export interface Reminder {
  id: string;
  memberId: string;
  guildId: string;
  channelId: string;
  message: string;
  fireAt: string;
  repeat: "none" | "daily" | "weekly";
  active: boolean;
}

export interface Suggestion {
  id: string;
  guildId: string;
  authorId: string;
  content: string;
  messageId: string;
  channelId: string;
  status: "pending" | "approved" | "denied";
  timestamp: string;
}

export interface TempRole {
  id: string;
  memberId: string;
  guildId: string;
  roleId: string;
  expiresAt: string;
  active: boolean;
}

export interface ShopItem {
  id: string;
  guildId: string;
  name: string;
  description: string;
  price: number;
  roleId?: string;
}

export interface AutoReplyConfig {
  trigger: string;
  response: string;
  isRegex: boolean;
  cooldownMs: number;
  imageUrl?: string;
  embedConfig?: object;
}

export interface GuildConfig {
  guildId: string;
  prefix: string | null;
  modRoleId: string | null;
  adminRoleId: string | null;
  muteRoleId: string | null;
  logsChannelId: string | null;
  autoRoleId: string | null;
  autoRoleEnabled: boolean;
  autoRoleIds: string[];
  chatBridgeChannelId: string | null;
  chatBridgeReadOnly: boolean;
  announcementsChannelId: string | null;
  suggestionsChannelId: string | null;
  staffChannelId: string | null;
  personalityMode: "friki" | "formal";
  gifUrls: {
    welcome: string;
    ban: string;
    ticket: string;
    event: string;
  };
  antiSpamExemptChannels: string[];
  trustedBots: string[];
  backupSchedule?: BackupSchedule;
}
