import { initDatabase, closeDatabase } from '../db/database';
import { registerUser } from './auth';
import { addSubscription, removeSubscription, getSubscriptions, toggleSubscription } from './subscription';

describe('Subscription Service', () => {
  let userId: number;

  beforeEach(async () => {
    await initDatabase(':memory:');
    const user = await registerUser('testuser', 'password123');
    userId = user.id;
  });

  afterEach(() => {
    closeDatabase();
  });

  test('添加订阅成功', async () => {
    const result = await addSubscription(userId, '123456', '测试UP主', 'https://example.com/face.jpg');

    expect(result).toHaveProperty('id');
    expect(result.up_mid).toBe('123456');
    expect(result.up_name).toBe('测试UP主');
    expect(result.is_active).toBe(true);
  });

  test('重复订阅返回已有订阅', async () => {
    await addSubscription(userId, '123456', '测试UP主', 'https://example.com/face.jpg');
    const result = await addSubscription(userId, '123456', '测试UP主', 'https://example.com/face.jpg');

    expect(result.up_mid).toBe('123456');
  });

  test('删除订阅成功', async () => {
    await addSubscription(userId, '123456', '测试UP主', 'https://example.com/face.jpg');
    const result = await removeSubscription(userId, '123456');

    expect(result).toBe(true);

    const subs = await getSubscriptions(userId);
    expect(subs).toHaveLength(0);
  });

  test('获取订阅列表', async () => {
    await addSubscription(userId, '111', 'UP主1', 'https://example.com/face1.jpg');
    await addSubscription(userId, '222', 'UP主2', 'https://example.com/face2.jpg');

    const subs = await getSubscriptions(userId);

    expect(subs).toHaveLength(2);
    expect(subs[0].up_mid).toBe('111');
    expect(subs[1].up_mid).toBe('222');
  });

  test('切换订阅状态', async () => {
    await addSubscription(userId, '123456', '测试UP主', 'https://example.com/face.jpg');

    const result = await toggleSubscription(userId, '123456');
    expect(result.is_active).toBe(false);

    const result2 = await toggleSubscription(userId, '123456');
    expect(result2.is_active).toBe(true);
  });

  test('获取活跃订阅列表', async () => {
    await addSubscription(userId, '111', 'UP主1', 'https://example.com/face1.jpg');
    await addSubscription(userId, '222', 'UP主2', 'https://example.com/face2.jpg');
    await toggleSubscription(userId, '222');

    const subs = await getSubscriptions(userId, true);

    expect(subs).toHaveLength(1);
    expect(subs[0].up_mid).toBe('111');
  });
});
