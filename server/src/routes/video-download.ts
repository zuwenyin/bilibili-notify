import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { getVideoInfo, getAvailableQualities, getPlayUrl } from '../services/video-download';
import { getDatabase } from '../db/database';
import axios from 'axios';

const router = Router();

router.use(authMiddleware);

router.get('/info/:bvid', async (req: AuthRequest, res: Response) => {
  try {
    const { bvid } = req.params;
    const userId = req.user!.userId;
    const cookie = await getUserCookie(userId);

    const videoInfo = await getVideoInfo(bvid, cookie);
    const qualities = await getAvailableQualities(bvid, videoInfo.cid, cookie);

    res.json({ ...videoInfo, qualities });
  } catch (error: any) {
    res.status(500).json({ error: error.message || '获取视频信息失败' });
  }
});

router.get('/play-url/:bvid', async (req: AuthRequest, res: Response) => {
  try {
    const { bvid } = req.params;
    const qn = parseInt(req.query.qn as string) || 80;
    const userId = req.user!.userId;
    const cookie = await getUserCookie(userId);

    const videoInfo = await getVideoInfo(bvid, cookie);
    const playUrl = await getPlayUrl(bvid, videoInfo.cid, qn, cookie);

    res.json({
      title: videoInfo.title,
      ...playUrl
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || '获取播放地址失败' });
  }
});

router.get('/stream/:bvid', async (req: AuthRequest, res: Response) => {
  try {
    const { bvid } = req.params;
    const qn = parseInt(req.query.qn as string) || 80;
    const userId = req.user!.userId;
    const cookie = await getUserCookie(userId);

    const videoInfo = await getVideoInfo(bvid, cookie);
    const playUrl = await getPlayUrl(bvid, videoInfo.cid, qn, cookie);

    const response = await axios({
      method: 'get',
      url: playUrl.url,
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.bilibili.com',
        'Origin': 'https://www.bilibili.com'
      },
      maxRedirects: 5
    });

    const contentType = (response.headers['content-type'] as string) || 'video/mp4';
    const contentLength = response.headers['content-length'];

    res.setHeader('Content-Type', contentType);
    if (contentLength) {
      res.setHeader('Content-Length', String(contentLength));
    }
    res.setHeader('Accept-Ranges', 'bytes');

    const safeTitle = videoInfo.title.replace(/[^\w\u4e00-\u9fa5]/g, '_').substring(0, 50);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(safeTitle)}.mp4"`);

    response.data.pipe(res);
  } catch (error: any) {
    console.error('[VideoStream] Error:', error.message);
    res.status(500).json({ error: error.message || '下载失败' });
  }
});

async function getUserCookie(userId: number): Promise<string> {
  const db = getDatabase();
  if (!db) return '';

  const stmt = db.prepare('SELECT bilibili_cookie FROM users WHERE id = ?');
  stmt.bind([userId]);
  let cookie = '';
  if (stmt.step()) {
    const row = stmt.getAsObject();
    cookie = (row.bilibili_cookie as string) || '';
  }
  stmt.free();
  return cookie;
}

export default router;
