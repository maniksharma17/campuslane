import { Router } from 'express';
import { AdminController } from '../controllers/AdminController';
import { requireAdminAuth, requireAnyAuth } from '../middleware/auth';
import { validateBody, validateQuery, validateParams } from '../middleware/validation';
import { mongoIdSchema, paginationSchema, presignSchema } from '../validators/common';
import { uploadLimiter } from '../middleware/rateLimit';
import { z } from 'zod';

const router = Router();

// Teacher management
router.get('/teachers', requireAdminAuth, validateQuery(paginationSchema.extend({
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
})), AdminController.getTeachers);
router.patch('/teachers/:id', requireAdminAuth, validateParams(z.object({ id: mongoIdSchema })), AdminController.updateStudent);
router.delete('/teachers/:id', requireAdminAuth, validateParams(z.object({ id: mongoIdSchema })), AdminController.deleteStudent);

router.patch('/teachers/:id/approve', requireAdminAuth, validateParams(z.object({ id: mongoIdSchema })), AdminController.approveTeacher);
router.patch('/teachers/:id/reject', requireAdminAuth, validateParams(z.object({ id: mongoIdSchema })), AdminController.rejectTeacher);

// Student management
router.get('/students', requireAdminAuth, validateQuery(paginationSchema), AdminController.getStudents);

router.patch('/students/:id', requireAdminAuth, validateParams(z.object({ id: mongoIdSchema })), AdminController.updateStudent);
router.delete('/students/:id', requireAdminAuth, validateParams(z.object({ id: mongoIdSchema })), AdminController.deleteStudent);


// Content management
router.get('/content', requireAdminAuth, validateQuery(paginationSchema.extend({
  approvalStatus: z.enum(['pending', 'approved', 'rejected']).optional(),
  classId: mongoIdSchema.optional(),
  subjectId: mongoIdSchema.optional(),
  chapterId: mongoIdSchema.optional(),
})), AdminController.getContentForApproval);

router.patch('/content/:id/approve', requireAdminAuth, validateParams(z.object({ id: mongoIdSchema })), AdminController.approveContent);
router.patch('/content/:id/reject', requireAdminAuth, validateParams(z.object({ id: mongoIdSchema })), AdminController.rejectContent);

// File upload
router.post('/presign', requireAnyAuth, uploadLimiter, validateBody(presignSchema), AdminController.generatePresignedUrl);

export default router;