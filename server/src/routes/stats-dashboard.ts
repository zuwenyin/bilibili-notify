import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import {
  getDashboardSummary,
  getUpdatesTrend,
  getUpRanking,
  getPushSuccessRate,
  getFollowersGrowth,
  getVideoInteractions
} from '../services/stats-dashboard';

const router = Router();

router.use(authMiddleware);

router.get('/dashboard', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const summary = await getDashboardSummary(userId);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/updates-trend', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const days = parseInt(req.query.days as string) || 30;
    const trend = await getUpdatesTrend(userId, days);
    res.json(trend);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/up-ranking', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const days = parseInt(req.query.days as string) || 30;
    const ranking = await getUpRanking(userId, days);
    res.json(ranking);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/push-success', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const days = parseInt(req.query.days as string) || 30;
    const rate = await getPushSuccessRate(userId, days);
    res.json(rate);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/followers-growth', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const days = parseInt(req.query.days as string) || 30;
    const growth = await getFollowersGrowth(userId, days);
    res.json(growth);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/video-interactions', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const interactions = await getVideoInteractions(userId);
    res.json(interactions);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
