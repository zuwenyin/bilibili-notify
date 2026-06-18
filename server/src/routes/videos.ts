import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { getDatabase } from '../db/database';

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

export default router;
