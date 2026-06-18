import { getDatabase, saveDatabase } from '../db/database';

interface FollowerRecord {
  id: number;
  up_mid: string;
  followers: number;
  recorded_at: string;
}

interface UpStatsRecord {
  id: number;
  up_mid: string;
  followers: number;
  total_views: number;
  video_count: number;
  recorded_at: string;
}

interface UpStats {
  current: UpStatsRecord;
  previous: UpStatsRecord | null;
  growth: {
    followers_growth: number;
    views_growth: number;
    video_growth: number;
  };
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

function queryAll(db: any, query: string, params: any[]): any[] {
  const stmt = db.prepare(query);
  stmt.bind(params);
  const results: any[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

export async function recordFollowers(upMid: string, followers: number): Promise<FollowerRecord> {
  const db = getDatabase();
  if (!db) throw new Error('Database not initialized');

  db.run('INSERT INTO up_stats (up_mid, followers) VALUES (?, ?)', [upMid, followers]);
  saveDatabase();

  const row = queryRow(db, 'SELECT * FROM up_stats WHERE up_mid = ? ORDER BY id DESC LIMIT 1', [upMid]);
  return {
    id: row!.id as number,
    up_mid: row!.up_mid as string,
    followers: row!.followers as number,
    recorded_at: row!.recorded_at as string
  };
}

export async function getFollowersTrend(upMid: string, days: number = 30): Promise<FollowerRecord[]> {
  const db = getDatabase();
  if (!db) throw new Error('Database not initialized');

  const rows = queryAll(
    db,
    `SELECT * FROM up_stats
     WHERE up_mid = ?
     AND recorded_at >= datetime('now', '-' || ? || ' days')
     ORDER BY recorded_at ASC`,
    [upMid, days]
  );

  return rows.map(row => ({
    id: row.id as number,
    up_mid: row.up_mid as string,
    followers: row.followers as number,
    recorded_at: row.recorded_at as string
  }));
}

export async function recordUpStats(
  upMid: string,
  followers: number,
  totalViews: number,
  videoCount: number
): Promise<UpStatsRecord> {
  const db = getDatabase();
  if (!db) throw new Error('Database not initialized');

  const today = new Date().toISOString().split('T')[0];
  const existing = queryRow(
    db,
    'SELECT * FROM up_stats WHERE up_mid = ? AND date(recorded_at) = ?',
    [upMid, today]
  );

  if (existing) {
    db.run(
      'UPDATE up_stats SET followers = ?, total_views = ?, video_count = ? WHERE id = ?',
      [followers, totalViews, videoCount, existing.id]
    );
    saveDatabase();

    return {
      id: existing.id as number,
      up_mid: existing.up_mid as string,
      followers,
      total_views: totalViews,
      video_count: videoCount,
      recorded_at: existing.recorded_at as string
    };
  }

  db.run(
    'INSERT INTO up_stats (up_mid, followers, total_views, video_count) VALUES (?, ?, ?, ?)',
    [upMid, followers, totalViews, videoCount]
  );
  saveDatabase();

  const row = queryRow(db, 'SELECT * FROM up_stats WHERE up_mid = ? ORDER BY id DESC LIMIT 1', [upMid]);
  return {
    id: row!.id as number,
    up_mid: row!.up_mid as string,
    followers,
    total_views: totalViews,
    video_count: videoCount,
    recorded_at: row!.recorded_at as string
  };
}

export async function getUpStats(upMid: string): Promise<UpStats | null> {
  const db = getDatabase();
  if (!db) throw new Error('Database not initialized');

  const current = queryRow(
    db,
    'SELECT * FROM up_stats WHERE up_mid = ? ORDER BY recorded_at DESC LIMIT 1',
    [upMid]
  );

  if (!current) {
    return null;
  }

  const previous = queryRow(
    db,
    'SELECT * FROM up_stats WHERE up_mid = ? AND recorded_at < ? ORDER BY recorded_at DESC LIMIT 1',
    [upMid, current.recorded_at]
  );

  const growth = {
    followers_growth: previous ? (current.followers as number) - (previous.followers as number) : 0,
    views_growth: previous ? (current.total_views as number) - (previous.total_views as number) : 0,
    video_growth: previous ? (current.video_count as number) - (previous.video_count as number) : 0
  };

  return {
    current: {
      id: current.id as number,
      up_mid: current.up_mid as string,
      followers: current.followers as number,
      total_views: current.total_views as number,
      video_count: current.video_count as number,
      recorded_at: current.recorded_at as string
    },
    previous: previous ? {
      id: previous.id as number,
      up_mid: previous.up_mid as string,
      followers: previous.followers as number,
      total_views: previous.total_views as number,
      video_count: previous.video_count as number,
      recorded_at: previous.recorded_at as string
    } : null,
    growth
  };
}
