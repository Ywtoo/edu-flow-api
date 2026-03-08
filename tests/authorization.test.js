import { vi, describe, test, expect, beforeAll, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import * as courseRepository from '../src/repositories/course.repository.js';
import { create as createCourseController } from '../src/controllers/course.controller.js';
import { verifyToken } from '../src/middlewares/auth.middleware.js';
import { verifyRole } from '../src/middlewares/role.middleware.js';

describe('Authorization for POST /api/courses', () => {
  let app;

  beforeAll(() => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret';
    app = express();
    app.use(express.json());

    app.post('/api/courses', verifyToken, verifyRole('instructor'), createCourseController);
  });

  afterEach(() => vi.restoreAllMocks());

  test('returns 401 when no token provided', async () => {
    const res = await request(app).post('/api/courses').send({ title: 'x' });
    expect(res.status).toBe(401);
  });

  test('returns 403 when token has non-instructor role', async () => {
    const studentToken = jwt.sign({ userId: 2, role: 'student' }, process.env.JWT_SECRET);
    const res = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ title: 'x' });
    expect(res.status).toBe(403);
  });

  test('returns 201 when token is instructor and course created', async () => {
    const instructorToken = jwt.sign({ userId: 3, role: 'instructor' }, process.env.JWT_SECRET);
    vi.spyOn(courseRepository, 'create').mockResolvedValue(555);

    const res = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({ title: 'Real Course', description: 'desc' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('courseId', 555);
  });
});
