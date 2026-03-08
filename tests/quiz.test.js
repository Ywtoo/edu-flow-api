import { vi, describe, test, expect, beforeAll, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import * as quizRepository from '../src/repositories/quiz.repository.js';
import * as lessonRepository from '../src/repositories/lesson.repository.js';
import * as aiService from '../src/services/ai.service.js';
import { create as createQuizController } from '../src/controllers/quiz.controller.js';
import { verifyToken } from '../src/middlewares/auth.middleware.js';
import { verifyRole } from '../src/middlewares/role.middleware.js';

describe('Quiz Controller - Integration Tests', () => {
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
    app.post('/api/lessons/:lessonId/quiz', verifyToken, verifyRole('instructor'), createQuizController);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/lessons/:lessonId/quiz', () => {
    test('deve gerar quiz com IA e salvar no banco com estrutura completa quando autenticado como instrutor', async () => {
      const mockLesson = {
        id: 'cc0e8400-e29b-41d4-a716-446655440006',
        module_id: 'bb0e8400-e29b-41d4-a716-446655440005',
        title: 'O que é Node.js?',
        content_text: 'Node.js é um runtime JavaScript construído sobre o motor V8 do Chrome. Ele permite executar JavaScript no servidor.',
        created_at: '2024-03-06T13:00:00.000Z'
      };

      const mockAIQuestions = [
        {
          question: 'O que é Node.js?',
          options: ['Runtime JavaScript', 'Navegador web', 'Banco de dados', 'Linguagem de programação'],
          answer: 'Runtime JavaScript'
        },
        {
          question: 'Qual motor JavaScript o Node.js usa?',
          options: ['V8', 'SpiderMonkey', 'JavaScriptCore', 'Chakra'],
          answer: 'V8'
        },
        {
          question: 'Onde o Node.js executa JavaScript?',
          options: ['No servidor', 'No navegador', 'No mobile', 'No desktop'],
          answer: 'No servidor'
        }
      ];

      const mockQuiz = {
        id: 'gg0e8400-e29b-41d4-a716-446655440010',
        lesson_id: 'cc0e8400-e29b-41d4-a716-446655440006',
        questions: mockAIQuestions,
        ai_generated: true,
        created_at: '2024-03-06T14:00:00.000Z'
      };

      vi.spyOn(lessonRepository, 'findByID').mockResolvedValue(mockLesson);
      vi.spyOn(aiService, 'generateQuiz').mockResolvedValue(mockAIQuestions);
      vi.spyOn(quizRepository, 'create').mockResolvedValue(mockQuiz);

      const response = await request(app)
        .post('/api/lessons/cc0e8400-e29b-41d4-a716-446655440006/quiz')
        .set('Authorization', `Bearer ${instructorToken}`);

      // Verificar que a IA recebeu o texto correto da lição
      expect(aiService.generateQuiz).toHaveBeenCalledWith('Node.js é um runtime JavaScript construído sobre o motor V8 do Chrome. Ele permite executar JavaScript no servidor.');
      expect(aiService.generateQuiz).toHaveBeenCalledTimes(1);

      // Verificar resposta do controller
      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Quiz criado!');
      expect(response.body.quiz).toEqual(mockQuiz);
      expect(response.body.quiz.id).toBe('gg0e8400-e29b-41d4-a716-446655440010');
      expect(response.body.quiz.lesson_id).toBe('cc0e8400-e29b-41d4-a716-446655440006');
      expect(response.body.quiz.ai_generated).toBe(true);
      expect(response.body.quiz.created_at).toBeDefined();
      
      // Verificar estrutura das questões
      expect(Array.isArray(response.body.quiz.questions)).toBe(true);
      expect(response.body.quiz.questions).toHaveLength(3);
      expect(response.body.quiz.questions[0]).toHaveProperty('question');
      expect(response.body.quiz.questions[0]).toHaveProperty('options');
      expect(response.body.quiz.questions[0]).toHaveProperty('answer');
      expect(response.body.quiz.questions[0].question).toBe('O que é Node.js?');
      expect(Array.isArray(response.body.quiz.questions[0].options)).toBe(true);
      expect(response.body.quiz.questions[0].options).toHaveLength(4);
      expect(response.body.quiz.questions[0].answer).toBe('Runtime JavaScript');
    });

    test('deve retornar 404 quando lição não existir', async () => {
      vi.spyOn(lessonRepository, 'findByID').mockResolvedValue(null);
      const generateQuizSpy = vi.spyOn(aiService, 'generateQuiz');

      const response = await request(app)
        .post('/api/lessons/lesson-inexistente/quiz')
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Lesson not found');
      expect(generateQuizSpy).not.toHaveBeenCalled();
    });

    test('deve retornar 401 quando não houver token', async () => {
      const response = await request(app)
        .post('/api/lessons/cc0e8400-e29b-41d4-a716-446655440006/quiz');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('No token provided');
    });

    test('deve retornar 401 quando token for inválido', async () => {
      const response = await request(app)
        .post('/api/lessons/cc0e8400-e29b-41d4-a716-446655440006/quiz')
        .set('Authorization', 'Bearer token_invalido');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid token');
    });

    test('deve retornar 403 quando usuário não for instrutor', async () => {
      const response = await request(app)
        .post('/api/lessons/cc0e8400-e29b-41d4-a716-446655440006/quiz')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Acesso negado. Apenas instrutores podem realizar esta ação.');
    });

    test('deve retornar 500 quando houver erro na API de IA (Gemini)', async () => {
      const mockLesson = {
        id: 'cc0e8400-e29b-41d4-a716-446655440006',
        module_id: 'bb0e8400-e29b-41d4-a716-446655440005',
        title: 'O que é Node.js?',
        content_text: 'Node.js é um runtime JavaScript...',
        created_at: '2024-03-06T13:00:00.000Z'
      };

      vi.spyOn(lessonRepository, 'findByID').mockResolvedValue(mockLesson);
      vi.spyOn(aiService, 'generateQuiz').mockRejectedValue(new Error('Gemini API rate limit exceeded'));

      const response = await request(app)
        .post('/api/lessons/cc0e8400-e29b-41d4-a716-446655440006/quiz')
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Gemini API rate limit exceeded');
    });

    test('deve retornar 500 quando houver erro ao salvar no banco de dados', async () => {
      const mockLesson = {
        id: 'cc0e8400-e29b-41d4-a716-446655440006',
        module_id: 'bb0e8400-e29b-41d4-a716-446655440005',
        title: 'O que é Node.js?',
        content_text: 'Node.js é um runtime JavaScript...',
        created_at: '2024-03-06T13:00:00.000Z'
      };

      const mockAIQuestions = [
        {
          question: 'O que é Node.js?',
          options: ['Runtime JavaScript', 'Navegador web', 'Banco de dados', 'Linguagem'],
          answer: 'Runtime JavaScript'
        }
      ];

      vi.spyOn(lessonRepository, 'findByID').mockResolvedValue(mockLesson);
      vi.spyOn(aiService, 'generateQuiz').mockResolvedValue(mockAIQuestions);
      vi.spyOn(quizRepository, 'create').mockRejectedValue(new Error('Database connection timeout'));

      const response = await request(app)
        .post('/api/lessons/cc0e8400-e29b-41d4-a716-446655440006/quiz')
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Database connection timeout');
    });

    test('deve retornar 500 quando lição não tiver conteúdo para gerar quiz', async () => {
      const mockLesson = {
        id: 'cc0e8400-e29b-41d4-a716-446655440006',
        module_id: 'bb0e8400-e29b-41d4-a716-446655440005',
        title: 'Lição vazia',
        content_text: null,
        created_at: '2024-03-06T13:00:00.000Z'
      };

      vi.spyOn(lessonRepository, 'findByID').mockResolvedValue(mockLesson);
      vi.spyOn(aiService, 'generateQuiz').mockRejectedValue(new Error('Cannot generate quiz from empty content'));

      const response = await request(app)
        .post('/api/lessons/cc0e8400-e29b-41d4-a716-446655440006/quiz')
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Cannot generate quiz from empty content');
      expect(aiService.generateQuiz).toHaveBeenCalledWith(null);
    });
  });
});
