import "dotenv/config";

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    console.error(`[config] Missing required environment variable: ${key}`);
    process.exit(1);
  }
  return value;
}

function optionalEnv(key: string, defaultValue?: string): string | undefined {
  return process.env[key] ?? defaultValue;
}

export const config = {
  DISCORD_TOKEN: requireEnv("DISCORD_TOKEN"),
  CLIENT_ID: optionalEnv("CLIENT_ID"),
  GUILD_ID: optionalEnv("GUILD_ID"),
  BRIDGE_PORT: parseInt(optionalEnv("BRIDGE_PORT", "3001") ?? "3001", 10),
  BRIDGE_SECRET: optionalEnv("BRIDGE_SECRET"),
  BRIDGE_CORS_ORIGIN: optionalEnv("BRIDGE_CORS_ORIGIN"),
  YOUTUBE_API_KEY: optionalEnv("YOUTUBE_API_KEY"),
  TENOR_API_KEY: optionalEnv("TENOR_API_KEY"),
  REDDIT_CLIENT_ID: optionalEnv("REDDIT_CLIENT_ID"),
  REDDIT_CLIENT_SECRET: optionalEnv("REDDIT_CLIENT_SECRET"),
} as const;
