<template>
  <div class="dashboard">
    <h1>控制面板</h1>

    <el-row :gutter="20" class="stats-grid">
      <el-col :xs="24" :sm="8">
        <el-card class="stat-card">
          <h3>订阅UP主</h3>
          <p class="stat-value">{{ subscriptions.length }}</p>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="8">
        <el-card class="stat-card">
          <h3>今日更新</h3>
          <p class="stat-value">{{ todayUpdates }}</p>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="8">
        <el-card class="stat-card">
          <h3>推送状态</h3>
          <p class="stat-value" :class="{ active: pushEnabled }">
            {{ pushEnabled ? '已启用' : '未配置' }}
          </p>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="quick-actions">
      <template #header>
        <h2>快速操作</h2>
      </template>
      <div class="action-buttons">
        <router-link to="/subscriptions">
          <el-button type="primary">管理订阅</el-button>
        </router-link>
        <router-link to="/statistics">
          <el-button type="success">数据统计</el-button>
        </router-link>
        <el-button @click="checkUpdates" :loading="checking">
          {{ checking ? '检查中...' : '立即检查更新' }}
        </el-button>
      </div>
    </el-card>

    <el-card class="push-config">
      <template #header>
        <h2>推送配置</h2>
      </template>
      <el-tabs v-model="pushType">
        <el-tab-pane label="PushPlus" name="pushplus">
          <el-alert type="info" :closable="false" show-icon style="margin-bottom: 1rem">
            <template #title>
              <b>PushPlus 获取步骤：</b>
            </template>
            <ol class="guide-list">
              <li>访问 <a href="https://www.pushplus.plus/" target="_blank">pushplus.plus</a> 并注册账号</li>
              <li>微信扫码关注"pushplus推送加"公众号</li>
              <li>进入"个人中心" → " token 一键复制"</li>
              <li>将Token粘贴到下方输入框</li>
            </ol>
          </el-alert>
          <el-input v-model="pushplusToken" placeholder="请输入PushPlus Token" clearable>
            <template #append>
              <el-button type="primary" @click="bindPush('pushplus')" :loading="binding">
                绑定
              </el-button>
            </template>
          </el-input>
        </el-tab-pane>
        <el-tab-pane label="Server酱" name="serverchan">
          <el-alert type="info" :closable="false" show-icon style="margin-bottom: 1rem">
            <template #title>
              <b>Server酱 获取步骤：</b>
            </template>
            <ol class="guide-list">
              <li>访问 <a href="https://sct.ftqq.com/" target="_blank">sct.ftqq.com</a></li>
              <li>微信扫码登录</li>
              <li>点击"SendKey"菜单获取你的专属Key</li>
              <li>将Key粘贴到下方输入框</li>
            </ol>
          </el-alert>
          <el-input v-model="serverchanKey" placeholder="请输入Server酱 SendKey" clearable>
            <template #append>
              <el-button type="primary" @click="bindPush('serverchan')" :loading="binding">
                绑定
              </el-button>
            </template>
          </el-input>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-card class="recent-updates">
      <template #header>
        <div class="recent-header">
          <h2>最近更新 <span class="total-count">共 {{ total }} 条</span></h2>
          <div class="filter-bar">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索标题"
              clearable
              style="width: 160px"
              @clear="fetchRecentVideos"
              @keyup.enter="fetchRecentVideos"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-select v-model="filterUpMid" placeholder="全部UP主" clearable style="width: 130px" @change="fetchRecentVideos">
              <el-option
                v-for="sub in subscriptions"
                :key="sub.up_mid"
                :label="sub.up_name"
                :value="sub.up_mid"
              />
            </el-select>
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              :unlink-panels="true"
              style="width: 260px"
              @change="fetchRecentVideos"
            />
            <el-button :icon="Refresh" circle @click="fetchRecentVideos" :loading="refreshing" />
            <el-button @click="fetchHistory" :loading="fetchingHistory" type="warning" size="small">
              {{ fetchingHistory ? '拉取中...' : '拉取历史' }}
            </el-button>
          </div>
        </div>
      </template>
      <div v-if="recentVideos.length === 0" class="empty-state">
        <el-empty description="暂无更新" />
      </div>
      <div v-else class="video-list">
        <div
          v-for="video in recentVideos"
          :key="video.bvid"
          class="video-item"
        >
          <img
            :src="`/api/bilibili/proxy?url=${encodeURIComponent(video.pic)}`"
            :alt="video.title"
            class="video-thumb"
            @click="openVideo(video.bvid)"
          />
          <div class="video-info" @click="openVideo(video.bvid)">
            <h4>{{ video.title }}</h4>
            <p>{{ video.up_name }} · {{ formatDate(video.pubdate) }}</p>
          </div>
          <div class="video-actions">
            <el-button
              type="primary"
              size="small"
              :icon="Download"
              circle
              :loading="video._loadingQualities"
              @click.stop="showQualityDialog(video)"
            />
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

    <el-dialog v-model="showDownloadDialog" title="下载视频" width="400px" :close-on-click-modal="false" :close-on-press-escape="false" :show-close="false">
      <div class="download-content">
        <p class="download-title">{{ downloadTitle }}</p>
        <el-progress
          :percentage="downloadProgress"
          :status="downloadStatus"
          :stroke-width="20"
          text-inside
        />
        <p class="download-tip">{{ downloadTip }}</p>
      </div>
      <template #footer>
        <div class="download-actions">
          <template v-if="downloading">
            <el-button v-if="!paused" @click="pauseDownload" :icon="VideoPause">暂停</el-button>
            <el-button v-else type="primary" @click="resumeDownload" :icon="VideoPlay">继续</el-button>
            <el-button type="danger" @click="cancelDownload" :icon="CloseBold">取消</el-button>
          </template>
          <template v-else>
            <el-button @click="closeDownloadDialog">关闭</el-button>
          </template>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="showQualitySelectDialog" title="选择清晰度" width="360px">
      <div v-loading="loadingQualities" class="quality-list">
        <div v-if="availableQualities.length === 0 && !loadingQualities" class="empty-qualities">
          未获取到清晰度信息
        </div>
        <div
          v-for="q in availableQualities"
          :key="q.qn"
          class="quality-item"
          @click="startDownload(currentDownloadBvid, q.qn)"
        >
          <span class="quality-label">{{ q.label }}</span>
          <span class="quality-desc">{{ getQualityDesc(q.qn) }}</span>
        </div>
      </div>
      <template #footer>
        <el-button @click="showQualitySelectDialog = false">取消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '../api'
import { ElMessage } from 'element-plus'
import { Refresh, Search, Download, VideoPause, VideoPlay, CloseBold } from '@element-plus/icons-vue'

const subscriptions = ref<any[]>([])
const recentVideos = ref<any[]>([])
const todayUpdates = ref(0)
const pushEnabled = ref(false)
const checking = ref(false)
const binding = ref(false)
const refreshing = ref(false)
const pushType = ref('pushplus')
const pushplusToken = ref('')
const serverchanKey = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const searchKeyword = ref('')
const filterUpMid = ref('')
const dateRange = ref<[string, string] | null>(null)
const showDownloadDialog = ref(false)
const downloading = ref(false)
const paused = ref(false)
const downloadProgress = ref(0)
const downloadStatus = ref<'success' | 'exception' | ''>('')
const downloadTitle = ref('')
const downloadTip = ref('准备下载...')
const showQualitySelectDialog = ref(false)
const loadingQualities = ref(false)
const availableQualities = ref<{ qn: number; label: string }[]>([])
const currentDownloadBvid = ref('')
const currentDownloadTitle = ref('')
const fetchingHistory = ref(false)
let currentXHR: XMLHttpRequest | null = null
let totalBytes = 0

const formatDate = (date: string) => {
  return new Date(date).toLocaleString('zh-CN')
}

const checkUpdates = async () => {
  checking.value = true
  try {
    await api.post('/scheduler/run')
    ElMessage.success('检查完成')
  } catch (error) {
    ElMessage.error('检查失败')
  } finally {
    checking.value = false
  }
}

const bindPush = async (type: string) => {
  const token = type === 'pushplus' ? pushplusToken.value : serverchanKey.value
  if (!token) {
    ElMessage.warning('请输入Token')
    return
  }

  binding.value = true
  try {
    await api.post('/push/bind', { type, token })
    ElMessage.success('绑定成功')
    pushEnabled.value = true
  } catch (error) {
    ElMessage.error('绑定失败')
  } finally {
    binding.value = false
  }
}

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

const fetchRecentVideos = async () => {
  refreshing.value = true
  try {
    const params: any = {
      page: currentPage.value,
      pageSize: pageSize.value
    }
    if (searchKeyword.value) {
      params.keyword = searchKeyword.value
    }
    if (filterUpMid.value) {
      params.up_mid = filterUpMid.value
    }
    if (dateRange.value) {
      params.start_date = dateRange.value[0]
      params.end_date = dateRange.value[1]
    }
    const videosRes = await api.get('/videos/updates', { params })
    recentVideos.value = videosRes.data.videos
    total.value = videosRes.data.total
  } catch (error) {
    console.error('Failed to fetch videos:', error)
  } finally {
    refreshing.value = false
  }
}

const fetchHistory = async () => {
  if (!filterUpMid.value) {
    ElMessage.warning('请先选择一个UP主')
    return
  }

  fetchingHistory.value = true
  try {
    const response = await api.post(`/videos/fetch-history/${filterUpMid.value}`)
    if (response.data.fetched > 0) {
      ElMessage.success(response.data.message)
      await fetchRecentVideos()
    } else {
      ElMessage.info(response.data.message)
    }
  } catch (error: any) {
    const msg = error.response?.data?.error || '拉取失败'
    if (msg.includes('412') || msg.includes('频繁') || msg.includes('限制')) {
      ElMessage.warning('B站API限制，请稍后再试')
    } else {
      ElMessage.error(msg)
    }
  } finally {
    fetchingHistory.value = false
  }
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchRecentVideos()
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  fetchRecentVideos()
}

const openVideo = (bvid: string) => {
  window.open(`https://www.bilibili.com/video/${bvid}`, '_blank')
}

const getQualityDesc = (qn: number): string => {
  const descs: Record<number, string> = {
    16: '流畅',
    32: '清晰',
    64: '高清',
    80: '超清',
    112: '超清+',
    116: '高帧率',
    120: '4K超清',
    125: 'HDR',
    126: '杜比视界',
    127: '杜比全景声'
  }
  return descs[qn] || ''
}

const showQualityDialog = async (video: any) => {
  currentDownloadBvid.value = video.bvid
  currentDownloadTitle.value = video.title
  showQualitySelectDialog.value = true
  loadingQualities.value = true
  availableQualities.value = []

  try {
    const response = await api.get(`/video-download/info/${video.bvid}`)
    const qualities = response.data.qualities || []

    const qnToLabel: Record<number, string> = {
      16: '360P',
      32: '480P',
      64: '720P',
      80: '1080P',
      112: '1080P+',
      116: '1080P60',
      120: '4K',
      125: 'HDR',
      126: '杜比视界',
      127: '杜比全景声'
    }

    availableQualities.value = qualities.map((q: any) => ({
      qn: q.qn,
      label: qnToLabel[q.qn] || `${q.qn}P`
    }))
  } catch (error: any) {
    const errorMsg = error.response?.data?.error || '获取清晰度失败'
    if (errorMsg.includes('限制') || errorMsg.includes('412')) {
      ElMessage.warning('B站API限制，请更新Cookie后重试')
    } else {
      ElMessage.error(errorMsg)
    }
    showQualitySelectDialog.value = false
  } finally {
    loadingQualities.value = false
  }
}

const startDownload = (bvid: string, qn: number) => {
  showQualitySelectDialog.value = false
  downloadVideo(bvid, qn)
}

const downloadVideo = async (bvid: string, qn: number) => {
  showDownloadDialog.value = true
  downloading.value = true
  paused.value = false
  downloadProgress.value = 0
  downloadStatus.value = ''
  downloadTitle.value = currentDownloadTitle.value || '正在下载...'
  downloadTip.value = '请稍候...'

  const token = localStorage.getItem('token')
  const url = `/api/video-download/stream/${bvid}?qn=${qn}`

  const xhr = new XMLHttpRequest()
  currentXHR = xhr
  xhr.open('GET', url, true)
  xhr.setRequestHeader('Authorization', `Bearer ${token}`)
  xhr.responseType = 'blob'

  xhr.onprogress = (event) => {
    if (event.lengthComputable) {
      totalBytes = event.total
      const progress = Math.round((event.loaded / totalBytes) * 100)
      downloadProgress.value = progress
      const loadedMB = (event.loaded / 1024 / 1024).toFixed(1)
      const totalMB = (totalBytes / 1024 / 1024).toFixed(1)
      downloadTip.value = `已下载 ${loadedMB}MB / ${totalMB}MB`
    }
  }

  xhr.onload = () => {
    if (xhr.status === 200) {
      downloadProgress.value = 100
      downloadStatus.value = 'success'
      downloadTitle.value = '下载完成'
      downloadTip.value = '文件已保存'

      const blob = xhr.response
      const contentDisposition = xhr.getResponseHeader('content-disposition')
      let filename = 'video.mp4'
      if (contentDisposition) {
        const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
        if (match) {
          filename = decodeURIComponent(match[1].replace(/['"]/g, ''))
        }
      }

      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(link.href)
    } else {
      downloadStatus.value = 'exception'
      downloadTitle.value = '下载失败'
      downloadTip.value = `错误: ${xhr.status}`
    }
    downloading.value = false
    currentXHR = null
  }

  xhr.onerror = () => {
    downloadStatus.value = 'exception'
    downloadTitle.value = '下载失败'
    downloadTip.value = '网络错误'
    downloading.value = false
    currentXHR = null
  }

  xhr.send()
}

const pauseDownload = () => {
  if (currentXHR) {
    currentXHR.abort()
    paused.value = true
    downloading.value = false
    downloadTip.value = `下载已暂停 (${downloadProgress.value}%)`
  }
}

const resumeDownload = () => {
  if (paused.value && currentDownloadBvid.value) {
    paused.value = false
    downloading.value = true
    downloadStatus.value = ''
    downloadTip.value = '正在继续下载...'
    downloadVideo(currentDownloadBvid.value, 80)
  }
}

const cancelDownload = () => {
  if (currentXHR) {
    currentXHR.abort()
    currentXHR = null
  }
  downloading.value = false
  paused.value = false
  downloadProgress.value = 0
  downloadStatus.value = 'exception'
  downloadTitle.value = '下载已取消'
  downloadTip.value = '已释放下载资源'
}

const closeDownloadDialog = () => {
  if (downloading.value && currentXHR) {
    currentXHR.abort()
    currentXHR = null
  }
  showDownloadDialog.value = false
  downloading.value = false
  paused.value = false
  downloadProgress.value = 0
  downloadStatus.value = ''
}
</script>

<style scoped>
.dashboard {
  overflow: hidden;
}

.dashboard h1 {
  color: #333;
  margin-bottom: 2rem;
}

.stats-grid {
  margin-bottom: 2rem;
}

.stat-card {
  text-align: center;
  margin-bottom: 1rem;
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

.stat-value.active {
  color: #4caf50;
}

.quick-actions {
  margin-bottom: 2rem;
}

.quick-actions h2 {
  color: #333;
  margin: 0;
  font-size: 1.2rem;
}

.action-buttons {
  display: flex;
  gap: 1rem;
}

.push-config {
  margin-bottom: 2rem;
}

.push-config h2 {
  color: #333;
  margin: 0;
  font-size: 1.2rem;
}

.tip {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.tip a {
  color: #00a1d6;
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

.recent-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

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

.video-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.video-item {
  display: flex;
  padding: 1rem;
  background: #f9f9f9;
  border-radius: 8px;
  overflow: hidden;
  transition: background 0.2s;
}

.video-item:hover {
  background: #f0f0f0;
}

.video-thumb {
  width: 160px;
  height: 90px;
  object-fit: cover;
  border-radius: 4px;
  margin-right: 1rem;
  flex-shrink: 0;
  cursor: pointer;
}

.video-info {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  cursor: pointer;
}

.video-info h4 {
  color: #333;
  margin-bottom: 0.5rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.video-info p {
  color: #666;
  font-size: 0.9rem;
}

.video-actions {
  display: flex;
  align-items: center;
  margin-left: 0.5rem;
  opacity: 0;
  transition: opacity 0.2s;
}

.video-item:hover .video-actions {
  opacity: 1;
}

.download-content {
  text-align: center;
}

.download-title {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 1rem;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.download-tip {
  margin-top: 1rem;
  color: #909399;
  font-size: 13px;
}

.download-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.quality-list {
  min-height: 100px;
}

.empty-qualities {
  text-align: center;
  color: #909399;
  padding: 2rem;
}

.quality-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border: 1px solid #eee;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.quality-item:hover {
  border-color: #00a1d6;
  background: #f0f9ff;
}

.quality-label {
  font-weight: 500;
  color: #303133;
}

.quality-desc {
  color: #909399;
  font-size: 13px;
}
</style>
