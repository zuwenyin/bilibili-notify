import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDatabase, saveDatabase } from '../db/database';

const JWT_SECRET = process.env.JWT_SECRET || 'bilibili-notify-secret-key';

interface UserRow {
  id: number;
  username: string;
  password_hash: string;
}

function queryUser(db: any, username: string): UserRow | null {
  const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
  stmt.bind([username]);

  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return {
      id: row.id as number,
      username: row.username as string,
      password_hash: row.password_hash as string
    };
  }
  stmt.free();
  return null;
}

export async function registerUser(username: string, password: string): Promise<{ id: number; username: string }> {
  const db = getDatabase();
  if (!db) throw new Error('Database not initialized');

  const existing = queryUser(db, username);
  if (existing) {
    throw new Error('Username already exists');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  db.run('INSERT INTO users (username, password_hash) VALUES (?, ?)', [username, passwordHash]);
  saveDatabase();

  const user = queryUser(db, username);
  return { id: user!.id, username };
}

export async function loginUser(username: string, password: string): Promise<{ token: string; username: string }> {
  const db = getDatabase();
  if (!db) throw new Error('Database not initialized');

  const user = queryUser(db, username);
  if (!user) {
    throw new Error('Invalid credentials');
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    throw new Error('Invalid credentials');
  }

  const token = generateToken(user.id, user.username);
  return { token, username: user.username };
}

export function generateToken(userId: number, username: string): string {
  return jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): { userId: number; username: string } {
  return jwt.verify(token, JWT_SECRET) as { userId: number; username: string };
}
