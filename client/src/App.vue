<template>
  <div id="app">
    <el-container>
      <el-header class="navbar">
        <div class="nav-brand">
          <router-link to="/">Bilibili Notify</router-link>
        </div>
        <div class="nav-links">
          <template v-if="authStore.isAuthenticated">
            <router-link to="/dashboard">控制面板</router-link>
            <router-link to="/subscriptions">订阅管理</router-link>
            <router-link to="/statistics">数据统计</router-link>
            <el-button type="info" text @click="logout">退出</el-button>
          </template>
          <template v-else>
            <router-link to="/login">登录</router-link>
            <router-link to="/register">注册</router-link>
          </template>
        </div>
      </el-header>
      <el-main class="container">
        <router-view />
      </el-main>
    </el-container>
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
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  background-color: #f4f4f4;
}

#app {
  min-height: 100vh;
}

.navbar {
  background-color: #00a1d6;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 2rem;
  height: 60px;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
}

.nav-brand a {
  color: white;
  font-size: 1.5rem;
  font-weight: bold;
  text-decoration: none;
}

.nav-links {
  display: flex;
  gap: 1.5rem;
  align-items: center;
}

.nav-links a {
  color: white;
  text-decoration: none;
  font-size: 1rem;
}

.nav-links a:hover {
  opacity: 0.9;
}

.container {
  width: 90%;
  max-width: 1600px;
  margin: 0 auto;
  padding: 2rem;
  padding-top: calc(60px + 2rem);
  min-height: calc(100vh - 60px);
}
</style>
