import { vi, describe, test, expect, beforeAll, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import * as courseRepository from '../src/repositories/course.repository.js';
import { create as createCourseController, listAll as listAllCoursesController } from '../src/controllers/course.controller.js';
import { verifyToken } from '../src/middlewares/auth.middleware.js';
import { verifyRole } from '../src/middlewares/role.middleware.js';

describe('Course Controller - Integration Tests', () => {
  let app;
  let instructorToken;
  let studentToken;

  beforeAll(() => {
    // Token real de instrutor
    instructorToken = jwt.sign(
      { userId: '770e8400-e29b-41d4-a716-446655440001', role: 'instructor' },
      process.env.JWT_SECRET || 'test-secret-key',
      { expiresIn: '1h' }
    );

    // Token real de estudante
    studentToken = jwt.sign(
      { userId: '880e8400-e29b-41d4-a716-446655440002', role: 'student' },
      process.env.JWT_SECRET || 'test-secret-key',
      { expiresIn: '1h' }
    );

    app = express();
    app.use(express.json());
    app.post('/api/courses', verifyToken, verifyRole('instructor'), createCourseController);
    app.get('/api/courses', listAllCoursesController);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/courses', () => {
    test('deve criar curso com estrutura completa do banco quando autenticado como instrutor', async () => {
      const mockCourse = {
        id: '990e8400-e29b-41d4-a716-446655440003',
        title: 'Node.js Avançado',
        description: 'Curso completo de Node.js',
        instructor_id: '770e8400-e29b-41d4-a716-446655440001',
        created_at: '2024-03-06T11:00:00.000Z'
      };

      vi.spyOn(courseRepository, 'create').mockResolvedValue(mockCourse);

      const response = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({
          title: 'Node.js Avançado',
          description: 'Curso completo de Node.js'
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Curso criado!');
      expect(response.body.courseId).toEqual(mockCourse);
      expect(response.body.courseId.id).toBe('990e8400-e29b-41d4-a716-446655440003');
      expect(response.body.courseId.title).toBe('Node.js Avançado');
      expect(response.body.courseId.description).toBe('Curso completo de Node.js');
      expect(response.body.courseId.instructor_id).toBe('770e8400-e29b-41d4-a716-446655440001');
      expect(response.body.courseId.created_at).toBeDefined();
    });

    test('deve retornar 401 quando não houver token', async () => {
      const response = await request(app)
        .post('/api/courses')
        .send({
          title: 'Node.js Avançado',
          description: 'Curso completo de Node.js'
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('No token provided');
    });

    test('deve retornar 401 quando token for inválido', async () => {
      const response = await request(app)
        .post('/api/courses')
        .set('Authorization', 'Bearer token_invalido_123')
        .send({
          title: 'Node.js Avançado',
          description: 'Curso completo de Node.js'
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid token');
    });

    test('deve retornar 403 quando usuário não for instrutor', async () => {
      const response = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'Node.js Avançado',
          description: 'Curso completo de Node.js'
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Acesso negado. Apenas instrutores podem realizar esta ação.');
    });

    test('deve retornar 500 quando faltar título obrigatório', async () => {
      vi.spyOn(courseRepository, 'create').mockRejectedValue(new Error('Title is required'));

      const response = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({
          description: 'Curso sem título'
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Title is required');
    });

    test('deve retornar 500 quando houver erro no banco de dados', async () => {
      vi.spyOn(courseRepository, 'create').mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({
          title: 'Node.js Avançado',
          description: 'Curso completo'
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Database connection failed');
    });
  });

  describe('GET /api/courses', () => {
    test('deve listar todos os cursos com estrutura completa', async () => {
      const mockCourses = [
        {
          id: '990e8400-e29b-41d4-a716-446655440003',
          title: 'Node.js Avançado',
          description: 'Curso completo de Node.js',
          instructor_id: '770e8400-e29b-41d4-a716-446655440001',
          created_at: '2024-03-06T11:00:00.000Z'
        },
        {
          id: 'aa0e8400-e29b-41d4-a716-446655440004',
          title: 'React Fundamentals',
          description: 'Aprenda React do zero',
          instructor_id: '770e8400-e29b-41d4-a716-446655440001',
          created_at: '2024-03-06T12:00:00.000Z'
        }
      ];

      vi.spyOn(courseRepository, 'listAll').mockResolvedValue(mockCourses);

      const response = await request(app).get('/api/courses');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].id).toBe('990e8400-e29b-41d4-a716-446655440003');
      expect(response.body[0].title).toBe('Node.js Avançado');
      expect(response.body[0].description).toBe('Curso completo de Node.js');
      expect(response.body[0].instructor_id).toBe('770e8400-e29b-41d4-a716-446655440001');
      expect(response.body[0].created_at).toBeDefined();
      expect(response.body[1].id).toBe('aa0e8400-e29b-41d4-a716-446655440004');
      expect(response.body[1].title).toBe('React Fundamentals');
    });

    test('deve retornar array vazio quando não houver cursos', async () => {
      vi.spyOn(courseRepository, 'listAll').mockResolvedValue([]);

      const response = await request(app).get('/api/courses');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });

    test('deve retornar 500 quando houver erro no banco de dados', async () => {
      vi.spyOn(courseRepository, 'listAll').mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/courses');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Database error');
    });
  });
});
