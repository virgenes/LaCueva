import { createServer } from "http";
import type { Client } from "discord.js";
import type { BridgeMessage } from "../src/types/index.js";
/** Register the Discord client so the bridge can post messages to Discord */
export declare function setDiscordClient(client: Client): void;
/** Broadcast a BridgeMessage to all connected WebSocket clients and store it */
export declare function broadcast(msg: BridgeMessage): void;
export declare function createBridgeServer(): ReturnType<typeof createServer>;
export declare function startBridgeServer(port?: number): void;
//# sourceMappingURL=server.d.ts.map