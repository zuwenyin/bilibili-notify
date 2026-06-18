import { initDatabase, getDatabase, closeDatabase } from './database';

describe('Database', () => {
  afterEach(() => {
    closeDatabase();
  });

  test('初始化数据库并创建所有表', async () => {
    const db = await initDatabase(':memory:');

    expect(db).toBeDefined();

    const tables = db.exec(
      "SELECT name FROM sqlite_master WHERE type='table'"
    );

    const tableNames = tables[0].values.map((row: any[]) => row[0] as string);
    expect(tableNames).toContain('users');
    expect(tableNames).toContain('subscriptions');
    expect(tableNames).toContain('videos');
    expect(tableNames).toContain('push_history');
    expect(tableNames).toContain('up_stats');
  });

  test('users表结构正确', async () => {
    const db = await initDatabase(':memory:');

    const result = db.exec("PRAGMA table_info(users)");
    const columnNames = result[0].values.map((row: any[]) => row[1] as string);

    expect(columnNames).toContain('id');
    expect(columnNames).toContain('username');
    expect(columnNames).toContain('password_hash');
    expect(columnNames).toContain('bilibili_uid');
    expect(columnNames).toContain('bilibili_cookie');
    expect(columnNames).toContain('pushplus_token');
    expect(columnNames).toContain('serverchan_key');
    expect(columnNames).toContain('created_at');
  });

  test('subscriptions表结构正确', async () => {
    const db = await initDatabase(':memory:');

    const result = db.exec("PRAGMA table_info(subscriptions)");
    const columnNames = result[0].values.map((row: any[]) => row[1] as string);

    expect(columnNames).toContain('id');
    expect(columnNames).toContain('user_id');
    expect(columnNames).toContain('up_mid');
    expect(columnNames).toContain('up_name');
    expect(columnNames).toContain('up_face');
    expect(columnNames).toContain('is_active');
    expect(columnNames).toContain('created_at');
  });

  test('videos表结构正确', async () => {
    const db = await initDatabase(':memory:');

    const result = db.exec("PRAGMA table_info(videos)");
    const columnNames = result[0].values.map((row: any[]) => row[1] as string);

    expect(columnNames).toContain('id');
    expect(columnNames).toContain('up_mid');
    expect(columnNames).toContain('bvid');
    expect(columnNames).toContain('title');
    expect(columnNames).toContain('description');
    expect(columnNames).toContain('pic');
    expect(columnNames).toContain('pubdate');
    expect(columnNames).toContain('view');
    expect(columnNames).toContain('like');
    expect(columnNames).toContain('coin');
    expect(columnNames).toContain('favorites');
    expect(columnNames).toContain('created_at');
  });

  test('getDatabase返回当前数据库实例', async () => {
    await initDatabase(':memory:');
    const db = getDatabase();
    expect(db).toBeDefined();
  });

  test('closeDatabase关闭数据库', async () => {
    await initDatabase(':memory:');
    closeDatabase();
    const db = getDatabase();
    expect(db).toBeNull();
  });
});
