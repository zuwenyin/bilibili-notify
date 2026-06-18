<template>
  <div class="subscriptions">
    <h1>订阅管理</h1>

    <el-card class="bilibili-section">
      <template #header>
        <h2>Bilibili绑定</h2>
      </template>
      <el-alert type="info" :closable="false" show-icon style="margin-bottom: 1rem">
        <template #title>
          <b>配置说明</b>
        </template>
        <p style="margin: 0">
          输入你的Bilibili UID和SESSDATA即可。<br/>
          获取方式：登录 bilibili.com → 按 <kbd>F12</kbd> → Network → 刷新页面 → 任意请求 Headers 中复制 <code>SESSDATA=xxx</code> 的值。
        </p>
      </el-alert>
      <div v-if="!bilibiliUid" class="bind-form">
        <el-input
          v-model="inputUid"
          placeholder="Bilibili UID（纯数字）"
          style="width: 200px"
        />
        <el-input
          v-model="inputCookie"
          placeholder="SESSDATA（从Cookie中获取）"
          style="flex: 1"
          show-password
        />
        <el-button type="primary" @click="bindBilibili" :loading="binding">
          {{ binding ? '绑定中...' : '绑定' }}
        </el-button>
      </div>
      <div v-else class="bound-info">
        <span>已绑定 UID: {{ bilibiliUid }}</span>
        <el-tag v-if="sessionStatus === 'valid'" type="success" size="small">Session有效</el-tag>
        <el-tag v-else-if="sessionStatus === 'expired'" type="danger" size="small">Session过期</el-tag>
        <el-button @click="fetchFollows" :loading="loading">
          {{ loading ? '加载中...' : '刷新关注列表' }}
        </el-button>
        <el-button v-if="sessionStatus === 'expired'" type="warning" size="small" @click="refreshSession" :loading="refreshing">
          {{ refreshing ? '续期中...' : '续期Session' }}
        </el-button>
        <el-button text type="info" @click="showCookieGuide = true">
          更新Cookie
        </el-button>
      </div>
    </el-card>

    <el-dialog v-model="showCookieGuide" title="Bilibili Cookie 获取指引" width="500px">
      <el-alert type="info" :closable="false" show-icon style="margin-bottom: 1rem">
        <b>获取关注列表需要登录Cookie</b>
      </el-alert>
      <ol class="guide-list">
        <li>打开浏览器登录 <a href="https://www.bilibili.com" target="_blank">bilibili.com</a></li>
        <li>按 <kbd>F12</kbd> 打开开发者工具</li>
        <li>切换到 <b>Network（网络）</b> 标签</li>
        <li>刷新页面，点击任意请求</li>
        <li>在 <b>Request Headers</b> 中找到 <code>Cookie</code></li>
        <li>复制 <code>SESSDATA=xxx</code> 部分的值（xxx部分）</li>
        <li>将SESSDATA值粘贴到下方输入框</li>
      </ol>
      <el-input v-model="cookieInput" placeholder="粘贴 SESSDATA 值" clearable style="margin-top: 1rem" />
      <template #footer>
        <el-button @click="submitCookie" type="primary" :loading="cookieSaving" :disabled="!cookieInput">
          保存Cookie
        </el-button>
        <el-button @click="showCookieGuide = false">稍后配置</el-button>
      </template>
    </el-dialog>

    <el-card v-if="followsTotal > 0" class="follows-section">
      <template #header>
        <h2>关注列表 ({{ followsTotal }})</h2>
      </template>
      <el-row :gutter="16">
        <el-col
          v-for="follow in follows"
          :key="follow.mid"
          :xs="12"
          :sm="8"
          :md="6"
          :lg="4"
        >
          <div
            class="follow-card"
            :class="{ subscribed: isSubscribed(follow.mid) }"
          >
            <el-avatar :src="`/api/bilibili/proxy?url=${encodeURIComponent(follow.face)}`" :size="50" />
            <div class="follow-info">
              <h4>{{ follow.name }}</h4>
              <el-button
                :type="isSubscribed(follow.mid) ? 'danger' : 'primary'"
                size="small"
                @click="toggleSubscription(follow)"
              >
                {{ isSubscribed(follow.mid) ? '取消订阅' : '订阅' }}
              </el-button>
            </div>
          </div>
        </el-col>
      </el-row>
      <el-pagination
        v-if="followsTotal > followsPageSize"
        v-model:current-page="followsPage"
        :page-size="followsPageSize"
        :total="followsTotal"
        layout="prev, pager, next"
        @current-change="fetchFollows"
        style="justify-content: center; margin-top: 1rem"
      />
    </el-card>

    <el-card class="subscriptions-section">
      <template #header>
        <h2>已订阅 ({{ subscriptions.length }})</h2>
      </template>
      <div v-if="subscriptions.length === 0" class="empty-state">
        <el-empty description="暂无订阅" />
      </div>
      <div v-else class="sub-list">
        <div v-for="sub in subscriptions" :key="sub.up_mid" class="sub-item">
          <el-avatar
            :src="`/api/bilibili/proxy?url=${encodeURIComponent(sub.up_face)}`"
            :size="40"
            class="clickable-avatar"
            @click="showUpDetail(sub.up_mid)"
          />
          <span class="name">{{ sub.up_name }}</span>
          <el-tag :type="sub.is_active ? 'success' : 'info'" size="small">
            {{ sub.is_active ? '推送中' : '已暂停' }}
          </el-tag>
          <el-button
            :type="sub.is_active ? 'warning' : 'success'"
            size="small"
            @click="toggleSubStatus(sub)"
          >
            {{ sub.is_active ? '暂停' : '启用' }}
          </el-button>
          <el-button
            type="danger"
            size="small"
            @click="removeSubscription(sub.up_mid)"
          >
            删除
          </el-button>
        </div>
      </div>
    </el-card>

    <el-dialog v-model="showDetailDialog" :title="upDetail?.name || 'UP主详情'" width="400px" destroy-on-close>
      <div v-loading="detailLoading" class="up-detail">
        <template v-if="upDetail">
          <div class="detail-header">
            <el-avatar :src="`/api/bilibili/proxy?url=${encodeURIComponent(upDetail.face)}`" :size="80" />
            <div class="detail-basic">
              <h3>{{ upDetail.name }}</h3>
              <p class="sign" v-if="upDetail.sign">{{ upDetail.sign }}</p>
              <el-tag size="small">LV{{ upDetail.level }}</el-tag>
            </div>
          </div>
          <el-divider />
          <el-row :gutter="20" class="detail-stats">
            <el-col :span="8">
              <div class="stat-item">
                <div class="stat-value">{{ formatNumber(upDetail.followers) }}</div>
                <div class="stat-label">粉丝</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="stat-item">
                <div class="stat-value">{{ formatNumber(upDetail.following) }}</div>
                <div class="stat-label">关注</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="stat-item">
                <div class="stat-value">{{ upDetail.level }}</div>
                <div class="stat-label">等级</div>
              </div>
            </el-col>
          </el-row>
          <el-divider />
          <div class="detail-actions">
            <el-button type="primary" @click="openBilibiliSpace" block>
              访问B站主页
            </el-button>
          </div>
        </template>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '../api'
import { ElMessage, ElMessageBox } from 'element-plus'

const bilibiliUid = ref<string | null>(null)
const inputUid = ref('')
const follows = ref<any[]>([])
const followsTotal = ref(0)
const followsPage = ref(1)
const followsPageSize = 50
const subscriptions = ref<any[]>([])
const binding = ref(false)
const loading = ref(false)
const refreshing = ref(false)
const sessionStatus = ref<'valid' | 'expired' | 'unknown'>('unknown')
const showCookieGuide = ref(false)
const cookieInput = ref('')
const cookieSaving = ref(false)
const inputCookie = ref('')
const showDetailDialog = ref(false)
const detailLoading = ref(false)
const upDetail = ref<any>(null)

const isSubscribed = (mid: string) => {
  return subscriptions.value.some(s => s.up_mid === mid)
}

const formatNumber = (num: number) => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  }
  return num.toLocaleString()
}

const showUpDetail = async (mid: string) => {
  showDetailDialog.value = true
  detailLoading.value = true
  upDetail.value = null
  try {
    const response = await api.get(`/bilibili/up/${mid}/detail`)
    upDetail.value = response.data
  } catch (error: any) {
    ElMessage.error(error.response?.data?.error || '获取详情失败')
    showDetailDialog.value = false
  } finally {
    detailLoading.value = false
  }
}

const openBilibiliSpace = () => {
  if (upDetail.value?.mid) {
    window.open(`https://space.bilibili.com/${upDetail.value.mid}`, '_blank')
  }
}

const bindBilibili = async () => {
  if (!inputUid.value) return

  binding.value = true
  try {
    await api.post('/bilibili/bind', {
      uid: inputUid.value,
      cookie: inputCookie.value ? `SESSDATA=${inputCookie.value}` : ''
    })
    bilibiliUid.value = inputUid.value
    ElMessage.success('绑定成功')
    if (!inputCookie.value) {
      showCookieGuide.value = true
    } else {
      await fetchFollows()
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.error || '绑定失败')
  } finally {
    binding.value = false
  }
}

const fetchFollows = async () => {
  loading.value = true
  try {
    const response = await api.get('/bilibili/follows', {
      params: { pn: followsPage.value, ps: followsPageSize }
    })
    follows.value = response.data.list
    followsTotal.value = response.data.total
    if (response.data.list.length === 0 && followsPage.value === 1) {
      ElMessage.info('未获取到关注列表，请检查Cookie是否正确')
    }
  } catch (error: any) {
    const msg = error.response?.data?.error || '获取关注列表失败'
    if (msg.includes('Cookie')) {
      showCookieGuide.value = true
    } else {
      ElMessage.error(msg)
    }
  } finally {
    loading.value = false
  }
}

const checkSessionStatus = async () => {
  try {
    const response = await api.get('/bilibili/session')
    sessionStatus.value = response.data.valid ? 'valid' : 'expired'
  } catch {
    sessionStatus.value = 'unknown'
  }
}

const refreshSession = async () => {
  refreshing.value = true
  try {
    const response = await api.post('/bilibili/session/refresh')
    if (response.data.valid) {
      sessionStatus.value = 'valid'
      ElMessage.success(response.data.message)
      await fetchFollows()
    } else {
      sessionStatus.value = 'expired'
      ElMessage.error(response.data.message)
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.error || '续期失败')
  } finally {
    refreshing.value = false
  }
}

const submitCookie = async () => {
  if (!cookieInput.value || !bilibiliUid.value) return

  cookieSaving.value = true
  try {
    await api.post('/bilibili/bind', {
      uid: bilibiliUid.value,
      cookie: `SESSDATA=${cookieInput.value}`
    })
    ElMessage.success('Cookie保存成功')
    showCookieGuide.value = false
    cookieInput.value = ''
    await fetchFollows()
  } catch (error: any) {
    ElMessage.error(error.response?.data?.error || '保存失败')
  } finally {
    cookieSaving.value = false
  }
}

const toggleSubscription = async (follow: any) => {
  try {
    if (isSubscribed(follow.mid)) {
      await api.delete(`/subscribe/${follow.mid}`)
      subscriptions.value = subscriptions.value.filter(s => s.up_mid !== follow.mid)
      ElMessage.success('已取消订阅')
    } else {
      const response = await api.post('/subscribe', {
        up_mid: follow.mid,
        up_name: follow.name,
        up_face: follow.face
      })
      subscriptions.value.unshift(response.data)
      ElMessage.success('订阅成功')
    }
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const toggleSubStatus = async (sub: any) => {
  try {
    const response = await api.patch(`/subscribe/${sub.up_mid}/toggle`)
    const index = subscriptions.value.findIndex(s => s.up_mid === sub.up_mid)
    if (index !== -1) {
      subscriptions.value[index] = response.data
    }
    ElMessage.success('状态已更新')
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const removeSubscription = async (upMid: string) => {
  try {
    await ElMessageBox.confirm('确定取消订阅？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await api.delete(`/subscribe/${upMid}`)
    subscriptions.value = subscriptions.value.filter(s => s.up_mid !== upMid)
    ElMessage.success('已取消订阅')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

onMounted(async () => {
  try {
    const [subRes, statusRes] = await Promise.all([
      api.get('/subscribe/list'),
      api.get('/bilibili/status')
    ])
    subscriptions.value = subRes.data
    if (statusRes.data.uid) {
      bilibiliUid.value = statusRes.data.uid
      await Promise.all([fetchFollows(), checkSessionStatus()])
    }
  } catch (error) {
    console.error('Failed to load data:', error)
  }
})
</script>

<style scoped>
.subscriptions h1 {
  color: #333;
  margin-bottom: 2rem;
}

.bilibili-section,
.follows-section,
.subscriptions-section {
  margin-bottom: 2rem;
}

.bilibili-section h2,
.follows-section h2,
.subscriptions-section h2 {
  color: #333;
  margin: 0;
  font-size: 1.2rem;
}

.bind-form {
  display: flex;
  gap: 1rem;
}

.bound-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.follow-card {
  display: flex;
  align-items: center;
  padding: 1rem;
  border: 1px solid #eee;
  border-radius: 8px;
  margin-bottom: 1rem;
  transition: all 0.2s;
}

.follow-card.subscribed {
  border-color: #00a1d6;
  background: #f0f9ff;
}

.follow-info {
  flex: 1;
  margin-left: 1rem;
}

.follow-info h4 {
  margin-bottom: 0.5rem;
  color: #333;
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
  gap: 1rem;
}

.name {
  flex: 1;
  font-weight: 500;
}

.guide-list {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}

.guide-list li {
  margin-bottom: 0.3rem;
  line-height: 1.6;
}

.guide-list a {
  color: #00a1d6;
}

.guide-list code {
  background: #f0f0f0;
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
  font-size: 0.9em;
}

.guide-list kbd {
  background: #eee;
  border: 1px solid #ccc;
  border-radius: 3px;
  padding: 0.1rem 0.4rem;
  font-size: 0.85em;
}

.clickable-avatar {
  cursor: pointer;
  transition: transform 0.2s;
}

.clickable-avatar:hover {
  transform: scale(1.1);
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.detail-basic h3 {
  margin: 0 0 0.5rem 0;
  color: #303133;
}

.detail-basic .sign {
  color: #909399;
  font-size: 13px;
  margin: 0 0 0.5rem 0;
}

.detail-stats {
  text-align: center;
}

.stat-item {
  padding: 0.5rem 0;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.stat-label {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.detail-actions {
  margin-top: 1rem;
}
</style>
