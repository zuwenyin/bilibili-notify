import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { getProxyConfig, updateProxyConfig } from '../services/proxy';

const router = Router();

router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const proxyConfig = getProxyConfig();
    res.json({
      enabled: proxyConfig.enabled,
      host: proxyConfig.host,
      port: proxyConfig.port,
      protocol: proxyConfig.protocol,
      hasAuth: !!proxyConfig.username
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || '获取代理配置失败' });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { enabled, host, port, username, password, protocol } = req.body;

    updateProxyConfig({
      enabled: enabled ?? false,
      host: host || '',
      port: port || 0,
      username: username || '',
      password: password || '',
      protocol: protocol || 'http'
    });

    res.json({ message: '代理配置已更新' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || '更新代理配置失败' });
  }
});

router.post('/test', async (req: AuthRequest, res: Response) => {
  try {
    const { createAxiosInstance } = await import('../services/proxy');
    const http = createAxiosInstance();
    
    const response = await http.get('https://api.bilibili.com/x/web-interface/nav', {
      timeout: 10000
    });

    res.json({ 
      success: true, 
      message: '代理连接成功',
      code: response.data.code
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: error.message || '代理连接失败' 
    });
  }
});

export default router;
