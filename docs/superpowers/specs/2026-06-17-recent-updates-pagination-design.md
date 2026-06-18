# 最近更新分页功能设计

## 概述

在Dashboard的"最近更新"部分添加分页功能，显示总条数并支持分页浏览。

## 需求

1. 显示视频更新的总条数
2. 支持分页浏览，默认每页10条
3. 使用Element Plus分页组件
4. 保持向后兼容（支持无分页参数的旧请求）

## 技术方案

### 后端API修改

**当前API**: `GET /api/videos/updates?limit=5`

**修改后API**: `GET /api/videos/updates?page=1&pageSize=10`

**响应格式变更**:

当前响应:
```json
[
  { "bvid": "...", "title": "...", ... },
  ...
]
```

修改后响应:
```json
{
  "videos": [
    { "bvid": "...", "title": "...", ... },
    ...
  ],
  "total": 100
}
```

**实现细节**:

1. 在videos.ts路由中添加分页参数处理
2. 添加总条数查询
3. 修改SQL查询支持LIMIT和OFFSET
4. 保持向后兼容：如果没有page参数，返回所有数据（limit=20）

### 前端修改

**Dashboard.vue变更**:

1. 添加分页状态:
   - `currentPage`: 当前页码
   - `pageSize`: 每页条数（默认10）
   - `total`: 总条数

2. 修改数据获取逻辑:
   - 传递page和pageSize参数
   - 处理新的响应格式

3. 添加分页组件:
   - 使用el-pagination组件
   - 显示总条数
   - 支持切换每页条数

**UI布局**:
- 分页组件放在视频列表下方
- 显示"共 X 条"信息
- 支持页码切换和每页条数选择

## 数据库查询优化

**当前查询**:
```sql
SELECT v.*, s.up_name
FROM videos v
INNER JOIN subscriptions s ON v.up_mid = s.up_mid
WHERE s.user_id = ?
ORDER BY v.pubdate DESC
LIMIT ?
```

**修改后查询**:
```sql
-- 总条数查询
SELECT COUNT(*) as total
FROM videos v
INNER JOIN subscriptions s ON v.up_mid = s.up_mid
WHERE s.user_id = ?

-- 分页查询
SELECT v.*, s.up_name
FROM videos v
INNER JOIN subscriptions s ON v.up_mid = s.up_mid
WHERE s.user_id = ?
ORDER BY v.pubdate DESC
LIMIT ? OFFSET ?
```

## 错误处理

1. 分页参数验证:
   - page必须大于0
   - pageSize必须在1-100之间
   - 无效参数使用默认值

2. 数据库查询错误处理:
   - 保持现有的错误处理逻辑
   - 返回适当的错误信息

## 测试计划

1. 单元测试:
   - 测试分页参数解析
   - 测试SQL查询正确性
   - 测试边界条件（page=0, pageSize=101等）

2. 集成测试:
   - 测试API响应格式
   - 测试分页功能
   - 测试向后兼容性

3. 前端测试:
   - 测试分页组件交互
   - 测试数据加载和显示
   - 测试错误状态处理

## 实现步骤

1. 后端实现:
   - 修改videos.ts路由
   - 添加分页参数验证
   - 修改SQL查询
   - 更新响应格式

2. 前端实现:
   - 更新API调用逻辑
   - 添加分页状态
   - 实现分页组件
   - 测试功能

3. 测试:
   - 运行现有测试
   - 添加新测试用例
   - 手动测试功能

## 兼容性考虑

1. API向后兼容:
   - 如果没有page参数，返回所有数据（limit=20）
   - 旧客户端可以继续工作

2. 数据库兼容:
   - 使用现有的数据库结构
   - 不需要数据库迁移

## 性能考虑

1. 数据库查询优化:
   - 为用户ID和发布时间添加索引
   - 避免不必要的JOIN操作

2. 前端性能:
   - 分页减少单次数据加载量
   - 避免重复请求相同数据

## 安全考虑

1. 参数验证:
   - 防止SQL注入
   - 验证用户权限

2. 数据访问控制:
   - 确保用户只能访问自己的订阅数据