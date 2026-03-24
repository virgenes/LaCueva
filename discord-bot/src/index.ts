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
  const commands = await loadCommands();
  await registerCommands(commands);
  registerEvents(client, commands);

  // Wire chatbridge → bridge broadcast
  setBroadcast(broadcast);

  // Start bridge server before login so port is ready
  startBridgeServer(config.BRIDGE_PORT);

  // Wire Discord client as soon as it's ready
  client.once("clientReady", (readyClient) => {
    setDiscordClient(readyClient);
    console.log(`[bot] Discord client ready: ${readyClient.user.tag}`);
  });

  await client.login(config.DISCORD_TOKEN);
}

main().catch((err) => {
  console.error("[bot] Fatal error during startup:", err);
  process.exit(1);
});
