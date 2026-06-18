import { initDatabase, closeDatabase } from '../db/database';
import { registerUser } from './auth';
import { addSubscription, toggleSubscription } from './subscription';
import { startScheduler, stopScheduler, runCheckOnce } from './scheduler';

jest.mock('./update-checker');
import { checkAndUpdate } from './update-checker';
const mockedCheckAndUpdate = checkAndUpdate as jest.MockedFunction<typeof checkAndUpdate>;

jest.mock('./push');
import { sendNotification } from './push';
const mockedSendNotification = sendNotification as jest.MockedFunction<typeof sendNotification>;

describe('Scheduler', () => {
  beforeEach(async () => {
    await initDatabase(':memory:');
    jest.clearAllMocks();
  });

  afterEach(() => {
    stopScheduler();
    closeDatabase();
  });

  test('启动调度器', () => {
    const result = startScheduler();
    expect(result).toBe(true);
  });

  test('重复启动调度器返回false', () => {
    startScheduler();
    const result = startScheduler();
    expect(result).toBe(false);
  });

  test('停止调度器', () => {
    startScheduler();
    const result = stopScheduler();
    expect(result).toBe(true);
  });

  test('未启动时停止调度器返回false', () => {
    const result = stopScheduler();
    expect(result).toBe(false);
  });

  test('执行一次检查 - 有新视频发送通知', async () => {
    const user = await registerUser('testuser', 'password123');
    await addSubscription(user.id, '123456', '测试UP主', 'https://example.com/face.jpg');

    mockedCheckAndUpdate.mockResolvedValue([
      {
        bvid: 'BV1xx1111111',
        title: '新视频',
        description: '',
        pic: '',
        pubdate: new Date(),
        view: 0,
        like: 0,
        coin: 0,
        favorites: 0
      }
    ]);
    mockedSendNotification.mockResolvedValue(true);

    await runCheckOnce();

    expect(mockedCheckAndUpdate).toHaveBeenCalledWith('123456');
    expect(mockedSendNotification).toHaveBeenCalledWith(
      user.id,
      expect.stringContaining('新视频'),
      expect.any(String)
    );
  });

  test('执行一次检查 - 无新视频不发送通知', async () => {
    const user = await registerUser('testuser', 'password123');
    await addSubscription(user.id, '123456', '测试UP主', 'https://example.com/face.jpg');

    mockedCheckAndUpdate.mockResolvedValue([]);

    await runCheckOnce();

    expect(mockedCheckAndUpdate).toHaveBeenCalledWith('123456');
    expect(mockedSendNotification).not.toHaveBeenCalled();
  });

  test('执行一次检查 - 多个用户订阅同一UP主都收到通知', async () => {
    const user1 = await registerUser('user1', 'password123');
    const user2 = await registerUser('user2', 'password123');
    await addSubscription(user1.id, '123456', '测试UP主', 'https://example.com/face.jpg');
    await addSubscription(user2.id, '123456', '测试UP主', 'https://example.com/face.jpg');

    mockedCheckAndUpdate.mockResolvedValue([
      {
        bvid: 'BV1xx1111111',
        title: '新视频',
        description: '',
        pic: '',
        pubdate: new Date(),
        view: 0,
        like: 0,
        coin: 0,
        favorites: 0
      }
    ]);
    mockedSendNotification.mockResolvedValue(true);

    await runCheckOnce();

    expect(mockedSendNotification).toHaveBeenCalledTimes(2);
  });

  test('执行一次检查 - 只检查活跃订阅', async () => {
    const user = await registerUser('testuser', 'password123');
    await addSubscription(user.id, '111', 'UP主1', 'https://example.com/face1.jpg');
    await addSubscription(user.id, '222', 'UP主2', 'https://example.com/face2.jpg');
    await toggleSubscription(user.id, '222');

    mockedCheckAndUpdate.mockResolvedValue([]);
    mockedSendNotification.mockResolvedValue(true);

    await runCheckOnce();

    expect(mockedCheckAndUpdate).toHaveBeenCalledTimes(1);
    expect(mockedCheckAndUpdate).toHaveBeenCalledWith('111');
  });

  test('执行一次检查 - API错误不中断', async () => {
    const user = await registerUser('testuser', 'password123');
    await addSubscription(user.id, '123456', '测试UP主', 'https://example.com/face.jpg');

    mockedCheckAndUpdate.mockRejectedValue(new Error('API Error'));

    await runCheckOnce();

    expect(mockedCheckAndUpdate).toHaveBeenCalled();
    expect(mockedSendNotification).not.toHaveBeenCalled();
  });
});
