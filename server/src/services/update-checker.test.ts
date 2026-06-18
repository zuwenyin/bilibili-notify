import { initDatabase, closeDatabase } from '../db/database';
import { registerUser } from './auth';
import { addSubscription } from './subscription';
import { checkAndUpdate, recordVideo, getLatestVideo } from './update-checker';

jest.mock('./bilibili');
import { getLatestVideos } from './bilibili';
const mockedGetLatestVideos = getLatestVideos as jest.MockedFunction<typeof getLatestVideos>;

describe('Update Checker', () => {
  let userId: number;

  beforeEach(async () => {
    await initDatabase(':memory:');
    const user = await registerUser('testuser', 'password123');
    userId = user.id;
    await addSubscription(userId, '123456', '测试UP主', 'https://example.com/face.jpg');
    jest.clearAllMocks();
  });

  afterEach(() => {
    closeDatabase();
  });

  test('记录视频成功', async () => {
    const result = await recordVideo(
      '123456',
      'BV1xx1111111',
      '测试视频',
      '视频描述',
      'https://example.com/pic.jpg',
      new Date(),
      1000,
      100,
      50,
      30
    );

    expect(result).toHaveProperty('id');
    expect(result.bvid).toBe('BV1xx1111111');
    expect(result.title).toBe('测试视频');
    expect(result.view).toBe(1000);
  });

  test('重复视频返回已有记录', async () => {
    await recordVideo('123456', 'BV1xx1111111', '测试视频', '', '', new Date(), 0, 0, 0, 0);
    const result = await recordVideo('123456', 'BV1xx1111111', '测试视频2', '', '', new Date(), 0, 0, 0, 0);

    expect(result.bvid).toBe('BV1xx1111111');
    expect(result.title).toBe('测试视频');
  });

  test('获取UP主最新视频', async () => {
    const date1 = new Date('2024-01-01');
    const date2 = new Date('2024-01-02');
    await recordVideo('123456', 'BV1xx1111111', '视频1', '', '', date1, 0, 0, 0, 0);
    await recordVideo('123456', 'BV1xx2222222', '视频2', '', '', date2, 0, 0, 0, 0);

    const latest = await getLatestVideo('123456');

    expect(latest).not.toBeNull();
    expect(latest!.bvid).toBe('BV1xx2222222');
  });

  test('无视频时获取最新视频返回null', async () => {
    const latest = await getLatestVideo('999999');
    expect(latest).toBeNull();
  });

  test('检查更新发现新视频', async () => {
    mockedGetLatestVideos.mockResolvedValue([
      {
        bvid: 'BV1xx3333333',
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

    const newVideos = await checkAndUpdate('123456');

    expect(newVideos).toHaveLength(1);
    expect(newVideos[0].bvid).toBe('BV1xx3333333');
  });

  test('检查更新无新视频返回空', async () => {
    await recordVideo('123456', 'BV1xx1111111', '视频1', '', '', new Date(), 0, 0, 0, 0);

    mockedGetLatestVideos.mockResolvedValue([
      {
        bvid: 'BV1xx1111111',
        title: '视频1',
        description: '',
        pic: '',
        pubdate: new Date(),
        view: 0,
        like: 0,
        coin: 0,
        favorites: 0
      }
    ]);

    const newVideos = await checkAndUpdate('123456');

    expect(newVideos).toHaveLength(0);
  });

  test('检查更新混合新旧视频只返回新的', async () => {
    await recordVideo('123456', 'BV1xx1111111', '旧视频', '', '', new Date(), 0, 0, 0, 0);

    mockedGetLatestVideos.mockResolvedValue([
      {
        bvid: 'BV1xx1111111',
        title: '旧视频',
        description: '',
        pic: '',
        pubdate: new Date(),
        view: 0,
        like: 0,
        coin: 0,
        favorites: 0
      },
      {
        bvid: 'BV1xx4444444',
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

    const newVideos = await checkAndUpdate('123456');

    expect(newVideos).toHaveLength(1);
    expect(newVideos[0].bvid).toBe('BV1xx4444444');
  });
});
