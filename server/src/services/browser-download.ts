import puppeteer from 'puppeteer-core';
import path from 'path';

let browserInstance: any = null;

async function getBrowser(): Promise<any> {
  if (browserInstance) {
    return browserInstance;
  }

  const chromePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'Application', 'chrome.exe')
  ];

  let chromePath = '';
  for (const p of chromePaths) {
    const fs = require('fs');
    if (fs.existsSync(p)) {
      chromePath = p;
      break;
    }
  }

  if (!chromePath) {
    throw new Error('未找到Chrome浏览器，请安装Chrome后重试');
  }

  browserInstance = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-web-security',
      '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
    ]
  });

  return browserInstance;
}

export async function getPlayUrlWithBrowser(bvid: string, qn: number, cookie?: string): Promise<{ url: string; title: string }> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    if (cookie) {
      const cookies = cookie.split(';').map(c => {
        const [name, ...value] = c.trim().split('=');
        return {
          name: name.trim(),
          value: value.join('=').trim(),
          domain: '.bilibili.com',
          path: '/'
        };
      });
      await page.setCookie(...cookies);
    }

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');

    const videoUrl = `https://www.bilibili.com/video/${bvid}`;
    console.log('[Browser] Navigating to:', videoUrl);

    await page.goto(videoUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    await page.waitForSelector('video', { timeout: 10000 });

    const title = await page.title();
    console.log('[Browser] Page title:', title);

    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const videoSrc = await page.evaluate("(() => { const v = document.querySelector('video'); return v ? (v.src || v.currentSrc || '') : ''; })()");

    if (videoSrc) {
      console.log('[Browser] Got video URL');
      return { url: videoSrc, title: title.replace(' - bilibili', '').trim() };
    }

    throw new Error('未找到视频地址');
  } finally {
    await page.close();
  }
}

export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}
