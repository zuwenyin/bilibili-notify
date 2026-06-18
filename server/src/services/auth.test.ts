import { initDatabase, closeDatabase } from '../db/database';
import { registerUser, loginUser, generateToken, verifyToken } from './auth';

describe('Auth Service', () => {
  beforeEach(async () => {
    await initDatabase(':memory:');
  });

  afterEach(() => {
    closeDatabase();
  });

  test('注册新用户成功', async () => {
    const result = await registerUser('testuser', 'password123');

    expect(result).toHaveProperty('id');
    expect(result.username).toBe('testuser');
  });

  test('注册重复用户名失败', async () => {
    await registerUser('testuser', 'password123');

    await expect(registerUser('testuser', 'password123'))
      .rejects.toThrow('Username already exists');
  });

  test('登录成功返回token', async () => {
    await registerUser('testuser', 'password123');

    const result = await loginUser('testuser', 'password123');

    expect(result).toHaveProperty('token');
    expect(result.username).toBe('testuser');
  });

  test('登录失败密码错误', async () => {
    await registerUser('testuser', 'password123');

    await expect(loginUser('testuser', 'wrongpassword'))
      .rejects.toThrow('Invalid credentials');
  });

  test('登录失败用户不存在', async () => {
    await expect(loginUser('nonexistent', 'password123'))
      .rejects.toThrow('Invalid credentials');
  });

  test('生成和验证JWT token', () => {
    const token = generateToken(1, 'testuser');

    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);

    const decoded = verifyToken(token);
    expect(decoded.userId).toBe(1);
    expect(decoded.username).toBe('testuser');
  });
});
