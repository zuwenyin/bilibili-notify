import { initDatabase, getDatabase, closeDatabase } from '../db/database';

describe('Videos API Pagination', () => {
  beforeEach(async () => {
    await initDatabase(':memory:');
  });

  afterEach(() => {
    closeDatabase();
  });

  test('分页查询应该返回正确格式', async () => {
    const db = getDatabase();
    if (!db) return;

    // Insert test data
    db.exec(`INSERT INTO users (id, username, password_hash) VALUES (1, 'testuser', 'hash')`);
    db.exec(`INSERT INTO subscriptions (user_id, up_mid, up_name) VALUES (1, '123456', 'TestUP')`);
    db.exec(`INSERT INTO videos (bvid, title, up_mid, pic, pubdate) VALUES ('BV123', 'Test Video', '123456', 'http://test.com/pic.jpg', '2024-01-01')`);

    // Test count query
    const countStmt = db.prepare(`
      SELECT COUNT(*) as total
      FROM videos v
      INNER JOIN subscriptions s ON v.up_mid = s.up_mid
      WHERE s.user_id = ?
    `);
    countStmt.bind([1]);
    let total = 0;
    if (countStmt.step()) {
      total = countStmt.getAsObject().total as number;
    }
    countStmt.free();

    expect(total).toBe(1);

    // Test pagination query
    const stmt = db.prepare(`
      SELECT v.*, s.up_name
      FROM videos v
      INNER JOIN subscriptions s ON v.up_mid = s.up_mid
      WHERE s.user_id = ?
      ORDER BY v.pubdate DESC
      LIMIT ? OFFSET ?
    `);
    stmt.bind([1, 10, 0]);
    const videos: any[] = [];
    while (stmt.step()) {
      videos.push(stmt.getAsObject());
    }
    stmt.free();

    expect(videos).toHaveLength(1);
    expect(videos[0].bvid).toBe('BV123');
    expect(videos[0].up_name).toBe('TestUP');
  });

  test('LIMIT OFFSET应该正确工作', async () => {
    const db = getDatabase();
    if (!db) return;

    // Insert test data
    db.exec(`INSERT INTO users (id, username, password_hash) VALUES (1, 'testuser', 'hash')`);
    db.exec(`INSERT INTO subscriptions (user_id, up_mid, up_name) VALUES (1, '123456', 'TestUP')`);
    db.exec(`INSERT INTO videos (bvid, title, up_mid, pic, pubdate) VALUES ('BV1', 'Video 1', '123456', 'http://test.com/1.jpg', '2024-01-03')`);
    db.exec(`INSERT INTO videos (bvid, title, up_mid, pic, pubdate) VALUES ('BV2', 'Video 2', '123456', 'http://test.com/2.jpg', '2024-01-02')`);
    db.exec(`INSERT INTO videos (bvid, title, up_mid, pic, pubdate) VALUES ('BV3', 'Video 3', '123456', 'http://test.com/3.jpg', '2024-01-01')`);

    // Page 1, size 2
    const stmt1 = db.prepare(`
      SELECT v.*, s.up_name
      FROM videos v
      INNER JOIN subscriptions s ON v.up_mid = s.up_mid
      WHERE s.user_id = ?
      ORDER BY v.pubdate DESC
      LIMIT ? OFFSET ?
    `);
    stmt1.bind([1, 2, 0]);
    const videos1: any[] = [];
    while (stmt1.step()) {
      videos1.push(stmt1.getAsObject());
    }
    stmt1.free();

    expect(videos1).toHaveLength(2);
    expect(videos1[0].bvid).toBe('BV1');
    expect(videos1[1].bvid).toBe('BV2');

    // Page 2, size 2
    const stmt2 = db.prepare(`
      SELECT v.*, s.up_name
      FROM videos v
      INNER JOIN subscriptions s ON v.up_mid = s.up_mid
      WHERE s.user_id = ?
      ORDER BY v.pubdate DESC
      LIMIT ? OFFSET ?
    `);
    stmt2.bind([1, 2, 2]);
    const videos2: any[] = [];
    while (stmt2.step()) {
      videos2.push(stmt2.getAsObject());
    }
    stmt2.free();

    expect(videos2).toHaveLength(1);
    expect(videos2[0].bvid).toBe('BV3');
  });
});
