<div align="center">

# Bilibili Notify

**哔哩哔哩UP主视频更新监控与微信推送系统**

![Vue](https://img.shields.io/badge/Vue-3.4+-42b883?style=flat-square&logo=vue.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-3178c6?style=flat-square&logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)

[功能特性](#功能特性) · [快速开始](#快速开始) · [配置说明](#配置说明) · [API文档](#api文档) · [贡献指南](#贡献指南)

</div>

---

## 功能特性

- **订阅管理** - 从B站导入关注列表，一键订阅UP主
- **自动更新检测** - 定时检查订阅UP主的视频更新
- **微信推送** - 支持PushPlus和Server酱两种推送渠道
- **数据统计** - 可视化展示更新趋势、UP主活跃度、粉丝增长等
- **视频下载** - 支持多清晰度视频下载（360P ~ 4K）
- **多维度筛选** - 按关键词、UP主、时间范围筛选视频

## 快速开始

### 环境要求

| 依赖 | 版本要求 |
|------|----------|
| Node.js | >= 18.0.0 |
| pnpm | >= 8.0.0 |

### 安装部署

```bash
# 1. 克隆项目
git clone https://github.com/your-username/bilibili-notify.git
cd bilibili-notify

# 2. 安装依赖
pnpm install

# 3. 启动开发服务器
pnpm dev
```

启动后访问：
- 前端页面：http://localhost:5173
- 后端API：http://localhost:3001

### 首次使用

```
1. 注册账号 → 登录系统
2. 绑定B站账号（UID + Cookie）
3. 导入关注列表，选择订阅UP主
4. 配置微信推送渠道
5. 系统自动检测更新并推送通知
```

## 技术架构

```
bilibili-notify/
├── client/                  # Vue 3 前端
│   ├── src/api/            # API 接口
│   ├── src/views/          # 页面组件
│   ├── src/stores/         # 状态管理
│   └── src/router/         # 路由配置
├── server/                  # Express 后端
│   ├── src/routes/         # API 路由
│   ├── src/services/       # 业务逻辑
│   ├── src/middleware/      # 中间件
│   └── src/db/             # 数据库
└── docs/                    # 项目文档
```

### 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | Vue 3 + TypeScript |
| UI组件库 | Element Plus |
| 图表可视化 | ECharts |
| 构建工具 | Vite |
| 后端框架 | Express + TypeScript |
| 数据库 | SQLite (sql.js) |
| 认证方式 | JWT |
| 定时任务 | node-cron |

## 配置说明

### B站Cookie获取

1. 登录 [bilibili.com](https://www.bilibili.com)
2. 按 `F12` 打开开发者工具
3. 切换到 **Network** 标签
4. 刷新页面，点击任意请求
5. 在 **Request Headers** 中找到 `Cookie`
6. 复制 `SESSDATA=xxx` 的值

### 推送渠道配置

#### PushPlus

1. 访问 [pushplus.plus](https://www.pushplus.plus/)
2. 注册账号并关注"pushplus推送加"公众号
3. 进入个人中心获取 Token
4. 在控制面板中绑定 Token

#### Server酱

1. 访问 [sct.ftqq.com](https://sct.ftqq.com/)
2. 微信扫码登录
3. 点击 "SendKey" 菜单获取 Key
4. 在控制面板中绑定 Key

## 页面功能

### 控制面板

- 汇总卡片：订阅数、今日更新、推送状态
- 最近更新：视频列表 + 搜索 + 筛选 + 下载
- 推送配置：绑定PushPlus/Server酱

### 订阅管理

- B站账号绑定
- 关注列表导入
- UP主订阅/取消
- UP主详情查看

### 数据统计

- 更新趋势折线图
- UP主活跃度排行
- 推送成功率饼图
- 粉丝增长趋势
- 视频互动统计

## API 文档

### 认证接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/register | 用户注册 |
| POST | /api/auth/login | 用户登录 |

### 订阅管理

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/subscribe | 添加订阅 |
| GET | /api/subscribe/list | 获取订阅列表 |
| DELETE | /api/subscribe/:upMid | 删除订阅 |
| PATCH | /api/subscribe/:upMid/toggle | 切换状态 |

### 视频更新

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/videos/updates | 获取更新列表 |

**查询参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| page | number | 页码 |
| pageSize | number | 每页数量 |
| keyword | string | 标题关键词 |
| up_mid | string | UP主ID |
| start_date | string | 开始日期 |
| end_date | string | 结束日期 |

### 数据统计

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/stats-dashboard/dashboard | 汇总数据 |
| GET | /api/stats-dashboard/updates-trend | 更新趋势 |
| GET | /api/stats-dashboard/up-ranking | UP主排行 |
| GET | /api/stats-dashboard/push-success | 推送成功率 |
| GET | /api/stats-dashboard/followers-growth | 粉丝增长 |
| GET | /api/stats-dashboard/video-interactions | 互动统计 |

### 视频下载

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/video-download/info/:bvid | 视频信息+清晰度 |
| GET | /api/video-download/play-url/:bvid | 播放地址 |
| GET | /api/video-download/stream/:bvid | 代理下载 |

## 数据库表结构

| 表名 | 说明 |
|------|------|
| users | 用户信息 |
| subscriptions | 订阅关系 |
| videos | 视频信息 |
| push_history | 推送历史 |
| up_stats | UP主统计 |

## 开发指南

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

## 常见问题

**Q: B站Cookie多久过期？**
A: SESSDATA通常有效期30天，过期后需重新获取。

**Q: 推送频率是多少？**
A: 默认每5分钟检查一次更新。

**Q: 视频下载有限制吗？**
A: 受B站API限制，下载功能可能不稳定，需保持Cookie有效。

## 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 许可证

本项目基于 [MIT License](LICENSE) 开源。

## 致谢

- [Bilibili](https://www.bilibili.com/) - 提供视频数据
- [Vue.js](https://vuejs.org/) - 前端框架
- [Element Plus](https://element-plus.org/) - UI组件库
- [ECharts](https://echarts.apache.org/) - 图表库
