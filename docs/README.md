# Bilibili Notify - 哔哩哔哩UP主更新推送系统

## 项目简介

Bilibili Notify 是一个基于 Node.js + Vue 3 的哔哩哔哩UP主视频更新监控与推送系统。用户可以订阅关注的UP主，系统会自动检测视频更新并通过微信推送通知。

## 技术栈

### 前端
| 技术 | 版本 | 说明 |
|------|------|------|
| Vue | 3.4+ | 渐进式JavaScript框架 |
| TypeScript | 5.3+ | 类型安全的JavaScript超集 |
| Element Plus | 2.5+ | UI组件库 |
| ECharts | 5.4+ | 数据可视化图表库 |
| Vue Router | 4.2+ | 路由管理 |
| Pinia | 2.1+ | 状态管理 |
| Vite | 5.0+ | 构建工具 |
| Axios | 1.6+ | HTTP客户端 |

### 后端
| 技术 | 版本 | 说明 |
|------|------|------|
| Node.js | 18+ | 运行时环境 |
| Express | 4.18+ | Web框架 |
| TypeScript | 5.3+ | 类型安全 |
| sql.js | 1.9+ | SQLite数据库（WASM） |
| jsonwebtoken | 9.0+ | JWT认证 |
| bcryptjs | 2.4+ | 密码加密 |
| node-cron | 3.0+ | 定时任务 |
| axios | 1.6+ | HTTP客户端 |
| puppeteer-core | 25.1+ | 浏览器自动化（备用下载方案） |

## 系统架构

```
bilibili-notify/
├── client/                    # 前端Vue 3项目
│   ├── src/
│   │   ├── api/              # API接口封装
│   │   ├── router/           # 路由配置
│   │   ├── stores/           # Pinia状态管理
│   │   ├── views/            # 页面组件
│   │   ├── App.vue           # 根组件
│   │   └── main.ts           # 入口文件
│   ├── package.json
│   └── vite.config.ts
├── server/                    # 后端Express项目
│   ├── src/
│   │   ├── db/               # 数据库初始化
│   │   ├── middleware/       # 中间件（认证）
│   │   ├── routes/           # API路由
│   │   ├── services/         # 业务逻辑
│   │   ├── types/            # TypeScript类型
│   │   └── index.ts          # 入口文件
│   └── package.json
└── package.json               # 根package.json（pnpm workspace）
```

## 数据库设计

### users 表 - 用户信息
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| username | TEXT | 用户名，唯一 |
| password_hash | TEXT | 密码哈希值 |
| bilibili_uid | TEXT | B站UID |
| bilibili_cookie | TEXT | B站Cookie（SESSDATA） |
| bilibili_csrf | TEXT | B站CSRF Token |
| pushplus_token | TEXT | PushPlus推送Token |
| serverchan_key | TEXT | Server酱推送Key |
| created_at | DATETIME | 创建时间 |

### subscriptions 表 - 订阅关系
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| user_id | INTEGER | 用户ID，外键 |
| up_mid | TEXT | UP主ID |
| up_name | TEXT | UP主昵称 |
| up_face | TEXT | UP主头像URL |
| is_active | BOOLEAN | 是否启用推送 |
| created_at | DATETIME | 创建时间 |

### videos 表 - 视频信息
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| up_mid | TEXT | UP主ID |
| bvid | TEXT | 视频BV号，唯一 |
| title | TEXT | 视频标题 |
| description | TEXT | 视频描述 |
| pic | TEXT | 封面图URL |
| pubdate | DATETIME | 发布时间 |
| view | INTEGER | 播放量 |
| like | INTEGER | 点赞数 |
| coin | INTEGER | 投币数 |
| favorites | INTEGER | 收藏数 |
| created_at | DATETIME | 创建时间 |

### push_history 表 - 推送历史
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| user_id | INTEGER | 用户ID，外键 |
| bvid | TEXT | 视频BV号 |
| pushed_at | DATETIME | 推送时间 |

### up_stats 表 - UP主统计数据
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| up_mid | TEXT | UP主ID |
| followers | INTEGER | 粉丝数 |
| total_views | INTEGER | 总播放量 |
| video_count | INTEGER | 视频数量 |
| recorded_at | DATETIME | 记录时间 |

## 功能模块

### 1. 用户认证模块

#### 功能
- 用户注册/登录
- JWT Token认证
- 密码加密存储

#### API接口
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/register | 用户注册 |
| POST | /api/auth/login | 用户登录 |

---

### 2. B站账号绑定模块

#### 功能
- 绑定B站UID和Cookie
- 获取关注列表
- Session状态检测与续期
- UP主头像/图片代理

#### API接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/bilibili/status | 获取绑定状态 |
| POST | /api/bilibili/bind | 绑定B站账号 |
| GET | /api/bilibili/follows | 获取关注列表 |
| GET | /api/bilibili/up/:mid | 获取UP主信息 |
| GET | /api/bilibili/up/:mid/detail | 获取UP主详细信息 |
| GET | /api/bilibili/session | 检查Session状态 |
| POST | /api/bilibili/session/refresh | 续期Session |
| GET | /api/bilibili/proxy | 图片代理 |

---

### 3. 订阅管理模块

#### 功能
- 添加/删除订阅
- 切换订阅状态（启用/暂停）
- 查看订阅列表

#### API接口
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/subscribe | 添加订阅 |
| GET | /api/subscribe/list | 获取订阅列表 |
| DELETE | /api/subscribe/:upMid | 删除订阅 |
| PATCH | /api/subscribe/:upMid/toggle | 切换订阅状态 |

---

### 4. 视频更新模块

#### 功能
- 获取订阅UP主的最新视频
- 支持分页查询
- 支持按关键词、UP主、时间范围筛选

#### API接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/videos/updates | 获取视频更新列表 |

#### 查询参数
| 参数 | 类型 | 说明 |
|------|------|------|
| page | number | 页码，默认1 |
| pageSize | number | 每页数量，默认10 |
| keyword | string | 标题关键词筛选 |
| up_mid | string | UP主ID筛选 |
| start_date | string | 开始日期（YYYY-MM-DD） |
| end_date | string | 结束日期（YYYY-MM-DD） |

---

### 5. 推送通知模块

#### 功能
- PushPlus微信推送
- Server酱微信推送
- 推送状态管理

#### API接口
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/push/bind | 绑定推送渠道 |
| GET | /api/push/status | 获取推送状态 |

#### 支持的推送渠道
| 渠道 | 说明 | 获取方式 |
|------|------|----------|
| PushPlus | 微信公众号推送 | [pushplus.plus](https://www.pushplus.plus/) |
| Server酱 | 微信推送 | [sct.ftqq.com](https://sct.ftqq.com/) |

---

### 6. 数据统计模块

#### 功能
- Dashboard汇总数据
- 更新趋势图表
- UP主活跃度排行
- 推送成功率统计
- 粉丝增长趋势
- 视频互动统计

#### API接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/stats-dashboard/dashboard | 获取汇总数据 |
| GET | /api/stats-dashboard/updates-trend | 获取更新趋势 |
| GET | /api/stats-dashboard/up-ranking | 获取UP主排行 |
| GET | /api/stats-dashboard/push-success | 获取推送成功率 |
| GET | /api/stats-dashboard/followers-growth | 获取粉丝增长 |
| GET | /api/stats-dashboard/video-interactions | 获取互动统计 |

#### 查询参数
| 参数 | 类型 | 说明 |
|------|------|------|
| days | number | 统计天数，默认30 |

---

### 7. 视频下载模块

#### 功能
- 获取视频信息和可用清晰度
- 获取视频播放地址
- 服务器代理下载（绕过CDN防盗链）
- 下载进度追踪

#### API接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/video-download/info/:bvid | 获取视频信息和清晰度 |
| GET | /api/video-download/play-url/:bvid | 获取播放地址 |
| GET | /api/video-download/stream/:bvid | 代理下载视频 |

#### 清晰度选项
| qn值 | 清晰度 | 说明 |
|------|--------|------|
| 16 | 360P | 流畅 |
| 32 | 480P | 清晰 |
| 64 | 720P | 高清 |
| 80 | 1080P | 超清 |
| 112 | 1080P+ | 超清+ |
| 116 | 1080P60 | 高帧率 |
| 120 | 4K | 4K超清（需大会员） |
| 125 | HDR | 高动态范围（需大会员） |
| 126 | 杜比视界 | 最高画质（需大会员） |
| 127 | 杜比全景声 | 最高音质（需大会员） |

---

### 8. 定时任务模块

#### 功能
- 定时检查UP主视频更新
- 自动推送新视频通知
- 记录推送历史

## 页面说明

### 1. 首页 (/)
系统介绍页面，展示主要功能。

### 2. 登录页 (/login)
用户登录界面。

### 3. 注册页 (/register)
新用户注册界面。

### 4. 控制面板 (/dashboard)
- **汇总卡片**：订阅UP主数、今日更新、推送状态
- **快速操作**：管理订阅、立即检查更新
- **推送配置**：绑定PushPlus/Server酱
- **最近更新**：视频列表，支持搜索、UP主筛选、时间范围筛选
- **视频下载**：点击下载按钮选择清晰度下载

### 5. 订阅管理 (/subscriptions)
- **Bilibili绑定**：配置UID和Cookie
- **关注列表**：从B站获取的关注列表，可订阅
- **已订阅列表**：管理已订阅的UP主
- **UP主详情**：点击头像查看详细信息

### 6. 数据统计 (/statistics)
- **汇总卡片**：总订阅数、今日/本周更新、推送覆盖率
- **更新趋势**：折线图展示更新数量变化
- **推送成功率**：饼图展示推送状态分布
- **UP主排行**：按更新频率排序的列表
- **粉丝增长**：折线图展示粉丝数变化
- **互动统计**：播放量、点赞、投币、收藏统计

## 快速开始

### 环境要求
- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Chrome浏览器（可选，用于视频下载备用方案）

### 安装步骤

```bash
# 克隆项目
git clone <repository-url>
cd bilibili-notify

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

### 启动说明
- 前端开发服务器：http://localhost:5173
- 后端API服务器：http://localhost:3001

### 首次使用
1. 访问 http://localhost:5173/register 注册账号
2. 登录后进入控制面板
3. 绑定B站账号（UID + SESSDATA Cookie）
4. 刷新关注列表，选择要订阅的UP主
5. 配置推送渠道（PushPlus或Server酱）
6. 等待系统自动检查更新并推送通知

## 配置说明

### B站Cookie获取
1. 登录 bilibili.com
2. 按 F12 打开开发者工具
3. 切换到 Network 标签
4. 刷新页面，点击任意请求
5. 在 Request Headers 中找到 Cookie
6. 复制 `SESSDATA=xxx` 部分的值

### PushPlus配置
1. 访问 [pushplus.plus](https://www.pushplus.plus/)
2. 注册并关注"pushplus推送加"公众号
3. 进入个人中心获取Token
4. 在控制面板中绑定Token

### Server酱配置
1. 访问 [sct.ftqq.com](https://sct.ftqq.com/)
2. 微信扫码登录
3. 点击"SendKey"菜单获取Key
4. 在控制面板中绑定Key

## API认证

所有需要认证的API请求需要在Header中携带JWT Token：

```
Authorization: Bearer <token>
```

## 注意事项

1. **B站Cookie有效期**：SESSDATA通常有效期为30天，过期后需要重新获取
2. **推送频率**：系统默认每5分钟检查一次更新
3. **视频下载**：受B站API限制，下载功能可能不稳定，建议保持Cookie有效
4. **数据存储**：使用SQLite数据库，数据文件位于 `server/data/bilibili-notify.db`

## 开发说明

### 运行测试
```bash
# 后端测试
pnpm test

# 前端测试
cd client && pnpm test
```

### 构建生产版本
```bash
pnpm build
```

## License

MIT
