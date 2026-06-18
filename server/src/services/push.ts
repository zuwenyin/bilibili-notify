import axios from 'axios';
import { getDatabase, saveDatabase } from '../db/database';

interface PushConfig {
  pushplus_token: string | null;
  serverchan_key: string | null;
}

function queryRow(db: any, query: string, params: any[]): any | null {
  const stmt = db.prepare(query);
  stmt.bind(params);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return null;
}

export async function bindPushPlus(userId: number, token: string): Promise<boolean> {
  const db = getDatabase();
  if (!db) throw new Error('Database not initialized');

  db.run('UPDATE users SET pushplus_token = ? WHERE id = ?', [token, userId]);
  saveDatabase();
  const row = queryRow(db, 'SELECT id FROM users WHERE id = ?', [userId]);
  return row !== null;
}

export async function bindServerChan(userId: number, key: string): Promise<boolean> {
  const db = getDatabase();
  if (!db) throw new Error('Database not initialized');

  db.run('UPDATE users SET serverchan_key = ? WHERE id = ?', [key, userId]);
  saveDatabase();
  const row = queryRow(db, 'SELECT id FROM users WHERE id = ?', [userId]);
  return row !== null;
}

export async function getPushConfig(userId: number): Promise<PushConfig> {
  const db = getDatabase();
  if (!db) throw new Error('Database not initialized');

  const row = queryRow(db, 'SELECT pushplus_token, serverchan_key FROM users WHERE id = ?', [userId]);
  if (!row) {
    return { pushplus_token: null, serverchan_key: null };
  }
  return {
    pushplus_token: row.pushplus_token as string | null,
    serverchan_key: row.serverchan_key as string | null
  };
}

export async function sendPushPlus(
  token: string,
  title: string,
  content: string
): Promise<boolean> {
  try {
    const response = await axios.post('https://www.pushplus.plus/send', {
      token,
      title,
      content,
      template: 'html'
    });

    return response.data.code === 200;
  } catch (error) {
    console.error('PushPlus send error:', error);
    return false;
  }
}

export async function sendServerChan(
  key: string,
  title: string,
  content: string
): Promise<boolean> {
  try {
    const response = await axios.get(
      `https://sctapi.ftqq.com/${key}.send`,
      {
        params: { title, desp: content }
      }
    );

    return response.data.code === 0;
  } catch (error) {
    console.error('ServerChan send error:', error);
    return false;
  }
}

export async function sendNotification(
  userId: number,
  title: string,
  content: string
): Promise<boolean> {
  const config = await getPushConfig(userId);

  if (config.pushplus_token) {
    return sendPushPlus(config.pushplus_token, title, content);
  }

  if (config.serverchan_key) {
    return sendServerChan(config.serverchan_key, title, content);
  }

  console.warn(`No push config for user ${userId}`);
  return false;
}
