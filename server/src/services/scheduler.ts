import cron from 'node-cron';
import { getDatabase } from '../db/database';
import { checkAndUpdate } from './update-checker';
import { sendNotification } from './push';
import { refreshSession } from './session';

let scheduledTask: cron.ScheduledTask | null = null;
let sessionCheckTask: cron.ScheduledTask | null = null;

interface Subscription {
  user_id: number;
  up_mid: string;
  up_name: string;
}

interface UserCookie {
  id: number;
  bilibili_cookie: string;
}

function queryAll(db: any, query: string, params: any[] = []): any[] {
  const stmt = db.prepare(query);
  stmt.bind(params);
  const results: any[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

export function startScheduler(schedule: string = '*/5 * * * *'): boolean {
  if (scheduledTask) {
    return false;
  }

  scheduledTask = cron.schedule(schedule, async () => {
    console.log(`[${new Date().toISOString()}] Running update check...`);
    await runCheckOnce();
  });

  sessionCheckTask = cron.schedule('0 8 * * *', async () => {
    console.log(`[${new Date().toISOString()}] Running session check...`);
    await runSessionCheck();
  });

  console.log(`Scheduler started with schedule: ${schedule}`);
  return true;
}

export function stopScheduler(): boolean {
  let stopped = false;
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    stopped = true;
  }
  if (sessionCheckTask) {
    sessionCheckTask.stop();
    sessionCheckTask = null;
    stopped = true;
  }
  if (stopped) {
    console.log('Scheduler stopped');
  }
  return stopped;
}

export async function runCheckOnce(): Promise<void> {
  const db = getDatabase();
  if (!db) {
    console.error('Database not initialized');
    return;
  }

  const subscriptions = queryAll(db, 'SELECT DISTINCT user_id, up_mid, up_name FROM subscriptions WHERE is_active = 1') as Subscription[];

  const upMidToUsers = new Map<string, number[]>();
  for (const sub of subscriptions) {
    const users = upMidToUsers.get(sub.up_mid) || [];
    users.push(sub.user_id);
    upMidToUsers.set(sub.up_mid, users);
  }

  const userCookies = queryAll(db, 'SELECT id, bilibili_cookie FROM users WHERE bilibili_cookie IS NOT NULL AND bilibili_cookie != ""') as UserCookie[];
  const cookieMap = new Map<number, string>();
  for (const uc of userCookies) {
    cookieMap.set(uc.id, uc.bilibili_cookie);
  }

  for (const [upMid, userIds] of upMidToUsers) {
    try {
      const cookie = cookieMap.get(userIds[0]);
      console.log(`[Scheduler] Checking UP ${upMid}, cookie: ${cookie ? 'present' : 'missing'}, users: ${userIds.join(',')}`);
      const newVideos = cookie
        ? await checkAndUpdate(upMid, cookie)
        : await checkAndUpdate(upMid);
      console.log(`[Scheduler] UP ${upMid}: found ${newVideos.length} new videos`);

      if (newVideos.length > 0) {
        console.log(`Found ${newVideos.length} new videos for UP ${upMid}`);

        for (const userId of userIds) {
          for (const video of newVideos) {
            const title = `新视频更新：${video.title}`;
            const content = `
              <h3>${video.title}</h3>
              <p>发布时间：${video.pubdate.toLocaleString()}</p>
              <p><a href="https://www.bilibili.com/video/${video.bvid}">查看视频</a></p>
            `;

            await sendNotification(userId, title, content);
          }
        }
      }
    } catch (error) {
      console.error(`Error checking updates for UP ${upMid}:`, error);
    }
  }
}

async function runSessionCheck(): Promise<void> {
  const db = getDatabase();
  if (!db) return;

  const users = queryAll(db, 'SELECT id, bilibili_uid, bilibili_cookie FROM users WHERE bilibili_uid IS NOT NULL AND bilibili_uid != ""');

  for (const user of users) {
    try {
      const status = await refreshSession(user.id);
      if (!status.valid) {
        console.log(`[Session] User ${user.id}: ${status.message}`);
        await sendNotification(user.id, 'Bilibili Session已过期', `
          <h3>Session过期提醒</h3>
          <p>${status.message}</p>
          <p>请前往订阅管理页面重新绑定Cookie。</p>
        `);
      } else if (status.message === 'Session已自动续期') {
        console.log(`[Session] User ${user.id}: Session已自动续期`);
      }
    } catch (error: any) {
      console.error(`[Session] Error checking session for user ${user.id}:`, error.message);
    }
  }
}
