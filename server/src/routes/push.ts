import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { bindPushPlus, bindServerChan, getPushConfig } from '../services/push';

const router = Router();

router.use(authMiddleware);

router.post('/bind', async (req: AuthRequest, res: Response) => {
  try {
    const { type, token } = req.body;
    const userId = req.user!.userId;

    if (!type || !token) {
      res.status(400).json({ error: 'type and token required' });
      return;
    }

    let success = false;
    if (type === 'pushplus') {
      success = await bindPushPlus(userId, token);
    } else if (type === 'serverchan') {
      success = await bindServerChan(userId, token);
    } else {
      res.status(400).json({ error: 'Invalid push type. Use pushplus or serverchan' });
      return;
    }

    if (success) {
      res.json({ message: 'Push token bound successfully', type });
    } else {
      res.status(500).json({ error: 'Failed to bind push token' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/status', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const config = await getPushConfig(userId);

    res.json({
      enabled: !!(config.pushplus_token || config.serverchan_key),
      pushplus: !!config.pushplus_token,
      serverchan: !!config.serverchan_key
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
