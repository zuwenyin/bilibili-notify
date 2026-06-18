import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { runCheckOnce } from '../services/scheduler';

const router = Router();

router.use(authMiddleware);

router.post('/run', async (req: AuthRequest, res: Response) => {
  try {
    await runCheckOnce();
    res.json({ message: 'Update check completed' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
