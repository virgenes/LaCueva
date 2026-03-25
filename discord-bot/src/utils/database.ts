import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const DB_PATH = join(process.cwd(), "data", "db.sqlite");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    mkdirSync(join(process.cwd(), "data"), { recursive: true });
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
  }
  return db;
}

export function initDb(): void {
  const database = getDb();

  database.exec(`
    CREATE TABLE IF NOT EXISTS warns (
      id            TEXT PRIMARY KEY,
      member_id     TEXT NOT NULL,
      guild_id      TEXT NOT NULL,
      reason        TEXT NOT NULL,
      moderator_id  TEXT NOT NULL,
      timestamp     TEXT NOT NULL,
      active        INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS mod_logs (
      id            TEXT PRIMARY KEY,
      member_id     TEXT NOT NULL,
      guild_id      TEXT NOT NULL,
      action        TEXT NOT NULL,
      reason        TEXT,
      moderator_id  TEXT NOT NULL,
      timestamp     TEXT NOT NULL,
      duration      INTEGER
    );

    CREATE TABLE IF NOT EXISTS economy (
      member_id     TEXT NOT NULL,
      guild_id      TEXT NOT NULL,
      balance       INTEGER NOT NULL DEFAULT 0,
      last_daily    TEXT,
      daily_streak  INTEGER NOT NULL DEFAULT 0,
      last_work     TEXT,
      PRIMARY KEY (member_id, guild_id)
    );

    CREATE TABLE IF NOT EXISTS giveaways (
      id              TEXT PRIMARY KEY,
      guild_id        TEXT NOT NULL,
      channel_id      TEXT NOT NULL,
      message_id      TEXT,
      prize           TEXT NOT NULL,
      winners_count   INTEGER NOT NULL DEFAULT 1,
      ends_at         TEXT NOT NULL,
      ended           INTEGER NOT NULL DEFAULT 0,
      creator_id      TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS giveaway_participants (
      giveaway_id   TEXT NOT NULL,
      member_id     TEXT NOT NULL,
      PRIMARY KEY (giveaway_id, member_id)
    );

    CREATE TABLE IF NOT EXISTS levels (
      member_id     TEXT NOT NULL,
      guild_id      TEXT NOT NULL,
      xp            INTEGER NOT NULL DEFAULT 0,
      level         INTEGER NOT NULL DEFAULT 0,
      last_xp_grant TEXT,
      PRIMARY KEY (member_id, guild_id)
    );

    CREATE TABLE IF NOT EXISTS reminders (
      id          TEXT PRIMARY KEY,
      member_id   TEXT NOT NULL,
      guild_id    TEXT NOT NULL,
      channel_id  TEXT NOT NULL,
      message     TEXT NOT NULL,
      fire_at     TEXT NOT NULL,
      repeat      TEXT,
      active      INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS suggestions (
      id          TEXT PRIMARY KEY,
      guild_id    TEXT NOT NULL,
      author_id   TEXT NOT NULL,
      content     TEXT NOT NULL,
      message_id  TEXT,
      channel_id  TEXT,
      status      TEXT NOT NULL DEFAULT 'pending',
      timestamp   TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS temp_roles (
      id          TEXT PRIMARY KEY,
      member_id   TEXT NOT NULL,
      guild_id    TEXT NOT NULL,
      role_id     TEXT NOT NULL,
      expires_at  TEXT NOT NULL,
      active      INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS server_config (
      guild_id    TEXT PRIMARY KEY,
      config_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS word_filter (
      guild_id  TEXT NOT NULL,
      word      TEXT NOT NULL,
      PRIMARY KEY (guild_id, word)
    );

    CREATE TABLE IF NOT EXISTS auto_replies (
      id            TEXT PRIMARY KEY,
      guild_id      TEXT NOT NULL,
      trigger       TEXT NOT NULL,
      response      TEXT NOT NULL,
      is_regex      INTEGER NOT NULL DEFAULT 0,
      cooldown_ms   INTEGER NOT NULL DEFAULT 0,
      image_url     TEXT,
      embed_config  TEXT
    );

    CREATE TABLE IF NOT EXISTS trivia_scores (
      member_id       TEXT NOT NULL,
      guild_id        TEXT NOT NULL,
      correct_answers INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (member_id, guild_id)
    );

    CREATE TABLE IF NOT EXISTS playlists (
      id        TEXT PRIMARY KEY,
      member_id TEXT NOT NULL,
      guild_id  TEXT NOT NULL,
      name      TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS playlist_tracks (
      playlist_id TEXT NOT NULL,
      position    INTEGER NOT NULL,
      url         TEXT NOT NULL,
      title       TEXT NOT NULL,
      duration    INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (playlist_id, position)
    );
  `);
}
