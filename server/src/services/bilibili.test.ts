import { getUserInfo, getFollows, getLatestVideos, addUpManually } from './bilibili';

jest.mock('axios');
import axios from 'axios';
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Bilibili Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('获取用户信息成功（公开API）', async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        code: 0,
        data: {
          mid: 123456,
          name: '测试UP主',
          face: 'https://example.com/face.jpg'
        }
      }
    });

    const result = await getUserInfo('123456');

    expect(result).toEqual({
      mid: '123456',
      name: '测试UP主',
      face: 'https://example.com/face.jpg'
    });
  });

  test('获取关注列表需要Cookie', async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        code: 0,
        data: {
          list: [
            { mid: 111, uname: 'UP主1', face: 'https://example.com/face1.jpg' },
            { mid: 222, uname: 'UP主2', face: 'https://example.com/face2.jpg' }
          ]
        }
      }
    });

    const cookie = 'SESSDATA=test123';
    const result = await getFollows('123456', cookie);

    expect(result.list).toHaveLength(2);
    expect(result.list[0]).toEqual({
      mid: '111',
      name: 'UP主1',
      face: 'https://example.com/face1.jpg'
    });

    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Cookie: cookie
        })
      })
    );
  });

  test('无Cookie获取关注列表失败', async () => {
    await expect(getFollows('123456')).rejects.toThrow('Cookie required');
  });

  test('手动添加UP主成功', async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        code: 0,
        data: {
          mid: 123456,
          name: '测试UP主',
          face: 'https://example.com/face.jpg'
        }
      }
    });

    const result = await addUpManually('123456');

    expect(result).toEqual({
      mid: '123456',
      name: '测试UP主',
      face: 'https://example.com/face.jpg'
    });
  });

  test('获取最新视频成功', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({
        data: {
          code: 0,
          data: {
            wbi_img: {
              img_url: 'https://i0.hdslb.com/bfs/wbi/abc123.png',
              sub_url: 'https://i0.hdslb.com/bfs/wbi/def456.png'
            }
          }
        }
      })
      .mockResolvedValueOnce({
        data: {
          code: 0,
          data: {
            list: {
              vlist: [
                {
                  bvid: 'BV1xx1111111',
                  title: '测试视频',
                  description: '视频描述',
                  pic: 'https://example.com/pic.jpg',
                  created: 1703001600,
                  play: 1000,
                  like: 100,
                  favorites: 50
                }
              ]
            }
          }
        }
      });

    const result = await getLatestVideos('123456');

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      bvid: 'BV1xx1111111',
      title: '测试视频',
      description: '视频描述',
      pic: 'https://example.com/pic.jpg',
      pubdate: expect.any(Date),
      view: 1000,
      like: 100,
      coin: 0,
      favorites: 50
    });
  });

  test('API错误时抛出异常', async () => {
    mockedAxios.get.mockRejectedValue(new Error('Network error'));

    await expect(getUserInfo('123456')).rejects.toThrow('Network error');
  });
});
