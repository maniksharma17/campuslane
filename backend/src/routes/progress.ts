import { Router } from 'express';
import { ProgressController } from '../controllers/ProgressController';
import { requireAuth, requireRole } from '../middleware/auth';
import { validateBody, validateQuery, validateParams } from '../middleware/validation';
import { openContentSchema, completeContentSchema, videoPingSchema } from '../validators/progress';
import { mongoIdSchema, paginationSchema } from '../validators/common';
import { z } from 'zod';

const router = Router();

/**
 * Student opens content — creates/updates progress entry with status=in_progress
 */
router.post(
  '/open',
  requireAuth,
  requireRole('student'),
  validateBody(openContentSchema),
  ProgressController.openContent
);

/**
 * Mark content as complete (with optional quizScore)
 * Also sets completedAt timestamp and status=completed
 */
router.post(
  '/complete',
  requireAuth,
  requireRole('student'),
  validateBody(completeContentSchema),
  ProgressController.completeContent
);

/**
 * Video watch ping — increments timeSpent
 * Should not exceed 5 min increments per ping
 */
router.post(
  '/video/ping',
  requireAuth,
  requireRole('student'),
  validateBody(videoPingSchema),
  ProgressController.recordVideoTime
);

/**
 * Get logged-in student's progress, filterable by class/subject
 */
router.get(
  '/mine',
  requireAuth,
  requireRole('student'),
  validateQuery(
    paginationSchema.extend({
      classId: mongoIdSchema.optional(),
      subjectId: mongoIdSchema.optional(),
      status: z.enum(['not_started', 'in_progress', 'completed']).optional(),
    })
  ),
  ProgressController.getMyProgress
);

/**
 * Get logged-in student's recently visited content
 */
router.get("/recent",
  requireAuth,
  requireRole('student'),
  ProgressController.getRecentlyVisited);

/**
 * Get logged-in student's content progress
 */
router.get(
  '/content/:id',
  requireAuth,
  requireRole('student'),
  ProgressController.getContentProgress
);

/**
 * Parent can view child's progress
 */
router.get(
  '/child/:childId',
  requireAuth,
  requireRole('parent'),
  validateParams(z.object({ childId: mongoIdSchema })),
  validateQuery(
    paginationSchema.extend({
      classId: mongoIdSchema.optional(),
      subjectId: mongoIdSchema.optional(),
      status: z.enum(['not_started', 'in_progress', 'completed']).optional(),
    })
  ),
  ProgressController.getChildProgress
);

/**
 * Admin/teacher can delete a progress record
 */
router.delete(
  '/:id',
  requireAuth,
  requireRole(['admin', 'teacher']),
  validateParams(z.object({ id: mongoIdSchema })),
  ProgressController.deleteProgress
);

export default router;
