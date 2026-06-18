import { initDatabase, closeDatabase } from '../db/database';
import { recordFollowers, getFollowersTrend, recordUpStats, getUpStats } from './stats';

describe('Stats Service', () => {
  beforeEach(async () => {
    await initDatabase(':memory:');
  });

  afterEach(() => {
    closeDatabase();
  });

  test('记录粉丝数', async () => {
    const result = await recordFollowers('123456', 10000);

    expect(result).toHaveProperty('id');
    expect(result.up_mid).toBe('123456');
    expect(result.followers).toBe(10000);
    expect(result.recorded_at).toBeDefined();
  });

  test('记录多个时间点的粉丝数', async () => {
    await recordFollowers('123456', 10000);
    await recordFollowers('123456', 10100);
    await recordFollowers('123456', 10200);

    const trend = await getFollowersTrend('123456');

    expect(trend).toHaveLength(3);
    expect(trend[0].followers).toBe(10000);
    expect(trend[2].followers).toBe(10200);
  });

  test('获取粉丝数趋势限制天数', async () => {
    await recordFollowers('123456', 10000);

    const trend = await getFollowersTrend('123456', 1);

    expect(trend.length).toBeGreaterThanOrEqual(1);
  });

  test('无数据时获取粉丝趋势返回空', async () => {
    const trend = await getFollowersTrend('999999');
    expect(trend).toHaveLength(0);
  });

  test('记录UP主综合统计', async () => {
    const result = await recordUpStats('123456', 10000, 500000, 100);

    expect(result).toHaveProperty('id');
    expect(result.up_mid).toBe('123456');
    expect(result.followers).toBe(10000);
    expect(result.total_views).toBe(500000);
    expect(result.video_count).toBe(100);
  });

  test('同一天重复记录会更新', async () => {
    await recordUpStats('123456', 10000, 500000, 100);
    const result = await recordUpStats('123456', 10100, 510000, 101);

    expect(result.followers).toBe(10100);
    expect(result.total_views).toBe(510000);
    expect(result.video_count).toBe(101);
  });

  test('获取UP主统计数据', async () => {
    await recordUpStats('123456', 10000, 500000, 100);
    await recordUpStats('123456', 10100, 510000, 101);

    const stats = await getUpStats('123456');

    expect(stats).not.toBeNull();
    expect(stats!.current.followers).toBe(10100);
    expect(stats!.current.total_views).toBe(510000);
  });

  test('获取UP主统计数据包含增长计算', async () => {
    const db = (await import('../db/database')).getDatabase()!;
    db.run(
      'INSERT INTO up_stats (up_mid, followers, total_views, video_count, recorded_at) VALUES (?, ?, ?, ?, datetime("now", "-1 day"))',
      ['123456', 10000, 500000, 100]
    );
    await recordUpStats('123456', 10100, 510000, 101);

    const stats = await getUpStats('123456');

    expect(stats!.growth.followers_growth).toBe(100);
    expect(stats!.growth.views_growth).toBe(10000);
    expect(stats!.growth.video_growth).toBe(1);
  });

  test('首次记录无增长数据', async () => {
    await recordUpStats('123456', 10000, 500000, 100);

    const stats = await getUpStats('123456');

    expect(stats).not.toBeNull();
    expect(stats!.previous).toBeNull();
    expect(stats!.growth.followers_growth).toBe(0);
    expect(stats!.growth.views_growth).toBe(0);
    expect(stats!.growth.video_growth).toBe(0);
  });

  test('无数据时获取UP主统计返回null', async () => {
    const stats = await getUpStats('999999');
    expect(stats).toBeNull();
  });
});
