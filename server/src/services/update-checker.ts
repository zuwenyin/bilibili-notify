import { getDatabase, saveDatabase } from '../db/database';
import { getLatestVideos as fetchLatestVideos, VideoInfo } from './bilibili';

interface VideoRecord {
  id: number;
  up_mid: string;
  bvid: string;
  title: string;
  description: string;
  pic: string;
  pubdate: string;
  view: number;
  like: number;
  coin: number;
  favorites: number;
  created_at: string;
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

export async function recordVideo(
  upMid: string,
  bvid: string,
  title: string,
  description: string,
  pic: string,
  pubdate: Date,
  view: number,
  like: number,
  coin: number,
  favorites: number
): Promise<VideoRecord> {
  const db = getDatabase();
  if (!db) throw new Error('Database not initialized');

  const existing = queryRow(db, 'SELECT * FROM videos WHERE bvid = ?', [bvid]);
  if (existing) {
    return {
      id: existing.id as number,
      up_mid: existing.up_mid as string,
      bvid: existing.bvid as string,
      title: existing.title as string,
      description: existing.description as string,
      pic: existing.pic as string,
      pubdate: existing.pubdate as string,
      view: existing.view as number,
      like: existing.like as number,
      coin: existing.coin as number,
      favorites: existing.favorites as number,
      created_at: existing.created_at as string
    };
  }

  db.run(
    `INSERT INTO videos (up_mid, bvid, title, description, pic, pubdate, view, like, coin, favorites)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [upMid, bvid, title, description, pic, pubdate.toISOString(), view, like, coin, favorites]
  );
  saveDatabase();

  const row = queryRow(db, 'SELECT * FROM videos WHERE bvid = ?', [bvid]);
  return {
    id: row!.id as number,
    up_mid: row!.up_mid as string,
    bvid: row!.bvid as string,
    title: row!.title as string,
    description: row!.description as string,
    pic: row!.pic as string,
    pubdate: row!.pubdate as string,
    view: row!.view as number,
    like: row!.like as number,
    coin: row!.coin as number,
    favorites: row!.favorites as number,
    created_at: row!.created_at as string
  };
}

export async function getLatestVideo(upMid: string): Promise<VideoRecord | null> {
  const db = getDatabase();
  if (!db) throw new Error('Database not initialized');

  const row = queryRow(db, 'SELECT * FROM videos WHERE up_mid = ? ORDER BY pubdate DESC LIMIT 1', [upMid]);
  if (!row) return null;

  return {
    id: row.id as number,
    up_mid: row.up_mid as string,
    bvid: row.bvid as string,
    title: row.title as string,
    description: row.description as string,
    pic: row.pic as string,
    pubdate: row.pubdate as string,
    view: row.view as number,
    like: row.like as number,
    coin: row.coin as number,
    favorites: row.favorites as number,
    created_at: row.created_at as string
  };
}

export async function checkAndUpdate(upMid: string, cookie?: string): Promise<VideoInfo[]> {
  const db = getDatabase();
  if (!db) throw new Error('Database not initialized');

  console.log(`[UpdateChecker] Fetching videos for UP ${upMid}, cookie: ${cookie ? 'present' : 'missing'}`);
  const latestVideos = await fetchLatestVideos(upMid, cookie);
  console.log(`[UpdateChecker] UP ${upMid}: Bilibili returned ${latestVideos.length} videos`);

  const existingVideos = queryAll(db, 'SELECT bvid FROM videos WHERE up_mid = ?', [upMid]);
  const existingBvids = new Set(existingVideos.map(v => v.bvid as string));

  const newVideos = latestVideos.filter(v => !existingBvids.has(v.bvid));

  for (const video of newVideos) {
    await recordVideo(
      upMid,
      video.bvid,
      video.title,
      video.description,
      video.pic,
      video.pubdate,
      video.view,
      video.like,
      video.coin,
      video.favorites
    );
  }

  return newVideos;
}
