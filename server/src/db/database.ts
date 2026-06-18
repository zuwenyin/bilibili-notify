import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';

let db: Database | null = null;
let dbFilePath: string = '';

export async function initDatabase(dbPath: string = './data/bilibili-notify.db'): Promise<Database> {
  const SQL = await initSqlJs();

  if (dbPath === ':memory:') {
    db = new SQL.Database();
    dbFilePath = ':memory:';
  } else {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (fs.existsSync(dbPath)) {
      const fileBuffer = fs.readFileSync(dbPath);
      db = new SQL.Database(fileBuffer);
    } else {
      db = new SQL.Database();
    }
    dbFilePath = dbPath;
  }

  createTables(db);
  migrateDatabase(db);
  return db;
}

function createTables(database: Database): void {
  database.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      bilibili_uid TEXT,
      bilibili_cookie TEXT,
      bilibili_csrf TEXT,
      pushplus_token TEXT,
      serverchan_key TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      up_mid TEXT NOT NULL,
      up_name TEXT NOT NULL,
      up_face TEXT,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(user_id, up_mid)
    )
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS videos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      up_mid TEXT NOT NULL,
      bvid TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      pic TEXT,
      pubdate DATETIME,
      view INTEGER DEFAULT 0,
      like INTEGER DEFAULT 0,
      coin INTEGER DEFAULT 0,
      favorites INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS push_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      bvid TEXT NOT NULL,
      pushed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(user_id, bvid)
    )
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS up_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      up_mid TEXT NOT NULL,
      followers INTEGER DEFAULT 0,
      total_views INTEGER DEFAULT 0,
      video_count INTEGER DEFAULT 0,
      recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

function migrateDatabase(database: Database): void {
  const columns = database.exec("PRAGMA table_info(users)");
  const columnNames = columns[0]?.values.map((row: any[]) => row[1]) || [];

  if (!columnNames.includes('bilibili_csrf')) {
    database.run('ALTER TABLE users ADD COLUMN bilibili_csrf TEXT');
  }
}

export function getDatabase(): Database | null {
  return db;
}

export function closeDatabase(): void {
  if (db) {
    if (dbFilePath !== ':memory:' && dbFilePath) {
      const data = db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(dbFilePath, buffer);
    }
    db.close();
    db = null;
  }
}

export function saveDatabase(): void {
  if (db && dbFilePath !== ':memory:') {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbFilePath, buffer);
  }
}
