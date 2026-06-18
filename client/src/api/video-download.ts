import api from './index'

export interface VideoDownloadInfo {
  bvid: string
  cid: number
  title: string
  pic: string
  desc: string
  duration: number
  owner: {
    mid: number
    name: string
    face: string
  }
  qualities: PlayQuality[]
}

export interface PlayQuality {
  qn: number
  label: string
  available: boolean
}

export interface PlayUrlResponse {
  title: string
  quality: number
  format: string
  url: string
  backupUrls: string[]
  size: number
}

export const videoDownloadApi = {
  getVideoInfo: (bvid: string) => api.get<VideoDownloadInfo>(`/video-download/info/${bvid}`),
  getPlayUrl: (bvid: string, qn: number = 80) => api.get<PlayUrlResponse>(`/video-download/play-url/${bvid}`, { params: { qn } }),
  downloadVideo: (bvid: string, qn: number = 80) => {
    const url = `/api/video-download/stream/${bvid}?qn=${qn}`
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', '')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}
