import { initDatabase, closeDatabase } from '../db/database';
import { registerUser } from './auth';
import { bindPushPlus, bindServerChan, sendPushPlus, sendServerChan, getPushConfig, sendNotification } from './push';

jest.mock('axios');
import axios from 'axios';
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Push Service', () => {
  let userId: number;

  beforeEach(async () => {
    await initDatabase(':memory:');
    const user = await registerUser('testuser', 'password123');
    userId = user.id;
    jest.clearAllMocks();
  });

  afterEach(() => {
    closeDatabase();
  });

  test('绑定PushPlus Token成功', async () => {
    const result = await bindPushPlus(userId, 'test-token-123');

    expect(result).toBe(true);

    const config = await getPushConfig(userId);
    expect(config.pushplus_token).toBe('test-token-123');
  });

  test('绑定Server酱Key成功', async () => {
    const result = await bindServerChan(userId, 'serverchan-key-123');

    expect(result).toBe(true);

    const config = await getPushConfig(userId);
    expect(config.serverchan_key).toBe('serverchan-key-123');
  });

  test('发送PushPlus推送成功', async () => {
    mockedAxios.post.mockResolvedValue({
      data: { code: 200, msg: 'success' }
    });

    const result = await sendPushPlus(
      'test-token-123',
      '测试标题',
      '测试内容'
    );

    expect(result).toBe(true);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://www.pushplus.plus/send',
      expect.objectContaining({
        token: 'test-token-123',
        title: '测试标题',
        content: '测试内容'
      })
    );
  });

  test('PushPlus推送失败返回false', async () => {
    mockedAxios.post.mockResolvedValue({
      data: { code: 400, msg: 'error' }
    });

    const result = await sendPushPlus(
      'test-token-123',
      '测试标题',
      '测试内容'
    );

    expect(result).toBe(false);
  });

  test('PushPlus推送异常返回false', async () => {
    mockedAxios.post.mockRejectedValue(new Error('Network error'));

    const result = await sendPushPlus(
      'test-token-123',
      '测试标题',
      '测试内容'
    );

    expect(result).toBe(false);
  });

  test('发送Server酱推送成功', async () => {
    mockedAxios.get.mockResolvedValue({
      data: { code: 0, message: 'success' }
    });

    const result = await sendServerChan(
      'serverchan-key-123',
      '测试标题',
      '测试内容'
    );

    expect(result).toBe(true);
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://sctapi.ftqq.com/serverchan-key-123.send',
      expect.objectContaining({
        params: { title: '测试标题', desp: '测试内容' }
      })
    );
  });

  test('Server酱推送失败返回false', async () => {
    mockedAxios.get.mockResolvedValue({
      data: { code: 1, message: 'error' }
    });

    const result = await sendServerChan(
      'serverchan-key-123',
      '测试标题',
      '测试内容'
    );

    expect(result).toBe(false);
  });

  test('获取推送配置', async () => {
    await bindPushPlus(userId, 'test-token');

    const config = await getPushConfig(userId);

    expect(config.pushplus_token).toBe('test-token');
    expect(config.serverchan_key).toBeNull();
  });

  test('获取不存在用户的推送配置', async () => {
    const config = await getPushConfig(9999);

    expect(config.pushplus_token).toBeNull();
    expect(config.serverchan_key).toBeNull();
  });

  test('sendNotification使用PushPlus发送', async () => {
    await bindPushPlus(userId, 'test-token');
    mockedAxios.post.mockResolvedValue({
      data: { code: 200, msg: 'success' }
    });

    const result = await sendNotification(userId, '标题', '内容');

    expect(result).toBe(true);
    expect(mockedAxios.post).toHaveBeenCalled();
  });

  test('sendNotification使用Server酱发送', async () => {
    await bindServerChan(userId, 'serverchan-key');
    mockedAxios.get.mockResolvedValue({
      data: { code: 0, message: 'success' }
    });

    const result = await sendNotification(userId, '标题', '内容');

    expect(result).toBe(true);
    expect(mockedAxios.get).toHaveBeenCalled();
  });

  test('sendNotification无推送配置返回false', async () => {
    const result = await sendNotification(userId, '标题', '内容');

    expect(result).toBe(false);
  });
});
