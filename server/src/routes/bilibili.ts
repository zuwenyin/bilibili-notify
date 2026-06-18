import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { getUserInfo, getFollows, addUpManually, getUpDetailInfo } from '../services/bilibili';
import { checkSession, refreshSession } from '../services/session';
import { getDatabase, saveDatabase } from '../db/database';
import axios from 'axios';

const router = Router();

router.get('/proxy', async (req, res: Response) => {
  try {
    const url = req.query.url as string;
    if (!url || !url.match(/^https?:\/\/i\d+\.hdslb\.com\//)) {
      res.status(400).json({ error: 'Invalid URL' });
      return;
    }

    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      headers: {
        'Referer': 'https://www.bilibili.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    res.setHeader('Content-Type', (response.headers['content-type'] as string) || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(Buffer.from(response.data));
  } catch (error: any) {
    res.status(502).json({ error: 'Failed to fetch image' });
  }
});

router.use(authMiddleware);

router.get('/status', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const db = getDatabase();

    if (!db) {
      res.status(500).json({ error: 'Database not initialized' });
      return;
    }

    const stmt = db.prepare('SELECT bilibili_uid FROM users WHERE id = ?');
    stmt.bind([userId]);
    let uid = null;
    if (stmt.step()) {
      const row = stmt.getAsObject();
      uid = row.bilibili_uid || null;
    }
    stmt.free();

    res.json({ uid });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

router.post('/bind', async (req: AuthRequest, res: Response) => {
  try {
    const { uid, cookie } = req.body;
    const userId = req.user!.userId;

    if (!uid) {
      res.status(400).json({ error: 'UID required' });
      return;
    }

    const db = getDatabase();
    if (!db) {
      res.status(500).json({ error: 'Database not initialized' });
      return;
    }

    const check = db.prepare('SELECT id FROM users WHERE id = ?');
    check.bind([userId]);
    const userExists = check.step();
    check.free();

    if (!userExists) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const stmt = db.prepare('UPDATE users SET bilibili_uid = ?, bilibili_cookie = ?, bilibili_csrf = ? WHERE id = ?');
    let csrf = '';
    if (cookie) {
      for (const part of cookie.split(';')) {
        const [key, value] = part.trim().split('=');
        if (key?.trim() === 'bili_jct') {
          csrf = value?.trim() || '';
          break;
        }
      }
    }
    stmt.bind([String(uid), cookie || '', csrf, userId]);
    stmt.step();
    stmt.free();
    saveDatabase();

    res.json({ message: 'Bilibili account bound', uid });
  } catch (error: any) {
    console.error('[bind] Error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/add-up', async (req: AuthRequest, res: Response) => {
  try {
    const { mid } = req.body;

    if (!mid) {
      res.status(400).json({ error: 'UP主 MID required' });
      return;
    }

    const userInfo = await addUpManually(mid);
    res.json(userInfo);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

router.get('/follows', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const db = getDatabase();

    if (!db) {
      res.status(500).json({ error: 'Database not initialized' });
      return;
    }

    const stmt = db.prepare('SELECT id, bilibili_uid, bilibili_cookie FROM users WHERE id = ?');
    stmt.bind([userId]);
    let user = null;
    if (stmt.step()) {
      user = stmt.getAsObject();
    }
    stmt.free();

    console.log(`[follows] userId=${userId}, user=`, user);

    if (!user || !user.bilibili_uid) {
      res.status(400).json({ error: 'Bilibili account not bound' });
      return;
    }

    const pn = Math.max(1, parseInt(req.query.pn as string) || 1);
    const ps = Math.min(50, Math.max(1, parseInt(req.query.ps as string) || 50));

    const result = await getFollows(user.bilibili_uid as string, user.bilibili_cookie as string, pn, ps);
    res.json(result);
  } catch (error: any) {
    console.error('[follows] Error:', error.message);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

router.get('/up/:mid', async (req: AuthRequest, res: Response) => {
  try {
    const { mid } = req.params;
    const userInfo = await getUserInfo(mid);
    res.json(userInfo);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

router.get('/up/:mid/detail', async (req: AuthRequest, res: Response) => {
  try {
    const { mid } = req.params;
    const userId = req.user!.userId;
    const db = getDatabase();

    let cookie = '';
    if (db) {
      const stmt = db.prepare('SELECT bilibili_cookie FROM users WHERE id = ?');
      stmt.bind([userId]);
      if (stmt.step()) {
        const row = stmt.getAsObject();
        cookie = (row.bilibili_cookie as string) || '';
      }
      stmt.free();
    }

    const detailInfo = await getUpDetailInfo(mid, cookie);
    res.json(detailInfo);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

router.get('/session', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const db = getDatabase();

    if (!db) {
      res.status(500).json({ error: 'Database not initialized' });
      return;
    }

    const stmt = db.prepare('SELECT bilibili_cookie FROM users WHERE id = ?');
    stmt.bind([userId]);
    let cookie = null;
    if (stmt.step()) {
      const row = stmt.getAsObject();
      cookie = row.bilibili_cookie;
    }
    stmt.free();

    if (!cookie) {
      res.json({ valid: false, message: '未绑定Bilibili账号' });
      return;
    }

    const status = await checkSession(cookie as string);
    res.json(status);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

router.post('/session/refresh', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const status = await refreshSession(userId);
    res.json(status);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

export default router;
