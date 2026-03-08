import { vi, describe, test, expect, beforeAll, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import * as authService from '../src/services/auth.service.js';
import { register, login } from '../src/controllers/auth.controller.js';

describe('Auth Controller - Integration Tests', () => {
  let app;
  
  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.post('/api/auth/register', register);
    app.post('/api/auth/login', login);
  });

  afterEach(() => vi.restoreAllMocks());

  describe('POST /api/auth/register', () => {
    test('deve criar um novo usuário com estrutura completa do banco', async () => {
      const mockUser = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'João Silva',
        email: 'joao.silva@test.com',
        role: 'student',
        created_at: '2024-03-06T10:30:00.000Z'
      };

      vi.spyOn(authService, 'register').mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'João Silva',
          email: 'joao.silva@test.com',
          password: 'senha123',
          role: 'student'
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.user).toEqual(mockUser);
      expect(response.body.user.id).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(response.body.user.name).toBe('João Silva');
      expect(response.body.user.email).toBe('joao.silva@test.com');
      expect(response.body.user.role).toBe('student');
      expect(response.body.user.created_at).toBeDefined();
    });

    test('deve criar usuário com role de instructor', async () => {
      const mockUser = {
        id: '660e8400-e29b-41d4-a716-446655440001',
        name: 'Maria Professora',
        email: 'maria.prof@test.com',
        role: 'instructor',
        created_at: '2024-03-06T10:35:00.000Z'
      };

      vi.spyOn(authService, 'register').mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Maria Professora',
          email: 'maria.prof@test.com',
          password: 'senha456',
          role: 'instructor'
        });

      expect(response.status).toBe(201);
      expect(response.body.user.role).toBe('instructor');
    });

    test('deve retornar 400 se email já estiver em uso', async () => {
      vi.spyOn(authService, 'register').mockRejectedValue(new Error('Email already in use'));

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'João Silva',
          email: 'joao.silva@test.com',
          password: 'senha123',
          role: 'student'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Email already in use');
    });

    test('deve retornar 400 se dados obrigatórios estiverem faltando', async () => {
      vi.spyOn(authService, 'register').mockRejectedValue(new Error('Missing required fields'));

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'João Silva'
          // Faltando email e password
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    test('deve retornar token e dados completos do usuário ao fazer login', async () => {
      const mockData = {
        user: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'João Silva',
          email: 'joao.silva@test.com',
          role: 'student'
        },
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJyb2xlIjoic3R1ZGVudCIsImlhdCI6MTYxNjIzOTAyMn0.example'
      };

      vi.spyOn(authService, 'login').mockResolvedValue(mockData);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'joao.silva@test.com',
          password: 'senha123'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Login successful');
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.id).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(response.body.user.name).toBe('João Silva');
      expect(response.body.user.email).toBe('joao.silva@test.com');
      expect(response.body.user.role).toBe('student');
      expect(response.body.token).toBeDefined();
      expect(response.body.token.length).toBeGreaterThan(0);
    });

    test('deve retornar 400 para email inválido', async () => {
      vi.spyOn(authService, 'login').mockRejectedValue(new Error('Invalid email or password'));

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'naoexiste@test.com',
          password: 'senha123'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid email or password');
    });

    test('deve retornar 400 para senha incorreta', async () => {
      vi.spyOn(authService, 'login').mockRejectedValue(new Error('Invalid email or password'));

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'joao.silva@test.com',
          password: 'senhaerrada'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid email or password');
    });

    test('deve retornar 400 se dados obrigatórios estiverem faltando', async () => {
      vi.spyOn(authService, 'login').mockRejectedValue(new Error('Missing required fields'));

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'joao.silva@test.com'
          // Faltando password
        });

      expect(response.status).toBe(400);
    });
  });
});
