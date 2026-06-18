# Bilibili Notify — 最终开发计划

> **TDD驱动开发** — 每个功能模块先写测试，测试通过后再进行下一步

**目标：** 构建Bilibili关注UP主更新推送网站，支持微信通知和UP主数据统计

**架构：** Express.js + Vue 3 monorepo，SQLite数据库，node-cron定时任务，PushPlus/Server酱推送

**包管理器：** pnpm（推荐，速度快，磁盘占用小）

---

## 技术栈与成熟库选型

### 后端依赖

| 用途 | 库 | 说明 |
|------|-----|------|
| Web框架 | `express` ^4.18.2 | 成熟稳定的Node.js框架 |
| TypeScript | `typescript` ^5.3.3 | 类型安全 |
| 开发热更新 | `tsx` ^4.7.0 | 轻量级TypeScript执行器 |
| 数据库 | `better-sqlite3` ^9.4.3 | SQLite同步API，性能优秀 |
| 密码哈希 | `bcryptjs` ^2.4.3 | 纯JS实现，无需原生编译 |
| JWT认证 | `jsonwebtoken` ^9.0.2 | 标准JWT库 |
| HTTP客户端 | `axios` ^1.6.0 | 成熟的HTTP库 |
| 定时任务 | `node-cron` ^3.0.3 | Cron表达式调度 |
| CORS | `cors` ^2.8.5 | 跨域中间件 |
| 环境变量 | `dotenv` ^16.3.1 | .env文件加载 |

### 前端依赖

| 用途 | 库 | 说明 |
|------|-----|------|
| 框架 | `vue` ^3.4.0 | Vue 3 Composition API |
| 构建工具 | `vite` ^5.0.10 | 快速构建 |
| TypeScript | `vue-tsc` ^1.8.25 | Vue TS支持 |
| 路由 | `vue-router` ^4.2.5 | 官方路由 |
| 状态管理 | `pinia` ^2.1.7 | 官方状态管理 |
| **UI组件库** | **`element-plus`** ^2.5.0 | **饿了么出品，成熟稳定** |
| 图标 | `@element-plus/icons-vue` ^2.3.1 | Element Plus图标库 |
| HTTP客户端 | `axios` ^1.6.0 | 与后端统一 |
| 图表 | `echarts` ^5.4.3 | 成熟的图表库 |
| Vue ECharts | `vue-echarts` ^6.6.8 | ECharts Vue封装 |

### 开发依赖

| 用途 | 后端 | 前端 |
|------|------|------|
| 测试框架 | `jest` ^29.7.0 + `ts-jest` | `vitest` ^1.1.0 |
| 测试工具 | - | `@vue/test-utils` ^2.4.3 |
| 测试环境 | - | `jsdom` ^23.0.1 |
| 并发运行 | `concurrently` ^8.2.0 | - |

---

## 开发阶段概览

| 阶段 | 内容 | 测试要求 |
|------|------|----------|
| Phase 1 | 项目初始化与数据库 | 数据库表结构测试 |
| Phase 2 | 用户认证模块 | 注册/登录/JWT测试 |
| Phase 3 | Bilibili API服务 | API调用Mock测试 |
| Phase 4 | 订阅管理模块 | CRUD操作测试 |
| Phase 5 | 推送服务模块 | PushPlus/Server酱测试 |
| Phase 6 | 视频更新检测 | 新视频检测测试 |
| Phase 7 | 定时任务调度 | 调度器功能测试 |
| Phase 8 | 统计服务模块 | 数据统计测试 |
| Phase 9 | Express路由层 | API端点测试 |
| Phase 10 | Vue前端基础 | 组件渲染测试 |
| Phase 11 | Vue页面组件 | 页面功能测试 |
| Phase 12 | 集成测试与验证 | 全流程测试 |

---

## Phase 1: 项目初始化与数据库

### Task 1.1: 项目结构搭建

**根 package.json：**
```json
{
  "name": "bilibili-notify",
  "private": true,
  "scripts": {
    "dev": "pnpm run dev:server & pnpm run dev:client",
    "dev:server": "cd server && pnpm dev",
    "dev:client": "cd client && pnpm dev",
    "test": "cd server && pnpm test",
    "build": "cd client && pnpm build"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

**pnpm-workspace.yaml：**
```yaml
packages:
  - 'server'
  - 'client'
```

**server/package.json：**
```json
{
  "name": "bilibili-notify-server",
  "version": "1.0.0",
  "type": "module",
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

**client/package.json：**
```json
{
  "name": "bilibili-notify-client",
  "version": "1.0.0",
  "type": "module",
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
    "element-plus": "^2.5.0",
    "@element-plus/icons-vue": "^2.3.1",
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
    "jsdom": "^23.0.1",
    "unplugin-auto-import": "^0.17.3",
    "unplugin-vue-components": "^0.26.0"
  }
}
```

### Task 1.2: 数据库层 (TDD)

**测试文件：** `server/src/db/database.test.ts`

**测试用例：**
- [ ] 初始化数据库并创建所有表
- [ ] users表结构正确（含bilibili_cookie字段）
- [ ] subscriptions表结构正确
- [ ] videos表结构正确
- [ ] push_history表结构正确
- [ ] up_stats表结构正确

**实现文件：** `server/src/db/database.ts`

**表结构：**

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  bilibili_uid TEXT,
  bilibili_cookie TEXT,
  pushplus_token TEXT,
  serverchan_key TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE subscriptions (
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

CREATE TABLE videos (
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

CREATE TABLE push_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  bvid TEXT NOT NULL,
  pushed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, bvid)
);

CREATE TABLE up_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  up_mid TEXT NOT NULL,
  followers INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  video_count INTEGER DEFAULT 0,
  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## Phase 2: 用户认证模块

### Task 2.1: 认证服务 (TDD)

**测试文件：** `server/src/services/auth.test.ts`

**测试用例：**
- [ ] 注册新用户成功
- [ ] 注册重复用户名失败
- [ ] 登录成功返回token
- [ ] 登录失败密码错误
- [ ] 登录失败用户不存在
- [ ] 生成和验证JWT token

**实现文件：** `server/src/services/auth.ts`

### Task 2.2: JWT中间件 (TDD)

**测试文件：** `server/src/middleware/auth.test.ts`

**测试用例：**
- [ ] 有效token通过认证
- [ ] 无token拒绝请求(401)
- [ ] 无效token拒绝请求(401)

**实现文件：** `server/src/middleware/auth.ts`

---

## Phase 3: Bilibili API服务

> **重要：** Bilibili关注列表API需要Cookie认证，纯UID无法获取

### Task 3.1: Bilibili API服务 (TDD)

**测试文件：** `server/src/services/bilibili.test.ts`

**测试用例：**
- [ ] 获取用户信息成功（公开API）
- [ ] 获取关注列表需要Cookie
- [ ] 无Cookie获取关注列表失败
- [ ] 手动添加UP主成功
- [ ] 获取最新视频成功
- [ ] API错误时抛出异常

**实现文件：** `server/src/services/bilibili.ts`

**API端点：**
- `getUserInfo(mid)` — 公开API，获取UP主信息
- `getFollows(mid, cookie)` — 需要Cookie，获取关注列表
- `addUpManually(mid)` — 手动添加UP主
- `getLatestVideos(mid)` — 获取最新视频

---

## Phase 4: 订阅管理模块

### Task 4.1: 订阅服务 (TDD)

**测试文件：** `server/src/services/subscription.test.ts`

**测试用例：**
- [ ] 添加订阅成功
- [ ] 重复订阅返回已有订阅
- [ ] 删除订阅成功
- [ ] 获取订阅列表
- [ ] 切换订阅状态（启用/暂停）
- [ ] 获取活跃订阅列表

**实现文件：** `server/src/services/subscription.ts`

---

## Phase 5: 推送服务模块

### Task 5.1: 推送服务 (TDD)

**测试文件：** `server/src/services/push.test.ts`

**测试用例：**
- [ ] 绑定PushPlus Token成功
- [ ] 绑定Server酱Key成功
- [ ] 发送PushPlus推送成功
- [ ] PushPlus推送失败返回false
- [ ] 发送Server酱推送成功
- [ ] 获取推送配置

**实现文件：** `server/src/services/push.ts`

**推送API：**
- PushPlus: `POST https://www.pushplus.plus/send`
- Server酱: `GET https://sctapi.ftqq.com/{key}.send`

---

## Phase 6: 视频更新检测

### Task 6.1: 更新检测服务 (TDD)

**测试文件：** `server/src/services/update-checker.test.ts`

**测试用例：**
- [ ] 记录视频成功
- [ ] 重复视频返回已有记录
- [ ] 获取UP主最新视频
- [ ] 检查更新发现新视频
- [ ] 检查更新无新视频返回空

**实现文件：** `server/src/services/update-checker.ts`

---

## Phase 7: 定时任务调度

### Task 7.1: 调度器服务 (TDD)

**测试文件：** `server/src/services/scheduler.test.ts`

**测试用例：**
- [ ] 启动调度器
- [ ] 停止调度器
- [ ] 执行一次检查
- [ ] 无新视频时不发送通知
- [ ] 有新视频时发送通知

**实现文件：** `server/src/services/scheduler.ts`

**调度配置：**
- 默认频率：每5分钟 `*/5 * * * *`
- 检查逻辑：遍历所有活跃订阅 → 获取最新视频 → 对比已记录 → 触发推送

---

## Phase 8: 统计服务模块

### Task 8.1: 统计服务 (TDD)

**测试文件：** `server/src/services/stats.test.ts`

**测试用例：**
- [ ] 记录粉丝数
- [ ] 获取粉丝数趋势
- [ ] 记录UP主综合统计
- [ ] 获取UP主统计数据（含增长计算）

**实现文件：** `server/src/services/stats.ts`

---

## Phase 9: Express路由层

### Task 9.1: 认证路由 (TDD)

**测试文件：** `server/src/routes/auth.test.ts`

**测试用例：**
- [ ] POST /api/auth/register 成功
- [ ] POST /api/auth/register 重复用户名
- [ ] POST /api/auth/login 成功
- [ ] POST /api/auth/login 密码错误

**实现文件：** `server/src/routes/auth.ts`

### Task 9.2: Bilibili路由 (TDD)

**测试文件：** `server/src/routes/bilibili.test.ts`

**测试用例：**
- [ ] POST /api/bilibili/bind 绑定UID+Cookie
- [ ] POST /api/bilibili/add-up 手动添加UP主
- [ ] GET /api/bilibili/follows 获取关注列表
- [ ] GET /api/bilibili/up/:mid 获取UP主信息

**实现文件：** `server/src/routes/bilibili.ts`

### Task 9.3: 订阅路由 (TDD)

**测试文件：** `server/src/routes/subscribe.test.ts`

**测试用例：**
- [ ] POST /api/subscribe 订阅UP主
- [ ] GET /api/subscribe/list 获取订阅列表
- [ ] DELETE /api/subscribe/:upMid 取消订阅
- [ ] PATCH /api/subscribe/:upMid/toggle 切换状态

**实现文件：** `server/src/routes/subscribe.ts`

### Task 9.4: 推送路由 (TDD)

**测试文件：** `server/src/routes/push.test.ts`

**测试用例：**
- [ ] POST /api/push/bind 绑定推送Token
- [ ] GET /api/push/status 获取推送状态

**实现文件：** `server/src/routes/push.ts`

### Task 9.5: 统计路由 (TDD)

**测试文件：** `server/src/routes/stats.test.ts`

**测试用例：**
- [ ] GET /api/stats/up/:mid 获取UP主统计
- [ ] GET /api/stats/up/:mid/followers 粉丝趋势
- [ ] GET /api/stats/up/:mid/videos 视频数据

**实现文件：** `server/src/routes/stats.ts`

### Task 9.6: Express入口与服务器启动

**实现文件：** `server/src/index.ts`

**配置：**
- CORS中间件
- JSON解析
- 路由注册
- 定时任务启动
- 健康检查端点

---

## Phase 10: Vue前端基础

### Task 10.1: 项目基础结构

**创建文件：**
- `client/index.html` — HTML入口
- `client/src/main.ts` — Vue入口
- `client/src/App.vue` — 根组件
- `client/src/router/index.ts` — 路由配置
- `client/src/api/index.ts` — Axios封装
- `client/src/stores/auth.ts` — 认证状态管理

### Task 10.2: Element Plus配置

**main.ts配置：**
```typescript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import router from './router'

const app = createApp(App)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(createPinia())
app.use(router)
app.use(ElementPlus)

app.mount('#app')
```

**自动导入配置（vite.config.ts）：**
```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
  ],
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

### Task 10.3: Bilibili风格主题

**Element Plus主题覆盖：**
```css
/* src/styles/variables.scss */
:root {
  --el-color-primary: #00a1d6;
  --el-color-primary-light-3: #33b5e0;
  --el-color-primary-light-5: #66c9ea;
  --el-color-primary-light-7: #99ddf3;
  --el-color-primary-light-9: #ccf0f9;
  --el-color-primary-dark-2: #0081ab;
  
  --el-color-success: #4caf50;
  --el-color-warning: #ff9800;
  --el-color-danger: #f44336;
  
  --el-border-radius-base: 4px;
  --el-border-radius-round: 8px;
}
```

---

## Phase 11: Vue页面组件

### Task 11.1: 页面组件

**创建文件：**
- `client/src/views/Home.vue` — 首页
- `client/src/views/Login.vue` — 登录页
- `client/src/views/Register.vue` — 注册页
- `client/src/views/Dashboard.vue` — 控制面板
- `client/src/views/Subscriptions.vue` — 订阅管理

### Task 11.2: Element Plus组件使用规范

**常用组件映射：**

| 功能 | Element Plus组件 | 说明 |
|------|------------------|------|
| 表单 | `el-form`, `el-input`, `el-button` | 表单验证内置 |
| 表格 | `el-table`, `el-table-column` | 支持排序、筛选 |
| 卡片 | `el-card` | 包容性内容容器 |
| 弹窗 | `el-dialog`, `el-message-box` | 确认操作 |
| 消息提示 | `el-message`, `el-notification` | 操作反馈 |
| 加载 | `el-loading`, `el-skeleton` | 加载状态 |
| 标签页 | `el-tabs`, `el-tab-pane` | 内容切换 |
| 下拉选择 | `el-select`, `el-option` | 选项选择 |
| 开关 | `el-switch` | 启用/禁用切换 |
| 头像 | `el-avatar` | UP主头像显示 |
| 进度条 | `el-progress` | 数据展示 |
| 分页 | `el-pagination` | 列表分页 |

### Task 11.3: 通用组件

**创建文件：**
- `client/src/components/NavBar.vue` — 导航栏
- `client/src/components/UpCard.vue` — UP主卡片
- `client/src/components/VideoCard.vue` — 视频卡片
- `client/src/components/StatsChart.vue` — 统计图表

---

## Phase 12: 集成测试与验证

### Task 12.1: 后端集成测试

- [ ] 运行所有后端测试 `cd server && pnpm test`
- [ ] 验证所有测试通过
- [ ] 启动后端服务验证

### Task 12.2: 前端集成测试

- [ ] 运行前端构建 `cd client && pnpm build`
- [ ] 验证构建成功

### Task 12.3: 端到端验证

- [ ] 启动完整服务
- [ ] 验证注册/登录流程
- [ ] 验证Bilibili绑定流程
- [ ] 验证订阅管理流程
- [ ] 验证推送配置流程

---

## 测试执行规范

### TDD流程（每个Task必须遵循）

```
1. 写失败测试 → 验证测试失败
2. 写最小实现 → 验证测试通过
3. 重构优化 → 验证测试仍通过
4. 提交代码
```

### 测试命令

```bash
# 后端测试
cd server && pnpm test

# 单个测试文件
cd server && pnpm test -- auth.test.ts

# 测试监听模式
cd server && pnpm run test:watch

# 前端测试
cd client && pnpm test
```

### 测试覆盖率要求

- 核心业务逻辑：100%
- API路由：90%+
- 工具函数：95%+

---

## API端点汇总

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | /api/auth/register | 注册 | 否 |
| POST | /api/auth/login | 登录 | 否 |
| POST | /api/bilibili/bind | 绑定UID+Cookie | 是 |
| POST | /api/bilibili/add-up | 手动添加UP主 | 是 |
| GET | /api/bilibili/follows | 获取关注列表 | 是 |
| GET | /api/bilibili/up/:mid | 获取UP主信息 | 是 |
| POST | /api/subscribe | 订阅UP主 | 是 |
| GET | /api/subscribe/list | 获取订阅列表 | 是 |
| DELETE | /api/subscribe/:upMid | 取消订阅 | 是 |
| PATCH | /api/subscribe/:upMid/toggle | 切换订阅状态 | 是 |
| POST | /api/push/bind | 绑定推送Token | 是 |
| GET | /api/push/status | 获取推送状态 | 是 |
| GET | /api/stats/up/:mid | 获取UP主统计 | 是 |
| GET | /api/stats/up/:mid/followers | 粉丝趋势 | 是 |
| GET | /api/stats/up/:mid/videos | 视频数据 | 是 |
| GET | /api/videos/updates | 获取更新记录 | 是 |
| GET | /api/health | 健康检查 | 否 |

---

## 项目结构

```
bilibili-notify/
├── client/                          # Vue 3 前端
│   ├── src/
│   │   ├── components/              # 通用组件
│   │   │   ├── NavBar.vue
│   │   │   ├── UpCard.vue
│   │   │   ├── VideoCard.vue
│   │   │   └── StatsChart.vue
│   │   ├── views/                   # 页面组件
│   │   │   ├── Home.vue
│   │   │   ├── Login.vue
│   │   │   ├── Register.vue
│   │   │   ├── Dashboard.vue
│   │   │   └── Subscriptions.vue
│   │   ├── api/                     # API调用
│   │   │   └── index.ts
│   │   ├── stores/                  # Pinia状态
│   │   │   └── auth.ts
│   │   ├── router/                  # 路由
│   │   │   └── index.ts
│   │   ├── styles/                  # 样式
│   │   │   └── variables.scss
│   │   ├── App.vue
│   │   └── main.ts
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
├── server/                          # Express 后端
│   ├── src/
│   │   ├── routes/                  # 路由层
│   │   │   ├── auth.ts
│   │   │   ├── bilibili.ts
│   │   │   ├── subscribe.ts
│   │   │   ├── push.ts
│   │   │   └── stats.ts
│   │   ├── services/                # 业务逻辑
│   │   │   ├── auth.ts
│   │   │   ├── bilibili.ts
│   │   │   ├── subscription.ts
│   │   │   ├── push.ts
│   │   │   ├── update-checker.ts
│   │   │   ├── scheduler.ts
│   │   │   └── stats.ts
│   │   ├── db/                      # 数据库
│   │   │   └── database.ts
│   │   ├── middleware/              # 中间件
│   │   │   └── auth.ts
│   │   └── index.ts                 # 入口
│   ├── tsconfig.json
│   ├── jest.config.js
│   └── package.json
├── data/                            # SQLite数据库文件
├── docs/                            # 文档
│   └── compose/
│       ├── specs/                   # 设计文档
│       └── plans/                   # 开发计划
├── .gitignore
├── pnpm-workspace.yaml              # pnpm工作空间配置
└── package.json                     # 根配置
```

---

## 环境准备

### 安装pnpm

```bash
# 全局安装pnpm
npm install -g pnpm

# 验证安装
pnpm --version
```

### 初始化项目

```bash
# 克隆项目后，安装所有依赖
pnpm install

# 启动开发服务
pnpm run dev
```

---

## .gitignore配置

```gitignore
# 依赖
node_modules/
.pnpm-store/

# 构建产物
dist/
build/

# 环境变量
.env
.env.local
.env.*.local

# 数据库
data/*.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# 系统
.DS_Store
Thumbs.db

# 测试覆盖率
coverage/

# 日志
*.log
npm-debug.log*
pnpm-debug.log*
```

---

## Bilibili Cookie获取指引

前端需展示以下指引帮助用户获取Cookie：

1. 打开浏览器登录 bilibili.com
2. 按 F12 打开开发者工具
3. 切换到 Network（网络）标签
4. 刷新页面，点击任意请求
5. 在 Request Headers 中找到 Cookie
6. 复制 `SESSDATA=xxx` 部分的值（xxx部分）
7. 粘贴到绑定表单中

---

## 环境变量配置

```env
# 服务器
PORT=3001
NODE_ENV=development

# 数据库
DB_PATH=./data/bilibili-notify.db

# JWT
JWT_SECRET=your-secret-key-here

# Bilibili (可选)
BILIBILI_USER_AGENT=Mozilla/5.0
```

---

## 开发顺序建议

1. **Phase 1-2** — 基础设施（数据库+认证）— 约1天
2. **Phase 3-4** — 核心功能（Bilibili+订阅）— 约2天
3. **Phase 5-7** — 推送与调度 — 约1.5天
4. **Phase 8** — 数据统计 — 约1天
5. **Phase 9** — API路由层 — 约1天
6. **Phase 10-11** — 前端开发 — 约2天
7. **Phase 12** — 集成测试 — 约0.5天

**总计：约9天完成MVP**

---

## 注意事项

1. **TDD严格执行** — 每个功能必须先写测试，看到测试失败后再实现
2. **Bilibili API限制** — 关注列表需要Cookie，需在前端提供获取指引
3. **Cookie安全** — 服务端存储Cookie，前端不直接暴露
4. **推送频率** — 避免过于频繁的推送，建议每次更新合并推送
5. **错误处理** — API调用失败需要优雅降级，不影响其他功能
6. **Element Plus** — 优先使用组件库内置功能，避免重复造轮子
7. **自动导入** — 配置unplugin-auto-import和unplugin-vue-components实现按需导入
