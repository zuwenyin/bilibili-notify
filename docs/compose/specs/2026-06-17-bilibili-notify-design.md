# Bilibili Notify — 哔哩哔哩更新推送网站设计文档

## [S1] 问题

用户需要一个工具来追踪Bilibili关注的UP主更新，并通过微信接收推送通知。现有方案要么需要安装客户端，要么无法灵活选择特定UP主进行推送。

## [S2] 解决方案概览

构建一个Web应用，用户绑定Bilibili账号后可选择关注的UP主进行订阅，系统定时检测新视频并通过PushPlus/Server酱推送微信通知。同时提供UP主数据统计功能，追踪粉丝数、播放量等指标的变化趋势。

### 技术栈

| 模块 | 选择 |
|------|------|
| 后端 | Express.js + TypeScript |
| 前端 | Vue 3 + Vite |
| 数据库 | SQLite (better-sqlite3) |
| Bilibili采集 | 公开API轮询 |
| 微信推送 | PushPlus / Server酱 |
| 定时任务 | node-cron |
| 图表 | ECharts |

## [S3] 功能模块

### 3.1 用户认证

- 简单的用户名+密码注册/登录
- JWT Token认证
- 个人项目无需OAuth

### 3.2 Bilibili绑定

**API限制说明：** Bilibili的关注列表API（`/x/relation/followings`）需要登录认证，纯UID无法获取关注列表。

**绑定方式（二选一）：**

1. **UID + Cookie绑定（推荐）**
   - 用户输入Bilibili UID
   - 用户从浏览器获取Cookie（主要需要`SESSDATA`字段）
   - 系统使用Cookie调用关注列表API
   - 展示关注的UP主供用户选择订阅

2. **手动添加UP主**
   - 用户直接输入UP主的UID或主页链接
   - 系统通过公开API获取UP主信息
   - 适用于不想绑定Cookie的用户

**Cookie获取指引（前端展示）：**
1. 登录bilibili.com
2. 按F12打开开发者工具
3. 切换到Network标签
4. 刷新页面，点击任意请求
5. 在Request Headers中找到Cookie
6. 复制`SESSDATA=xxx`部分的值

### 3.3 UP主订阅管理

- 展示用户关注的所有UP主
- 勾选/取消勾选进行订阅管理
- 支持批量操作
- 记录订阅状态

### 3.4 更新检测

- node-cron定时任务，每5分钟执行一次
- 检查所有已订阅UP主的最新视频
- 与数据库中的最后检测视频ID对比
- 发现新视频时触发推送

### 3.5 微信推送

- 用户绑定PushPlus Token或Server酱Key
- 新视频检测到后调用推送API
- 推送内容包含：UP主名称、视频标题、发布时间、视频链接
- 记录推送历史，避免重复推送

### 3.6 UP主数据统计

- **粉丝数追踪**：每日定时记录粉丝数，展示增长曲线
- **视频数据**：播放量、点赞、投币、收藏的统计
- **更新频率**：分析UP主的发布规律（周几发布、平均间隔天数）
- **数据可视化**：使用ECharts展示趋势图

## [S4] 数据模型

### users表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PRIMARY KEY | 用户ID |
| username | TEXT UNIQUE | 用户名 |
| password_hash | TEXT | 密码哈希 |
| bilibili_uid | TEXT | Bilibili UID |
| bilibili_cookie | TEXT | Bilibili Cookie (SESSDATA) |
| pushplus_token | TEXT | PushPlus Token |
| serverchan_key | TEXT | Server酱Key |
| created_at | DATETIME | 创建时间 |

### subscriptions表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PRIMARY KEY | 订阅ID |
| user_id | INTEGER | 用户ID |
| up_mid | TEXT | UP主UID |
| up_name | TEXT | UP主名称 |
| up_face | TEXT | UP主头像URL |
| is_active | BOOLEAN | 是否启用推送 |
| created_at | DATETIME | 创建时间 |

### videos表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PRIMARY KEY | 视频ID |
| up_mid | TEXT | UP主UID |
| bvid | TEXT UNIQUE | 视频BV号 |
| title | TEXT | 视频标题 |
| description | TEXT | 视频简介 |
| pic | TEXT | 封面图URL |
| pubdate | DATETIME | 发布时间 |
| view | INTEGER | 播放量 |
| like | INTEGER | 点赞数 |
| coin | INTEGER | 投币数 |
| favorites | INTEGER | 收藏数 |
| created_at | DATETIME | 记录时间 |

### push_history表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PRIMARY KEY | 推送ID |
| user_id | INTEGER | 用户ID |
| bvid | TEXT | 视频BV号 |
| pushed_at | DATETIME | 推送时间 |

### up_stats表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PRIMARY KEY | 统计ID |
| up_mid | TEXT | UP主UID |
| followers | INTEGER | 粉丝数 |
| recorded_at | DATETIME | 记录时间 |

## [S5] API设计

### 认证
- `POST /api/auth/register` — 注册
- `POST /api/auth/login` — 登录

### Bilibili
- `POST /api/bilibili/bind` — 绑定Bilibili UID + Cookie
- `POST /api/bilibili/add-up` — 手动添加UP主（通过UID）
- `GET /api/bilibili/follows` — 获取关注列表（需要Cookie）
- `GET /api/bilibili/up/:mid` — 获取UP主信息（公开API）

### 订阅管理
- `POST /api/subscribe` — 订阅UP主
- `DELETE /api/subscribe/:upMid` — 取消订阅
- `GET /api/subscribe/list` — 查看已订阅列表

### 推送配置
- `POST /api/push/bind` — 绑定推送Token
- `GET /api/push/status` — 推送状态

### 数据统计
- `GET /api/stats/up/:upMid` — UP主统计数据
- `GET /api/stats/up/:upMid/followers` — 粉丝数趋势
- `GET /api/stats/up/:upMid/videos` — 视频数据

### 更新记录
- `GET /api/videos/updates` — 查看更新记录

## [S6] 项目结构

```
bilibili-notify/
├── client/                    # Vue 3 前端
│   ├── src/
│   │   ├── components/        # 组件
│   │   ├── views/             # 页面
│   │   ├── api/               # API调用
│   │   ├── stores/            # Pinia状态管理
│   │   └── App.vue
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
├── server/                    # Express 后端
│   ├── src/
│   │   ├── routes/            # 路由
│   │   ├── services/          # 业务逻辑
│   │   ├── db/                # 数据库操作
│   │   ├── middleware/        # 中间件
│   │   └── index.ts           # 入口
│   ├── tsconfig.json
│   └── package.json
├── data/                      # SQLite数据库文件
├── docs/                      # 文档
└── package.json               # 根package.json (monorepo)
```

## [S7] UI设计规范

### 视觉风格

采用Bilibili官网风格，简洁现代的卡片式设计。

### 颜色规范

| 用途 | 颜色值 | 说明 |
|------|--------|------|
| 主色 | `#00a1d6` | Bilibili蓝，用于按钮、链接、强调 |
| 辅助色 | `#fb7299` | Bilibili粉，用于点赞、收藏等 |
| 成功色 | `#4caf50` | 绿色，用于成功状态 |
| 警告色 | `#ff9800` | 橙色，用于警告 |
| 错误色 | `#f44336` | 红色，用于删除、错误 |
| 背景色 | `#f4f4f4` | 页面背景 |
| 卡片背景 | `#ffffff` | 白色 |
| 主文字 | `#212121` | 深色文字 |
| 次文字 | `#999999` | 灰色辅助文字 |

### 字体规范

```css
font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', sans-serif;
```

### 圆角规范

- 卡片：`8px`
- 按钮：`4px`
- 头像：`50%`（圆形）
- 输入框：`4px`

### 阴影规范

```css
/* 卡片阴影 */
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

/* 悬停阴影 */
box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
```

### 组件规范

**导航栏：**
- 背景：`#00a1d6`
- 高度：`60px`
- 固定顶部

**按钮：**
- 主按钮：`#00a1d6` 背景，白色文字
- 次按钮：白色背景，`#00a1d6` 边框
- 悬停：加深10%

**输入框：**
- 边框：`1px solid #ddd`
- 聚焦：`#00a1d6` 边框
- 内边距：`12px`

**卡片：**
- 白色背景
- 8px圆角
- 8px-16px内边距
- 悬停微上浮效果

## [S8] 部署考虑

- 开发阶段本地运行
- 生产环境可部署到任何Node.js托管平台
- SQLite文件需持久化存储
- 环境变量管理敏感配置（数据库路径、JWT密钥等）
