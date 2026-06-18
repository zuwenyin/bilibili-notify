import { getDatabase } from '../db/database';

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

export interface DashboardSummary {
  totalSubscriptions: number;
  todayUpdates: number;
  weekUpdates: number;
  monthUpdates: number;
  pushSuccessRate: number;
}

export interface UpdateTrend {
  date: string;
  up_mid: string;
  up_name: string;
  count: number;
}

export interface UpRanking {
  up_mid: string;
  up_name: string;
  up_face: string | null;
  update_count: number;
  latest_update: string;
}

export interface PushSuccessRate {
  status: string;
  count: number;
}

export interface FollowersGrowth {
  date: string;
  up_mid: string;
  up_name: string;
  followers: number;
}

export interface VideoInteractions {
  up_mid: string;
  up_name: string;
  total_views: number;
  total_likes: number;
  total_coins: number;
  total_favorites: number;
  video_count: number;
}

export async function getDashboardSummary(userId: number): Promise<DashboardSummary> {
  const db = getDatabase();
  if (!db) throw new Error('Database not initialized');

  const totalSub = queryRow(
    db,
    'SELECT COUNT(*) as count FROM subscriptions WHERE user_id = ? AND is_active = 1',
    [userId]
  );

  const today = new Date().toISOString().split('T')[0];
  const todayUpdates = queryRow(
    db,
    `SELECT COUNT(*) as count FROM videos v
     INNER JOIN subscriptions s ON v.up_mid = s.up_mid
     WHERE s.user_id = ? AND date(v.pubdate) = ?`,
    [userId, today]
  );

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const weekUpdates = queryRow(
    db,
    `SELECT COUNT(*) as count FROM videos v
     INNER JOIN subscriptions s ON v.up_mid = s.up_mid
     WHERE s.user_id = ? AND date(v.pubdate) >= ?`,
    [userId, weekAgo]
  );

  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const monthUpdates = queryRow(
    db,
    `SELECT COUNT(*) as count FROM videos v
     INNER JOIN subscriptions s ON v.up_mid = s.up_mid
     WHERE s.user_id = ? AND date(v.pubdate) >= ?`,
    [userId, monthAgo]
  );

  const pushTotal = queryRow(
    db,
    `SELECT COUNT(DISTINCT bvid) as total FROM push_history WHERE user_id = ?`,
    [userId]
  );
  const pushSuccess = queryRow(
    db,
    `SELECT COUNT(DISTINCT bvid) as success FROM push_history WHERE user_id = ?`,
    [userId]
  );
  const videoTotal = queryRow(
    db,
    `SELECT COUNT(*) as count FROM videos v
     INNER JOIN subscriptions s ON v.up_mid = s.up_mid
     WHERE s.user_id = ?`,
    [userId]
  );

  const totalV = (videoTotal?.count as number) || 0;
  const pushedV = (pushSuccess?.success as number) || 0;
  const pushSuccessRate = totalV > 0 ? Math.round((pushedV / totalV) * 100) : 0;

  return {
    totalSubscriptions: (totalSub?.count as number) || 0,
    todayUpdates: (todayUpdates?.count as number) || 0,
    weekUpdates: (weekUpdates?.count as number) || 0,
    monthUpdates: (monthUpdates?.count as number) || 0,
    pushSuccessRate
  };
}

export async function getUpdatesTrend(userId: number, days: number = 30): Promise<UpdateTrend[]> {
  const db = getDatabase();
  if (!db) throw new Error('Database not initialized');

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  return queryAll(
    db,
    `SELECT date(v.pubdate) as date, v.up_mid, s.up_name, COUNT(*) as count
     FROM videos v
     INNER JOIN subscriptions s ON v.up_mid = s.up_mid
     WHERE s.user_id = ? AND date(v.pubdate) >= ?
     GROUP BY date(v.pubdate), v.up_mid, s.up_name
     ORDER BY date(v.pubdate) ASC`,
    [userId, since]
  );
}

export async function getUpRanking(userId: number, days: number = 30): Promise<UpRanking[]> {
  const db = getDatabase();
  if (!db) throw new Error('Database not initialized');

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  return queryAll(
    db,
    `SELECT s.up_mid, s.up_name, s.up_face, COUNT(*) as update_count,
            MAX(v.pubdate) as latest_update
     FROM videos v
     INNER JOIN subscriptions s ON v.up_mid = s.up_mid
     WHERE s.user_id = ? AND s.is_active = 1 AND date(v.pubdate) >= ?
     GROUP BY s.up_mid, s.up_name, s.up_face
     ORDER BY update_count DESC`,
    [userId, since]
  );
}

export async function getPushSuccessRate(userId: number, days: number = 30): Promise<PushSuccessRate[]> {
  const db = getDatabase();
  if (!db) throw new Error('Database not initialized');

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const totalVideos = queryRow(
    db,
    `SELECT COUNT(*) as count FROM videos v
     INNER JOIN subscriptions s ON v.up_mid = s.up_mid
     WHERE s.user_id = ? AND date(v.pubdate) >= ?`,
    [userId, since]
  );

  const pushedVideos = queryRow(
    db,
    `SELECT COUNT(DISTINCT ph.bvid) as count FROM push_history ph
     INNER JOIN videos v ON ph.bvid = v.bvid
     INNER JOIN subscriptions s ON v.up_mid = s.up_mid
     WHERE ph.user_id = ? AND date(v.pubdate) >= ?`,
    [userId, since]
  );

  const total = (totalVideos?.count as number) || 0;
  const pushed = (pushedVideos?.count as number) || 0;
  const notPushed = total - pushed;

  return [
    { status: '已推送', count: pushed },
    { status: '未推送', count: notPushed > 0 ? notPushed : 0 }
  ];
}

export async function getFollowersGrowth(userId: number, days: number = 30): Promise<FollowersGrowth[]> {
  const db = getDatabase();
  if (!db) throw new Error('Database not initialized');

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  return queryAll(
    db,
    `SELECT date(us.recorded_at) as date, us.up_mid, s.up_name, us.followers
     FROM up_stats us
     INNER JOIN subscriptions s ON us.up_mid = s.up_mid
     WHERE s.user_id = ? AND date(us.recorded_at) >= ?
     ORDER BY us.recorded_at ASC`,
    [userId, since]
  );
}

export async function getVideoInteractions(userId: number): Promise<VideoInteractions[]> {
  const db = getDatabase();
  if (!db) throw new Error('Database not initialized');

  return queryAll(
    db,
    `SELECT v.up_mid, s.up_name,
            SUM(v.view) as total_views,
            SUM(v.\"like\") as total_likes,
            SUM(v.coin) as total_coins,
            SUM(v.favorites) as total_favorites,
            COUNT(*) as video_count
     FROM videos v
     INNER JOIN subscriptions s ON v.up_mid = s.up_mid
     WHERE s.user_id = ?
     GROUP BY v.up_mid, s.up_name
     ORDER BY total_views DESC`,
    [userId]
  );
}
