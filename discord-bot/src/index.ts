import "./config.js"; // loads dotenv and validates DISCORD_TOKEN
import { config } from "./config.js";
import { client } from "./client.js";
import { loadCommands, registerCommands } from "./handlers/commandHandler.js";
import { registerEvents } from "./handlers/eventHandler.js";
import { startBridgeServer, broadcast, setDiscordClient } from "./bridge/server.js";
import { setBroadcast } from "./modules/chatbridge/chatbridge.js";

process.on("unhandledRejection", (reason) => {
  console.error("[bot] Unhandled rejection:", reason);
});

async function main(): Promise<void> {
  // Start bridge server FIRST so Render detects the open port immediately
  startBridgeServer(config.BRIDGE_PORT);
  console.log(`[bot] Bridge server started on port ${config.BRIDGE_PORT}`);

  // Wire chatbridge → bridge broadcast
  setBroadcast(broadcast);

  // Wire Discord client as soon as it's ready
  client.once("clientReady", (readyClient) => {
    setDiscordClient(readyClient);
    console.log(`[bot] Discord client ready: ${readyClient.user.tag}`);
  });

  // Load commands and login — register commands in background after ready
  const commands = await loadCommands();
  registerEvents(client, commands);

  console.log("[bot] Attempting Discord login...");
  try {
    await client.login(config.DISCORD_TOKEN);
    console.log("[bot] Login call completed");
  } catch (err) {
    console.error("[bot] Login FAILED:", err);
    process.exit(1);
  }

  // Register slash commands after login (non-blocking)
  registerCommands(commands).catch((err) => {
    console.error("[bot] Failed to register commands:", err);
  });
}

main().catch((err) => {
  console.error("[bot] Fatal error during startup:", err);
  process.exit(1);
});
