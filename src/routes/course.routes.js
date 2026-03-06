import { Router } from 'express';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { verifyRole } from '../middlewares/role.middleware.js';
import * as courseController from '../controllers/course.controller.js';
import * as contentController from '../controllers/content.controller.js';


const router = Router();

// Rota pública
router.get('/', courseController.listAll);

// Rota protegida

/**
 * @swagger
 * /api/courses:
 *   post:
 *     summary: Cria um novo curso
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Curso criado com sucesso
 */
router.post('/', verifyToken, verifyRole('instructor'), courseController.create);
router.post('/:courseId/modules', verifyToken, verifyRole('instructor'), contentController.createModule);
router.post('/:moduleId/lessons', verifyToken, verifyRole('instructor'), contentController.createLesson);

// Rotas GET protegidas
router.get('/:courseId/modules', verifyToken, contentController.listModulesByCourse);
router.get('/lessons/:lessonId', verifyToken, contentController.getLessonByID);
router.get('/:courseId/content', verifyToken, contentController.getFullCourseContent);

export default router;