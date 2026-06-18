import express from 'express';
import cors from 'cors';
import { initDatabase } from './db/database';
import { startScheduler } from './services/scheduler';
import authRouter from './routes/auth';
import subscribeRouter from './routes/subscribe';
import bilibiliRouter from './routes/bilibili';
import pushRouter from './routes/push';
import statsRouter from './routes/stats';
import statsDashboardRouter from './routes/stats-dashboard';
import videosRouter from './routes/videos';
import schedulerRouter from './routes/scheduler';
import videoDownloadRouter from './routes/video-download';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

async function bootstrap() {
  await initDatabase();
  console.log('Database initialized');

  app.use('/api/auth', authRouter);
  app.use('/api/subscribe', subscribeRouter);
  app.use('/api/bilibili', bilibiliRouter);
  app.use('/api/push', pushRouter);
  app.use('/api/stats', statsRouter);
  app.use('/api/stats-dashboard', statsDashboardRouter);
  app.use('/api/videos', videosRouter);
  app.use('/api/scheduler', schedulerRouter);
  app.use('/api/video-download', videoDownloadRouter);

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  startScheduler();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

bootstrap().catch(console.error);

export default app;
