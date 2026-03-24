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

  await client.login(config.DISCORD_TOKEN);

  // Start bridge server after login so client is ready
  client.once("clientReady", () => {
    setDiscordClient(client);
    startBridgeServer(config.BRIDGE_PORT);
  });
}

main().catch((err) => {
  console.error("[bot] Fatal error during startup:", err);
  process.exit(1);
});
