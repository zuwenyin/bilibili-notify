import axios from 'axios';
import crypto from 'crypto';

export interface UserInfo {
  mid: string;
  name: string;
  face: string;
}

export interface UpDetailInfo {
  mid: string;
  name: string;
  face: string;
  sign: string;
  followers: number;
  following: number;
  videoCount: number;
  level: number;
}

const upDetailCache = new Map<string, { data: UpDetailInfo; expiry: number }>();
const CACHE_TTL = 5 * 60 * 1000;

export interface FollowInfo {
  mid: string;
  name: string;
  face: string;
}

export interface VideoInfo {
  bvid: string;
  title: string;
  description: string;
  pic: string;
  pubdate: Date;
  view: number;
  like: number;
  coin: number;
  favorites: number;
}

const BILIBILI_API = {
  userInfo: 'https://api.bilibili.com/x/space/acc/info',
  followings: 'https://api.bilibili.com/x/relation/followings',
  spaceArcs: 'https://api.bilibili.com/x/space/wbi/arc/search'
};

const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
};

const MIXIN_KEY_ENC_TAB = [
  46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35,
  27, 43, 5, 49, 33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13,
  37, 48, 7, 16, 24, 55, 40, 61, 26, 17, 0, 1, 60, 51, 30, 4,
  22, 25, 54, 21, 56, 59, 6, 63, 57, 62, 11, 36, 20, 34, 44, 52
];

let wbiKeys: { img_key: string; sub_key: string } | null = null;
let wbiKeysExpiry = 0;

function getMixinKey(orig: string): string {
  return MIXIN_KEY_ENC_TAB.map(n => orig[n]).join('').slice(0, 32);
}

export function encWbi(params: Record<string, any>, imgKey: string, subKey: string): Record<string, any> {
  const mixinKey = getMixinKey(imgKey + subKey);
  const wts = Math.floor(Date.now() / 1000);

  const filtered: Record<string, string> = {};
  const keys = Object.keys(params).sort();
  for (const key of keys) {
    const val = String(params[key]).replace(/[!'()*]/g, '');
    filtered[key] = val;
  }
  filtered.wts = String(wts);

  const query = Object.entries(filtered).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
  const w_rid = crypto.createHash('md5').update(query + mixinKey).digest('hex');

  return { ...filtered, w_rid };
}

export function clearWbiKeysCache(): void {
  wbiKeys = null;
  wbiKeysExpiry = 0;
}

export async function getWbiKeys(cookie?: string): Promise<{ img_key: string; sub_key: string }> {
  const headers: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://www.bilibili.com'
  };
  if (cookie) {
    headers.Cookie = cookie;
  }

  console.log('[WBI] Fetching fresh keys...');
  const response = await axios.get('https://api.bilibili.com/x/web-interface/nav', { headers });
  console.log('[WBI] Nav response code:', response.data.code);
  
  const wbiImg = response.data.data?.wbi_img;
  if (!wbiImg) {
    console.error('[WBI] No wbi_img in response');
    throw new Error('Failed to get WBI keys');
  }

  const imgUrl = wbiImg.img_url;
  const subUrl = wbiImg.sub_url;
  const img_key = imgUrl.split('/').pop()!.split('.')[0];
  const sub_key = subUrl.split('/').pop()!.split('.')[0];

  console.log('[WBI] Got fresh keys');
  wbiKeys = { img_key, sub_key };
  wbiKeysExpiry = Date.now() + 5 * 60 * 1000;

  return wbiKeys;
}

export async function getUserInfo(mid: string): Promise<UserInfo> {
  const response = await axios.get(BILIBILI_API.userInfo, {
    params: { mid },
    headers: DEFAULT_HEADERS
  });

  if (response.data.code !== 0) {
    throw new Error(`Bilibili API error: ${response.data.message}`);
  }

  const { data } = response.data;
  return {
    mid: String(data.mid),
    name: data.name,
    face: data.face
  };
}

export async function getUpDetailInfo(mid: string, cookie?: string): Promise<UpDetailInfo> {
  const cached = upDetailCache.get(mid);
  if (cached && Date.now() < cached.expiry) {
    return cached.data;
  }

  const headers: Record<string, string> = { ...DEFAULT_HEADERS };
  if (cookie) {
    headers.Cookie = cookie;
    headers.Referer = 'https://www.bilibili.com';
  }

  const infoRes = await axios.get(BILIBILI_API.userInfo, {
    params: { mid },
    headers
  });

  if (infoRes.data.code !== 0) {
    throw new Error(`Bilibili API error: ${infoRes.data.message}`);
  }

  const { data } = infoRes.data;

  let followers = 0;
  let following = 0;
  try {
    await new Promise(resolve => setTimeout(resolve, 300));
    const statRes = await axios.get('https://api.bilibili.com/x/relation/stat', {
      params: { vmid: mid },
      headers
    });
    const statData = statRes.data.data || {};
    followers = statData.follower || 0;
    following = statData.following || 0;
  } catch {
    // 忽略粉丝数据获取失败
  }

  const result: UpDetailInfo = {
    mid: String(data.mid),
    name: data.name,
    face: data.face,
    sign: data.sign || '',
    followers,
    following,
    videoCount: 0,
    level: data.level || 0
  };

  upDetailCache.set(mid, { data: result, expiry: Date.now() + CACHE_TTL });

  return result;
}

export async function addUpManually(mid: string): Promise<UserInfo> {
  return getUserInfo(mid);
}

export interface FollowsResult {
  list: FollowInfo[];
  total: number;
}

export async function getFollows(mid: string, cookie?: string, pn: number = 1, ps: number = 50): Promise<FollowsResult> {
  if (!cookie) {
    throw new Error('Cookie required');
  }

  const response = await axios.get(BILIBILI_API.followings, {
    params: { vmid: mid, pn, ps },
    headers: {
      ...DEFAULT_HEADERS,
      Cookie: cookie,
      Referer: 'https://www.bilibili.com'
    }
  });

  if (response.data.code !== 0) {
    throw new Error(`Bilibili API error: ${response.data.message}`);
  }

  const total = response.data.data?.total || 0;
  const list = response.data.data?.list;
  if (!Array.isArray(list)) {
    return { list: [], total };
  }

  return {
    list: list.map((item: any) => ({
      mid: String(item.mid),
      name: item.uname,
      face: item.face
    })),
    total
  };
}

export async function getLatestVideos(mid: string, cookie?: string): Promise<VideoInfo[]> {
  const headers: Record<string, string> = { ...DEFAULT_HEADERS };
  if (cookie) {
    headers.Cookie = cookie;
    headers.Referer = 'https://www.bilibili.com';
  }

  const { img_key, sub_key } = await getWbiKeys(cookie);
  const signedParams = encWbi({ mid, pn: 1, ps: 10, order: 'pubdate' }, img_key, sub_key);

  console.log(`[Bilibili] getLatestVideos mid=${mid}, cookie: ${cookie ? 'present' : 'missing'}`);
  const response = await axios.get(BILIBILI_API.spaceArcs, {
    params: signedParams,
    headers
  });

  console.log(`[Bilibili] spaceArcs response code=${response.data.code}, message=${response.data.message}`);

  if (response.data.code !== 0) {
    throw new Error(`Bilibili API error: ${response.data.message}`);
  }

  const { list } = response.data.data;
  if (!list || !list.vlist) {
    return [];
  }

  return list.vlist.map((item: any) => ({
    bvid: item.bvid,
    title: item.title,
    description: item.description || '',
    pic: item.pic,
    pubdate: new Date(item.created * 1000),
    view: item.play || 0,
    like: item.like || 0,
    coin: 0,
    favorites: item.favorites || 0
  }));
}
