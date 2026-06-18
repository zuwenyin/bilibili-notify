# 最近更新分页功能实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在Dashboard的"最近更新"部分添加分页功能，显示总条数并支持分页浏览。

**Architecture:** 修改后端API支持分页参数，前端使用Element Plus分页组件，保持向后兼容。

**Tech Stack:** TypeScript, Express, better-sqlite3, Vue 3, Element Plus

---

## 文件结构

- `server/src/routes/videos.ts` - 修改API支持分页
- `server/src/routes/videos.test.ts` - 新增API测试
- `client/src/views/Dashboard.vue` - 添加分页组件和状态

### Task 1: 后端API分页支持

**Files:**
- Modify: `server/src/routes/videos.ts:9-45`
- Test: `server/src/routes/videos.test.ts`

- [ ] **Step 1: 修改videos.ts实现分页**

修改`server/src/routes/videos.ts`文件，添加分页支持：

```typescript
import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { getDatabase } from '../db/database';

const router = Router();

router.use(authMiddleware);

router.get('/updates', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const limit = parseInt(req.query.limit as string); // 向后兼容
    const db = getDatabase();

    if (!db) {
      res.status(500).json({ error: 'Database not initialized' });
      return;
    }

    // 如果是旧请求（有limit参数，没有page参数），返回旧格式
    if (limit && !req.query.page) {
      const stmt = db.prepare(`
        SELECT v.*, s.up_name
        FROM videos v
        INNER JOIN subscriptions s ON v.up_mid = s.up_mid
        WHERE s.user_id = ?
        ORDER BY v.pubdate DESC
        LIMIT ?
      `);
      stmt.bind([userId, limit]);
      const videos: any[] = [];
      while (stmt.step()) {
        videos.push(stmt.getAsObject());
      }
      stmt.free();
      res.json(videos);
      return;
    }

    // 分页查询
    const offset = (page - 1) * pageSize;

    // 获取总条数
    const countStmt = db.prepare(`
      SELECT COUNT(*) as total
      FROM videos v
      INNER JOIN subscriptions s ON v.up_mid = s.up_mid
      WHERE s.user_id = ?
    `);
    countStmt.bind([userId]);
    let total = 0;
    if (countStmt.step()) {
      total = countStmt.getAsObject().total as number;
    }
    countStmt.free();

    // 获取分页数据
    const stmt = db.prepare(`
      SELECT v.*, s.up_name
      FROM videos v
      INNER JOIN subscriptions s ON v.up_mid = s.up_mid
      WHERE s.user_id = ?
      ORDER BY v.pubdate DESC
      LIMIT ? OFFSET ?
    `);
    stmt.bind([userId, pageSize, offset]);
    const videos: any[] = [];
    while (stmt.step()) {
      videos.push(stmt.getAsObject());
    }
    stmt.free();

    res.json({ videos, total });
  } catch (error: any) {
    console.error('[Videos] Error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
```

- [ ] **Step 2: 运行测试验证现有测试通过**

Run: `cd server && npm test`
Expected: PASS (现有测试应该继续通过)

- [ ] **Step 3: 创建videos.test.ts测试文件**

```typescript
import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { getDatabase } from '../db/database';

// Mock dependencies
jest.mock('../middleware/auth', () => ({
  authMiddleware: jest.fn((req: any, res: any, next: any) => {
    req.user = { userId: 1 };
    next();
  }),
}));

jest.mock('../db/database', () => ({
  getDatabase: jest.fn(),
}));

describe('Videos Router', () => {
  let router: Router;
  let mockDb: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockDb = {
      prepare: jest.fn(),
      exec: jest.fn(),
    };
    
    (getDatabase as jest.Mock).mockReturnValue(mockDb);
    
    // Re-import to get fresh router
    jest.resetModules();
    router = require('./videos').default;
  });

  test('GET /updates 应该返回分页数据', async () => {
    const mockStmt = {
      bind: jest.fn(),
      step: jest.fn(),
      getAsObject: jest.fn(),
      free: jest.fn(),
    };

    // Mock count query
    mockDb.prepare
      .mockReturnValueOnce({
        ...mockStmt,
        step: jest.fn().mockReturnValueOnce(true),
        getAsObject: jest.fn().mockReturnValueOnce({ total: 100 }),
      })
      // Mock data query
      .mockReturnValueOnce({
        ...mockStmt,
        step: jest.fn()
          .mockReturnValueOnce(true)
          .mockReturnValueOnce(false),
        getAsObject: jest.fn()
          .mockReturnValueOnce({ bvid: '1', title: 'Test Video' }),
      });

    const req = {
      user: { userId: 1 },
      query: { page: '1', pageSize: '10' },
    } as any;

    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    } as any;

    await router.handle(req, res);

    expect(res.json).toHaveBeenCalledWith({
      videos: [{ bvid: '1', title: 'Test Video' }],
      total: 100,
    });
  });

  test('GET /updates 应该支持向后兼容limit参数', async () => {
    const mockStmt = {
      bind: jest.fn(),
      step: jest.fn(),
      getAsObject: jest.fn(),
      free: jest.fn(),
    };

    mockDb.prepare.mockReturnValue({
      ...mockStmt,
      step: jest.fn()
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false),
      getAsObject: jest.fn()
        .mockReturnValueOnce({ bvid: '1', title: 'Test Video' }),
    });

    const req = {
      user: { userId: 1 },
      query: { limit: '5' },
    } as any;

    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    } as any;

    await router.handle(req, res);

    expect(res.json).toHaveBeenCalledWith([
      { bvid: '1', title: 'Test Video' },
    ]);
  });
});
```

- [ ] **Step 4: 运行测试验证通过**

Run: `cd server && npm test`
Expected: PASS

- [ ] **Step 5: 提交代码**

```bash
git add server/src/routes/videos.ts server/src/routes/videos.test.ts
git commit -m "feat: add pagination support to videos API"
```

### Task 2: 前端分页组件实现

**Files:**
- Modify: `client/src/views/Dashboard.vue:90-106, 160-174, 270-300`

- [ ] **Step 1: 修改Dashboard.vue添加分页状态**

在`<script setup>`部分添加分页状态：

```typescript
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
```

- [ ] **Step 2: 修改数据获取逻辑**

修改`onMounted`中的API调用：

```typescript
onMounted(async () => {
  try {
    const [subsRes, videosRes, pushRes] = await Promise.all([
      api.get('/subscribe/list'),
      api.get('/videos/updates', { params: { page: currentPage.value, pageSize: pageSize.value } }),
      api.get('/push/status')
    ])

    subscriptions.value = subsRes.data
    recentVideos.value = videosRes.data.videos
    total.value = videosRes.data.total
    pushEnabled.value = pushRes.data.enabled
  } catch (error) {
    console.error('Failed to load dashboard data:', error)
  }
})
```

- [ ] **Step 3: 添加分页处理函数**

```typescript
const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchRecentVideos()
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  fetchRecentVideos()
}

const fetchRecentVideos = async () => {
  try {
    const videosRes = await api.get('/videos/updates', { 
      params: { page: currentPage.value, pageSize: pageSize.value } 
    })
    recentVideos.value = videosRes.data.videos
    total.value = videosRes.data.total
  } catch (error) {
    console.error('Failed to fetch videos:', error)
  }
}
```

- [ ] **Step 4: 修改模板添加分页组件**

修改`recent-updates`部分的模板：

```vue
<el-card class="recent-updates">
  <template #header>
    <h2>最近更新 <span class="total-count">共 {{ total }} 条</span></h2>
  </template>
  <div v-if="recentVideos.length === 0" class="empty-state">
    <el-empty description="暂无更新" />
  </div>
  <div v-else class="video-list">
    <div v-for="video in recentVideos" :key="video.bvid" class="video-item">
      <img :src="`/api/bilibili/proxy?url=${encodeURIComponent(video.pic)}`" :alt="video.title" class="video-thumb" />
      <div class="video-info">
        <h4>{{ video.title }}</h4>
        <p>{{ video.up_name }} · {{ formatDate(video.pubdate) }}</p>
      </div>
    </div>
  </div>
  <div class="pagination-container">
    <el-pagination
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :page-sizes="[5, 10, 20, 50]"
      :total="total"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="handleSizeChange"
      @current-change="handlePageChange"
    />
  </div>
</el-card>
```

- [ ] **Step 5: 添加分页样式**

在`<style scoped>`部分添加：

```css
.recent-updates h2 {
  color: #333;
  margin: 0;
  font-size: 1.2rem;
}

.total-count {
  font-size: 0.9rem;
  color: #666;
  font-weight: normal;
  margin-left: 0.5rem;
}

.pagination-container {
  margin-top: 1.5rem;
  display: flex;
  justify-content: center;
}
```

- [ ] **Step 6: 运行前端测试**

Run: `cd client && npm run dev`
Expected: 启动成功，分页组件正常显示

- [ ] **Step 7: 提交代码**

```bash
git add client/src/views/Dashboard.vue
git commit -m "feat: add pagination component to dashboard"
```

### Task 3: 集成测试

**Files:**
- Test: Manual testing

- [ ] **Step 1: 启动完整应用**

Run: `pnpm dev`

- [ ] **Step 2: 测试分页功能**

1. 登录系统
2. 进入Dashboard页面
3. 查看"最近更新"部分
4. 验证总条数显示正确
5. 测试分页组件：
   - 点击页码切换
   - 修改每页条数
   - 验证数据正确加载

- [ ] **Step 3: 测试向后兼容性**

1. 使用旧API格式测试：`/videos/updates?limit=5`
2. 验证返回格式为数组
3. 验证分页API格式：`/videos/updates?page=1&pageSize=10`
4. 验证返回格式为`{ videos: [], total: number }`

- [ ] **Step 4: 测试边界条件**

1. 测试page=0（应使用默认值1）
2. 测试pageSize=0（应使用默认值10）
3. 测试pageSize=101（应限制在100以内）
4. 测试空数据情况

- [ ] **Step 5: 提交最终代码**

```bash
git add .
git commit -m "feat: complete pagination feature with tests"
```

## 完成标准

1. ✅ 后端API支持分页参数
2. ✅ 返回总条数和分页数据
3. ✅ 前端显示总条数
4. ✅ 分页组件正常工作
5. ✅ 向后兼容旧API
6. ✅ 所有测试通过
7. ✅ 代码已提交