<template>
  <div class="statistics">
    <div class="page-header">
      <h1>数据统计</h1>
      <el-select v-model="selectedDays" @change="loadData" style="width: 120px">
        <el-option :value="7" label="近7天" />
        <el-option :value="30" label="近30天" />
        <el-option :value="90" label="近90天" />
      </el-select>
    </div>

    <el-row :gutter="20" class="summary-cards">
      <el-col :xs="12" :sm="6">
        <el-card class="summary-card">
          <div class="card-icon subscriptions">
            <el-icon :size="24"><User /></el-icon>
          </div>
          <div class="card-content">
            <div class="card-value">{{ summary.totalSubscriptions }}</div>
            <div class="card-label">总订阅数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card class="summary-card">
          <div class="card-icon today">
            <el-icon :size="24"><VideoPlay /></el-icon>
          </div>
          <div class="card-content">
            <div class="card-value">{{ summary.todayUpdates }}</div>
            <div class="card-label">今日更新</div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card class="summary-card">
          <div class="card-icon week">
            <el-icon :size="24"><Calendar /></el-icon>
          </div>
          <div class="card-content">
            <div class="card-value">{{ summary.weekUpdates }}</div>
            <div class="card-label">本周更新</div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card class="summary-card">
          <div class="card-icon push">
            <el-icon :size="24"><Promotion /></el-icon>
          </div>
          <div class="card-content">
            <div class="card-value">{{ summary.pushSuccessRate }}%</div>
            <div class="card-label">推送覆盖率</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :xs="24" :lg="16">
        <el-card class="chart-card">
          <template #header>
            <h3>更新趋势</h3>
          </template>
          <div ref="updateTrendChart" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="8">
        <el-card class="chart-card">
          <template #header>
            <h3>推送成功率</h3>
          </template>
          <div ref="pushRateChart" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :xs="24" :lg="12">
        <el-card class="chart-card">
          <template #header>
            <h3>UP主活跃度排行</h3>
          </template>
          <el-table :data="upRanking" stripe style="width: 100%">
            <el-table-column label="排名" width="60">
              <template #default="{ $index }">
                <span :class="['rank-badge', $index < 3 ? 'top' : '']">{{ $index + 1 }}</span>
              </template>
            </el-table-column>
            <el-table-column label="UP主" min-width="150">
              <template #default="{ row }">
                <div class="up-info">
                  <img :src="`/api/bilibili/proxy?url=${encodeURIComponent(row.up_face || '')}`" class="up-avatar" v-if="row.up_face" />
                  <span>{{ row.up_name }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="update_count" label="更新数" width="80" />
            <el-table-column label="最近更新" width="120">
              <template #default="{ row }">
                {{ formatDate(row.latest_update) }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="12">
        <el-card class="chart-card">
          <template #header>
            <h3>粉丝增长趋势</h3>
          </template>
          <div ref="followersChart" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="chart-card interactions-card">
      <template #header>
        <h3>视频互动统计</h3>
      </template>
      <el-table :data="videoInteractions" stripe style="width: 100%">
        <el-table-column label="UP主" min-width="150">
          <template #default="{ row }">
            <div class="up-info">
              <img :src="`/api/bilibili/proxy?url=${encodeURIComponent(row.up_face || '')}`" class="up-avatar" v-if="row.up_face" />
              <span>{{ row.up_name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="播放量" width="120">
          <template #default="{ row }">
            {{ formatNumber(row.total_views) }}
          </template>
        </el-table-column>
        <el-table-column label="点赞" width="100">
          <template #default="{ row }">
            {{ formatNumber(row.total_likes) }}
          </template>
        </el-table-column>
        <el-table-column label="投币" width="100">
          <template #default="{ row }">
            {{ formatNumber(row.total_coins) }}
          </template>
        </el-table-column>
        <el-table-column label="收藏" width="100">
          <template #default="{ row }">
            {{ formatNumber(row.total_favorites) }}
          </template>
        </el-table-column>
        <el-table-column prop="video_count" label="视频数" width="80" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { User, VideoPlay, Calendar, Promotion } from '@element-plus/icons-vue'
import { statsApi, DashboardSummary, UpRanking, VideoInteractions } from '../api/stats'

const selectedDays = ref(30)
const summary = ref<DashboardSummary>({
  totalSubscriptions: 0,
  todayUpdates: 0,
  weekUpdates: 0,
  monthUpdates: 0,
  pushSuccessRate: 0
})
const upRanking = ref<UpRanking[]>([])
const videoInteractions = ref<VideoInteractions[]>([])

const updateTrendChart = ref<HTMLElement>()
const pushRateChart = ref<HTMLElement>()
const followersChart = ref<HTMLElement>()

let updateTrendInstance: echarts.ECharts | null = null
let pushRateInstance: echarts.ECharts | null = null
let followersInstance: echarts.ECharts | null = null

const formatDate = (date: string) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('zh-CN')
}

const formatNumber = (num: number) => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  }
  return num.toLocaleString()
}

const initCharts = () => {
  if (updateTrendChart.value) {
    updateTrendInstance = echarts.init(updateTrendChart.value)
  }
  if (pushRateChart.value) {
    pushRateInstance = echarts.init(pushRateChart.value)
  }
  if (followersChart.value) {
    followersInstance = echarts.init(followersChart.value)
  }
}

const renderUpdateTrend = (data: any[]) => {
  if (!updateTrendInstance) return

  const dateMap = new Map<string, Map<string, { name: string; count: number }>>()
  const upNames = new Set<string>()

  data.forEach(item => {
    upNames.add(item.up_name)
    if (!dateMap.has(item.date)) {
      dateMap.set(item.date, new Map())
    }
    dateMap.get(item.date)!.set(item.up_name, { name: item.up_name, count: item.count })
  })

  const dates = Array.from(dateMap.keys()).sort()
  const series = Array.from(upNames).map(name => ({
    name,
    type: 'line' as const,
    smooth: true,
    data: dates.map(date => {
      const upData = dateMap.get(date)?.get(name)
      return upData ? upData.count : 0
    })
  }))

  updateTrendInstance.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: Array.from(upNames), type: 'scroll' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: dates },
    yAxis: { type: 'value', minInterval: 1 },
    series
  })
}

const renderPushRate = (data: { status: string; count: number }[]) => {
  if (!pushRateInstance) return

  pushRateInstance.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { orient: 'vertical', left: 'left' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: false, position: 'center' },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
      labelLine: { show: false },
      data: data.map(item => ({
        name: item.status,
        value: item.count,
        itemStyle: { color: item.status === '已推送' ? '#67c23a' : '#909399' }
      }))
    }]
  })
}

const renderFollowersGrowth = (data: any[]) => {
  if (!followersInstance) return

  const dateMap = new Map<string, Map<string, number>>()
  const upNames = new Set<string>()

  data.forEach(item => {
    upNames.add(item.up_name)
    if (!dateMap.has(item.date)) {
      dateMap.set(item.date, new Map())
    }
    dateMap.get(item.date)!.set(item.up_name, item.followers)
  })

  const dates = Array.from(dateMap.keys()).sort()
  const series = Array.from(upNames).map(name => ({
    name,
    type: 'line' as const,
    smooth: true,
    data: dates.map(date => dateMap.get(date)?.get(name) ?? null)
  }))

  followersInstance.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: Array.from(upNames), type: 'scroll' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: dates },
    yAxis: { type: 'value' },
    series
  })
}

const loadData = async () => {
  try {
    const [summaryRes, trendRes, rankingRes, pushRes, followersRes, interactionsRes] = await Promise.all([
      statsApi.getDashboard(),
      statsApi.getUpdatesTrend(selectedDays.value),
      statsApi.getUpRanking(selectedDays.value),
      statsApi.getPushSuccess(selectedDays.value),
      statsApi.getFollowersGrowth(selectedDays.value),
      statsApi.getVideoInteractions()
    ])

    summary.value = summaryRes.data
    upRanking.value = rankingRes.data
    videoInteractions.value = interactionsRes.data

    await nextTick()
    renderUpdateTrend(trendRes.data)
    renderPushRate(pushRes.data)
    renderFollowersGrowth(followersRes.data)
  } catch (error) {
    console.error('Failed to load statistics:', error)
  }
}

const handleResize = () => {
  updateTrendInstance?.resize()
  pushRateInstance?.resize()
  followersInstance?.resize()
}

onMounted(async () => {
  await nextTick()
  initCharts()
  loadData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  updateTrendInstance?.dispose()
  pushRateInstance?.dispose()
  followersInstance?.dispose()
})
</script>

<style scoped>
.statistics {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h1 {
  margin: 0;
  color: #303133;
}

.summary-cards {
  margin-bottom: 24px;
}

.summary-card {
  display: flex;
  align-items: center;
  padding: 20px;
  margin-bottom: 12px;
}

.summary-card :deep(.el-card__body) {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-icon.subscriptions { background: #e6f7ff; color: #1890ff; }
.card-icon.today { background: #f6ffed; color: #52c41a; }
.card-icon.week { background: #fff7e6; color: #faad14; }
.card-icon.push { background: #f9f0ff; color: #722ed1; }

.card-content {
  flex: 1;
}

.card-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  line-height: 1.2;
}

.card-label {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}

.chart-card {
  margin-bottom: 24px;
}

.chart-card h3 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.chart-container {
  height: 320px;
}

.up-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.up-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
}

.rank-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #f0f0f0;
  color: #666;
  font-size: 12px;
  font-weight: 500;
}

.rank-badge.top {
  background: #ffd700;
  color: #333;
}

.interactions-card {
  margin-bottom: 24px;
}
</style>
