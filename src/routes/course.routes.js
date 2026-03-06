import { Router } from 'express';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { verifyRole } from '../middlewares/role.middleware.js';
import * as courseController from '../controllers/course.controller.js';

const router = Router();

// Rota pública
router.get('/', courseController.listAll);

// Rota protegida
router.post('/', verifyToken, verifyRole('instructor'), courseController.create);

export default router;