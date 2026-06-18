<template>
  <div class="home">
    <h1>Bilibili Notify</h1>
    <p class="subtitle">哔哩哔哩UP主更新推送服务</p>

    <div class="features">
      <el-card class="feature">
        <template #header>
          <div class="feature-icon">
            <el-icon size="40"><Bell /></el-icon>
          </div>
        </template>
        <h3>订阅管理</h3>
        <p>选择你关注的UP主，接收更新推送</p>
      </el-card>

      <el-card class="feature">
        <template #header>
          <div class="feature-icon">
            <el-icon size="40"><Message /></el-icon>
          </div>
        </template>
        <h3>微信推送</h3>
        <p>新视频发布时通过微信收到通知</p>
      </el-card>

      <el-card class="feature">
        <template #header>
          <div class="feature-icon">
            <el-icon size="40"><DataAnalysis /></el-icon>
          </div>
        </template>
        <h3>数据统计</h3>
        <p>查看UP主粉丝数和视频数据变化</p>
      </el-card>
    </div>

    <div class="cta">
      <router-link to="/register">
        <el-button type="primary" size="large">开始使用</el-button>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Bell, Message, DataAnalysis } from '@element-plus/icons-vue'
</script>

<style scoped>
.home {
  text-align: center;
  padding: 4rem 2rem;
}

h1 {
  font-size: 3rem;
  color: #00a1d6;
  margin-bottom: 0.5rem;
}

.subtitle {
  font-size: 1.2rem;
  color: #666;
  margin-bottom: 3rem;
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
}

.feature {
  text-align: center;
}

.feature-icon {
  display: flex;
  justify-content: center;
  color: #00a1d6;
}

.feature h3 {
  color: #333;
  margin-bottom: 0.5rem;
}

.feature p {
  color: #666;
}

.cta {
  margin-top: 2rem;
}
</style>
