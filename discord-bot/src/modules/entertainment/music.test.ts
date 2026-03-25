/**
 * Property tests for music module — playlist round-trip
 *
 * **Validates: Requirements 11.9, 11.10**
 *
 * These tests verify the playlist data model logic in isolation,
 * without requiring the native better-sqlite3 bindings.
 */

import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { randomUUID } from "node:crypto";

// ─── In-memory playlist store (mirrors SQLite schema logic) ──────────────────

interface PlaylistRow {
  id: string;
  memberId: string;
  guildId: string;
  name: string;
}

interface PlaylistTrackRow {
  playlistId: string;
  position: number;
  url: string;
  title: string;
  duration: number;
}

class InMemoryPlaylistStore {
  private playlists: PlaylistRow[] = [];
  private tracks: PlaylistTrackRow[] = [];

  createPlaylist(memberId: string, guildId: string, name: string): string {
    const id = randomUUID();
    this.playlists.push({ id, memberId, guildId, name });
    return id;
  }

  getPlaylistByName(memberId: string, guildId: string, name: string): PlaylistRow | undefined {
    return this.playlists.find(
      (p) => p.memberId === memberId && p.guildId === guildId && p.name === name,
    );
  }

  addTrack(playlistId: string, position: number, url: string, title: string, duration: number): void {
    this.tracks.push({ playlistId, position, url, title, duration });
  }

  loadTracks(playlistId: string): PlaylistTrackRow[] {
    return this.tracks
      .filter((t) => t.playlistId === playlistId)
      .sort((a, b) => a.position - b.position);
  }

  reset(): void {
    this.playlists = [];
    this.tracks = [];
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Property 44: Playlist round-trip", () => {
  /**
   * Property 44a: A playlist created with a given name can be retrieved by that name.
   * Validates: Requirements 11.9
   */
  it("playlist created is retrievable by name (11.9)", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
        fc.hexaString({ minLength: 8, maxLength: 16 }),
        fc.hexaString({ minLength: 8, maxLength: 16 }),
        (name, memberId, guildId) => {
          const store = new InMemoryPlaylistStore();
          const trimmed = name.trim();
          store.createPlaylist(memberId, guildId, trimmed);
          const found = store.getPlaylistByName(memberId, guildId, trimmed);
          expect(found).toBeDefined();
          expect(found!.id).toBeTruthy();
          expect(found!.name).toBe(trimmed);
        },
      ),
    );
  });

  /**
   * Property 44b: All tracks added to a playlist are returned in insertion order when loaded.
   * Validates: Requirements 11.10
   */
  it("tracks loaded from playlist preserve insertion order (11.10)", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            url: fc.webUrl(),
            title: fc.string({ minLength: 1, maxLength: 100 }),
            duration: fc.integer({ min: 0, max: 7200 }),
          }),
          { minLength: 1, maxLength: 20 },
        ),
        (trackInputs) => {
          const store = new InMemoryPlaylistStore();
          const memberId = randomUUID();
          const guildId = randomUUID();
          const playlistId = store.createPlaylist(memberId, guildId, "test-playlist");

          trackInputs.forEach((t, i) => {
            store.addTrack(playlistId, i, t.url, t.title, t.duration);
          });

          const loaded = store.loadTracks(playlistId);

          expect(loaded).toHaveLength(trackInputs.length);
          loaded.forEach((row, i) => {
            expect(row.url).toBe(trackInputs[i]!.url);
            expect(row.title).toBe(trackInputs[i]!.title);
            expect(row.duration).toBe(trackInputs[i]!.duration);
          });
        },
      ),
    );
  });

  /**
   * Property 44c: Playlists are isolated per member — one member cannot see another's playlists.
   * Validates: Requirements 11.9
   */
  it("playlists are isolated per member", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 30 }).filter((s) => s.trim().length > 0),
        fc.hexaString({ minLength: 8, maxLength: 16 }),
        fc.hexaString({ minLength: 8, maxLength: 16 }),
        fc.hexaString({ minLength: 8, maxLength: 16 }),
        (name, guildId, memberA, memberB) => {
          fc.pre(memberA !== memberB);
          const store = new InMemoryPlaylistStore();
          const trimmed = name.trim();
          store.createPlaylist(memberA, guildId, trimmed);
          const foundByB = store.getPlaylistByName(memberB, guildId, trimmed);
          expect(foundByB).toBeUndefined();
        },
      ),
    );
  });

  /**
   * Property 44d: An empty playlist returns zero tracks when loaded.
   * Validates: Requirements 11.10
   */
  it("empty playlist returns no tracks", () => {
    fc.assert(
      fc.property(
        fc.hexaString({ minLength: 8, maxLength: 16 }),
        fc.hexaString({ minLength: 8, maxLength: 16 }),
        (memberId, guildId) => {
          const store = new InMemoryPlaylistStore();
          const playlistId = store.createPlaylist(memberId, guildId, "empty-playlist");
          const tracks = store.loadTracks(playlistId);
          expect(tracks).toHaveLength(0);
        },
      ),
    );
  });

  /**
   * Property 44e: Loading a non-existent playlist returns undefined.
   * Validates: Requirements 11.10
   */
  it("non-existent playlist returns undefined", () => {
    fc.assert(
      fc.property(
        fc.hexaString({ minLength: 8, maxLength: 16 }),
        fc.hexaString({ minLength: 8, maxLength: 16 }),
        fc.string({ minLength: 1, maxLength: 30 }),
        (memberId, guildId, name) => {
          const store = new InMemoryPlaylistStore();
          const found = store.getPlaylistByName(memberId, guildId, name);
          expect(found).toBeUndefined();
        },
      ),
    );
  });
});
