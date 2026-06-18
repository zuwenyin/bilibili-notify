import { getDatabase, saveDatabase } from '../db/database';

interface Subscription {
  id: number;
  user_id: number;
  up_mid: string;
  up_name: string;
  up_face: string | null;
  is_active: boolean;
  created_at: string;
}

export async function addSubscription(
  userId: number,
  upMid: string,
  upName: string,
  upFace: string
): Promise<Subscription> {
  const db = getDatabase();
  if (!db) throw new Error('Database not initialized');

  const stmt = db.prepare('SELECT * FROM subscriptions WHERE user_id = ? AND up_mid = ?');
  stmt.bind([userId, upMid]);

  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return {
      id: row.id as number,
      user_id: row.user_id as number,
      up_mid: row.up_mid as string,
      up_name: row.up_name as string,
      up_face: row.up_face as string | null,
      is_active: Boolean(row.is_active),
      created_at: row.created_at as string
    };
  }
  stmt.free();

  db.run(
    'INSERT INTO subscriptions (user_id, up_mid, up_name, up_face) VALUES (?, ?, ?, ?)',
    [userId, upMid, upName, upFace]
  );
  saveDatabase();

  const result = db.prepare('SELECT * FROM subscriptions WHERE user_id = ? AND up_mid = ?');
  result.bind([userId, upMid]);
  result.step();
  const row = result.getAsObject();
  result.free();

  return {
    id: row.id as number,
    user_id: row.user_id as number,
    up_mid: row.up_mid as string,
    up_name: row.up_name as string,
    up_face: row.up_face as string | null,
    is_active: Boolean(row.is_active),
    created_at: row.created_at as string
  };
}

export async function removeSubscription(userId: number, upMid: string): Promise<boolean> {
  const db = getDatabase();
  if (!db) throw new Error('Database not initialized');

  const stmt = db.prepare('SELECT id FROM subscriptions WHERE user_id = ? AND up_mid = ?');
  stmt.bind([userId, upMid]);
  const hasRow = stmt.step();
  stmt.free();

  if (!hasRow) return false;

  db.run('DELETE FROM subscriptions WHERE user_id = ? AND up_mid = ?', [userId, upMid]);
  saveDatabase();
  return true;
}

export async function getSubscriptions(
  userId: number,
  activeOnly: boolean = false
): Promise<Subscription[]> {
  const db = getDatabase();
  if (!db) throw new Error('Database not initialized');

  let query = 'SELECT * FROM subscriptions WHERE user_id = ?';
  if (activeOnly) {
    query += ' AND is_active = 1';
  }
  query += ' ORDER BY created_at DESC';

  const stmt = db.prepare(query);
  stmt.bind([userId]);

  const results: Subscription[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    results.push({
      id: row.id as number,
      user_id: row.user_id as number,
      up_mid: row.up_mid as string,
      up_name: row.up_name as string,
      up_face: row.up_face as string | null,
      is_active: Boolean(row.is_active),
      created_at: row.created_at as string
    });
  }
  stmt.free();

  return results;
}

export async function toggleSubscription(
  userId: number,
  upMid: string
): Promise<Subscription> {
  const db = getDatabase();
  if (!db) throw new Error('Database not initialized');

  const stmt = db.prepare('SELECT * FROM subscriptions WHERE user_id = ? AND up_mid = ?');
  stmt.bind([userId, upMid]);

  if (!stmt.step()) {
    stmt.free();
    throw new Error('Subscription not found');
  }

  const row = stmt.getAsObject();
  stmt.free();

  const newStatus = row.is_active ? 0 : 1;
  db.run(
    'UPDATE subscriptions SET is_active = ? WHERE user_id = ? AND up_mid = ?',
    [newStatus, userId, upMid]
  );
  saveDatabase();

  return {
    id: row.id as number,
    user_id: row.user_id as number,
    up_mid: row.up_mid as string,
    up_name: row.up_name as string,
    up_face: row.up_face as string | null,
    is_active: newStatus === 1,
    created_at: row.created_at as string
  };
}
