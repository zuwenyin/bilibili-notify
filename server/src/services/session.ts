import axios from 'axios';
import { getDatabase, saveDatabase } from '../db/database';

const PASSPORT_API = {
  nav: 'https://api.bilibili.com/x/web-interface/nav',
  refresh: 'https://passport.bilibili.com/x/passport-login/web/cookie/refresh'
};

const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
};

export interface SessionStatus {
  valid: boolean;
  expired: boolean;
  message: string;
}

function parseCookies(cookieStr: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieStr) return cookies;
  for (const part of cookieStr.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key) {
      cookies[key.trim()] = rest.join('=').trim();
    }
  }
  return cookies;
}

export async function checkSession(cookie: string): Promise<SessionStatus> {
  if (!cookie) {
    return { valid: false, expired: true, message: 'Cookie为空' };
  }

  try {
    const response = await axios.get(PASSPORT_API.nav, {
      headers: {
        ...DEFAULT_HEADERS,
        Cookie: cookie,
        Referer: 'https://www.bilibili.com'
      }
    });

    if (response.data.code === 0 && response.data.data?.isLogin) {
      return { valid: true, expired: false, message: 'Session有效' };
    }

    return { valid: false, expired: true, message: response.data.message || 'Session已过期' };
  } catch (error: any) {
    return { valid: false, expired: true, message: `检测失败: ${error.message}` };
  }
}

export async function refreshSession(userId: number): Promise<SessionStatus> {
  const db = getDatabase();
  if (!db) {
    return { valid: false, expired: true, message: '数据库未初始化' };
  }

  const stmt = db.prepare('SELECT bilibili_cookie, bilibili_csrf FROM users WHERE id = ?');
  stmt.bind([userId]);
  let user = null;
  if (stmt.step()) {
    user = stmt.getAsObject();
  }
  stmt.free();

  if (!user || !user.bilibili_cookie) {
    return { valid: false, expired: true, message: '未绑定Bilibili账号' };
  }

  const cookie = user.bilibili_cookie as string;
  const csrf = user.bilibili_csrf as string;

  const status = await checkSession(cookie);
  if (status.valid) {
    return status;
  }

  if (!csrf) {
    return { valid: false, expired: true, message: 'CSRF token缺失，请重新绑定' };
  }

  try {
    const response = await axios.post(PASSPORT_API.refresh, null, {
      params: { csrf },
      headers: {
        ...DEFAULT_HEADERS,
        Cookie: cookie,
        Referer: 'https://www.bilibili.com'
      }
    });

    if (response.data.code === 0) {
      const newCookies = response.headers['set-cookie'];
      if (newCookies) {
        const newCookieParts: string[] = [];
        let newCsrf = csrf;

        for (const setCookie of newCookies) {
          const mainPart = setCookie.split(';')[0];
          const [key, value] = mainPart.split('=');
          if (key && value) {
            newCookieParts.push(`${key.trim()}=${value.trim()}`);
            if (key.trim() === 'bili_jct') {
              newCsrf = value.trim();
            }
          }
        }

        if (newCookieParts.length > 0) {
          const updateStmt = db.prepare('UPDATE users SET bilibili_cookie = ?, bilibili_csrf = ? WHERE id = ?');
          updateStmt.bind([newCookieParts.join('; '), newCsrf, userId]);
          updateStmt.step();
          updateStmt.free();
          saveDatabase();

          return { valid: true, expired: false, message: 'Session已自动续期' };
        }
      }
    }

    return { valid: false, expired: true, message: `续期失败: ${response.data.message || '未知错误'}` };
  } catch (error: any) {
    return { valid: false, expired: true, message: `续期请求失败: ${error.message}` };
  }
}
