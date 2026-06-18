import { initDatabase, closeDatabase } from '../db/database';
import { generateToken } from '../services/auth';
import { authMiddleware, AuthRequest } from './auth';
import { Request, Response } from 'express';

describe('Auth Middleware', () => {
  beforeEach(async () => {
    await initDatabase(':memory:');
  });

  afterEach(() => {
    closeDatabase();
  });

  test('有效token通过认证', () => {
    const token = generateToken(1, 'testuser');
    const req = { headers: { authorization: `Bearer ${token}` } } as Request;
    const res = {} as Response;
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect((req as AuthRequest).user).toMatchObject({ userId: 1, username: 'testuser' });
  });

  test('无token拒绝请求', () => {
    const req = { headers: {} } as Request;
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
    expect(next).not.toHaveBeenCalled();
  });

  test('无效token拒绝请求', () => {
    const req = { headers: { authorization: 'Bearer invalidtoken' } } as Request;
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
    expect(next).not.toHaveBeenCalled();
  });

  test('Bearer格式错误拒绝请求', () => {
    const req = { headers: { authorization: 'Token abc123' } } as Request;
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
