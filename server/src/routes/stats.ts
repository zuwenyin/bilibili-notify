import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { getUpStats, getFollowersTrend } from '../services/stats';
import { getDatabase } from '../db/database';

const router = Router();

router.use(authMiddleware);

router.get('/up/:mid', async (req: AuthRequest, res: Response) => {
  try {
    const { mid } = req.params;
    const stats = await getUpStats(mid);

    if (!stats) {
      res.status(404).json({ error: 'No stats found for this UP主' });
      return;
    }

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/up/:mid/followers', async (req: AuthRequest, res: Response) => {
  try {
    const { mid } = req.params;
    const days = parseInt(req.query.days as string) || 30;
    const trend = await getFollowersTrend(mid, days);
    res.json(trend);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/up/:mid/videos', async (req: AuthRequest, res: Response) => {
  try {
    const { mid } = req.params;
    const db = getDatabase();

    if (!db) {
      res.status(500).json({ error: 'Database not initialized' });
      return;
    }

    const stmt = db.prepare('SELECT * FROM videos WHERE up_mid = ? ORDER BY pubdate DESC LIMIT 50');
    stmt.bind([mid]);
    const videos: any[] = [];
    while (stmt.step()) {
      videos.push(stmt.getAsObject());
    }
    stmt.free();

    res.json(videos);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
