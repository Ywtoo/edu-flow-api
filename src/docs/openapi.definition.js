export const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'FlyEdu/EduFlow API',
    version: '0.2.0',
    description: 'API focada em LMS com integração de IA',
  },
  servers: [{ url: 'http://localhost:3000' }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          error: { type: 'string' }
        }
      },
      Credentials: {
        type: 'object',
        required: ['email','password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', format: 'password' }
        }
      },
      AuthResponse: {
        type: 'object',
        properties: {
          token: { type: 'string' }
        }
      },
      CourseInput: {
        type: 'object',
        required: ['title'],
        properties: {
          title: { type: 'string' },
          description: { type: 'string' }
        }
      },
      CourseSummary: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          description: { type: 'string' }
        }
      },
      Course: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          description: { type: 'string' },
          instructor_id: { type: 'string', format: 'uuid' }
        }
      },
      Module: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          ordering: { type: 'integer' },
          lessons: { type: 'array', items: { $ref: '#/components/schemas/Lesson' } }
        }
      },
      Lesson: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          content_text: { type: 'string' }
        }
      },
      ModuleInput: {
        type: 'object',
        required: ['title'],
        properties: {
          title: { type: 'string' },
          ordering: { type: 'integer', format: 'int64' }
        }
      },
      LessonInput: {
        type: 'object',
        required: ['title'],
        properties: {
          title: { type: 'string' },
          content_text: { type: 'string' }
        }
      }
    }
  },
  paths: {
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email','password'],
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '201': { description: 'User created' },
          '400': { description: 'Bad Request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
        }
      }
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Log in and receive a JWT',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Credentials' } } }
        },
        responses: {
          '200': { description: 'Authenticated', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
          '401': { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
        }
      }
    },
    '/api/courses': {
      get: {
        tags: ['Courses'],
        summary: 'List all courses (public)',
        responses: {
          '200': { description: 'A list of courses', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/CourseSummary' } } } } }
        }
      },
      post: {
        tags: ['Courses'],
        summary: 'Create a new course',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CourseInput' } } } },
        responses: {
          '201': { description: 'Course created' },
          '400': { description: 'Bad Request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
        }
      }
    },
    '/api/courses/{courseId}/modules': {
      post: {
        tags: ['Content'],
        summary: 'Create module in a course',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'courseId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ModuleInput' } } } },
        responses: {
          '201': { description: 'Module created' },
          '400': { description: 'Bad Request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '401': { description: 'Unauthorized' }
        }
      },
      get: {
        tags: ['Content'],
        summary: 'List modules for a course',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'courseId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'Modules list', content: { 'application/json': { schema: { type: 'array', items: { type: 'object' } } } } },
          '401': { description: 'Unauthorized' }
        }
      }
    },
    '/api/courses/{moduleId}/lessons': {
      post: {
        tags: ['Content'],
        summary: 'Create a lesson for a module',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'moduleId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/LessonInput' } } } },
        responses: {
          '201': { description: 'Lesson created' },
          '400': { description: 'Bad Request' },
          '401': { description: 'Unauthorized' }
        }
      }
    },
    '/api/courses/lessons/{lessonId}': {
      get: {
        tags: ['Content'],
        summary: 'Get lesson by ID',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'lessonId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'Lesson', content: { 'application/json': { schema: { type: 'object' } } } },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Not found' }
        }
      }
    },
    '/api/courses/{courseId}/content': {
      get: {
        tags: ['Content'],
        summary: 'Get full course content (modules + lessons)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'courseId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'Course content', content: { 'application/json': { schema: { type: 'array', items: { type: 'object' } } } } },
          '401': { description: 'Unauthorized' }
        }
      }
    },
    '/api/courses/lessons/{lessonId}/quiz': {
      post: {
        tags: ['Quiz'],
        summary: 'Create quiz for lesson',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'lessonId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: {
          '201': { description: 'Quiz created' },
          '400': { description: 'Bad Request' },
          '401': { description: 'Unauthorized' }
        }
      }
    }
  }
};

export default openApiSpec;
