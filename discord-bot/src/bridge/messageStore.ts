import type { BridgeMessage } from "../types/index.js";

const MAX_MESSAGES = 50;
const store: BridgeMessage[] = [];

export function addMessage(msg: BridgeMessage): void {
  store.push(msg);
  if (store.length > MAX_MESSAGES) {
    store.shift();
  }
}

export function getMessages(limit: number = MAX_MESSAGES): BridgeMessage[] {
  const count = Math.min(limit, MAX_MESSAGES);
  return store.slice(-count);
}
