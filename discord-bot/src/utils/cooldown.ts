/** In-memory cooldown manager keyed by userId + command. */
export class CooldownManager {
  private readonly store = new Map<string, number>();

  private key(userId: string, command: string): string {
    return `${userId}:${command}`;
  }

  /** Register a cooldown for a user/command pair. */
  set(userId: string, command: string, durationMs: number): void {
    this.store.set(this.key(userId, command), Date.now() + durationMs);
  }

  /**
   * Check remaining cooldown time.
   * @returns Milliseconds remaining, or 0 if the user is free to use the command.
   */
  check(userId: string, command: string): number {
    const expiresAt = this.store.get(this.key(userId, command));
    if (expiresAt === undefined) return 0;
    const remaining = expiresAt - Date.now();
    if (remaining <= 0) {
      this.store.delete(this.key(userId, command));
      return 0;
    }
    return remaining;
  }
}
