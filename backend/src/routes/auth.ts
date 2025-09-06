import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { validateBody } from '../middleware/validation';
import { googleSignInSchema, adminLoginSchema } from '../validators/auth';
import { authLimiter } from '../middleware/rateLimit';

const router = Router();

/**
 * @swagger
 * /auth/google:
 *   post:
 *     summary: Google Sign-In
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               idToken:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [student, teacher, parent]
 *               age:
 *                 type: number
 *                 minimum: 5
 *                 maximum: 18
 *     responses:
 *       200:
 *         description: Authentication successful
 */
router.post('/google', authLimiter, validateBody(googleSignInSchema), AuthController.googleSignIn);

/**
 * @swagger
 * /admin/login:
 *   post:
 *     summary: Admin Login
 *     tags: [Admin]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post('/admin/login', authLimiter, validateBody(adminLoginSchema), AuthController.adminLogin);

export default router;