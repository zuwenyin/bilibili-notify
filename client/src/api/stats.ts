import api from './index'

export interface DashboardSummary {
  totalSubscriptions: number
  todayUpdates: number
  weekUpdates: number
  monthUpdates: number
  pushSuccessRate: number
}

export interface UpdateTrend {
  date: string
  up_mid: string
  up_name: string
  count: number
}

export interface UpRanking {
  up_mid: string
  up_name: string
  up_face: string | null
  update_count: number
  latest_update: string
}

export interface PushSuccessRate {
  status: string
  count: number
}

export interface FollowersGrowth {
  date: string
  up_mid: string
  up_name: string
  followers: number
}

export interface VideoInteractions {
  up_mid: string
  up_name: string
  total_views: number
  total_likes: number
  total_coins: number
  total_favorites: number
  video_count: number
}

export const statsApi = {
  getDashboard: () => api.get<DashboardSummary>('/stats-dashboard/dashboard'),
  getUpdatesTrend: (days: number = 30) => api.get<UpdateTrend[]>('/stats-dashboard/updates-trend', { params: { days } }),
  getUpRanking: (days: number = 30) => api.get<UpRanking[]>('/stats-dashboard/up-ranking', { params: { days } }),
  getPushSuccess: (days: number = 30) => api.get<PushSuccessRate[]>('/stats-dashboard/push-success', { params: { days } }),
  getFollowersGrowth: (days: number = 30) => api.get<FollowersGrowth[]>('/stats-dashboard/followers-growth', { params: { days } }),
  getVideoInteractions: () => api.get<VideoInteractions[]>('/stats-dashboard/video-interactions')
}
