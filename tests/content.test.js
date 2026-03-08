import { vi, describe, test, expect, beforeAll, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import * as moduleRepository from '../src/repositories/module.repository.js';
import * as lessonRepository from '../src/repositories/lesson.repository.js';
import {
  createModule,
  createLesson,
  listModulesByCourse,
  getLessonByID,
  getFullCourseContent
} from '../src/controllers/content.controller.js';
import { verifyToken } from '../src/middlewares/auth.middleware.js';
import { verifyRole } from '../src/middlewares/role.middleware.js';

describe('Content Controller - Integration Tests', () => {
  let app;
  let instructorToken;
  let studentToken;

  beforeAll(() => {
    instructorToken = jwt.sign(
      { userId: '770e8400-e29b-41d4-a716-446655440001', role: 'instructor' },
      process.env.JWT_SECRET || 'test-secret-key',
      { expiresIn: '1h' }
    );

    studentToken = jwt.sign(
      { userId: '880e8400-e29b-41d4-a716-446655440002', role: 'student' },
      process.env.JWT_SECRET || 'test-secret-key',
      { expiresIn: '1h' }
    );

    app = express();
    app.use(express.json());
    app.post('/api/courses/:courseId/modules', verifyToken, verifyRole('instructor'), createModule);
    app.post('/api/modules/:moduleId/lessons', verifyToken, verifyRole('instructor'), createLesson);
    app.get('/api/courses/:courseId/modules', listModulesByCourse);
    app.get('/api/lessons/:lessonId', getLessonByID);
    app.get('/api/courses/:courseId/content', getFullCourseContent);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/courses/:courseId/modules', () => {
    test('deve criar módulo com estrutura completa do banco quando autenticado como instrutor', async () => {
      const mockModule = {
        id: 'bb0e8400-e29b-41d4-a716-446655440005',
        course_id: 'aa0e8400-e29b-41d4-a716-446655440004',
        title: 'Introdução ao Node.js',
        ordering: 1
      };

      vi.spyOn(moduleRepository, 'create').mockResolvedValue(mockModule);

      const response = await request(app)
        .post('/api/courses/aa0e8400-e29b-41d4-a716-446655440004/modules')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({
          title: 'Introdução ao Node.js',
          ordering: 1
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Módulo criado!');
      expect(response.body.module).toEqual(mockModule);
      expect(response.body.module.id).toBe('bb0e8400-e29b-41d4-a716-446655440005');
      expect(response.body.module.course_id).toBe('aa0e8400-e29b-41d4-a716-446655440004');
      expect(response.body.module.title).toBe('Introdução ao Node.js');
      expect(response.body.module.ordering).toBe(1);
    });

    test('deve retornar 401 quando não houver token', async () => {
      const response = await request(app)
        .post('/api/courses/aa0e8400-e29b-41d4-a716-446655440004/modules')
        .send({
          title: 'Módulo sem auth',
          ordering: 1
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('No token provided');
    });

    test('deve retornar 403 quando usuário não for instrutor', async () => {
      const response = await request(app)
        .post('/api/courses/aa0e8400-e29b-41d4-a716-446655440004/modules')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'Módulo por estudante',
          ordering: 1
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Acesso negado. Apenas instrutores podem realizar esta ação.');
    });

    test('deve retornar 500 quando houver erro no banco de dados', async () => {
      vi.spyOn(moduleRepository, 'create').mockRejectedValue(new Error('Foreign key constraint violation'));

      const response = await request(app)
        .post('/api/courses/curso-inexistente/modules')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({
          title: 'Módulo',
          ordering: 1
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Foreign key constraint violation');
    });
  });

  describe('POST /api/modules/:moduleId/lessons', () => {
    test('deve criar lição com estrutura completa do banco quando autenticado como instrutor', async () => {
      const mockLesson = {
        id: 'cc0e8400-e29b-41d4-a716-446655440006',
        module_id: 'bb0e8400-e29b-41d4-a716-446655440005',
        title: 'O que é Node.js?',
        content_text: 'Node.js é um runtime JavaScript...',
        created_at: '2024-03-06T13:00:00.000Z'
      };

      vi.spyOn(lessonRepository, 'create').mockResolvedValue(mockLesson);

      const response = await request(app)
        .post('/api/modules/bb0e8400-e29b-41d4-a716-446655440005/lessons')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({
          title: 'O que é Node.js?',
          content_text: 'Node.js é um runtime JavaScript...'
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Lição criada!');
      expect(response.body.lessonId).toEqual(mockLesson);
      expect(response.body.lessonId.id).toBe('cc0e8400-e29b-41d4-a716-446655440006');
      expect(response.body.lessonId.module_id).toBe('bb0e8400-e29b-41d4-a716-446655440005');
      expect(response.body.lessonId.title).toBe('O que é Node.js?');
      expect(response.body.lessonId.content_text).toBe('Node.js é um runtime JavaScript...');
      expect(response.body.lessonId.created_at).toBeDefined();
    });

    test('deve retornar 401 quando não houver token', async () => {
      const response = await request(app)
        .post('/api/modules/bb0e8400-e29b-41d4-a716-446655440005/lessons')
        .send({
          title: 'Lição sem auth',
          content_text: 'Conteúdo...'
        });

      expect(response.status).toBe(401);
    });

    test('deve retornar 403 quando usuário não for instrutor', async () => {
      const response = await request(app)
        .post('/api/modules/bb0e8400-e29b-41d4-a716-446655440005/lessons')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'Lição de estudante',
          content_text: 'Não deveria criar'
        });

      expect(response.status).toBe(403);
    });

    test('deve retornar 500 quando faltar conteúdo obrigatório', async () => {
      vi.spyOn(lessonRepository, 'create').mockRejectedValue(new Error('Content is required'));

      const response = await request(app)
        .post('/api/modules/bb0e8400-e29b-41d4-a716-446655440005/lessons')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({
          title: 'Lição sem conteúdo'
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Content is required');
    });
  });

  describe('GET /api/courses/:courseId/modules', () => {
    test('deve listar módulos do curso com estrutura completa', async () => {
      const mockModules = [
        {
          id: 'bb0e8400-e29b-41d4-a716-446655440005',
          course_id: 'aa0e8400-e29b-41d4-a716-446655440004',
          title: 'Introdução ao Node.js',
          ordering: 1
        },
        {
          id: 'dd0e8400-e29b-41d4-a716-446655440007',
          course_id: 'aa0e8400-e29b-41d4-a716-446655440004',
          title: 'Express Framework',
          ordering: 2
        }
      ];

      vi.spyOn(moduleRepository, 'findByCourseID').mockResolvedValue(mockModules);

      const response = await request(app).get('/api/courses/aa0e8400-e29b-41d4-a716-446655440004/modules');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].id).toBe('bb0e8400-e29b-41d4-a716-446655440005');
      expect(response.body[0].title).toBe('Introdução ao Node.js');
      expect(response.body[0].ordering).toBe(1);
      expect(response.body[1].id).toBe('dd0e8400-e29b-41d4-a716-446655440007');
      expect(response.body[1].title).toBe('Express Framework');
    });

    test('deve retornar array vazio quando curso não tiver módulos', async () => {
      vi.spyOn(moduleRepository, 'findByCourseID').mockResolvedValue([]);

      const response = await request(app).get('/api/courses/curso-vazio/modules');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });

    test('deve retornar 500 quando houver erro no banco', async () => {
      vi.spyOn(moduleRepository, 'findByCourseID').mockRejectedValue(new Error('Query timeout'));

      const response = await request(app).get('/api/courses/aa0e8400/modules');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Query timeout');
    });
  });

  describe('GET /api/lessons/:lessonId', () => {
    test('deve retornar lição com estrutura completa quando encontrada', async () => {
      const mockLesson = {
        id: 'cc0e8400-e29b-41d4-a716-446655440006',
        module_id: 'bb0e8400-e29b-41d4-a716-446655440005',
        title: 'O que é Node.js?',
        content_text: 'Node.js é um runtime JavaScript...',
        created_at: '2024-03-06T13:00:00.000Z'
      };

      vi.spyOn(lessonRepository, 'findByID').mockResolvedValue(mockLesson);

      const response = await request(app).get('/api/lessons/cc0e8400-e29b-41d4-a716-446655440006');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockLesson);
      expect(response.body.id).toBe('cc0e8400-e29b-41d4-a716-446655440006');
      expect(response.body.module_id).toBe('bb0e8400-e29b-41d4-a716-446655440005');
      expect(response.body.title).toBe('O que é Node.js?');
      expect(response.body.content_text).toBe('Node.js é um runtime JavaScript...');
      expect(response.body.created_at).toBeDefined();
    });

    test('deve retornar 404 quando lição não for encontrada', async () => {
      vi.spyOn(lessonRepository, 'findByID').mockResolvedValue(null);

      const response = await request(app).get('/api/lessons/inexistente');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Lição não encontrada');
    });

    test('deve retornar 500 quando houver erro no banco', async () => {
      vi.spyOn(lessonRepository, 'findByID').mockRejectedValue(new Error('Connection refused'));

      const response = await request(app).get('/api/lessons/cc0e8400');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Connection refused');
    });
  });

  describe('GET /api/courses/:courseId/content', () => {
    test('deve retornar conteúdo completo do curso com módulos e lições', async () => {
      const mockContent = [
        {
          id: 'bb0e8400-e29b-41d4-a716-446655440005',
          title: 'Introdução ao Node.js',
          lessons: [
            { id: 'cc0e8400-e29b-41d4-a716-446655440006', title: 'O que é Node.js?' },
            { id: 'ee0e8400-e29b-41d4-a716-446655440008', title: 'Instalando Node.js' }
          ]
        },
        {
          id: 'dd0e8400-e29b-41d4-a716-446655440007',
          title: 'Express Framework',
          lessons: [
            { id: 'ff0e8400-e29b-41d4-a716-446655440009', title: 'Criando servidor Express' }
          ]
        }
      ];

      vi.spyOn(moduleRepository, 'findFullCourseContent').mockResolvedValue(mockContent);

      const response = await request(app).get('/api/courses/aa0e8400-e29b-41d4-a716-446655440004/content');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].id).toBe('bb0e8400-e29b-41d4-a716-446655440005');
      expect(response.body[0].title).toBe('Introdução ao Node.js');
      expect(Array.isArray(response.body[0].lessons)).toBe(true);
      expect(response.body[0].lessons).toHaveLength(2);
      expect(response.body[0].lessons[0].id).toBe('cc0e8400-e29b-41d4-a716-446655440006');
      expect(response.body[0].lessons[0].title).toBe('O que é Node.js?');
      expect(response.body[1].lessons[0].id).toBe('ff0e8400-e29b-41d4-a716-446655440009');
    });

    test('deve retornar 404 quando curso não tiver conteúdo', async () => {
      vi.spyOn(moduleRepository, 'findFullCourseContent').mockResolvedValue([]);

      const response = await request(app).get('/api/courses/curso-vazio/content');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Conteúdo do curso não encontrado');
    });

    test('deve retornar 500 quando houver erro no banco', async () => {
      vi.spyOn(moduleRepository, 'findFullCourseContent').mockRejectedValue(new Error('Complex query failed'));

      const response = await request(app).get('/api/courses/aa0e8400/content');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Complex query failed');
    });
  });
});
