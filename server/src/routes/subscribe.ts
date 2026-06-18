import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { addSubscription, removeSubscription, getSubscriptions, toggleSubscription } from '../services/subscription';

const router = Router();

router.use(authMiddleware);

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { up_mid, up_name, up_face } = req.body;
    const userId = req.user!.userId;

    if (!up_mid || !up_name) {
      res.status(400).json({ error: 'up_mid and up_name required' });
      return;
    }

    const subscription = await addSubscription(userId, up_mid, up_name, up_face || '');
    res.status(201).json(subscription);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/list', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const subscriptions = await getSubscriptions(userId);
    res.json(subscriptions);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:upMid', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { upMid } = req.params;

    const result = await removeSubscription(userId, upMid);
    if (result) {
      res.json({ message: 'Subscription removed' });
    } else {
      res.status(404).json({ error: 'Subscription not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:upMid/toggle', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { upMid } = req.params;

    const subscription = await toggleSubscription(userId, upMid);
    res.json(subscription);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
