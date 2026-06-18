import axios from 'axios';

const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Referer': 'https://www.bilibili.com',
  'Origin': 'https://www.bilibili.com'
};

export interface VideoInfo {
  bvid: string;
  cid: number;
  title: string;
  pic: string;
  desc: string;
  duration: number;
  owner: {
    mid: number;
    name: string;
    face: string;
  };
}

export interface PlayQuality {
  qn: number;
  label: string;
  available: boolean;
}

export interface PlayUrl {
  quality: number;
  format: string;
  url: string;
  backupUrls: string[];
  size: number;
}

const QUALITY_MAP: Record<number, string> = {
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
};

export async function getVideoInfo(bvid: string, cookie?: string): Promise<VideoInfo> {
  const headers: Record<string, string> = { ...DEFAULT_HEADERS };
  if (cookie) {
    headers.Cookie = cookie;
  }

  const response = await axios.get('https://api.bilibili.com/x/web-interface/view', {
    params: { bvid },
    headers
  });

  if (response.data.code !== 0) {
    throw new Error(`获取视频信息失败: ${response.data.message}`);
  }

  const data = response.data.data;
  return {
    bvid: data.bvid,
    cid: data.cid,
    title: data.title,
    pic: data.pic,
    desc: data.desc || '',
    duration: data.duration,
    owner: {
      mid: data.owner.mid,
      name: data.owner.name,
      face: data.owner.face
    }
  };
}

export async function getAvailableQualities(bvid: string, cid: number, cookie?: string): Promise<PlayQuality[]> {
  const headers: Record<string, string> = { ...DEFAULT_HEADERS };
  if (cookie) {
    headers.Cookie = cookie;
  }

  const response = await axios.get('https://api.bilibili.com/x/player/playurl', {
    params: {
      bvid,
      cid,
      fnval: 16,
      wts: Math.floor(Date.now() / 1000)
    },
    headers
  });

  if (response.data.code !== 0) {
    throw new Error(`获取清晰度失败: ${response.data.message}`);
  }

  const acceptQuality = response.data.data?.accept_quality || [];

  const qualities: PlayQuality[] = [];
  const availableQns = new Set(acceptQuality);

  for (const [qn, label] of Object.entries(QUALITY_MAP)) {
    const qnNum = parseInt(qn);
    qualities.push({
      qn: qnNum,
      label,
      available: availableQns.has(qnNum)
    });
  }

  return qualities.filter(q => q.available);
}

export async function getPlayUrl(bvid: string, cid: number, qn: number, cookie?: string): Promise<PlayUrl> {
  const headers: Record<string, string> = { ...DEFAULT_HEADERS };
  if (cookie) {
    headers.Cookie = cookie;
  }

  console.log('[VideoDownload] Getting play url for bvid:', bvid, 'cid:', cid, 'qn:', qn);

  const response = await axios.get('https://api.bilibili.com/x/player/playurl', {
    params: {
      bvid,
      cid,
      qn,
      fnval: 1,
      fourk: 1,
      wts: Math.floor(Date.now() / 1000)
    },
    headers
  });

  console.log('[VideoDownload] Response code:', response.data.code, 'message:', response.data.message);

  if (response.data.code !== 0) {
    throw new Error(`获取播放地址失败: ${response.data.message}`);
  }

  const data = response.data.data;
  const durl = data.durl?.[0];

  if (!durl) {
    throw new Error('未找到播放地址，该视频可能仅支持DASH格式');
  }

  return {
    quality: data.quality,
    format: data.format,
    url: durl.url,
    backupUrls: durl.backup_url || [],
    size: durl.size
  };
}
