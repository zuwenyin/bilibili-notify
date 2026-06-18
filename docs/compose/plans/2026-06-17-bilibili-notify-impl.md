# Bilibili Notify 实现计划 (TDD)

> **For agentic workers:** REQUIRED SUB-SKILL: Use compose:subagent (recommended) or compose:execute to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个Bilibili关注UP主更新推送网站，支持微信通知和数据统计

**Architecture:** Express.js + Vue 3 monorepo，SQLite数据库，node-cron定时任务，PushPlus/Server酱推送

**Tech Stack:** Express.js, TypeScript, Vue 3, Vite, SQLite, Jest, Vitest, node-cron, ECharts

---

## Task 1: 项目初始化与基础配置

**Covers:** [S6]

**Files:**
- Create: `package.json`
- Create: `server/package.json`
- Create: `server/tsconfig.json`
- Create: `server/jest.config.js`
- Create: `client/package.json`
- Create: `client/vite.config.ts`
- Create: `client/tsconfig.json`

- [ ] **Step 1: 创建根package.json**

```json
{
  "name": "bilibili-notify",
  "private": true,
  "scripts": {
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
    "dev:server": "cd server && npm run dev",
    "dev:client": "cd client && npm run dev",
    "test": "cd server && npm test",
    "build": "cd client && npm run build"
  },
  "devDependencies": {
    "concurrently": "^8.2.0"
  }
}
```

- [ ] **Step 2: 创建server/package.json**

```json
{
  "name": "bilibili-notify-server",
  "version": "1.0.0",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "jest",
    "test:watch": "jest --watch"
  },
  "dependencies": {
    "express": "^4.18.2",
    "better-sqlite3": "^9.4.3",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "node-cron": "^3.0.3",
    "axios": "^1.6.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/better-sqlite3": "^7.6.8",
    "@types/bcryptjs": "^2.4.6",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/node-cron": "^3.0.11",
    "@types/cors": "^2.8.17",
    "@types/jest": "^29.5.11",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.1",
    "tsx": "^4.7.0",
    "typescript": "^5.3.3"
  }
}
```

- [ ] **Step 3: 创建server/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

- [ ] **Step 4: 创建server/jest.config.js**

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov']
};
```

- [ ] **Step 5: 创建client/package.json**

```json
{
  "name": "bilibili-notify-client",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:watch": "vitest --watch"
  },
  "dependencies": {
    "vue": "^3.4.0",
    "vue-router": "^4.2.5",
    "pinia": "^2.1.7",
    "axios": "^1.6.0",
    "echarts": "^5.4.3",
    "vue-echarts": "^6.6.8"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^4.5.2",
    "vite": "^5.0.10",
    "vue-tsc": "^1.8.25",
    "typescript": "^5.3.3",
    "vitest": "^1.1.0",
    "@vue/test-utils": "^2.4.3",
    "jsdom": "^23.0.1"
  }
}
```

- [ ] **Step 6: 创建client/vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
})
```

- [ ] **Step 7: 创建client/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "preserve",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src/**/*.ts", "src/**/*.tsx", "src/**/*.vue"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 8: 安装依赖**

Run: `npm install && cd server && npm install && cd ../client && npm install`
Expected: 所有依赖安装成功

- [ ] **Step 9: 验证基础结构**

Run: `ls -la server/src && ls -la client/src`
Expected: 目录存在

- [ ] **Step 10: Commit**

```bash
git init
git add .
git commit -m "chore: initialize project structure with monorepo setup"
```

---

## Task 2: 数据库层 (TDD)

**Covers:** [S4]

**Files:**
- Create: `server/src/db/database.ts`
- Create: `server/src/db/database.test.ts`

- [ ] **Step 1: 写失败测试 - 数据库初始化**

```typescript
// server/src/db/database.test.ts
import { Database } from 'better-sqlite3';
import { initDatabase, getDatabase } from './database';

describe('Database', () => {
  afterEach(() => {
    // 清理测试数据库
    const db = getDatabase();
    if (db) {
      db.close();
    }
  });

  test('初始化数据库并创建所有表', () => {
    const db = initDatabase(':memory:');
    
    expect(db).toBeInstanceOf(Database);
    
    // 验证表已创建
    const tables = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table'"
    ).all() as { name: string }[];
    
    const tableNames = tables.map(t => t.name);
    expect(tableNames).toContain('users');
    expect(tableNames).toContain('subscriptions');
    expect(tableNames).toContain('videos');
    expect(tableNames).toContain('push_history');
    expect(tableNames).toContain('up_stats');
  });

  test('users表结构正确', () => {
    const db = initDatabase(':memory:');
    
    const columns = db.prepare("PRAGMA table_info(users)").all() as { name: string }[];
    const columnNames = columns.map(c => c.name);
    
    expect(columnNames).toContain('id');
    expect(columnNames).toContain('username');
    expect(columnNames).toContain('password_hash');
    expect(columnNames).toContain('bilibili_uid');
    expect(columnNames).toContain('pushplus_token');
    expect(columnNames).toContain('serverchan_key');
    expect(columnNames).toContain('created_at');
  });

  test('subscriptions表结构正确', () => {
    const db = initDatabase(':memory:');
    
    const columns = db.prepare("PRAGMA table_info(subscriptions)").all() as { name: string }[];
    const columnNames = columns.map(c => c.name);
    
    expect(columnNames).toContain('id');
    expect(columnNames).toContain('user_id');
    expect(columnNames).toContain('up_mid');
    expect(columnNames).toContain('up_name');
    expect(columnNames).toContain('up_face');
    expect(columnNames).toContain('is_active');
    expect(columnNames).toContain('created_at');
  });

  test('videos表结构正确', () => {
    const db = initDatabase(':memory:');
    
    const columns = db.prepare("PRAGMA table_info(videos)").all() as { name: string }[];
    const columnNames = columns.map(c => c.name);
    
    expect(columnNames).toContain('id');
    expect(columnNames).toContain('up_mid');
    expect(columnNames).toContain('bvid');
    expect(columnNames).toContain('title');
    expect(columnNames).toContain('description');
    expect(columnNames).toContain('pic');
    expect(columnNames).toContain('pubdate');
    expect(columnNames).toContain('view');
    expect(columnNames).toContain('like');
    expect(columnNames).toContain('coin');
    expect(columnNames).toContain('favorites');
    expect(columnNames).toContain('created_at');
  });
});
```

- [ ] **Step 2: 运行测试验证失败**

Run: `cd server && npm test -- database.test.ts`
Expected: FAIL - 模块未找到

- [ ] **Step 3: 实现数据库初始化**

```typescript
// server/src/db/database.ts
import Database from 'better-sqlite3';

let db: Database.Database | null = null;

export function initDatabase(dbPath: string = './data/bilibili-notify.db'): Database.Database {
  db = new Database(dbPath);
  
  // 启用WAL模式提高并发性能
  db.pragma('journal_mode = WAL');
  
  // 创建表
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      bilibili_uid TEXT,
      pushplus_token TEXT,
      serverchan_key TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      up_mid TEXT NOT NULL,
      up_name TEXT NOT NULL,
      up_face TEXT,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(user_id, up_mid)
    );

    CREATE TABLE IF NOT EXISTS videos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      up_mid TEXT NOT NULL,
      bvid TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      pic TEXT,
      pubdate DATETIME,
      view INTEGER DEFAULT 0,
      like INTEGER DEFAULT 0,
      coin INTEGER DEFAULT 0,
      favorites INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS push_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      bvid TEXT NOT NULL,
      pushed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(user_id, bvid)
    );

    CREATE TABLE IF NOT EXISTS up_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      up_mid TEXT NOT NULL,
      followers INTEGER DEFAULT 0,
      recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  return db;
}

export function getDatabase(): Database.Database | null {
  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}
```

- [ ] **Step 4: 运行测试验证通过**

Run: `cd server && npm test -- database.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/src/db/
git commit -m "feat: add database initialization with all tables (TDD)"
```

---

## Task 3: 用户认证模块 (TDD)

**Covers:** [S3.1]

**Files:**
- Create: `server/src/services/auth.ts`
- Create: `server/src/services/auth.test.ts`
- Create: `server/src/middleware/auth.ts`
- Create: `server/src/middleware/auth.test.ts`

- [ ] **Step 1: 写失败测试 - 用户注册**

```typescript
// server/src/services/auth.test.ts
import { initDatabase, closeDatabase } from '../db/database';
import { registerUser, loginUser, generateToken } from './auth';

describe('Auth Service', () => {
  beforeEach(() => {
    initDatabase(':memory:');
  });

  afterEach(() => {
    closeDatabase();
  });

  test('注册新用户成功', async () => {
    const result = await registerUser('testuser', 'password123');
    
    expect(result).toHaveProperty('id');
    expect(result.username).toBe('testuser');
  });

  test('注册重复用户名失败', async () => {
    await registerUser('testuser', 'password123');
    
    await expect(registerUser('testuser', 'password123'))
      .rejects.toThrow('Username already exists');
  });

  test('登录成功返回token', async () => {
    await registerUser('testuser', 'password123');
    
    const result = await loginUser('testuser', 'password123');
    
    expect(result).toHaveProperty('token');
    expect(result.username).toBe('testuser');
  });

  test('登录失败密码错误', async () => {
    await registerUser('testuser', 'password123');
    
    await expect(loginUser('testuser', 'wrongpassword'))
      .rejects.toThrow('Invalid credentials');
  });

  test('登录失败用户不存在', async () => {
    await expect(loginUser('nonexistent', 'password123'))
      .rejects.toThrow('Invalid credentials');
  });

  test('生成和验证JWT token', () => {
    const token = generateToken(1, 'testuser');
    
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
  });
});
```

- [ ] **Step 2: 运行测试验证失败**

Run: `cd server && npm test -- auth.test.ts`
Expected: FAIL - 模块未找到

- [ ] **Step 3: 实现用户注册**

```typescript
// server/src/services/auth.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDatabase } from '../db/database';

const JWT_SECRET = process.env.JWT_SECRET || 'bilibili-notify-secret-key';

interface User {
  id: number;
  username: string;
  password_hash: string;
  bilibili_uid: string | null;
  pushplus_token: string | null;
  serverchan_key: string | null;
  created_at: string;
}

export async function registerUser(username: string, password: string): Promise<{ id: number; username: string }> {
  const db = getDatabase();
  if (!db) throw new Error('Database not initialized');
  
  // 检查用户名是否已存在
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    throw new Error('Username already exists');
  }
  
  // 密码哈希
  const passwordHash = await bcrypt.hash(password, 10);
  
  // 插入用户
  const result = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(username, passwordHash);
  
  return { id: result.lastInsertRowid as number, username };
}

export async function loginUser(username: string, password: string): Promise<{ token: string; username: string }> {
  const db = getDatabase();
  if (!db) throw new Error('Database not initialized');
  
  // 查找用户
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as User | undefined;
  if (!user) {
    throw new Error('Invalid credentials');
  }
  
  // 验证密码
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    throw new Error('Invalid credentials');
  }
  
  // 生成token
  const token = generateToken(user.id, user.username);
  
  return { token, username: user.username };
}

export function generateToken(userId: number, username: string): string {
  return jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): { userId: number; username: string } {
  return jwt.verify(token, JWT_SECRET) as { userId: number; username: string };
}
```

- [ ] **Step 4: 运行测试验证通过**

Run: `cd server && npm test -- auth.test.ts`
Expected: PASS

- [ ] **Step 5: 写失败测试 - JWT中间件**

```typescript
// server/src/middleware/auth.test.ts
import { initDatabase, closeDatabase } from '../db/database';
import { generateToken } from '../services/auth';
import { authMiddleware, AuthRequest } from './auth';
import { Request, Response, NextFunction } from 'express';

describe('Auth Middleware', () => {
  beforeEach(() => {
    initDatabase(':memory:');
  });

  afterEach(() => {
    closeDatabase();
  });

  test('有效token通过认证', () => {
    const token = generateToken(1, 'testuser');
    const req = { headers: { authorization: `Bearer ${token}` } } as Request;
    const res = {} as Response;
    const next = jest.fn();
    
    authMiddleware(req, res, next);
    
    expect(next).toHaveBeenCalled();
    expect((req as AuthRequest).user).toEqual({ userId: 1, username: 'testuser' });
  });

  test('无token拒绝请求', () => {
    const req = { headers: {} } as Request;
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;
    const next = jest.fn();
    
    authMiddleware(req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
    expect(next).not.toHaveBeenCalled();
  });

  test('无效token拒绝请求', () => {
    const req = { headers: { authorization: 'Bearer invalidtoken' } } as Request;
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;
    const next = jest.fn();
    
    authMiddleware(req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
    expect(next).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 6: 运行测试验证失败**

Run: `cd server && npm test -- auth.test.ts`
Expected: FAIL - authMiddleware未定义

- [ ] **Step 7: 实现JWT中间件**

```typescript
// server/src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/auth';

export interface AuthRequest extends Request {
  user?: {
    userId: number;
    username: string;
  };
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = verifyToken(token);
    (req as AuthRequest).user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}
```

- [ ] **Step 8: 运行测试验证通过**

Run: `cd server && npm test -- auth.test.ts`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add server/src/services/auth.ts server/src/services/auth.test.ts server/src/middleware/auth.ts server/src/middleware/auth.test.ts
git commit -m "feat: add user authentication with JWT (TDD)"
```

---

## Task 4: Bilibili API服务 (TDD)

**Covers:** [S3.2]

**Files:**
- Create: `server/src/services/bilibili.ts`
- Create: `server/src/services/bilibili.test.ts`

- [ ] **Step 1: 写失败测试 - 获取用户信息和关注列表**

```typescript
// server/src/services/bilibili.test.ts
import { getUserInfo, getFollows, getLatestVideos, addUpManually } from './bilibili';

// Mock axios
jest.mock('axios');
import axios from 'axios';
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Bilibili Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('获取用户信息成功（公开API）', async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        code: 0,
        data: {
          mid: 123456,
          name: '测试UP主',
          face: 'https://example.com/face.jpg'
        }
      }
    });
    
    const result = await getUserInfo('123456');
    
    expect(result).toEqual({
      mid: '123456',
      name: '测试UP主',
      face: 'https://example.com/face.jpg'
    });
  });

  test('获取关注列表需要Cookie', async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        code: 0,
        data: {
          list: {
            mon_list: [
              { mid: 111, uname: 'UP主1', face: 'https://example.com/face1.jpg' },
              { mid: 222, uname: 'UP主2', face: 'https://example.com/face2.jpg' }
            ]
          }
        }
      }
    });
    
    const cookie = 'SESSDATA=test123';
    const result = await getFollows('123456', cookie);
    
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      mid: '111',
      name: 'UP主1',
      face: 'https://example.com/face1.jpg'
    });
    
    // 验证Cookie被传递
    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Cookie: cookie
        })
      })
    );
  });

  test('无Cookie获取关注列表失败', async () => {
    await expect(getFollows('123456')).rejects.toThrow('Cookie required');
  });

  test('手动添加UP主成功', async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        code: 0,
        data: {
          mid: 123456,
          name: '测试UP主',
          face: 'https://example.com/face.jpg'
        }
      }
    });
    
    const result = await addUpManually('123456');
    
    expect(result).toEqual({
      mid: '123456',
      name: '测试UP主',
      face: 'https://example.com/face.jpg'
    });
  });

  test('获取最新视频成功', async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        code: 0,
        data: {
          list: {
            vlist: [
              {
                bvid: 'BV1xx1111111',
                title: '测试视频',
                description: '视频描述',
                pic: 'https://example.com/pic.jpg',
                created: 1703001600,
                play: 1000,
                like: 100,
                favorites: 50
              }
            ]
          }
        }
      }
    });
    
    const result = await getLatestVideos('123456');
    
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      bvid: 'BV1xx1111111',
      title: '测试视频',
      description: '视频描述',
      pic: 'https://example.com/pic.jpg',
      pubdate: expect.any(Date),
      view: 1000,
      like: 100,
      coin: 0,
      favorites: 50
    });
  });

  test('API错误时抛出异常', async () => {
    mockedAxios.get.mockRejectedValue(new Error('Network error'));
    
    await expect(getUserInfo('123456')).rejects.toThrow('Network error');
  });
});
```

- [ ] **Step 2: 运行测试验证失败**

Run: `cd server && npm test -- bilibili.test.ts`
Expected: FAIL - 模块未找到

- [ ] **Step 3: 实现Bilibili API服务**

```typescript
// server/src/services/bilibili.ts
import axios from 'axios';

interface UserInfo {
  mid: string;
  name: string;
  face: string;
}

interface FollowInfo {
  mid: string;
  name: string;
  face: string;
}

interface VideoInfo {
  bvid: string;
  title: string;
  description: string;
  pic: string;
  pubdate: Date;
  view: number;
  like: number;
  coin: number;
  favorites: number;
}

const BILIBILI_API = {
  userInfo: 'https://api.bilibili.com/x/space/acc/info',
  followings: 'https://api.bilibili.com/x/relation/followings',
  spaceArcs: 'https://api.bilibili.com/x/space/wbi/arc/search'
};

const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
};

export async function getUserInfo(mid: string): Promise<UserInfo> {
  const response = await axios.get(BILIBILI_API.userInfo, {
    params: { mid },
    headers: DEFAULT_HEADERS
  });
  
  if (response.data.code !== 0) {
    throw new Error(`Bilibili API error: ${response.data.message}`);
  }
  
  const { data } = response.data;
  return {
    mid: String(data.mid),
    name: data.name,
    face: data.face
  };
}

export async function addUpManually(mid: string): Promise<UserInfo> {
  return getUserInfo(mid);
}

export async function getFollows(mid: string, cookie?: string): Promise<FollowInfo[]> {
  if (!cookie) {
    throw new Error('Cookie required for followings API');
  }
  
  const response = await axios.get(BILIBILI_API.followings, {
    params: { vmid: mid, pn: 1, ps: 50 },
    headers: {
      ...DEFAULT_HEADERS,
      Cookie: cookie
    }
  });
  
  if (response.data.code !== 0) {
    throw new Error(`Bilibili API error: ${response.data.message}`);
  }
  
  const { list } = response.data.data;
  if (!list || !list.mon_list) {
    return [];
  }
  
  return list.mon_list.map((item: any) => ({
    mid: String(item.mid),
    name: item.uname,
    face: item.face
  }));
}

export async function getLatestVideos(mid: string): Promise<VideoInfo[]> {
  const response = await axios.get(BILIBILI_API.spaceArcs, {
    params: { mid, pn: 1, ps: 10 },
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  
  if (response.data.code !== 0) {
    throw new Error(`Bilibili API error: ${response.data.message}`);
  }
  
  const { list } = response.data.data;
  if (!list || !list.vlist) {
    return [];
  }
  
  return list.vlist.map((item: any) => ({
    bvid: item.bvid,
    title: item.title,
    description: item.description || '',
    pic: item.pic,
    pubdate: new Date(item.created * 1000),
    view: item.play || 0,
    like: item.like || 0,
    coin: 0,
    favorites: item.favorites || 0
  }));
}
```

- [ ] **Step 4: 运行测试验证通过**

Run: `cd server && npm test -- bilibili.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/src/services/bilibili.ts server/src/services/bilibili.test.ts
git commit -m "feat: add Bilibili API service for user info and videos (TDD)"
```

---

## Task 5: 订阅管理模块 (TDD)

**Covers:** [S3.3]

**Files:**
- Create: `server/src/services/subscription.ts`
- Create: `server/src/services/subscription.test.ts`

- [ ] **Step 1: 写失败测试 - 订阅UP主**

```typescript
// server/src/services/subscription.test.ts
import { initDatabase, closeDatabase, getDatabase } from '../db/database';
import { registerUser } from './auth';
import { addSubscription, removeSubscription, getSubscriptions, toggleSubscription } from './subscription';

describe('Subscription Service', () => {
  let userId: number;

  beforeEach(async () => {
    initDatabase(':memory:');
    const user = await registerUser('testuser', 'password123');
    userId = user.id;
  });

  afterEach(() => {
    closeDatabase();
  });

  test('添加订阅成功', async () => {
    const result = await addSubscription(userId, '123456', '测试UP主', 'https://example.com/face.jpg');
    
    expect(result).toHaveProperty('id');
    expect(result.up_mid).toBe('123456');
    expect(result.up_name).toBe('测试UP主');
    expect(result.is_active).toBe(true);
  });

  test('重复订阅返回已有订阅', async () => {
    await addSubscription(userId, '123456', '测试UP主', 'https://example.com/face.jpg');
    const result = await addSubscription(userId, '123456', '测试UP主', 'https://example.com/face.jpg');
    
    expect(result.up_mid).toBe('123456');
  });

  test('删除订阅成功', async () => {
    const sub = await addSubscription(userId, '123456', '测试UP主', 'https://example.com/face.jpg');
    const result = await removeSubscription(userId, '123456');
    
    expect(result).toBe(true);
    
    const subs = await getSubscriptions(userId);
    expect(subs).toHaveLength(0);
  });

  test('获取订阅列表', async () => {
    await addSubscription(userId, '111', 'UP主1', 'https://example.com/face1.jpg');
    await addSubscription(userId, '222', 'UP主2', 'https://example.com/face2.jpg');
    
    const subs = await getSubscriptions(userId);
    
    expect(subs).toHaveLength(2);
    expect(subs[0].up_mid).toBe('111');
    expect(subs[1].up_mid).toBe('222');
  });

  test('切换订阅状态', async () => {
    await addSubscription(userId, '123456', '测试UP主', 'https://example.com/face.jpg');
    
    const result = await toggleSubscription(userId, '123456');
    
    expect(result.is_active).toBe(false);
    
    const result2 = await toggleSubscription(userId, '123456');
    expect(result2.is_active).toBe(true);
  });

  test('获取活跃订阅列表', async () => {
    await addSubscription(userId, '111', 'UP主1', 'https://example.com/face1.jpg');
    const sub2 = await addSubscription(userId, '222', 'UP主2', 'https://example.com/face2.jpg');
    await toggleSubscription(userId, '222');
    
    const subs = await getSubscriptions(userId, true);
    
    expect(subs).toHaveLength(1);
    expect(subs[0].up_mid).toBe('111');
  });
});
```

- [ ] **Step 2: 运行测试验证失败**

Run: `cd server && npm test -- subscription.test.ts`
Expected: FAIL - 模块未找到

- [ ] **Step 3: 实现订阅管理**

```typescript
// server/src/services/subscription.ts
import { getDatabase } from '../db/database';

interface Subscription {
  id: number;
  user_id: number;
  up_mid: string;
  up_name: string;
  up_face: string | null;
  is_active: boolean;
  created_at: string;
}

export async function addSubscription(
  userId: number,
  upMid: string,
  upName: string,
  upFace: string
): Promise<Subscription> {
  const db = getDatabase();
  if (!db) throw new Error('Database not initialized');
  
  // 检查是否已存在
  const existing = db.prepare(
    'SELECT * FROM subscriptions WHERE user_id = ? AND up_mid = ?'
  ).get(userId, upMid) as Subscription | undefined;
  
  if (existing) {
    return existing;
  }
  
  // 插入新订阅
  const result = db.prepare(
    'INSERT INTO subscriptions (user_id, up_mid, up_name, up_face) VALUES (?, ?, ?, ?)'
  ).run(userId, upMid, upName, upFace);
  
  return {
    id: result.lastInsertRowid as number,
    user_id: userId,
    up_mid: upMid,
    up_name: upName,
    up_face: upFace,
    is_active: true,
    created_at: new Date().toISOString()
  };
}

export async function removeSubscription(userId: number, upMid: string): Promise<boolean> {
  const db = getDatabase();
  if (!db) throw new Error('Database not initialized');
  
  const result = db.prepare(
    'DELETE FROM subscriptions WHERE user_id = ? AND up_mid = ?'
  ).run(userId, upMid);
  
  return result.changes > 0;
}

export async function getSubscriptions(
  userId: number,
  activeOnly: boolean = false
): Promise<Subscription[]> {
  const db = getDatabase();
  if (!db) throw new Error('Database not initialized');
  
  let query = 'SELECT * FROM subscriptions WHERE user_id = ?';
  if (activeOnly) {
    query += ' AND is_active = 1';
  }
  query += ' ORDER BY created_at DESC';
  
  return db.prepare(query).all(userId) as Subscription[];
}

export async function toggleSubscription(
  userId: number,
  upMid: string
): Promise<Subscription> {
  const db = getDatabase();
  if (!db) throw new Error('Database not initialized');
  
  const sub = db.prepare(
    'SELECT * FROM subscriptions WHERE user_id = ? AND up_mid = ?'
  ).get(userId, upMid) as Subscription | undefined;
  
  if (!sub) {
    throw new Error('Subscription not found');
  }
  
  const newStatus = !sub.is_active;
  db.prepare(
    'UPDATE subscriptions SET is_active = ? WHERE user_id = ? AND up_mid = ?'
  ).run(newStatus, userId, upMid);
  
  return { ...sub, is_active: newStatus };
}
```

- [ ] **Step 4: 运行测试验证通过**

Run: `cd server && npm test -- subscription.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/src/services/subscription.ts server/src/services/subscription.test.ts
git commit -m "feat: add subscription management service (TDD)"
```

---

## Task 6: 推送服务模块 (TDD)

**Covers:** [S3.5]

**Files:**
- Create: `server/src/services/push.ts`
- Create: `server/src/services/push.test.ts`

- [ ] **Step 1: 写失败测试 - PushPlus推送**

```typescript
// server/src/services/push.test.ts
import { initDatabase, closeDatabase } from '../db/database';
import { registerUser } from './auth';
import { bindPushPlus, sendPushPlus, getPushConfig } from './push';

// Mock axios
jest.mock('axios');
import axios from 'axios';
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Push Service', () => {
  let userId: number;

  beforeEach(async () => {
    initDatabase(':memory:');
    const user = await registerUser('testuser', 'password123');
    userId = user.id;
    jest.clearAllMocks();
  });

  afterEach(() => {
    closeDatabase();
  });

  test('绑定PushPlus Token成功', async () => {
    const result = await bindPushPlus(userId, 'test-token-123');
    
    expect(result).toBe(true);
    
    const config = await getPushConfig(userId);
    expect(config.pushplus_token).toBe('test-token-123');
  });

  test('发送PushPlus推送成功', async () => {
    mockedAxios.post.mockResolvedValue({
      data: { code: 200, msg: 'success' }
    });
    
    const result = await sendPushPlus(
      'test-token-123',
      '测试标题',
      '测试内容'
    );
    
    expect(result).toBe(true);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://www.pushplus.plus/send',
      expect.objectContaining({
        token: 'test-token-123',
        title: '测试标题',
        content: '测试内容'
      })
    );
  });

  test('PushPlus推送失败返回false', async () => {
    mockedAxios.post.mockResolvedValue({
      data: { code: 400, msg: 'error' }
    });
    
    const result = await sendPushPlus(
      'test-token-123',
      '测试标题',
      '测试内容'
    );
    
    expect(result).toBe(false);
  });

  test('获取推送配置', async () => {
    await bindPushPlus(userId, 'test-token');
    
    const config = await getPushConfig(userId);
    
    expect(config.pushplus_token).toBe('test-token');
    expect(config.serverchan_key).toBeNull();
  });
});
```

- [ ] **Step 2: 运行测试验证失败**

Run: `cd server && npm test -- push.test.ts`
Expected: FAIL - 模块未找到

- [ ] **Step 3: 实现推送服务**

```typescript
// server/src/services/push.ts
import axios from 'axios';
import { getDatabase } from '../db/database';

interface PushConfig {
  pushplus_token: string | null;
  serverchan_key: string | null;
}

export async function bindPushPlus(userId: number, token: string): Promise<boolean> {
  const db = getDatabase();
  if (!db) throw new Error('Database not initialized');
  
  const result = db.prepare(
    'UPDATE users SET pushplus_token = ? WHERE id = ?'
  ).run(token, userId);
  
  return result.changes > 0;
}

export async function bindServerChan(userId: number, key: string): Promise<boolean> {
  const db = getDatabase();
  if (!db) throw new Error('Database not initialized');
  
  const result = db.prepare(
    'UPDATE users SET serverchan_key = ? WHERE id = ?'
  ).run(key, userId);
  
  return result.changes > 0;
}

export async function getPushConfig(userId: number): Promise<PushConfig> {
  const db = getDatabase();
  if (!db) throw new Error('Database not initialized');
  
  const user = db.prepare(
    'SELECT pushplus_token, serverchan_key FROM users WHERE id = ?'
  ).get(userId) as PushConfig | undefined;
  
  return user || { pushplus_token: null, serverchan_key: null };
}

export async function sendPushPlus(
  token: string,
  title: string,
  content: string
): Promise<boolean> {
  try {
    const response = await axios.post('https://www.pushplus.plus/send', {
      token,
      title,
      content,
      template: 'html'
    });
    
    return response.data.code === 200;
  } catch (error) {
    console.error('PushPlus send error:', error);
    return false;
  }
}

export async function sendServerChan(
  key: string,
  title: string,
  content: string
): Promise<boolean> {
  try {
    const response = await axios.get(
      `https://sctapi.ftqq.com/${key}.send`,
      {
        params: { title, desp: content }
      }
    );
    
    return response.data.code === 0;
  } catch (error) {
    console.error('ServerChan send error:', error);
    return false;
  }
}

export async function sendNotification(
  userId: number,
  title: string,
  content: string
): Promise<boolean> {
  const config = await getPushConfig(userId);
  
  if (config.pushplus_token) {
    return sendPushPlus(config.pushplus_token, title, content);
  }
  
  if (config.serverchan_key) {
    return sendServerChan(config.serverchan_key, title, content);
  }
  
  console.warn(`No push config for user ${userId}`);
  return false;
}
```

- [ ] **Step 4: 运行测试验证通过**

Run: `cd server && npm test -- push.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/src/services/push.ts server/src/services/push.test.ts
git commit -m "feat: add PushPlus and ServerChan push services (TDD)"
```

---

## Task 7: 视频更新检测与推送 (TDD)

**Covers:** [S3.4, S3.5]

**Files:**
- Create: `server/src/services/update-checker.ts`
- Create: `server/src/services/update-checker.test.ts`

- [ ] **Step 1: 写失败测试 - 检查新视频**

```typescript
// server/src/services/update-checker.test.ts
import { initDatabase, closeDatabase, getDatabase } from '../db/database';
import { registerUser } from './auth';
import { addSubscription } from './subscription';
import { checkAndUpdate, recordVideo, getLatestVideo } from './update-checker';

// Mock bilibili service
jest.mock('../bilibili');
import { getLatestVideos } from '../bilibili';
const mockedGetLatestVideos = getLatestVideos as jest.MockedFunction<typeof getLatestVideos>;

describe('Update Checker', () => {
  let userId: number;

  beforeEach(async () => {
    initDatabase(':memory:');
    const user = await registerUser('testuser', 'password123');
    userId = user.id;
    await addSubscription(userId, '123456', '测试UP主', 'https://example.com/face.jpg');
    jest.clearAllMocks();
  });

  afterEach(() => {
    closeDatabase();
  });

  test('记录视频成功', async () => {
    const result = await recordVideo(
      '123456',
      'BV1xx1111111',
      '测试视频',
      '视频描述',
      'https://example.com/pic.jpg',
      new Date(),
      1000,
      100,
      50,
      30
    );
    
    expect(result).toHaveProperty('id');
    expect(result.bvid).toBe('BV1xx1111111');
  });

  test('重复视频返回已有记录', async () => {
    await recordVideo('123456', 'BV1xx1111111', '测试视频', '', '', new Date(), 0, 0, 0, 0);
    const result = await recordVideo('123456', 'BV1xx1111111', '测试视频', '', '', new Date(), 0, 0, 0, 0);
    
    expect(result.bvid).toBe('BV1xx1111111');
  });

  test('获取UP主最新视频', async () => {
    await recordVideo('123456', 'BV1xx1111111', '视频1', '', '', new Date(), 0, 0, 0, 0);
    await recordVideo('123456', 'BV1xx2222222', '视频2', '', '', new Date(), 0, 0, 0, 0);
    
    const latest = await getLatestVideo('123456');
    
    expect(latest).not.toBeNull();
    expect(latest!.bvid).toBe('BV1xx2222222');
  });

  test('检查更新发现新视频', async () => {
    mockedGetLatestVideos.mockResolvedValue([
      {
        bvid: 'BV1xx3333333',
        title: '新视频',
        description: '',
        pic: '',
        pubdate: new Date(),
        view: 0,
        like: 0,
        coin: 0,
        favorites: 0
      }
    ]);
    
    const newVideos = await checkAndUpdate('123456');
    
    expect(newVideos).toHaveLength(1);
    expect(newVideos[0].bvid).toBe('BV1xx3333333');
  });

  test('检查更新无新视频返回空', async () => {
    await recordVideo('123456', 'BV1xx1111111', '视频1', '', '', new Date(), 0, 0, 0, 0);
    
    mockedGetLatestVideos.mockResolvedValue([
      {
        bvid: 'BV1xx1111111',
        title: '视频1',
        description: '',
        pic: '',
        pubdate: new Date(),
        view: 0,
        like: 0,
        coin: 0,
        favorites: 0
      }
    ]);
    
    const newVideos = await checkAndUpdate('123456');
    
    expect(newVideos).toHaveLength(0);
  });
});
```

- [ ] **Step 2: 运行测试验证失败**

Run: `cd server && npm test -- update-checker.test.ts`
Expected: FAIL - 模块未找到

- [ ] **Step 3: 实现视频更新检测**

```typescript
// server/src/services/update-checker.ts
import { getDatabase } from '../db/database';
import { getLatestVideos as fetchLatestVideos, VideoInfo } from './bilibili';

interface VideoRecord {
  id: number;
  up_mid: string;
  bvid: string;
  title: string;
  description: string;
  pic: string;
  pubdate: string;
  view: number;
  like: number;
  coin: number;
  favorites: number;
  created_at: string;
}

export async function recordVideo(
  upMid: string,
  bvid: string,
  title: string,
  description: string,
  pic: string,
  pubdate: Date,
  view: number,
  like: number,
  coin: number,
  favorites: number
): Promise<VideoRecord> {
  const db = getDatabase();
  if (!db) throw new Error('Database not initialized');
  
  // 检查是否已存在
  const existing = db.prepare(
    'SELECT * FROM videos WHERE bvid = ?'
  ).get(bvid) as VideoRecord | undefined;
  
  if (existing) {
    return existing;
  }
  
  // 插入新视频
  const result = db.prepare(
    `INSERT INTO videos (up_mid, bvid, title, description, pic, pubdate, view, like, coin, favorites) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(upMid, bvid, title, description, pic, pubdate.toISOString(), view, like, coin, favorites);
  
  return {
    id: result.lastInsertRowid as number,
    up_mid: upMid,
    bvid,
    title,
    description,
    pic,
    pubdate: pubdate.toISOString(),
    view,
    like,
    coin,
    favorites,
    created_at: new Date().toISOString()
  };
}

export async function getLatestVideo(upMid: string): Promise<VideoRecord | null> {
  const db = getDatabase();
  if (!db) throw new Error('Database not initialized');
  
  const video = db.prepare(
    'SELECT * FROM videos WHERE up_mid = ? ORDER BY pubdate DESC LIMIT 1'
  ).get(upMid) as VideoRecord | undefined;
  
  return video || null;
}

export async function checkAndUpdate(upMid: string): Promise<VideoInfo[]> {
  const db = getDatabase();
  if (!db) throw new Error('Database not initialized');
  
  // 获取Bilibili最新视频
  const latestVideos = await fetchLatestVideos(upMid);
  
  // 获取数据库中已记录的bvid
  const existingVideos = db.prepare(
    'SELECT bvid FROM videos WHERE up_mid = ?'
  ).all(upMid) as { bvid: string }[];
  
  const existingBvids = new Set(existingVideos.map(v => v.bvid));
  
  // 筛选出新视频
  const newVideos = latestVideos.filter(v => !existingBvids.has(v.bvid));
  
  // 记录新视频
  for (const video of newVideos) {
    await recordVideo(
      upMid,
      video.bvid,
      video.title,
      video.description,
      video.pic,
      video.pubdate,
      video.view,
      video.like,
      video.coin,
      video.favorites
    );
  }
  
  return newVideos;
}
```

- [ ] **Step 4: 运行测试验证通过**

Run: `cd server && npm test -- update-checker.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/src/services/update-checker.ts server/src/services/update-checker.test.ts
git commit -m "feat: add video update checker service (TDD)"
```

---

## Task 8: 定时任务调度器 (TDD)

**Covers:** [S3.4]

**Files:**
- Create: `server/src/services/scheduler.ts`
- Create: `server/src/services/scheduler.test.ts`

- [ ] **Step 1: 写失败测试 - 调度器功能**

```typescript
// server/src/services/scheduler.test.ts
import { initDatabase, closeDatabase, getDatabase } from '../db/database';
import { registerUser } from './auth';
import { addSubscription } from './subscription';
import { startScheduler, stopScheduler, runCheckOnce } from './scheduler';

// Mock update-checker
jest.mock('./update-checker');
import { checkAndUpdate } from './update-checker';
const mockedCheckAndUpdate = checkAndUpdate as jest.MockedFunction<typeof checkAndUpdate>;

// Mock push
jest.mock('./push');
import { sendNotification } from './push';
const mockedSendNotification = sendNotification as jest.MockedFunction<typeof sendNotification>;

describe('Scheduler', () => {
  beforeEach(async () => {
    initDatabase(':memory:');
    jest.clearAllMocks();
  });

  afterEach(() => {
    stopScheduler();
    closeDatabase();
  });

  test('启动调度器', () => {
    const result = startScheduler();
    expect(result).toBe(true);
  });

  test('停止调度器', () => {
    startScheduler();
    const result = stopScheduler();
    expect(result).toBe(true);
  });

  test('执行一次检查', async () => {
    const user = await registerUser('testuser', 'password123');
    await addSubscription(user.id, '123456', '测试UP主', 'https://example.com/face.jpg');
    
    mockedCheckAndUpdate.mockResolvedValue([
      {
        bvid: 'BV1xx1111111',
        title: '新视频',
        description: '',
        pic: '',
        pubdate: new Date(),
        view: 0,
        like: 0,
        coin: 0,
        favorites: 0
      }
    ]);
    mockedSendNotification.mockResolvedValue(true);
    
    await runCheckOnce();
    
    expect(mockedCheckAndUpdate).toHaveBeenCalledWith('123456');
    expect(mockedSendNotification).toHaveBeenCalled();
  });

  test('无新视频时不发送通知', async () => {
    const user = await registerUser('testuser', 'password123');
    await addSubscription(user.id, '123456', '测试UP主', 'https://example.com/face.jpg');
    
    mockedCheckAndUpdate.mockResolvedValue([]);
    
    await runCheckOnce();
    
    expect(mockedCheckAndUpdate).toHaveBeenCalledWith('123456');
    expect(mockedSendNotification).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: 运行测试验证失败**

Run: `cd server && npm test -- scheduler.test.ts`
Expected: FAIL - 模块未找到

- [ ] **Step 3: 实现定时任务调度器**

```typescript
// server/src/services/scheduler.ts
import cron from 'node-cron';
import { getDatabase } from '../db/database';
import { checkAndUpdate } from './update-checker';
import { sendNotification } from './push';

let scheduledTask: cron.ScheduledTask | null = null;

interface Subscription {
  user_id: number;
  up_mid: string;
  up_name: string;
}

export function startScheduler(schedule: string = '*/5 * * * *'): boolean {
  if (scheduledTask) {
    return false;
  }
  
  scheduledTask = cron.schedule(schedule, async () => {
    console.log(`[${new Date().toISOString()}] Running update check...`);
    await runCheckOnce();
  });
  
  console.log(`Scheduler started with schedule: ${schedule}`);
  return true;
}

export function stopScheduler(): boolean {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    console.log('Scheduler stopped');
    return true;
  }
  return false;
}

export async function runCheckOnce(): Promise<void> {
  const db = getDatabase();
  if (!db) {
    console.error('Database not initialized');
    return;
  }
  
  // 获取所有活跃订阅
  const subscriptions = db.prepare(
    'SELECT DISTINCT user_id, up_mid, up_name FROM subscriptions WHERE is_active = 1'
  ).all() as Subscription[];
  
  // 按UP主分组
  const upMidToUsers = new Map<string, number[]>();
  for (const sub of subscriptions) {
    const users = upMidToUsers.get(sub.up_mid) || [];
    users.push(sub.user_id);
    upMidToUsers.set(sub.up_mid, users);
  }
  
  // 检查每个UP主的更新
  for (const [upMid, userIds] of upMidToUsers) {
    try {
      const newVideos = await checkAndUpdate(upMid);
      
      if (newVideos.length > 0) {
        console.log(`Found ${newVideos.length} new videos for UP ${upMid}`);
        
        // 向订阅用户发送通知
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
```

- [ ] **Step 4: 运行测试验证通过**

Run: `cd server && npm test -- scheduler.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/src/services/scheduler.ts server/src/services/scheduler.test.ts
git commit -m "feat: add scheduler for periodic update checks (TDD)"
```

---

## Task 9: 统计服务模块 (TDD)

**Covers:** [S3.6]

**Files:**
- Create: `server/src/services/stats.ts`
- Create: `server/src/services/stats.test.ts`

- [ ] **Step 1: 写失败测试 - 统计功能**

```typescript
// server/src/services/stats.test.ts
import { initDatabase, closeDatabase } from '../db/database';
import { recordFollowers, getFollowersTrend, getUpStats, recordUpStats } from './stats';

describe('Stats Service', () => {
  beforeEach(() => {
    initDatabase(':memory:');
  });

  afterEach(() => {
    closeDatabase();
  });

  test('记录粉丝数', async () => {
    const result = await recordFollowers('123456', 10000);
    
    expect(result).toHaveProperty('id');
    expect(result.up_mid).toBe('123456');
    expect(result.followers).toBe(10000);
  });

  test('获取粉丝数趋势', async () => {
    await recordFollowers('123456', 10000);
    await recordFollowers('123456', 10100);
    await recordFollowers('123456', 10200);
    
    const trend = await getFollowersTrend('123456');
    
    expect(trend).toHaveLength(3);
    expect(trend[0].followers).toBe(10000);
    expect(trend[2].followers).toBe(10200);
  });

  test('记录UP主综合统计', async () => {
    const result = await recordUpStats('123456', 10000, 500000, 100);
    
    expect(result).toHaveProperty('id');
    expect(result.up_mid).toBe('123456');
    expect(result.followers).toBe(10000);
    expect(result.total_views).toBe(500000);
    expect(result.video_count).toBe(100);
  });

  test('获取UP主统计数据', async () => {
    await recordUpStats('123456', 10000, 500000, 100);
    await recordUpStats('123456', 10100, 510000, 101);
    
    const stats = await getUpStats('123456');
    
    expect(stats).not.toBeNull();
    expect(stats!.current.followers).toBe(10100);
    expect(stats!.current.total_views).toBe(510000);
    expect(stats!.growth.followers_growth).toBe(100);
    expect(stats!.growth.views_growth).toBe(10000);
  });
});
```

- [ ] **Step 2: 运行测试验证失败**

Run: `cd server && npm test -- stats.test.ts`
Expected: FAIL - 模块未找到

- [ ] **Step 3: 实现统计服务**

```typescript
// server/src/services/stats.ts
import { getDatabase } from '../db/database';

interface FollowerRecord {
  id: number;
  up_mid: string;
  followers: number;
  recorded_at: string;
}

interface UpStatsRecord {
  id: number;
  up_mid: string;
  followers: number;
  total_views: number;
  video_count: number;
  recorded_at: string;
}

interface UpStats {
  current: UpStatsRecord;
  previous: UpStatsRecord | null;
  growth: {
    followers_growth: number;
    views_growth: number;
    video_growth: number;
  };
}

export async function recordFollowers(upMid: string, followers: number): Promise<FollowerRecord> {
  const db = getDatabase();
  if (!db) throw new Error('Database not initialized');
  
  const result = db.prepare(
    'INSERT INTO up_stats (up_mid, followers) VALUES (?, ?)'
  ).run(upMid, followers);
  
  return {
    id: result.lastInsertRowid as number,
    up_mid: upMid,
    followers,
    recorded_at: new Date().toISOString()
  };
}

export async function getFollowersTrend(upMid: string, days: number = 30): Promise<FollowerRecord[]> {
  const db = getDatabase();
  if (!db) throw new Error('Database not initialized');
  
  return db.prepare(
    `SELECT * FROM up_stats 
     WHERE up_mid = ? 
     AND recorded_at >= datetime('now', '-' || ? || ' days')
     ORDER BY recorded_at ASC`
  ).all(upMid, days) as FollowerRecord[];
}

export async function recordUpStats(
  upMid: string,
  followers: number,
  totalViews: number,
  videoCount: number
): Promise<UpStatsRecord> {
  const db = getDatabase();
  if (!db) throw new Error('Database not initialized');
  
  // 检查是否已有今天的记录
  const today = new Date().toISOString().split('T')[0];
  const existing = db.prepare(
    `SELECT * FROM up_stats WHERE up_mid = ? AND date(recorded_at) = ?`
  ).get(upMid, today) as UpStatsRecord | undefined;
  
  if (existing) {
    // 更新今天的记录
    db.prepare(
      'UPDATE up_stats SET followers = ?, total_views = ?, video_count = ? WHERE id = ?'
    ).run(followers, totalViews, videoCount, existing.id);
    
    return { ...existing, followers, total_views: totalViews, video_count: videoCount };
  }
  
  // 插入新记录
  const result = db.prepare(
    'INSERT INTO up_stats (up_mid, followers, total_views, video_count) VALUES (?, ?, ?, ?)'
  ).run(upMid, followers, totalViews, videoCount);
  
  return {
    id: result.lastInsertRowid as number,
    up_mid: upMid,
    followers,
    total_views: totalViews,
    video_count: videoCount,
    recorded_at: new Date().toISOString()
  };
}

export async function getUpStats(upMid: string): Promise<UpStats | null> {
  const db = getDatabase();
  if (!db) throw new Error('Database not initialized');
  
  // 获取最新记录
  const current = db.prepare(
    'SELECT * FROM up_stats WHERE up_mid = ? ORDER BY recorded_at DESC LIMIT 1'
  ).get(upMid) as UpStatsRecord | undefined;
  
  if (!current) {
    return null;
  }
  
  // 获取上一条记录
  const previous = db.prepare(
    'SELECT * FROM up_stats WHERE up_mid = ? AND recorded_at < ? ORDER BY recorded_at DESC LIMIT 1'
  ).get(upMid, current.recorded_at) as UpStatsRecord | undefined;
  
  // 计算增长
  const growth = {
    followers_growth: previous ? current.followers - previous.followers : 0,
    views_growth: previous ? current.total_views - previous.total_views : 0,
    video_growth: previous ? current.video_count - previous.video_count : 0
  };
  
  return { current, previous, growth };
}
```

- [ ] **Step 4: 运行测试验证通过**

Run: `cd server && npm test -- stats.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/src/services/stats.ts server/src/services/stats.test.ts
git commit -m "feat: add statistics service for UP主 data tracking (TDD)"
```

---

## Task 10: Express路由层 (TDD)

**Covers:** [S5]

**Files:**
- Create: `server/src/routes/auth.ts`
- Create: `server/src/routes/bilibili.ts`
- Create: `server/src/routes/subscribe.ts`
- Create: `server/src/routes/push.ts`
- Create: `server/src/routes/stats.ts`
- Create: `server/src/routes/auth.test.ts`
- Create: `server/src/routes/subscribe.test.ts`
- Create: `server/src/index.ts`

- [ ] **Step 1: 写失败测试 - 认证路由**

```typescript
// server/src/routes/auth.test.ts
import request from 'supertest';
import express from 'express';
import { initDatabase, closeDatabase } from '../db/database';
import authRouter from './auth';

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);

describe('Auth Routes', () => {
  beforeEach(() => {
    initDatabase(':memory:');
  });

  afterEach(() => {
    closeDatabase();
  });

  test('POST /api/auth/register 成功', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ username: 'testuser', password: 'password123' });
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.username).toBe('testuser');
  });

  test('POST /api/auth/register 重复用户名', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ username: 'testuser', password: 'password123' });
    
    const response = await request(app)
      .post('/api/auth/register')
      .send({ username: 'testuser', password: 'password123' });
    
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Username already exists');
  });

  test('POST /api/auth/login 成功', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ username: 'testuser', password: 'password123' });
    
    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testuser', password: 'password123' });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
  });

  test('POST /api/auth/login 密码错误', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ username: 'testuser', password: 'password123' });
    
    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testuser', password: 'wrongpassword' });
    
    expect(response.status).toBe(401);
  });
});
```

- [ ] **Step 2: 运行测试验证失败**

Run: `cd server && npm test -- auth.test.ts`
Expected: FAIL - 模块未找到

- [ ] **Step 3: 实现认证路由**

```typescript
// server/src/routes/auth.ts
import { Router, Request, Response } from 'express';
import { registerUser, loginUser } from '../services/auth';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      res.status(400).json({ error: 'Username and password required' });
      return;
    }
    
    const user = await registerUser(username, password);
    res.status(201).json(user);
  } catch (error: any) {
    if (error.message === 'Username already exists') {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      res.status(400).json({ error: 'Username and password required' });
      return;
    }
    
    const result = await loginUser(username, password);
    res.json(result);
  } catch (error: any) {
    if (error.message === 'Invalid credentials') {
      res.status(401).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

export default router;
```

- [ ] **Step 4: 运行测试验证通过**

Run: `cd server && npm test -- auth.test.ts`
Expected: PASS

- [ ] **Step 5: 写失败测试 - 订阅路由**

```typescript
// server/src/routes/subscribe.test.ts
import request from 'supertest';
import express from 'express';
import { initDatabase, closeDatabase } from '../db/database';
import { registerUser, generateToken } from '../services/auth';
import subscribeRouter from './subscribe';

const app = express();
app.use(express.json());
app.use('/api/subscribe', subscribeRouter);

describe('Subscribe Routes', () => {
  let token: string;

  beforeEach(async () => {
    initDatabase(':memory:');
    await registerUser('testuser', 'password123');
    token = generateToken(1, 'testuser');
  });

  afterEach(() => {
    closeDatabase();
  });

  test('POST /api/subscribe 成功', async () => {
    const response = await request(app)
      .post('/api/subscribe')
      .set('Authorization', `Bearer ${token}`)
      .send({ up_mid: '123456', up_name: '测试UP主', up_face: 'https://example.com/face.jpg' });
    
    expect(response.status).toBe(201);
    expect(response.body.up_mid).toBe('123456');
  });

  test('POST /api/subscribe 未认证', async () => {
    const response = await request(app)
      .post('/api/subscribe')
      .send({ up_mid: '123456', up_name: '测试UP主' });
    
    expect(response.status).toBe(401);
  });

  test('GET /api/subscribe/list 获取列表', async () => {
    await request(app)
      .post('/api/subscribe')
      .set('Authorization', `Bearer ${token}`)
      .send({ up_mid: '123456', up_name: '测试UP主' });
    
    const response = await request(app)
      .get('/api/subscribe/list')
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
  });

  test('DELETE /api/subscribe/:upMid 取消订阅', async () => {
    await request(app)
      .post('/api/subscribe')
      .set('Authorization', `Bearer ${token}`)
      .send({ up_mid: '123456', up_name: '测试UP主' });
    
    const response = await request(app)
      .delete('/api/subscribe/123456')
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
  });
});
```

- [ ] **Step 6: 运行测试验证失败**

Run: `cd server && npm test -- subscribe.test.ts`
Expected: FAIL - 模块未找到

- [ ] **Step 7: 实现订阅路由**

```typescript
// server/src/routes/subscribe.ts
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
    
    const subscription = await addSubscription(userId, up_mid, up_name, up_face);
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
```

- [ ] **Step 8: 运行测试验证通过**

Run: `cd server && npm test -- subscribe.test.ts`
Expected: PASS

- [ ] **Step 9: 创建Express入口文件**

```typescript
// server/src/index.ts
import express from 'express';
import cors from 'cors';
import { initDatabase } from './db/database';
import { startScheduler } from './services/scheduler';
import authRouter from './routes/auth';
import subscribeRouter from './routes/subscribe';

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());

// 初始化数据库
initDatabase();

// 路由
app.use('/api/auth', authRouter);
app.use('/api/subscribe', subscribeRouter);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 启动定时任务
startScheduler();

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
```

- [ ] **Step 10: Commit**

```bash
git add server/src/routes/ server/src/index.ts
git commit -m "feat: add Express routes for auth and subscription (TDD)"
```

---

## Task 11: Vue 3前端基础结构

**Covers:** [S6]

**Files:**
- Create: `client/src/main.ts`
- Create: `client/src/App.vue`
- Create: `client/src/router/index.ts`
- Create: `client/src/api/index.ts`
- Create: `client/src/stores/auth.ts`
- Create: `client/index.html`

- [ ] **Step 1: 创建index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bilibili Notify - 哔哩哔哩更新推送</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

- [ ] **Step 2: 创建main.ts**

```typescript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
```

- [ ] **Step 3: 创建App.vue**

```vue
<template>
  <div id="app">
    <nav class="navbar">
      <div class="nav-brand">
        <router-link to="/">Bilibili Notify</router-link>
      </div>
      <div class="nav-links">
        <template v-if="authStore.isAuthenticated">
          <router-link to="/dashboard">Dashboard</router-link>
          <router-link to="/subscriptions">订阅管理</router-link>
          <button @click="logout" class="btn-logout">退出</button>
        </template>
        <template v-else>
          <router-link to="/login">登录</router-link>
          <router-link to="/register">注册</router-link>
        </template>
      </div>
    </nav>
    
    <main class="container">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from './stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const logout = () => {
  authStore.logout()
  router.push('/login')
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: #f5f5f5;
}

.navbar {
  background-color: #00a1d6;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-brand a {
  color: white;
  font-size: 1.5rem;
  font-weight: bold;
  text-decoration: none;
}

.nav-links {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.nav-links a {
  color: white;
  text-decoration: none;
}

.btn-logout {
  background: transparent;
  border: 1px solid white;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.container {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 2rem;
}
</style>
```

- [ ] **Step 4: 创建router/index.ts**

```typescript
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/Home.vue')
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/Login.vue')
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/Register.vue')
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('../views/Dashboard.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/subscriptions',
      name: 'subscriptions',
      component: () => import('../views/Subscriptions.vue'),
      meta: { requiresAuth: true }
    }
  ]
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else {
    next()
  }
})

export default router
```

- [ ] **Step 5: 创建api/index.ts**

```typescript
import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
```

- [ ] **Step 6: 创建stores/auth.ts**

```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  const user = ref<{ username: string } | null>(null)

  const isAuthenticated = computed(() => !!token.value)

  async function login(username: string, password: string) {
    const response = await api.post('/auth/login', { username, password })
    token.value = response.data.token
    user.value = { username: response.data.username }
    localStorage.setItem('token', response.data.token)
  }

  async function register(username: string, password: string) {
    await api.post('/auth/register', { username, password })
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
  }

  return {
    token,
    user,
    isAuthenticated,
    login,
    register,
    logout
  }
})
```

- [ ] **Step 7: Commit**

```bash
git add client/
git commit -m "feat: add Vue 3 frontend with auth store and router"
```

---

## Task 12: Vue页面组件

**Covers:** [S3]

**Files:**
- Create: `client/src/views/Home.vue`
- Create: `client/src/views/Login.vue`
- Create: `client/src/views/Register.vue`
- Create: `client/src/views/Dashboard.vue`
- Create: `client/src/views/Subscriptions.vue`

- [ ] **Step 1: 创建Home.vue**

```vue
<template>
  <div class="home">
    <h1>Bilibili Notify</h1>
    <p>哔哩哔哩UP主更新推送服务</p>
    
    <div class="features">
      <div class="feature">
        <h3>订阅管理</h3>
        <p>选择你关注的UP主，接收更新推送</p>
      </div>
      <div class="feature">
        <h3>微信推送</h3>
        <p>新视频发布时通过微信收到通知</p>
      </div>
      <div class="feature">
        <h3>数据统计</h3>
        <p>查看UP主粉丝数和视频数据变化</p>
      </div>
    </div>
    
    <div class="cta">
      <router-link to="/register" class="btn-primary">开始使用</router-link>
    </div>
  </div>
</template>

<style scoped>
.home {
  text-align: center;
  padding: 4rem 2rem;
}

h1 {
  font-size: 3rem;
  color: #00a1d6;
  margin-bottom: 1rem;
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin: 3rem 0;
}

.feature {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.feature h3 {
  color: #00a1d6;
  margin-bottom: 1rem;
}

.btn-primary {
  display: inline-block;
  background: #00a1d6;
  color: white;
  padding: 1rem 2rem;
  border-radius: 4px;
  text-decoration: none;
  font-size: 1.1rem;
}
</style>
```

- [ ] **Step 2: 创建Login.vue**

```vue
<template>
  <div class="login-container">
    <div class="login-card">
      <h2>登录</h2>
      
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="username">用户名</label>
          <input
            id="username"
            v-model="username"
            type="text"
            required
            placeholder="请输入用户名"
          />
        </div>
        
        <div class="form-group">
          <label for="password">密码</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            placeholder="请输入密码"
          />
        </div>
        
        <div v-if="error" class="error">{{ error }}</div>
        
        <button type="submit" class="btn-submit" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>
      
      <p class="register-link">
        还没有账号？<router-link to="/register">立即注册</router-link>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

const handleLogin = async () => {
  loading.value = true
  error.value = ''
  
  try {
    await authStore.login(username.value, password.value)
    router.push('/dashboard')
  } catch (err: any) {
    error.value = err.response?.data?.error || '登录失败'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 200px);
}

.login-card {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

h2 {
  text-align: center;
  color: #333;
  margin-bottom: 2rem;
}

.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  color: #555;
}

input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.btn-submit {
  width: 100%;
  background: #00a1d6;
  color: white;
  border: none;
  padding: 1rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  margin-top: 1rem;
}

.btn-submit:disabled {
  background: #ccc;
}

.error {
  color: #f44336;
  margin-bottom: 1rem;
  text-align: center;
}

.register-link {
  text-align: center;
  margin-top: 1rem;
  color: #666;
}

.register-link a {
  color: #00a1d6;
}
</style>
```

- [ ] **Step 3: 创建Register.vue**

```vue
<template>
  <div class="register-container">
    <div class="register-card">
      <h2>注册</h2>
      
      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <label for="username">用户名</label>
          <input
            id="username"
            v-model="username"
            type="text"
            required
            placeholder="请输入用户名"
          />
        </div>
        
        <div class="form-group">
          <label for="password">密码</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            placeholder="请输入密码"
          />
        </div>
        
        <div class="form-group">
          <label for="confirmPassword">确认密码</label>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            required
            placeholder="请再次输入密码"
          />
        </div>
        
        <div v-if="error" class="error">{{ error }}</div>
        <div v-if="success" class="success">{{ success }}</div>
        
        <button type="submit" class="btn-submit" :disabled="loading">
          {{ loading ? '注册中...' : '注册' }}
        </button>
      </form>
      
      <p class="login-link">
        已有账号？<router-link to="/login">立即登录</router-link>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')
const success = ref('')
const loading = ref(false)

const handleRegister = async () => {
  if (password.value !== confirmPassword.value) {
    error.value = '两次输入的密码不一致'
    return
  }
  
  loading.value = true
  error.value = ''
  success.value = ''
  
  try {
    await authStore.register(username.value, password.value)
    success.value = '注册成功，正在跳转到登录页面...'
    setTimeout(() => router.push('/login'), 1500)
  } catch (err: any) {
    error.value = err.response?.data?.error || '注册失败'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 200px);
}

.register-card {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

h2 {
  text-align: center;
  color: #333;
  margin-bottom: 2rem;
}

.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  color: #555;
}

input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.btn-submit {
  width: 100%;
  background: #00a1d6;
  color: white;
  border: none;
  padding: 1rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  margin-top: 1rem;
}

.btn-submit:disabled {
  background: #ccc;
}

.error {
  color: #f44336;
  margin-bottom: 1rem;
  text-align: center;
}

.success {
  color: #4caf50;
  margin-bottom: 1rem;
  text-align: center;
}

.login-link {
  text-align: center;
  margin-top: 1rem;
  color: #666;
}

.login-link a {
  color: #00a1d6;
}
</style>
```

- [ ] **Step 4: 创建Dashboard.vue**

```vue
<template>
  <div class="dashboard">
    <h1>控制面板</h1>
    
    <div class="stats-grid">
      <div class="stat-card">
        <h3>订阅UP主</h3>
        <p class="stat-value">{{ subscriptions.length }}</p>
      </div>
      
      <div class="stat-card">
        <h3>今日更新</h3>
        <p class="stat-value">{{ todayUpdates }}</p>
      </div>
      
      <div class="stat-card">
        <h3>推送状态</h3>
        <p class="stat-value">{{ pushEnabled ? '已启用' : '未配置' }}</p>
      </div>
    </div>
    
    <div class="quick-actions">
      <h2>快速操作</h2>
      <div class="action-buttons">
        <router-link to="/subscriptions" class="btn-action">
          管理订阅
        </router-link>
        <button @click="checkUpdates" class="btn-action" :disabled="checking">
          {{ checking ? '检查中...' : '立即检查更新' }}
        </button>
      </div>
    </div>
    
    <div class="recent-updates">
      <h2>最近更新</h2>
      <div v-if="recentVideos.length === 0" class="empty-state">
        暂无更新
      </div>
      <div v-else class="video-list">
        <div v-for="video in recentVideos" :key="video.bvid" class="video-item">
          <img :src="video.pic" :alt="video.title" class="video-thumb" />
          <div class="video-info">
            <h4>{{ video.title }}</h4>
            <p>{{ video.up_name }} · {{ formatDate(video.pubdate) }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '../api'

const subscriptions = ref<any[]>([])
const recentVideos = ref<any[]>([])
const todayUpdates = ref(0)
const pushEnabled = ref(false)
const checking = ref(false)

const formatDate = (date: string) => {
  return new Date(date).toLocaleString('zh-CN')
}

const checkUpdates = async () => {
  checking.value = true
  try {
    await api.post('/scheduler/run')
    alert('检查完成')
  } catch (error) {
    alert('检查失败')
  } finally {
    checking.value = false
  }
}

onMounted(async () => {
  try {
    const [subsRes, videosRes, pushRes] = await Promise.all([
      api.get('/subscribe/list'),
      api.get('/videos/updates?limit=5'),
      api.get('/push/status')
    ])
    
    subscriptions.value = subsRes.data
    recentVideos.value = videosRes.data
    pushEnabled.value = pushRes.data.enabled
  } catch (error) {
    console.error('Failed to load dashboard data:', error)
  }
})
</script>

<style scoped>
.dashboard h1 {
  color: #333;
  margin-bottom: 2rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.stat-card h3 {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: #00a1d6;
}

.quick-actions {
  margin-bottom: 2rem;
}

.quick-actions h2 {
  color: #333;
  margin-bottom: 1rem;
}

.action-buttons {
  display: flex;
  gap: 1rem;
}

.btn-action {
  background: #00a1d6;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  text-decoration: none;
}

.btn-action:disabled {
  background: #ccc;
}

.recent-updates h2 {
  color: #333;
  margin-bottom: 1rem;
}

.empty-state {
  background: white;
  padding: 2rem;
  text-align: center;
  color: #999;
  border-radius: 8px;
}

.video-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.video-item {
  display: flex;
  background: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.video-thumb {
  width: 160px;
  height: 90px;
  object-fit: cover;
  border-radius: 4px;
  margin-right: 1rem;
}

.video-info h4 {
  color: #333;
  margin-bottom: 0.5rem;
}

.video-info p {
  color: #666;
  font-size: 0.9rem;
}
</style>
```

- [ ] **Step 5: 创建Subscriptions.vue**

```vue
<template>
  <div class="subscriptions">
    <h1>订阅管理</h1>
    
    <div class="bilibili-section">
      <h2>Bilibili绑定</h2>
      <div v-if="!bilibiliUid" class="bind-form">
        <input
          v-model="inputUid"
          type="text"
          placeholder="输入Bilibili UID"
        />
        <button @click="bindBilibili" :disabled="binding">
          {{ binding ? '绑定中...' : '绑定' }}
        </button>
      </div>
      <div v-else class="bound-info">
        <span>已绑定 UID: {{ bilibiliUid }}</span>
        <button @click="fetchFollows" :disabled="loading">
          {{ loading ? '加载中...' : '刷新关注列表' }}
        </button>
      </div>
    </div>
    
    <div class="follows-section" v-if="follows.length > 0">
      <h2>关注列表 ({{ follows.length }})</h2>
      <div class="follows-grid">
        <div
          v-for="follow in follows"
          :key="follow.mid"
          class="follow-card"
          :class="{ subscribed: isSubscribed(follow.mid) }"
        >
          <img :src="follow.face" :alt="follow.name" class="avatar" />
          <div class="follow-info">
            <h4>{{ follow.name }}</h4>
            <button
              @click="toggleSubscription(follow)"
              :class="isSubscribed(follow.mid) ? 'btn-unsub' : 'btn-sub'"
            >
              {{ isSubscribed(follow.mid) ? '取消订阅' : '订阅' }}
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <div class="subscriptions-section">
      <h2>已订阅 ({{ subscriptions.length }})</h2>
      <div v-if="subscriptions.length === 0" class="empty-state">
        暂无订阅
      </div>
      <div v-else class="sub-list">
        <div v-for="sub in subscriptions" :key="sub.up_mid" class="sub-item">
          <img :src="sub.up_face" :alt="sub.up_name" class="avatar-small" />
          <span class="name">{{ sub.up_name }}</span>
          <span class="status" :class="{ active: sub.is_active }">
            {{ sub.is_active ? '推送中' : '已暂停' }}
          </span>
          <button @click="toggleSubStatus(sub)" class="btn-toggle">
            {{ sub.is_active ? '暂停' : '启用' }}
          </button>
          <button @click="removeSubscription(sub.up_mid)" class="btn-remove">
            删除
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '../api'

const bilibiliUid = ref<string | null>(null)
const inputUid = ref('')
const follows = ref<any[]>([])
const subscriptions = ref<any[]>([])
const binding = ref(false)
const loading = ref(false)

const isSubscribed = (mid: string) => {
  return subscriptions.value.some(s => s.up_mid === mid)
}

const bindBilibili = async () => {
  if (!inputUid.value) return
  
  binding.value = true
  try {
    await api.post('/bilibili/bind', { uid: inputUid.value })
    bilibiliUid.value = inputUid.value
    await fetchFollows()
  } catch (error) {
    alert('绑定失败')
  } finally {
    binding.value = false
  }
}

const fetchFollows = async () => {
  loading.value = true
  try {
    const response = await api.get('/bilibili/follows')
    follows.value = response.data
  } catch (error) {
    alert('获取关注列表失败')
  } finally {
    loading.value = false
  }
}

const toggleSubscription = async (follow: any) => {
  try {
    if (isSubscribed(follow.mid)) {
      await api.delete(`/subscribe/${follow.mid}`)
      subscriptions.value = subscriptions.value.filter(s => s.up_mid !== follow.mid)
    } else {
      const response = await api.post('/subscribe', {
        up_mid: follow.mid,
        up_name: follow.name,
        up_face: follow.face
      })
      subscriptions.value.unshift(response.data)
    }
  } catch (error) {
    alert('操作失败')
  }
}

const toggleSubStatus = async (sub: any) => {
  try {
    const response = await api.patch(`/subscribe/${sub.up_mid}/toggle`)
    const index = subscriptions.value.findIndex(s => s.up_mid === sub.up_mid)
    if (index !== -1) {
      subscriptions.value[index] = response.data
    }
  } catch (error) {
    alert('操作失败')
  }
}

const removeSubscription = async (upMid: string) => {
  if (!confirm('确定取消订阅？')) return
  
  try {
    await api.delete(`/subscribe/${upMid}`)
    subscriptions.value = subscriptions.value.filter(s => s.up_mid !== upMid)
  } catch (error) {
    alert('操作失败')
  }
}

onMounted(async () => {
  try {
    const response = await api.get('/subscribe/list')
    subscriptions.value = response.data
  } catch (error) {
    console.error('Failed to load subscriptions:', error)
  }
})
</script>

<style scoped>
.subscriptions h1 {
  color: #333;
  margin-bottom: 2rem;
}

.bilibili-section {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.bilibili-section h2 {
  color: #333;
  margin-bottom: 1rem;
}

.bind-form {
  display: flex;
  gap: 1rem;
}

.bind-form input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.bind-form button,
.bound-info button {
  background: #00a1d6;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
}

.bound-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.follows-section,
.subscriptions-section {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.follows-section h2,
.subscriptions-section h2 {
  color: #333;
  margin-bottom: 1rem;
}

.follows-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.follow-card {
  display: flex;
  align-items: center;
  padding: 1rem;
  border: 1px solid #eee;
  border-radius: 8px;
  transition: all 0.2s;
}

.follow-card.subscribed {
  border-color: #00a1d6;
  background: #f0f9ff;
}

.avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  margin-right: 1rem;
}

.follow-info {
  flex: 1;
}

.follow-info h4 {
  margin-bottom: 0.5rem;
  color: #333;
}

.btn-sub {
  background: #00a1d6;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.btn-unsub {
  background: #f44336;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.empty-state {
  text-align: center;
  color: #999;
  padding: 2rem;
}

.sub-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.sub-item {
  display: flex;
  align-items: center;
  padding: 1rem;
  background: #f9f9f9;
  border-radius: 4px;
}

.avatar-small {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 1rem;
}

.name {
  flex: 1;
  font-weight: 500;
}

.status {
  color: #999;
  margin-right: 1rem;
}

.status.active {
  color: #4caf50;
}

.btn-toggle {
  background: #ff9800;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 0.5rem;
}

.btn-remove {
  background: #f44336;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}
</style>
```

- [ ] **Step 6: Commit**

```bash
git add client/src/views/
git commit -m "feat: add Vue page components for all views"
```

---

## Task 13: 集成测试与运行验证

**Covers:** [S1-S7]

- [ ] **Step 1: 运行所有后端测试**

Run: `cd server && npm test`
Expected: 所有测试通过

- [ ] **Step 2: 启动后端服务**

Run: `cd server && npm run dev`
Expected: 服务器在3001端口启动

- [ ] **Step 3: 启动前端服务**

Run: `cd client && npm run dev`
Expected: Vite开发服务器在3000端口启动

- [ ] **Step 4: 验证API连通性**

Run: `curl http://localhost:3001/api/health`
Expected: `{"status":"ok","timestamp":"..."}`

- [ ] **Step 5: 创建.gitignore**

```gitignore
node_modules/
dist/
.env
*.db
```

- [ ] **Step 6: 最终提交**

```bash
git add .
git commit -m "chore: add gitignore and verify project runs correctly"
```
