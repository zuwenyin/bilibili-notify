import axios, { AxiosRequestConfig, AxiosInstance } from 'axios';
import fs from 'fs';
import path from 'path';

interface ProxyConfig {
  enabled: boolean;
  host: string;
  port: number;
  username: string;
  password: string;
  protocol: string;
}

interface Config {
  proxy: ProxyConfig;
  bilibili: {
    requestInterval: number;
    maxRetries: number;
  };
}

let config: Config | null = null;

function getConfigPath(): string {
  return path.join(process.cwd(), 'server', 'config.json');
}

function loadConfig(): Config {
  if (config) return config;

  const configPath = getConfigPath();
  console.log('[Config] Loading config from:', configPath);
  
  if (fs.existsSync(configPath)) {
    const data = fs.readFileSync(configPath, 'utf-8');
    config = JSON.parse(data);
    console.log('[Config] Config loaded, proxy enabled:', config?.proxy?.enabled);
  } else {
    console.log('[Config] Config file not found, using defaults');
    config = {
      proxy: {
        enabled: false,
        host: '',
        port: 0,
        username: '',
        password: '',
        protocol: 'http'
      },
      bilibili: {
        requestInterval: 2000,
        maxRetries: 3
      }
    };
  }

  return config!;
}

export function getProxyConfig(): ProxyConfig {
  return loadConfig().proxy;
}

export function getBilibiliConfig() {
  return loadConfig().bilibili;
}

export function updateProxyConfig(proxy: Partial<ProxyConfig>): void {
  const cfg = loadConfig();
  cfg.proxy = { ...cfg.proxy, ...proxy };
  const configPath = getConfigPath();
  fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2));
  config = cfg;
  console.log('[Config] Proxy config updated:', cfg.proxy);
}

export function createAxiosInstance(headers?: Record<string, string>): AxiosInstance {
  const proxyCfg = getProxyConfig();
  
  const axiosConfig: AxiosRequestConfig = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'zh-CN,zh;q=0.9',
      'Referer': 'https://www.bilibili.com/',
      ...headers
    },
    timeout: 15000
  };

  if (proxyCfg.enabled && proxyCfg.host && proxyCfg.port) {
    axiosConfig.proxy = {
      protocol: proxyCfg.protocol,
      host: proxyCfg.host,
      port: proxyCfg.port,
      auth: proxyCfg.username ? {
        username: proxyCfg.username,
        password: proxyCfg.password
      } : undefined
    };

    console.log(`[Proxy] Using proxy: ${proxyCfg.host}:${proxyCfg.port}`);
  }

  return axios.create(axiosConfig);
}

export async function requestWithRetry(
  url: string,
  config?: AxiosRequestConfig,
  retries?: number
): Promise<any> {
  const bilibiliCfg = getBilibiliConfig();
  const maxRetries = retries ?? bilibiliCfg.maxRetries;
  const interval = bilibiliCfg.requestInterval;

  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const instance = createAxiosInstance(config?.headers as Record<string, string>);
      const response = await instance.get(url, config);
      return response;
    } catch (error: any) {
      lastError = error;
      console.log(`[Request] Attempt ${i + 1} failed: ${error.message}`);
      
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }
  }

  throw lastError;
}
