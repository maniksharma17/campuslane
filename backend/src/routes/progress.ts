import { Router } from 'express';
import { ProgressController } from '../controllers/ProgressController';
import { requireAuth, requireRole } from '../middleware/auth';
import { validateBody, validateQuery, validateParams } from '../middleware/validation';
import { openContentSchema, completeContentSchema, videoPingSchema } from '../validators/progress';
import { mongoIdSchema, paginationSchema } from '../validators/common';
import { z } from 'zod';

const router = Router();

router.post('/open', requireAuth, requireRole('student'), validateBody(openContentSchema), ProgressController.openContent);

router.post('/complete', requireAuth, requireRole('student'), validateBody(completeContentSchema), ProgressController.completeContent);

router.post('/video/ping', requireAuth, requireRole('student'), validateBody(videoPingSchema), ProgressController.recordVideoTime);

router.get('/mine', requireAuth, requireRole('student'), validateQuery(paginationSchema.extend({
  classId: mongoIdSchema.optional(),
  subjectId: mongoIdSchema.optional(),
})), ProgressController.getMyProgress);

router.get('/child/:childId', requireAuth, requireRole('parent'), validateParams(z.object({ childId: mongoIdSchema })), validateQuery(paginationSchema.extend({
  classId: mongoIdSchema.optional(),
  subjectId: mongoIdSchema.optional(),
})), ProgressController.getChildProgress);

router.delete('/:id', requireAuth, requireRole(['admin', 'teacher']), validateParams(z.object({ id: mongoIdSchema })), ProgressController.deleteProgress);

export default router;