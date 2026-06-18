import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { getDatabase, saveDatabase } from '../db/database';
import { getLatestVideos } from '../services/bilibili';

const router = Router();

router.use(authMiddleware);

router.get('/updates', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const limit = parseInt(req.query.limit as string);
    const keyword = (req.query.keyword as string) || '';
    const upMid = (req.query.up_mid as string) || '';
    const startDate = (req.query.start_date as string) || '';
    const endDate = (req.query.end_date as string) || '';
    const db = getDatabase();

    if (!db) {
      res.status(500).json({ error: 'Database not initialized' });
      return;
    }

    let whereClause = 'WHERE s.user_id = ?';
    const params: any[] = [userId];

    if (keyword) {
      whereClause += ' AND v.title LIKE ?';
      params.push(`%${keyword}%`);
    }
    if (upMid) {
      whereClause += ' AND v.up_mid = ?';
      params.push(upMid);
    }
    if (startDate) {
      whereClause += ' AND date(v.pubdate) >= ?';
      params.push(startDate);
    }
    if (endDate) {
      whereClause += ' AND date(v.pubdate) <= ?';
      params.push(endDate);
    }

    if (limit && !req.query.page) {
      const stmt = db.prepare(`
        SELECT v.*, s.up_name
        FROM videos v
        INNER JOIN subscriptions s ON v.up_mid = s.up_mid
        ${whereClause}
        ORDER BY v.pubdate DESC
        LIMIT ?
      `);
      stmt.bind([...params, limit]);
      const videos: any[] = [];
      while (stmt.step()) {
        videos.push(stmt.getAsObject());
      }
      stmt.free();
      res.json(videos);
      return;
    }

    const offset = (page - 1) * pageSize;

    const countStmt = db.prepare(`
      SELECT COUNT(*) as total
      FROM videos v
      INNER JOIN subscriptions s ON v.up_mid = s.up_mid
      ${whereClause}
    `);
    countStmt.bind(params);
    let total = 0;
    if (countStmt.step()) {
      total = countStmt.getAsObject().total as number;
    }
    countStmt.free();

    const stmt = db.prepare(`
      SELECT v.*, s.up_name
      FROM videos v
      INNER JOIN subscriptions s ON v.up_mid = s.up_mid
      ${whereClause}
      ORDER BY v.pubdate DESC
      LIMIT ? OFFSET ?
    `);
    stmt.bind([...params, pageSize, offset]);
    const videos: any[] = [];
    while (stmt.step()) {
      videos.push(stmt.getAsObject());
    }
    stmt.free();

    res.json({ videos, total });
  } catch (error: any) {
    console.error('[Videos] Error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/fetch-history/:upMid', async (req: AuthRequest, res: Response) => {
  try {
    const { upMid } = req.params;
    const userId = req.user!.userId;
    const db = getDatabase();

    if (!db) {
      res.status(500).json({ error: 'Database not initialized' });
      return;
    }

    const stmt = db.prepare('SELECT bilibili_cookie FROM users WHERE id = ?');
    stmt.bind([userId]);
    let cookie = '';
    if (stmt.step()) {
      const row = stmt.getAsObject();
      cookie = (row.bilibili_cookie as string) || '';
    }
    stmt.free();

    if (!cookie) {
      res.status(400).json({ error: '请先绑定B站账号' });
      return;
    }

    let totalFetched = 0;
    const maxRetries = 3;

    for (let retry = 0; retry < maxRetries; retry++) {
      try {
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const videos = await getLatestVideos(upMid, cookie, 1, 30);
        
        for (const video of videos) {
          const existing = db.prepare('SELECT id FROM videos WHERE bvid = ?');
          existing.bind([video.bvid]);
          const hasVideo = existing.step();
          existing.free();

          if (!hasVideo) {
            db.run(
              `INSERT INTO videos (up_mid, bvid, title, description, pic, pubdate, view, like, coin, favorites)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [upMid, video.bvid, video.title, video.description, video.pic, video.pubdate.toISOString(), video.view, video.like, video.coin, video.favorites]
            );
            totalFetched++;
          }
        }

        saveDatabase();
        break;
      } catch (pageError: any) {
        console.error('[FetchHistory] Attempt', retry + 1, 'failed:', pageError.message);
        if (retry < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
    }

    res.json({ 
      message: totalFetched > 0 ? `成功拉取 ${totalFetched} 个视频` : '未能获取新视频，请稍后重试',
      fetched: totalFetched
    });
  } catch (error: any) {
    console.error('[FetchHistory] Error:', error.message);
    res.status(500).json({ error: error.message || '拉取历史视频失败' });
  }
});

export default router;
